import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  FileUp, Loader2, Check, AlertCircle, Save, Trash2, Sparkles,
  Upload, CheckCircle, XCircle, Clock, Files
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateFoodImage } from "@/services/imageGenService";
import {
  processMenuFile,
  processMenuFilesBatch,
  type BatchFileResult,
  type OCRProgress,
} from "@/services/ocrService";
import type { ParsedMenuItem } from "@/services/menuParser";
import { ImageMatcher } from "@/services/imageMatcher";

interface OCRItem {
  name: string;
  price: number;
  category: string;
  confidence: number;
  image_url?: string;
  description?: string;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isJain?: boolean;
  isGlutenFree?: boolean;
}

// Status icon component
function StatusIcon({ status }: { status: BatchFileResult["status"] }) {
  switch (status) {
    case "pending":
      return <Clock className="w-4 h-4 text-muted-foreground" />;
    case "processing":
      return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
    case "completed":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "failed":
      return <XCircle className="w-4 h-4 text-destructive" />;
  }
}

export function MenuOCRImporter({ restaurantId }: { restaurantId: string }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedItems, setExtractedItems] = useState<OCRItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [progressStatus, setProgressStatus] = useState("");
  const [progressValue, setProgressValue] = useState(0);
  const [batchResults, setBatchResults] = useState<BatchFileResult[]>([]);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [ocrEngine, setOcrEngine] = useState<"paddle" | "surya" | "tesseract" | "easy">("tesseract");
  const [languageCode, setLanguageCode] = useState<string>("eng");
  const { toast } = useToast();

  // Single file handler
  const handleSingleFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setProgressStatus("Starting OCR...");
    setProgressValue(0);

    try {
      const items = await processMenuFile(
        file,
        { ocrEngine, languageCode, restaurantId },
        (p: OCRProgress) => {
          setProgressStatus(p.status);
          setProgressValue(p.progress);
        }
      );

      await ImageMatcher.initialize();

      const ocrItems: OCRItem[] = items.map(i => {
        const matchUrl = ImageMatcher.findBestMatch(i.name, i.category);
        return {
          name: i.name,
          price: i.price,
          category: i.category,
          confidence: i.confidence,
          description: i.description,
          isVegetarian: i.isVegetarian,
          isVegan: i.isVegan,
          isJain: i.isJain,
          isGlutenFree: i.isGlutenFree,
          image_url: matchUrl || undefined
        };
      });

      setExtractedItems(ocrItems);
      toast({
        title: "Scan Complete",
        description: `Extracted ${items.length} items from ${file.name}.`,
      });
    } catch (err: any) {
      toast({
        title: "OCR Failed",
        description: err.message || "Could not process file. Try a clearer document.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgressValue(100);
    }
  }, [toast, ocrEngine, languageCode, restaurantId]);

  // Bulk file handler
  const handleBulkFiles = useCallback(async (files: File[]) => {
    setIsProcessing(true);
    setIsBatchMode(true);
    setProgressStatus(`Processing ${files.length} files...`);

    const results = await processMenuFilesBatch(
      files,
      { ocrEngine, languageCode, restaurantId },

      (idx, result) => {
        setBatchResults(prev => {
          const newResults = [...prev];
          newResults[idx] = result;
          return newResults;
        });
        setProgressStatus(`Processing file ${idx + 1}/${files.length}: ${result.fileName}`);
        setProgressValue(Math.round(((idx + 1) / files.length) * 100));
      }
    );

    await ImageMatcher.initialize();

    // Merge all successful items
    const allItems: OCRItem[] = results
      .filter(r => r.status === "completed")
      .flatMap(r =>
        r.items.map(i => {
          const matchUrl = ImageMatcher.findBestMatch(i.name, i.category);
          return {
            name: i.name,
            price: i.price,
            category: i.category,
            confidence: i.confidence,
            description: i.description,
            isVegetarian: i.isVegetarian,
            isVegan: i.isVegan,
            isJain: i.isJain,
            isGlutenFree: i.isGlutenFree,
            image_url: matchUrl || undefined
          };
        })
      );

    setExtractedItems(allItems);
    setBatchResults(results);
    setIsProcessing(false);

    const successCount = results.filter(r => r.status === "completed").length;
    const failCount = results.filter(r => r.status === "failed").length;

    toast({
      title: "Batch Processing Complete",
      description: `${successCount} files processed, ${allItems.length} items extracted${failCount > 0 ? `, ${failCount} files failed` : ""}.`,
    });
  }, [toast, ocrEngine, languageCode, restaurantId]);

  // File input handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Reset state
    setExtractedItems([]);
    setBatchResults([]);
    setIsBatchMode(false);

    if (fileArray.length === 1) {
      await handleSingleFile(fileArray[0]);
    } else {
      await handleBulkFiles(fileArray);
    }
  };

  // Drag & drop handlers
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    setExtractedItems([]);
    setBatchResults([]);
    setIsBatchMode(false);

    if (files.length === 1) {
      await handleSingleFile(files[0]);
    } else {
      await handleBulkFiles(files);
    }
  }, [handleSingleFile, handleBulkFiles]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Save to database
  const handleSaveItems = async () => {
    try {
      // 1. Get or create categories
      const categoryNames = Array.from(new Set(extractedItems.map(i => i.category)));
      const categoryMap: Record<string, string> = {};

      for (const name of categoryNames) {
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('restaurant_id', restaurantId)
          .eq('name', name)
          .single();
        
        if (cat) {
          categoryMap[name] = cat.id;
        } else {
          const { data: newCat } = await supabase
            .from('categories')
            .insert({ restaurant_id: restaurantId, name, is_active: true })
            .select()
            .single();
          if (newCat) categoryMap[name] = newCat.id;
        }
      }

      // 2. Insert items
      const itemsToInsert = extractedItems.map(item => {
        const tags: string[] = [];
        if (item.isVegetarian) tags.push("Veg");
        if (item.isVegan) tags.push("Vegan");
        if (item.isJain) tags.push("Jain");
        if (item.isGlutenFree) tags.push("Gluten-Free");

        return {
          restaurant_id: restaurantId,
          category_id: categoryMap[item.category],
          name: item.name,
          price: item.price,
          image_url: item.image_url,
          description: item.description,
          is_vegetarian: !!item.isVegetarian,
          is_vegan: !!item.isVegan,
          tags: tags,
          is_available: true,
        };
      });

      const { error } = await supabase.from('menu_items').insert(itemsToInsert);
      
      if (error) throw error;

      toast({
        title: "Success",
        description: `${extractedItems.length} items imported to your menu.`,
      });
      setIsOpen(false);
      setExtractedItems([]);
      setBatchResults([]);
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileUp className="w-4 h-4" />
          Menu Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>Menu Upload</DialogTitle>
        </DialogHeader>

        {!extractedItems.length ? (
          <div className="flex flex-col space-y-4">
            {/* Upload Zone */}
            <div
              className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-2xl space-y-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => document.getElementById("menu-ocr-upload")?.click()}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  <div className="text-center space-y-2">
                    <p className="font-semibold text-lg">Processing with AI Vision...</p>
                    <p className="text-sm text-muted-foreground">{progressStatus}</p>
                    <Progress value={progressValue} className="w-64 mx-auto" />
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 bg-primary/10 rounded-full">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <p className="font-semibold text-lg text-slate-700 dark:text-slate-300">upload new menu</p>
                  <Input
                    type="file"
                    className="hidden"
                    id="menu-ocr-upload"
                    onChange={handleFileUpload}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                    multiple
                  />
                </>
              )}
            </div>

            {/* Batch Progress */}
            {isBatchMode && batchResults.length > 0 && (
              <div className="border rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Files className="w-4 h-4" />
                  Batch Progress ({batchResults.filter(r => r.status === "completed").length}/{batchResults.length})
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {batchResults.map((result, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm px-2 py-1 rounded bg-muted/50">
                      <div className="flex items-center gap-2">
                        <StatusIcon status={result.status} />
                        <span className="truncate max-w-[300px]">{result.fileName}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {result.status === "completed" && `${result.items.length} items`}
                        {result.status === "processing" && `${result.progress}%`}
                        {result.status === "failed" && (
                          <span className="text-destructive">{result.error}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {extractedItems.length} items extracted — review and edit below.
              </p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-primary gap-1"
                  onClick={async () => {
                    toast({ title: "Matching images...", description: "Searching Storage for matches..." });
                    await ImageMatcher.initialize(true);
                    let matchCount = 0;
                    const newItems = [...extractedItems];
                    for (let i = 0; i < newItems.length; i++) {
                      if (!newItems[i].image_url) {
                        const url = ImageMatcher.findBestMatch(newItems[i].name, newItems[i].category);
                        if (url) {
                          newItems[i] = { ...newItems[i], image_url: url };
                          matchCount++;
                        }
                      }
                    }
                    setExtractedItems([...newItems]);
                    toast({ title: `Matched ${matchCount} new images!` });
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                  Auto-Match Storage Images
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setExtractedItems([]); setBatchResults([]); }} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 border rounded-md">
              <div className="p-4 space-y-3">
                {extractedItems.map((item, idx) => (
                  <Card key={idx} className="border-l-4 border-l-primary/50">
                    <CardContent className="p-3 space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        {item.image_url && (
                          <div className="h-16 w-16 rounded-md overflow-hidden bg-muted shrink-0">
                            <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 grid grid-cols-3 gap-3">
                          <div className="col-span-1">
                            <Label className="text-[10px] uppercase text-muted-foreground font-semibold">Name</Label>
                            <Input 
                              value={item.name} 
                              onChange={(e) => {
                                const newItems = [...extractedItems];
                                newItems[idx].name = e.target.value;
                                setExtractedItems(newItems);
                              }}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] uppercase text-muted-foreground font-semibold">Price (₹)</Label>
                            <Input 
                              type="number"
                              value={item.price} 
                              onChange={(e) => {
                                const newItems = [...extractedItems];
                                newItems[idx].price = Number(e.target.value);
                                setExtractedItems(newItems);
                              }}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] uppercase text-muted-foreground font-semibold">Category</Label>
                            <Input 
                              value={item.category} 
                              onChange={(e) => {
                                const newItems = [...extractedItems];
                                newItems[idx].category = e.target.value;
                                setExtractedItems(newItems);
                              }}
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-4">
                          <span className="text-[10px] font-semibold text-muted-foreground">Confidence: {item.confidence}%</span>
                          {item.confidence > 80 && <Check className="w-4 h-4 text-green-500" />}
                          {item.confidence <= 80 && <AlertCircle className="w-4 h-4 text-yellow-500" />}
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setExtractedItems(items => items.filter((_, i) => i !== idx))}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Dietary Badges and Toggle Controls */}
                      <div className="flex items-center gap-4 border-t pt-2 text-xs flex-wrap">
                        <span className="text-[10px] uppercase text-muted-foreground font-semibold">Dietary Profile:</span>
                        
                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={item.isVegetarian || false}
                            onChange={(e) => {
                              const newItems = [...extractedItems];
                              newItems[idx].isVegetarian = e.target.checked;
                              if (!e.target.checked) {
                                newItems[idx].isVegan = false;
                                newItems[idx].isJain = false;
                              }
                              setExtractedItems(newItems);
                            }}
                            className="w-3.5 h-3.5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.isVegetarian 
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                              : "bg-muted text-muted-foreground"
                          }`}>
                            Veg
                          </span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={item.isVegan || false}
                            onChange={(e) => {
                              const newItems = [...extractedItems];
                              newItems[idx].isVegan = e.target.checked;
                              if (e.target.checked) {
                                newItems[idx].isVegetarian = true;
                              }
                              setExtractedItems(newItems);
                            }}
                            className="w-3.5 h-3.5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                          />
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.isVegan 
                              ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400" 
                              : "bg-muted text-muted-foreground"
                          }`}>
                            Vegan
                          </span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={item.isJain || false}
                            onChange={(e) => {
                              const newItems = [...extractedItems];
                              newItems[idx].isJain = e.target.checked;
                              if (e.target.checked) {
                                newItems[idx].isVegetarian = true;
                              }
                              setExtractedItems(newItems);
                            }}
                            className="w-3.5 h-3.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.isJain 
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" 
                              : "bg-muted text-muted-foreground"
                          }`}>
                            Jain
                          </span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={item.isGlutenFree || false}
                            onChange={(e) => {
                              const newItems = [...extractedItems];
                              newItems[idx].isGlutenFree = e.target.checked;
                              setExtractedItems(newItems);
                            }}
                            className="w-3.5 h-3.5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.isGlutenFree 
                              ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" 
                              : "bg-muted text-muted-foreground"
                          }`}>
                            Gluten-Free
                          </span>
                        </label>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            <div className="pt-4 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1 gap-2" onClick={handleSaveItems}>
                <Save className="w-4 h-4" />
                Confirm & Import {extractedItems.length} Items
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
