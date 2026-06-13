import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { executeOpenAIChatCall } from "@/services/openaiService";
import { generateEmbedding, cosineSimilarity, getOpenAIEmbedding } from "@/services/recommendations/embeddingService";
import { FOOD_NODES } from "@/services/recommendations/foodGraph";
import { 
  Sparkles, Brain, Check, Plus, Trash2, Loader2, ArrowRight, Info, Award
} from "lucide-react";

interface FoodGraphReasoningProps {
  restaurantId: string;
  menuItems: any[];
}

interface SuggestedPairing {
  item_name: string;
  type: "drink" | "side" | "addon";
  weight: number;
  reason: string;
}

export function FoodGraphReasoning({ restaurantId, menuItems = [] }: FoodGraphReasoningProps) {
  const { toast } = useToast();
  const [selectedItemName, setSelectedItemName] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedPairing[]>([]);
  const [approvedPairings, setApprovedPairings] = useState<Array<{ sourceName: string; targetName: string; weight: number; reason: string; type: string }>>([]);

  // Load approved pairings on mount
  useEffect(() => {
    const cached = localStorage.getItem(`zappy_approved_pairings_${restaurantId}`);
    if (cached) {
      try {
        setApprovedPairings(JSON.parse(cached));
      } catch {
        setApprovedPairings([]);
      }
    }
  }, [restaurantId]);

  const handleSavePairings = (newPairings: typeof approvedPairings) => {
    localStorage.setItem(`zappy_approved_pairings_${restaurantId}`, JSON.stringify(newPairings));
    // Also save under general key for the customer-side fallback
    localStorage.setItem(`zappy_approved_pairings`, JSON.stringify(newPairings));
    setApprovedPairings(newPairings);
  };

  const handleAnalyze = async () => {
    if (!selectedItemName) {
      toast({
        title: "Selection Required",
        description: "Please select a menu item first.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setSuggestions([]);

    try {
      // 1. Get embedding for the target item (try OpenAI dense embeddings, fallback to local TF-IDF)
      let targetVec: any;
      try {
        targetVec = await getOpenAIEmbedding(selectedItemName, restaurantId);
      } catch (embErr) {
        console.warn("[Food Graph] OpenAI Embedding failed, falling back to local TF-IDF.", embErr);
        targetVec = generateEmbedding(selectedItemName);
      }

      // 2. Pre-filter candidate menu items using cosine similarity
      const otherItems = menuItems.filter(item => item.name.toLowerCase() !== selectedItemName.toLowerCase() && item.is_available);
      
      const rankedCandidatesWithSim = await Promise.all(otherItems.map(async (item) => {
        let itemVec: any;
        try {
          itemVec = await getOpenAIEmbedding(item.name, restaurantId);
        } catch {
          itemVec = generateEmbedding(item.name);
        }
        const similarity = cosineSimilarity(targetVec, itemVec);
        return { item, similarity };
      }));

      const rankedCandidates = rankedCandidatesWithSim
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 8) // Select top 8 candidates for reasoning (cost control)
        .map(c => c.item);

      if (rankedCandidates.length === 0) {
        throw new Error("No available candidate items found in your menu to pair with.");
      }

      console.log(`[Food Graph] Pre-filtered ${rankedCandidates.length} candidates using embedding similarity.`);

      // 3. Query o4-mini (mapped to gpt-4o-mini) for final culinary matching and reasoning
      const systemPrompt = `You are a professional Michelin-star chef and menu engineering expert.
Analyze the target menu item and the list of candidate pairing items from the restaurant's menu.
Suggest matching food, side dishes, or beverage pairings that complement the target item.
Only suggest pairings that make high culinary sense (e.g. burgers pair with fries/soda, curries pair with naan/rice, desserts pair with hot beverages).
Return the result strictly as a JSON object with a single key "pairings" containing an array of objects conforming to:
interface SuggestedPairing {
  item_name: string;
  type: "drink" | "side" | "addon";
  weight: number; // between 0.5 and 1.0 based on pairing strength
  reason: string; // 1 concise culinary reason (max 12 words)
}`;

      const userPrompt = `Target Item: "${selectedItemName}"
Candidate Pairing Items:
${rankedCandidates.map(c => `- ${c.name} (Category: ${c.category?.name || "Main Course"})`).join("\n")}`;

      const aiResponse = await executeOpenAIChatCall(
        restaurantId,
        "food_graph_reasoning",
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        { type: "json_object" }
      );

      const parsed = JSON.parse(aiResponse);
      if (parsed && Array.isArray(parsed.pairings)) {
        setSuggestions(parsed.pairings);
        toast({
          title: "Analysis Complete",
          description: `Culinary engine generated ${parsed.pairings.length} recommendations.`
        });
      } else {
        throw new Error("Invalid response format from AI Culinary engine.");
      }

    } catch (err: any) {
      toast({
        title: "AI Analysis Failed",
        description: err.message || "Could not reason pairings. Fallback to manual setup.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApprovePairing = (suggestion: SuggestedPairing) => {
    // Check if already approved
    const exists = approvedPairings.some(
      p => p.sourceName.toLowerCase() === selectedItemName.toLowerCase() && 
           p.targetName.toLowerCase() === suggestion.item_name.toLowerCase()
    );

    if (exists) {
      toast({
        title: "Already Approved",
        description: "This pairing relation is already active.",
        variant: "destructive"
      });
      return;
    }

    const updated = [
      ...approvedPairings,
      {
        sourceName: selectedItemName,
        targetName: suggestion.item_name,
        weight: suggestion.weight,
        reason: suggestion.reason,
        type: suggestion.type
      }
    ];

    handleSavePairings(updated);
    toast({
      title: "Pairing Approved",
      description: `Linked "${selectedItemName}" with "${suggestion.item_name}".`
    });
  };

  const handleRemovePairing = (idx: number) => {
    const updated = approvedPairings.filter((_, i) => i !== idx);
    handleSavePairings(updated);
    toast({
      title: "Pairing Removed",
      description: "Relationship deleted from the Food Graph."
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
      {/* Advisor panel (Left) */}
      <Card className="lg:col-span-7 border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-500" />
            AI Pairings Advisor
          </CardTitle>
          <CardDescription>
            Select an item, and the AI Culinary reasoning engine (o4-mini) will analyze embeddings similarity to propose smart menu recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Target Menu Item</Label>
            <select
              value={selectedItemName}
              onChange={(e) => setSelectedItemName(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">-- Select an Item --</option>
              {menuItems.filter(i => i.is_available).map(i => (
                <option key={i.id} value={i.name}>
                  {i.name} ({i.category?.name || "Main"})
                </option>
              ))}
            </select>
          </div>

          <Button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing || !selectedItemName} 
            className="w-full gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/10"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing with Culinary AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analyze Complementary Pairings
              </>
            )}
          </Button>

          {suggestions.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">AI Proposals</h3>
              <div className="space-y-3">
                {suggestions.map((suggestion, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border bg-muted/20 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{suggestion.item_name}</span>
                        <Badge variant="secondary" className="capitalize text-[10px] py-0.5">
                          {suggestion.type}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] text-amber-600 bg-amber-50 border-amber-200">
                          {Math.round(suggestion.weight * 100)}% Match
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                        {suggestion.reason}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleApprovePairing(suggestion)}
                      className="rounded-lg gap-1.5 self-end sm:self-center bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4" /> Approve
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Graph Panel (Right) */}
      <Card className="lg:col-span-5 border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-950 dark:text-indigo-50">
            <Award className="w-5 h-5 text-indigo-600" />
            Active Food Graph Edges
          </CardTitle>
          <CardDescription>
            Restaurant-configured custom recommendation relationships currently live.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {approvedPairings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm border border-dashed rounded-xl">
              No custom recommendations linked yet. Analyze items using the Advisor to publish suggestions.
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {approvedPairings.map((pairing, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl border bg-card text-xs">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[120px]">{pairing.sourceName}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[120px]">{pairing.targetName}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[220px]">
                      Reason: {pairing.reason}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemovePairing(idx)}
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
