import { supabase } from "@/integrations/supabase/client";
import { checkCircuitBreaker, recordSuccess, recordFailure, checkTokenBudget, dedupedRequest, getCachedEmbedding, setCachedEmbedding } from "./aiCostOptimizer";
import { AICacheService } from "./aiCacheService";
import { aiQueue } from "./aiQueueService";

export interface OpenAIFeatureConfig {
  model: string;
  fallback_model?: string;
  supports_vision?: boolean;
  max_tokens: number;
  temperature: number;
  tier_required: "free" | "basic" | "pro" | "enterprise";
  use_batch_api?: boolean;
}

export interface OpenAIModelConfig {
  version: string;
  default_base_url: string;
  features: {
    review_sentiment_analysis: OpenAIFeatureConfig;
    review_recovery_message: OpenAIFeatureConfig;
    ocr_menu_import_fallback: OpenAIFeatureConfig;
    food_graph_reasoning: OpenAIFeatureConfig;
    superadmin_ai_insights: OpenAIFeatureConfig;
    menu_description: OpenAIFeatureConfig;
    menu_assistant: OpenAIFeatureConfig;
    dish_image_generation: OpenAIFeatureConfig;
    sales_summary: OpenAIFeatureConfig;
    moderation: OpenAIFeatureConfig;
    translation: OpenAIFeatureConfig;
    menu_embeddings: {
      model: string;
      dimensions: number;
      tier_required: string;
    };
  };
  rate_limit_strategy: string;
  cost_tracking: boolean;
  monthly_hard_cap_usd: number;
}

const DEFAULT_CONFIG: OpenAIModelConfig = {
  version: "2.0",
  default_base_url: "https://api.openai.com/v1",
  features: {
    review_sentiment_analysis: {
      model: "gpt-5.4-nano",
      fallback_model: "gpt-4.1-nano",
      max_tokens: 150,
      temperature: 0.0,
      tier_required: "free"
    },
    review_recovery_message: {
      model: "gpt-5.4-mini",
      fallback_model: "gpt-4.1-mini",
      max_tokens: 300,
      temperature: 0.7,
      tier_required: "pro"
    },
    ocr_menu_import_fallback: {
      model: "gpt-5.4-mini",
      supports_vision: true,
      max_tokens: 4000,
      temperature: 0.1,
      tier_required: "basic"
    },
    food_graph_reasoning: {
      model: "gpt-5.4-nano",
      max_tokens: 500,
      temperature: 0.3,
      tier_required: "enterprise"
    },
    superadmin_ai_insights: {
      model: "gpt-5.4-nano",
      max_tokens: 2000,
      temperature: 0.4,
      tier_required: "enterprise",
      use_batch_api: true
    },
    menu_description: {
      model: "gpt-5.5-mini",
      max_tokens: 300,
      temperature: 0.5,
      tier_required: "free"
    },
    menu_assistant: {
      model: "gpt-5.5-mini",
      max_tokens: 500,
      temperature: 0.7,
      tier_required: "basic"
    },
    dish_image_generation: {
      model: "gpt-image-1",
      max_tokens: 1000,
      temperature: 0.8,
      tier_required: "pro"
    },
    sales_summary: {
      model: "gpt-5.4-nano",
      max_tokens: 1500,
      temperature: 0.2,
      tier_required: "enterprise"
    },
    moderation: {
      model: "omni-moderation-latest",
      max_tokens: 100,
      temperature: 0.0,
      tier_required: "free"
    },
    translation: {
      model: "gpt-5.4-nano",
      max_tokens: 1000,
      temperature: 0.1,
      tier_required: "basic"
    },
    menu_embeddings: {
      model: "text-embedding-3-small",
      dimensions: 1536,
      tier_required: "basic"
    }
  },
  rate_limit_strategy: "queue_with_batch_fallback",
  cost_tracking: true,
  monthly_hard_cap_usd: 8.0
};

// Key to store config in localStorage/Supabase
const CONFIG_STORAGE_KEY = "zappy_openai_model_config";
const COST_STORAGE_KEY_PREFIX = "zappy_openai_monthly_cost_";

export function getOpenAIConfig(restaurantId: string): OpenAIModelConfig {
  const cached = localStorage.getItem(`${CONFIG_STORAGE_KEY}_${restaurantId}`);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      return DEFAULT_CONFIG;
    }
  }
  return DEFAULT_CONFIG;
}

export function saveOpenAIConfig(restaurantId: string, config: OpenAIModelConfig) {
  localStorage.setItem(`${CONFIG_STORAGE_KEY}_${restaurantId}`, JSON.stringify(config));
}

// Cost tracking helpers
export function getMonthlyCost(restaurantId: string): number {
  const monthKey = new Date().toISOString().substring(0, 7); // "YYYY-MM"
  const val = localStorage.getItem(`${COST_STORAGE_KEY_PREFIX}${restaurantId}_${monthKey}`);
  return val ? parseFloat(val) : 0.0;
}

export function addMonthlyCost(restaurantId: string, amount: number) {
  const monthKey = new Date().toISOString().substring(0, 7);
  const current = getMonthlyCost(restaurantId);
  const updated = current + amount;
  localStorage.setItem(`${COST_STORAGE_KEY_PREFIX}${restaurantId}_${monthKey}`, updated.toFixed(6));
  console.log(`[OpenAI Cost Tracker] Added $${amount.toFixed(6)}. Monthly Total: $${updated.toFixed(6)}`);
}

export function resetMonthlyCost(restaurantId: string) {
  const monthKey = new Date().toISOString().substring(0, 7);
  localStorage.setItem(`${COST_STORAGE_KEY_PREFIX}${restaurantId}_${monthKey}`, "0.00");
}

// Custom token pricing based on PRD pricing tables
function calculateEstimatedCost(model: string, promptTokens: number, completionTokens: number, isBatch: boolean = false): number {
  let inputRate = 0.15; // per 1M
  let outputRate = 0.60;

  const m = model.toLowerCase();
  if (m.includes("gpt-5.5-mini")) {
    inputRate = 0.50;
    outputRate = 2.00;
  } else if (m.includes("gpt-5.4-mini")) {
    inputRate = 0.75;
    outputRate = 4.50;
  } else if (m.includes("gpt-4.1-nano") || m.includes("gpt-5.4-nano")) {
    inputRate = 0.15;
    outputRate = 0.80;
  } else if (m.includes("gpt-4.1-mini")) {
    inputRate = 0.40;
    outputRate = 1.60;
  } else if (m.includes("o4-mini")) {
    inputRate = 1.10;
    outputRate = 4.40;
  } else if (m.includes("gpt-5.4")) {
    inputRate = 2.50;
    outputRate = 15.00;
  } else if (m.includes("text-embedding-3-small")) {
    inputRate = 0.02;
    outputRate = 0;
  }

  let cost = (promptTokens * inputRate + completionTokens * outputRate) / 1000000;
  
  // Apply 50% discount for Batch API
  if (isBatch) {
    cost *= 0.5;
  }

  return cost;
}

// Maps custom/future models to actual working OpenAI models
function mapModelToRealOpenAIModel(customModelName: string): string {
  const m = customModelName.toLowerCase();
  if (m.includes("text-embedding-3-small")) {
    return "text-embedding-3-small";
  }
  if (m.includes("gpt-image-1")) {
    return "gpt-image-1";
  }
  if (m.includes("omni-moderation")) {
    return "text-moderation-latest";
  }
  if (m.includes("gpt-5.5") || m.includes("gpt-5.4") && !m.includes("mini") && !m.includes("nano")) {
    return "gpt-4o";
  }
  // All other chat/vision fallbacks map to cheap & efficient gpt-4o-mini
  return "gpt-4o-mini";
}

// Verify if restaurant can make a call (gated by tier & hard cap)
export async function verifyAICallEligibility(
  restaurantId: string,
  featureKey: keyof OpenAIModelConfig["features"]
): Promise<{ eligible: boolean; reason?: string; config: OpenAIModelConfig; feature: any }> {
  const config = getOpenAIConfig(restaurantId);
  const feature = config.features[featureKey];

  if (!feature) {
    return { eligible: false, reason: `Unknown feature: ${featureKey}`, config, feature: null };
  }

  // 1. Check monthly hard cap
  const currentCost = getMonthlyCost(restaurantId);
  if (currentCost >= config.monthly_hard_cap_usd) {
    return { eligible: false, reason: "Monthly budget cap exceeded", config, feature };
  }

  // 2. Check tier gate
  try {
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("subscription_tier")
      .eq("id", restaurantId)
      .single();

    const currentTier = restaurant?.subscription_tier || "free";
    const tierRanks: Record<string, number> = { free: 0, basic: 1, pro: 2, enterprise: 3 };
    const requiredTier = feature.tier_required || "free";

    const currentRank = tierRanks[currentTier] ?? 0;
    const requiredRank = tierRanks[requiredTier] ?? 0;

    if (currentRank < requiredRank) {
      return { 
        eligible: false, 
        reason: `Feature requires ${requiredTier.toUpperCase()} tier (current: ${currentTier.toUpperCase()})`,
        config, 
        feature 
      };
    }
  } catch (err) {
    console.warn("Failed to fetch restaurant tier from Supabase, assuming local settings.", err);
  }

  return { eligible: true, config, feature };
}

// SHA-256 Hashing helper with environment fallback
async function getSha256Hash(text: string): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return "test_" + Math.abs(hash).toString(16);
  }
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const MEMO_CACHE = new Map<string, { response: string; timestamp: number }>();
const MEMO_TTL = 60_000;

function getMemoCache(key: string): string | null {
  const entry = MEMO_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > MEMO_TTL) {
    MEMO_CACHE.delete(key);
    return null;
  }
  return entry.response;
}

function setMemoCache(key: string, response: string) {
  MEMO_CACHE.set(key, { response, timestamp: Date.now() });
  if (MEMO_CACHE.size > 500) {
    const oldest = MEMO_CACHE.keys().next().value;
    if (oldest) MEMO_CACHE.delete(oldest);
  }
}

// Core OpenAI request handler
export async function executeOpenAIChatCall(
  restaurantId: string,
  featureKey: keyof OpenAIModelConfig["features"],
  messages: Array<{ role: "system" | "user" | "assistant"; content: any }>,
  responseFormat?: { type: "json_object" }
): Promise<string> {
  const eligibility = await verifyAICallEligibility(restaurantId, featureKey);
  if (!eligibility.eligible) {
    throw new Error(`AI Call blocked: ${eligibility.reason}`);
  }

  if (!checkCircuitBreaker(featureKey as string)) {
    throw new Error(`AI Call blocked: Circuit breaker open for ${featureKey}`);
  }

  // 1. Extract dish name if this is a menu description call (Rule 3)
  let dishName = "";
  if (featureKey === "menu_description") {
    const contentText = messages[0]?.content || "";
    const match = contentText.match(/Item:\s*([^\n]+)/i);
    if (match) {
      dishName = match[1].trim().toLowerCase();
    }
  }

  // 2. Description Library Check (Rule 3)
  if (featureKey === "menu_description" && dishName) {
    try {
      const { data: descData } = await supabase
        .from("ai_descriptions")
        .select("short_description, medium_description, seo_description")
        .eq("name", dishName)
        .maybeSingle();

      if (descData) {
        console.log(`[Cost Blocker] Description Library hit for: ${dishName}`);
        return JSON.stringify({
          short_description: descData.short_description,
          full_description: descData.medium_description,
          is_popular: Math.random() > 0.5,
          prep_time_minutes: 15,
          tags: ["Featured", "Delicious"]
        });
      }
    } catch (err) {
      console.warn("Failed to check ai_descriptions library:", err);
    }
  }

  // 3. Translation Library Check (Rule 5)
  if (featureKey === "translation") {
    try {
      const textToTranslate = messages[messages.length - 1]?.content || "";
      const transHash = await getSha256Hash(textToTranslate);
      const { data: transData } = await supabase
        .from("ai_translations")
        .select("translated_text")
        .eq("hash", transHash)
        .maybeSingle();

      if (transData) {
        console.log(`[Cost Blocker] Translation Library hit for text hash: ${transHash}`);
        return transData.translated_text;
      }
    } catch (err) {
      console.warn("Failed to check ai_translations library:", err);
    }
  }

  // 4. Generic AI Cache Check (Rule 13) — in-memory first, then DB
  const inputString = JSON.stringify({ featureKey, messages, responseFormat });
  const cacheHash = await getSha256Hash(inputString);

  const memCached = getMemoCache(cacheHash);
  if (memCached) {
    console.log(`[Cost Blocker] Memory cache hit for: ${featureKey}`);
    return memCached;
  }

  try {
    const { data: cached } = await supabase
      .from("ai_cache")
      .select("response")
      .eq("hash", cacheHash)
      .maybeSingle();

    if (cached?.response) {
      console.log(`[Cost Blocker] DB Cache hit for feature: ${featureKey}, hash: ${cacheHash}`);
      setMemoCache(cacheHash, cached.response);
      return cached.response;
    }
  } catch (err) {
    console.warn("Failed to check ai_cache:", err);
  }

  // 5. Token budget check
  const estimatedTokens = Math.max(
    ...messages.map(m => typeof m.content === "string" ? m.content.length / 4 : 500)
  ) + (responseFormat ? 50 : 0);
  const budget = await checkTokenBudget(restaurantId, estimatedTokens);
  if (!budget.allowed) {
    throw new Error(`AI Call blocked: ${budget.reason}`);
  }

  // 6. OpenAI API Key Blocker / Fallback (Rule 15)
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    console.warn(`VITE_OPENAI_API_KEY not configured. Returning local fallback for ${featureKey}`);
    if (featureKey === "menu_description" && dishName) {
      const mockDescription = JSON.stringify({
        short_description: `Freshly prepared delicious ${dishName}.`,
        full_description: `Our signature ${dishName} cooked with high-quality ingredients, traditional spices, and served hot. A perfect choice for any meal.`,
        is_popular: true,
        prep_time_minutes: 15,
        tags: ["Featured", "Chef Special"]
      });
      return mockDescription;
    }
    return `AI feature placeholder response for ${featureKey}. Please configure VITE_OPENAI_API_KEY.`;
  }

  // 7. Slicing and Token Limits (Rule 11)
  let chatMessages = messages;
  const feature = eligibility.feature;
  let maxTokens = feature.max_tokens;
  
  if (featureKey === "menu_assistant") {
    if (chatMessages.length > 3) {
      chatMessages = chatMessages.slice(-3);
    }
    maxTokens = Math.min(maxTokens, 60);
  }

  const realModel = mapModelToRealOpenAIModel(feature.model);

  const requestBody = {
    model: realModel,
    messages: chatMessages,
    max_tokens: maxTokens,
    temperature: feature.temperature,
    response_format: responseFormat,
  };

  // 8. Execute via queue for rate limiting
  return aiQueue.enqueue(featureKey as string, async () => {
    const response = await dedupedRequest(cacheHash, async () => {
      const res = await fetch(`${eligibility.config.default_base_url}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errorDetails = await res.text();
        recordFailure(featureKey as string);
        throw new Error(`OpenAI API failed with status ${res.status}: ${errorDetails}`);
      }

      return res.json();
    });

    const content = response.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("OpenAI API returned an empty completion choice.");
    }

    recordSuccess(featureKey as string);

    // Cost tracking
    if (response.usage) {
      const promptTokens = response.usage.prompt_tokens || 0;
      const completionTokens = response.usage.completion_tokens || 0;
      const isBatch = !!feature.use_batch_api;
      const estimatedCost = calculateEstimatedCost(feature.model, promptTokens, completionTokens, isBatch);
      addMonthlyCost(restaurantId, estimatedCost);
    }

    // Save to in-memory cache
    setMemoCache(cacheHash, content);

    // 9. Save to specific asset libraries & generic cache (Rule 2)
    try {
      await supabase.from("ai_cache").upsert({
        hash: cacheHash,
        feature: featureKey,
        input: inputString,
        response: content,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }).then(({ error }) => { if (error) console.error("Failed to write to ai_cache:", error); });

      if (featureKey === "menu_description" && dishName) {
        try {
          const parsed = JSON.parse(content);
          await supabase.from("ai_descriptions").upsert({
            name: dishName,
            short_description: parsed.short_description || "",
            medium_description: parsed.full_description || parsed.medium_description || "",
            seo_description: parsed.seo_description || ""
          }, { onConflict: "name" }).then(({ error }) => { if (error) console.error("Failed to write to ai_descriptions:", error); });
        } catch {}
      }

      if (featureKey === "translation") {
        const textToTranslate = messages[messages.length - 1]?.content || "";
        const transHash = await getSha256Hash(textToTranslate);
        await supabase.from("ai_translations").upsert({
          hash: transHash,
          source_text: textToTranslate,
          target_lang: "target",
          translated_text: content
        }, { onConflict: "hash" }).then(({ error }) => { if (error) console.error("Failed to write to ai_translations:", error); });
      }
    } catch (err) {
      console.warn("Failed to write to DB caches:", err);
    }

    return content;
  }, "medium");
}

// Vision handler
export async function executeOpenAIVisionCall(
  restaurantId: string,
  featureKey: keyof OpenAIModelConfig["features"],
  base64Images: string[],
  promptText: string
): Promise<string> {
  const eligibility = await verifyAICallEligibility(restaurantId, featureKey);
  if (!eligibility.eligible) {
    throw new Error(`AI Call blocked: ${eligibility.reason}`);
  }

  if (!checkCircuitBreaker(featureKey as string)) {
    throw new Error(`AI Call blocked: Circuit breaker open for ${featureKey}`);
  }

  const inputString = JSON.stringify({ featureKey, base64Images: base64Images.map(img => img.substring(0, 100)), promptText });
  const cacheHash = await getSha256Hash(inputString);

  const memCached = getMemoCache(cacheHash);
  if (memCached) return memCached;

  try {
    const { data: cached } = await supabase
      .from("ai_cache")
      .select("response")
      .eq("hash", cacheHash)
      .maybeSingle();
    if (cached?.response) {
      console.log(`[Cost Blocker] Cache hit for Vision: ${featureKey}`);
      setMemoCache(cacheHash, cached.response);
      return cached.response;
    }
  } catch (err) {
    console.warn("Failed to check Vision cache:", err);
  }

  const budget = await checkTokenBudget(restaurantId, 5000);
  if (!budget.allowed) throw new Error(`AI Call blocked: ${budget.reason}`);

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_OPENAI_API_KEY not configured in environment.");
  }

  const feature = eligibility.feature;
  const realModel = mapModelToRealOpenAIModel(feature.model);

  const imageContents = base64Images.map((b64) => ({
    type: "image_url",
    image_url: { url: b64 },
  }));

  const messages = [{
    role: "user",
    content: [
      { type: "text", text: promptText },
      ...imageContents,
    ],
  }];

  const requestBody = {
    model: realModel,
    messages,
    max_tokens: feature.max_tokens,
    temperature: feature.temperature,
    response_format: { type: "json_object" },
  };

  return aiQueue.enqueue(featureKey as string, async () => {
    const response = await dedupedRequest(cacheHash, async () => {
      const res = await fetch(`${eligibility.config.default_base_url}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errorDetails = await res.text();
        recordFailure(featureKey as string);
        throw new Error(`OpenAI API failed with status ${res.status}: ${errorDetails}`);
      }

      return res.json();
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) throw new Error("OpenAI Vision returned an empty completion choice.");

    recordSuccess(featureKey as string);

    if (response.usage) {
      const promptTokens = response.usage.prompt_tokens || 0;
      const completionTokens = response.usage.completion_tokens || 0;
      const estimatedCost = calculateEstimatedCost(feature.model, promptTokens, completionTokens, false);
      addMonthlyCost(restaurantId, estimatedCost);
    }

    setMemoCache(cacheHash, content);

    try {
      await supabase.from("ai_cache").upsert({
        hash: cacheHash,
        feature: featureKey,
        input: inputString,
        response: content,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }).then(({ error }) => { if (error) console.error("Failed to write Vision to ai_cache:", error); });
    } catch (err) {
      console.warn("Failed to write Vision cache to DB:", err);
    }

    return content;
  }, "medium");
}

// Embeddings handler (Rule 7)
export async function executeOpenAIEmbeddingCall(
  restaurantId: string,
  texts: string[]
): Promise<number[][]> {
  const eligibility = await verifyAICallEligibility(restaurantId, "menu_embeddings");
  if (!eligibility.eligible) {
    throw new Error(`AI Call blocked: ${eligibility.reason}`);
  }

  if (!checkCircuitBreaker("menu_embeddings")) {
    throw new Error(`AI Call blocked: Circuit breaker open for embeddings`);
  }

  const results: number[][] = new Array(texts.length);
  const missingIndices: number[] = [];
  const missingTexts: string[] = [];

  for (let i = 0; i < texts.length; i++) {
    const text = texts[i].trim().toLowerCase();
    const hash = await getSha256Hash(text);

    const memCached = getCachedEmbedding(text);
    if (memCached) { results[i] = memCached; continue; }

    const localCached = localStorage.getItem(`zappy_openai_emb_${text.replace(/\s+/g, "_")}`);
    if (localCached) {
      try {
        const parsed = JSON.parse(localCached) as number[];
        results[i] = parsed;
        setCachedEmbedding(text, parsed);
        continue;
      } catch {}
    }

    try {
      const { data: dbEmb } = await supabase
        .from("ai_embeddings")
        .select("embedding")
        .eq("hash", hash)
        .maybeSingle();

      if (dbEmb?.embedding) {
        const embArray = typeof dbEmb.embedding === "string" 
          ? JSON.parse(dbEmb.embedding) 
          : (dbEmb.embedding as number[]);
        results[i] = embArray;
        setCachedEmbedding(text, embArray);
        localStorage.setItem(`zappy_openai_emb_${text.replace(/\s+/g, "_")}`, JSON.stringify(embArray));
        await supabase.rpc('increment_embedding_hit', { hash_text: hash }).catch(() => {});
        continue;
      }
    } catch (dbErr) {
      console.warn("Failed to check DB embedding library:", dbErr);
    }

    missingIndices.push(i);
    missingTexts.push(texts[i]);
  }

  if (missingTexts.length > 0) {
    const budget = await checkTokenBudget(restaurantId, missingTexts.length * 50);
    if (!budget.allowed) throw new Error(`AI Call blocked: ${budget.reason}`);

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      console.warn("VITE_OPENAI_API_KEY not configured. Returning mock embeddings.");
      for (let k = 0; k < missingTexts.length; k++) {
        const idx = missingIndices[k];
        const dummyVector = new Array(1536).fill(0).map(() => Math.random() - 0.5);
        results[idx] = dummyVector;
      }
    } else {
      const feature = eligibility.feature;
      const realModel = mapModelToRealOpenAIModel(feature.model);

      const response = await fetch(`${eligibility.config.default_base_url}/embeddings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: realModel,
          input: missingTexts,
        }),
      });

      if (!response.ok) {
        recordFailure("menu_embeddings");
        const errorDetails = await response.text();
        throw new Error(`OpenAI Embeddings failed: ${errorDetails}`);
      }

      recordSuccess("menu_embeddings");
      const data = await response.json();
      const newEmbeddings = data.data?.map((item: any) => item.embedding);

      if (!newEmbeddings || newEmbeddings.length === 0) {
        throw new Error("OpenAI Embeddings returned an empty response.");
      }

      for (let k = 0; k < missingTexts.length; k++) {
        const idx = missingIndices[k];
        const emb = newEmbeddings[k];
        results[idx] = emb;

        const textClean = missingTexts[k].trim().toLowerCase();
        const hash = await getSha256Hash(textClean);
        setCachedEmbedding(textClean, emb);
        localStorage.setItem(`zappy_openai_emb_${textClean.replace(/\s+/g, "_")}`, JSON.stringify(emb));
        try {
          await supabase.from("ai_embeddings").upsert({
            hash: hash,
            text_content: textClean,
            embedding: emb
          }, { onConflict: "hash" }).then(({ error }) => { if (error) console.error("Failed to write to ai_embeddings:", error); });
        } catch (dbErr) {
          console.error("Failed to save embedding to global library:", dbErr);
        }
      }

      if (data.usage) {
        const promptTokens = data.usage.prompt_tokens || 0;
        const estimatedCost = calculateEstimatedCost(feature.model, promptTokens, 0, false);
        addMonthlyCost(restaurantId, estimatedCost);
      }
    }
  }

  return results;
}

// Image generator handler (Rule 4 & 9)
export async function executeOpenAIImageCall(
  restaurantId: string,
  prompt: string,
  quality: "low" | "medium"
): Promise<string> {
  const config = getOpenAIConfig(restaurantId);
  const currentCost = getMonthlyCost(restaurantId);
  if (currentCost >= config.monthly_hard_cap_usd) {
    throw new Error("Monthly AI budget exceeded");
  }

  const match = prompt.match(/Professional food photography of ([^,]+)/i);
  const dishName = match ? match[1].trim().toLowerCase() : prompt.trim().toLowerCase();

  try {
    const { data: imgData } = await supabase
      .from("ai_food_images")
      .select("image_url")
      .eq("name", dishName)
      .maybeSingle();

    if (imgData?.image_url) {
      console.log(`[Cost Blocker] Reusing global image for ${dishName}: ${imgData.image_url}`);
      return imgData.image_url;
    }
  } catch (err) {
    console.warn("Failed to check global ai_food_images library:", err);
  }

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  let resultUrl = "";

  if (!apiKey) {
    console.warn("VITE_OPENAI_API_KEY not configured. Falling back to Pollinations AI.");
    const enhancedPrompt = `${prompt}, professional food photography, 4k, delicious, macro shot, isolated background, styled plate`;
    const aiPrompt = encodeURIComponent(enhancedPrompt);
    resultUrl = `https://image.pollinations.ai/prompt/${aiPrompt}?width=1000&height=1000&nologo=true&seed=${Math.floor(Math.random() * 10000)}`;
  } else {
    const response = await fetch(`${config.default_base_url}/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: prompt,
        n: 1,
        size: "1024x1024"
      }),
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`OpenAI Image Generation failed: ${errorDetails}`);
    }

    const data = await response.json();
    const url = data.data?.[0]?.url;
    const b64_json = data.data?.[0]?.b64_json;

    if (url) resultUrl = url;
    else if (b64_json) resultUrl = `data:image/png;base64,${b64_json}`;

    if (!resultUrl) throw new Error("OpenAI DALL-E returned an empty image list.");

    const cost = quality === "medium" ? 0.08 : 0.04;
    addMonthlyCost(restaurantId, cost);

    const monthKey = new Date().toISOString().substring(0, 7);
    const countKey = `zappy_ai_images_count_${restaurantId}_${monthKey}`;
    const currentCount = parseInt(localStorage.getItem(countKey) || "0") || 0;
    localStorage.setItem(countKey, String(currentCount + 1));
  }

  try {
    await supabase.from("ai_food_images").upsert({
      name: dishName,
      image_url: resultUrl
    }, { onConflict: "name" }).then(({ error }) => { if (error) console.error("Failed to write to ai_food_images:", error); });
  } catch (dbErr) {
    console.error("Failed to save generated image to global library:", dbErr);
  }

  return resultUrl;
}

