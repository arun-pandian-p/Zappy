import { supabase } from "@/integrations/supabase/client";

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
  version: "1.0",
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
      model: "gpt-4.1-mini",
      supports_vision: true,
      max_tokens: 4000,
      temperature: 0.1,
      tier_required: "basic"
    },
    food_graph_reasoning: {
      model: "o4-mini",
      max_tokens: 500,
      temperature: 0.3,
      tier_required: "enterprise"
    },
    superadmin_ai_insights: {
      model: "gpt-5.4-mini",
      max_tokens: 2000,
      temperature: 0.4,
      tier_required: "enterprise",
      use_batch_api: true
    },
    menu_embeddings: {
      model: "text-embedding-3-small",
      dimensions: 1536,
      tier_required: "basic"
    }
  },
  rate_limit_strategy: "queue_with_batch_fallback",
  cost_tracking: true,
  monthly_hard_cap_usd: 10.0
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
  if (m.includes("gpt-5.4-mini")) {
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
  if (m.includes("gpt-5.4") && !m.includes("mini") && !m.includes("nano")) {
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

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_OPENAI_API_KEY not configured in environment.");
  }

  const feature = eligibility.feature;
  const realModel = mapModelToRealOpenAIModel(feature.model);

  const requestBody = {
    model: realModel,
    messages,
    max_tokens: feature.max_tokens,
    temperature: feature.temperature,
    response_format: responseFormat,
  };

  const response = await fetch(`${eligibility.config.default_base_url}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`OpenAI API failed with status ${response.status}: ${errorDetails}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI API returned an empty completion choice.");
  }

  // Cost tracking
  if (data.usage) {
    const promptTokens = data.usage.prompt_tokens || 0;
    const completionTokens = data.usage.completion_tokens || 0;
    const isBatch = !!feature.use_batch_api;
    const estimatedCost = calculateEstimatedCost(feature.model, promptTokens, completionTokens, isBatch);
    addMonthlyCost(restaurantId, estimatedCost);
  }

  return content;
}

// Vision handler
export async function executeOpenAIVisionCall(
  restaurantId: string,
  featureKey: keyof OpenAIModelConfig["features"],
  base64Images: string[], // Base64 data URLs
  promptText: string
): Promise<string> {
  const eligibility = await verifyAICallEligibility(restaurantId, featureKey);
  if (!eligibility.eligible) {
    throw new Error(`AI Call blocked: ${eligibility.reason}`);
  }

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_OPENAI_API_KEY not configured in environment.");
  }

  const feature = eligibility.feature;
  const realModel = mapModelToRealOpenAIModel(feature.model);

  const imageContents = base64Images.map((b64) => ({
    type: "image_url",
    image_url: {
      url: b64, // e.g. "data:image/png;base64,..."
    },
  }));

  const messages = [
    {
      role: "user",
      content: [
        { type: "text", text: promptText },
        ...imageContents,
      ],
    },
  ];

  const requestBody = {
    model: realModel,
    messages,
    max_tokens: feature.max_tokens,
    temperature: feature.temperature,
    response_format: { type: "json_object" },
  };

  const response = await fetch(`${eligibility.config.default_base_url}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`OpenAI API failed with status ${response.status}: ${errorDetails}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI Vision returned an empty completion choice.");
  }

  if (data.usage) {
    const promptTokens = data.usage.prompt_tokens || 0;
    const completionTokens = data.usage.completion_tokens || 0;
    const estimatedCost = calculateEstimatedCost(feature.model, promptTokens, completionTokens, false);
    addMonthlyCost(restaurantId, estimatedCost);
  }

  return content;
}

// Embeddings handler
export async function executeOpenAIEmbeddingCall(
  restaurantId: string,
  texts: string[]
): Promise<number[][]> {
  const eligibility = await verifyAICallEligibility(restaurantId, "menu_embeddings");
  if (!eligibility.eligible) {
    throw new Error(`AI Call blocked: ${eligibility.reason}`);
  }

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_OPENAI_API_KEY not configured in environment.");
  }

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
      input: texts,
    }),
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`OpenAI Embeddings failed: ${errorDetails}`);
  }

  const data = await response.json();
  const embeddings = data.data?.map((item: any) => item.embedding);

  if (!embeddings || embeddings.length === 0) {
    throw new Error("OpenAI Embeddings returned an empty response.");
  }

  if (data.usage) {
    const promptTokens = data.usage.prompt_tokens || 0;
    const estimatedCost = calculateEstimatedCost(feature.model, promptTokens, 0, false);
    addMonthlyCost(restaurantId, estimatedCost);
  }

  return embeddings;
}
