import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  FileUp, Loader2, Check, AlertCircle, Save, Trash2, Sparkles,
  Upload, CheckCircle, XCircle, Clock, Files, CopySlash, CheckSquare, Square
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { generateFoodImage } from "@/services/imageGenService";
import {
  processMenuFile,
  processMenuFilesBatch,
  type BatchFileResult,
  type OCRProgress,
} from "@/services/ocrService";
import type { ParsedMenuItem } from "@/services/menuParser";
import { ImageMatcher } from "@/services/imageMatcher";
import { FoodLoader } from "@/components/shared/FoodLoader";

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
  needsReview?: boolean;
  reviewReason?: string;
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

interface MenuOCRImporterProps {
  restaurantId: string;
  onSuccess?: (count: number) => void;
}

export function MenuOCRImporter({ restaurantId, onSuccess }: MenuOCRImporterProps) {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedItems, setExtractedItems] = useState<OCRItem[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isOpen, setIsOpen] = useState(false);
  const [progressStatus, setProgressStatus] = useState("");
  const [progressValue, setProgressValue] = useState(0);
  const [batchResults, setBatchResults] = useState<BatchFileResult[]>([]);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [ocrEngine, setOcrEngine] = useState<"paddle" | "surya" | "tesseract" | "easy">("paddle");
  const [languageCode, setLanguageCode] = useState<string>("eng");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  // Reset selections when items change
  useEffect(() => {
    setSelectedIndices(new Set());
  }, [extractedItems.length]);

  // Compute duplicate occurrences in extractedItems
  const { duplicateIndices, duplicateCount } = useMemo(() => {
    const seen = new Set<string>();
    const dupIndices = new Set<number>();
    extractedItems.forEach((item, idx) => {
      const key = item.name.trim().toLowerCase();
      if (seen.has(key)) {
        dupIndices.add(idx);
      } else {
        seen.add(key);
      }
    });
    return { duplicateIndices: dupIndices, duplicateCount: dupIndices.size };
  }, [extractedItems]);

  const isAllSelected = extractedItems.length > 0 && selectedIndices.size === extractedItems.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(extractedItems.map((_, idx) => idx)));
    }
  };

  const handleToggleSelect = (index: number) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedIndices.size === 0) return;
    const remaining = extractedItems.filter((_, idx) => !selectedIndices.has(idx));
    const count = selectedIndices.size;
    setExtractedItems(remaining);
    setSelectedIndices(new Set());
    toast({
      title: "Items Deleted",
      description: `Removed ${count} selected item(s).`,
    });
  };

  const handleRemoveDuplicates = () => {
    const seen = new Set<string>();
    const deduped: OCRItem[] = [];
    let removed = 0;
    extractedItems.forEach((item) => {
      const key = item.name.trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(item);
      } else {
        removed++;
      }
    });
    setExtractedItems(deduped);
    setSelectedIndices(new Set());
    toast({
      title: "Duplicates Removed",
      description: `Removed ${removed} duplicate item(s) from the import list.`,
    });
  };

  // Active elapsed time timer during OCR inference
  useEffect(() => {
    let timer: any = null;
    if (isProcessing) {
      setElapsedSeconds(0);
      timer = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isProcessing]);

  // Handle immediate cancellation of running OCR
  const handleCancelOCR = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsProcessing(false);
    setProgressStatus("Processing stopped");
    toast({
      title: "OCR Cancelled",
      description: "Menu parsing was stopped by user.",
    });
  }, [toast]);

  // Single file handler
  const handleSingleFile = useCallback(async (file: File) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsProcessing(true);
    setProgressStatus("Initializing OCR engine...");
    setProgressValue(5);

    try {
      const items = await processMenuFile(
        file,
        {
          ocrEngine,
          languageCode,
          restaurantId,
          signal: controller.signal,
          timeoutMs: 120_000,
        },
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
          needsReview: i.needsReview || (!i.price && i.price !== 0),
          reviewReason: i.reviewReason || (!i.price ? "Missing price in document" : undefined),
          image_url: matchUrl || undefined
        };
      });

      setExtractedItems(ocrItems);
      toast({
        title: "Scan Complete",
        description: `Extracted ${items.length} items from ${file.name}.`,
      });
    } catch (err: any) {
      const isAbort = err?.name === "AbortError" || controller.signal.aborted;
      if (isAbort) {
        toast({
          title: "OCR Stopped",
          description: "Menu scanning was stopped.",
        });
      } else {
        const isTimeout = err?.message?.includes("timed out");
        toast({
          title: isTimeout ? "OCR Timed Out" : "OCR Failed",
          description: isTimeout
            ? "PaddleOCR took longer than 2 minutes. The AI Space may be cold-starting or busy. You can retry or switch to local Tesseract."
            : (err.message || "Could not process file. Try a clearer document."),
          variant: "destructive",
        });
      }
    } finally {
      setIsProcessing(false);
      setProgressValue(100);
      abortControllerRef.current = null;
    }
  }, [toast, ocrEngine, languageCode, restaurantId]);

  // Bulk file handler
  const handleBulkFiles = useCallback(async (files: File[]) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsProcessing(true);
    setIsBatchMode(true);
    setProgressStatus(`Processing ${files.length} files...`);

    try {
      const results = await processMenuFilesBatch(
        files,
        {
          ocrEngine,
          languageCode,
          restaurantId,
          signal: controller.signal,
          timeoutMs: 120_000,
        },
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
              needsReview: i.needsReview || (!i.price && i.price !== 0),
              reviewReason: i.reviewReason || (!i.price ? "Missing price in document" : undefined),
              image_url: matchUrl || undefined
            };
          })
        );

      setExtractedItems(allItems);
      setBatchResults(results);

      const successCount = results.filter(r => r.status === "completed").length;
      toast({
        title: "Batch Processing Complete",
        description: `Successfully processed ${successCount}/${files.length} files. Extracted ${allItems.length} items.`,
      });
    } catch (err: any) {
      const isAbort = err?.name === "AbortError" || controller.signal.aborted;
      if (isAbort) {
        toast({
          title: "Batch Processing Stopped",
          description: "Batch OCR processing was cancelled.",
        });
      }
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  }, [ocrEngine, languageCode, restaurantId, toast]);

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
      if (extractedItems.length === 0) return;

      // 1. Fetch all existing categories for this restaurant
      const { data: existingCategories } = await supabase
        .from('categories')
        .select('id, name')
        .eq('restaurant_id', restaurantId);

      const categoryMap = new Map<string, string>();
      (existingCategories || []).forEach(c => {
        if (c.name) categoryMap.set(c.name.trim().toLowerCase(), c.id);
      });

      // 2. Identify missing categories and insert them safely
      const requiredCategories = Array.from(new Set(
        extractedItems.map(i => (i.category || "Main Course").trim()).filter(Boolean)
      ));

      for (const catName of requiredCategories) {
        const key = catName.toLowerCase();
        if (!categoryMap.has(key)) {
          const { data: newCat, error: insertCatErr } = await supabase
            .from('categories')
            .insert({
              restaurant_id: restaurantId,
              name: catName,
              is_active: true
            })
            .select('id, name')
            .single();

          if (newCat) {
            categoryMap.set(key, newCat.id);
          } else if (insertCatErr) {
            console.warn(`Category creation warning for "${catName}":`, insertCatErr.message);
          }
        }
      }

      // Default category fallback
      const defaultCategoryId = categoryMap.values().next().value || (existingCategories?.[0]?.id ?? null);

      // 3. Prepare items to insert
      const itemsToInsert = extractedItems.map(item => {
        const catName = (item.category || "Main Course").trim();
        const catId = categoryMap.get(catName.toLowerCase()) || defaultCategoryId;
        const tags: string[] = [];
        if (item.isVegetarian) tags.push("Veg");
        if (item.isVegan) tags.push("Vegan");
        if (item.isJain) tags.push("Jain");
        if (item.isGlutenFree) tags.push("Gluten-Free");

        return {
          restaurant_id: restaurantId,
          category_id: catId,
          name: item.name.trim(),
          price: Number(item.price) || 0,
          image_url: item.image_url || null,
          description: item.description || "",
          is_vegetarian: !!item.isVegetarian,
          is_vegan: !!item.isVegan,
          tags: tags,
          is_available: true,
        };
      });

      // 4. Pre-check vs Existing Items in the Database for this restaurant to prevent duplicates!
      const { data: existingDbItems } = await supabase
        .from('menu_items')
        .select('name')
        .eq('restaurant_id', restaurantId);

      const existingDbNames = new Set((existingDbItems || []).map(i => i.name.trim().toLowerCase()));

      const uniqueItemsToInsert: typeof itemsToInsert = [];
      const seenInBatch = new Set<string>();
      let skippedExistingCount = 0;
      let skippedBatchCount = 0;

      for (const item of itemsToInsert) {
        const key = item.name.toLowerCase().trim();
        if (seenInBatch.has(key)) {
          skippedBatchCount++;
          continue;
        }
        seenInBatch.add(key);

        if (existingDbNames.has(key)) {
          skippedExistingCount++;
          continue;
        }
        uniqueItemsToInsert.push(item);
      }

      if (uniqueItemsToInsert.length === 0) {
        toast({
          title: "All Items Already Exist",
          description: `All ${extractedItems.length} items already exist in your menu. No duplicates were created.`,
        });
        setIsOpen(false);
        setExtractedItems([]);
        setBatchResults([]);
        return;
      }

      const { data: inserted, error } = await supabase
        .from('menu_items')
        .insert(uniqueItemsToInsert)
        .select('id');
      
      if (error) throw error;

      // Invalidate React Query caches so Admin Menu Management & Customer Menu refresh immediately!
      await queryClient.invalidateQueries({ queryKey: ["menu_items", restaurantId] });
      await queryClient.invalidateQueries({ queryKey: ["categories", restaurantId] });
      await queryClient.invalidateQueries({ queryKey: ["restaurant", restaurantId] });

      toast({
        title: "Import Successful",
        description: `${inserted?.length || extractedItems.length} items published to your menu.`,
      });

      if (onSuccess) onSuccess(inserted?.length || extractedItems.length);
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
      <DialogContent className={`sm:max-w-[800px] w-[95vw] flex flex-col overflow-hidden ${
        extractedItems.length > 0 ? "h-[88vh] max-h-[88vh]" : "max-h-[90vh]"
      }`}>
        <DialogHeader className="shrink-0 pb-2 border-b">
          <DialogTitle className="text-base font-semibold">
            {extractedItems.length > 0 ? "Review Extracted Menu Items" : "Menu Upload"}
          </DialogTitle>
        </DialogHeader>

        {!extractedItems.length ? (
          <div className="flex flex-col space-y-4">
            {/* Engine Selection */}
            <div className="flex items-center justify-between pb-2 border-b">
              <span className="text-xs font-medium text-muted-foreground">OCR Engine:</span>
              <div className="flex gap-1.5 bg-muted/60 p-1 rounded-lg">
                {[
                  { id: "paddle", label: "PaddleOCR-VL-1.6", badge: "Cloud" },
                  { id: "tesseract", label: "Tesseract.js", badge: "Local" },
                  { id: "surya", label: "Surya OCR", badge: "API" },
                  { id: "easy", label: "EasyOCR", badge: "API" },
                ].map((eng) => (
                  <button
                    key={eng.id}
                    type="button"
                    onClick={() => setOcrEngine(eng.id as any)}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all flex items-center gap-1.5 ${
                      ocrEngine === eng.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {eng.label}
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded uppercase ${
                        ocrEngine === eng.id
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {eng.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Zone */}
            <div
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl transition-all ${
                isProcessing
                  ? "py-8 border-primary/40 bg-primary/5 cursor-default"
                  : "py-16 space-y-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5"
              }`}
              onDrop={!isProcessing ? handleDrop : undefined}
              onDragOver={!isProcessing ? handleDragOver : undefined}
              onClick={() => {
                if (!isProcessing) {
                  document.getElementById("menu-ocr-upload")?.click();
                }
              }}
            >
              {isProcessing ? (
                <FoodLoader
                  message={
                    ocrEngine === "paddle"
                      ? "Extracting menu with PaddleOCR-VL-1.6..."
                      : `Extracting menu with ${ocrEngine.toUpperCase()}...`
                  }
                  subMessage={
                    progressStatus
                      ? `${progressStatus} · ${elapsedSeconds}s / 120s`
                      : `Analyzing document layout & text · ${elapsedSeconds}s / 120s`
                  }
                  progress={progressValue}
                  onCancel={handleCancelOCR}
                  cancelLabel="Stop Processing"
                  size="md"
                />
              ) : (
                <>
                  <div className="p-4 bg-primary/10 rounded-full">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <p className="font-semibold text-lg text-slate-700 dark:text-slate-300">upload new menu</p>
                  <p className="text-xs text-muted-foreground">Click to browse or drag & drop menu files</p>
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
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col space-y-3 pt-1">
            <div className="flex items-center justify-between shrink-0 gap-2 flex-wrap border-b pb-2">
              <div className="flex items-center gap-3">
                <label 
                  className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground select-none"
                  onClick={handleToggleSelectAll}
                >
                  <Checkbox 
                    checked={isAllSelected}
                    onCheckedChange={handleToggleSelectAll}
                  />
                  <span>Select All ({extractedItems.length})</span>
                </label>
                {selectedIndices.size > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedIndices.size} selected
                  </Badge>
                )}
                {duplicateCount > 0 && (
                  <Badge variant="outline" className="text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30 text-[11px] gap-1">
                    <CopySlash className="w-3 h-3" />
                    {duplicateCount} duplicate(s)
                  </Badge>
                )}
              </div>

              <div className="flex gap-2 flex-wrap items-center">
                {duplicateCount > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 bg-amber-500/10 hover:bg-amber-500/20 text-xs h-8"
                    onClick={handleRemoveDuplicates}
                  >
                    <CopySlash className="w-3.5 h-3.5" />
                    Remove Duplicates ({duplicateCount})
                  </Button>
                )}
                {selectedIndices.size > 0 && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="gap-1 text-xs h-8"
                    onClick={handleDeleteSelected}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Selected ({selectedIndices.size})
                  </Button>
                )}
                {extractedItems.some(i => i.price === 0 && /candidate ₹\d+/.test(i.reviewReason || "")) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 bg-amber-500/10 hover:bg-amber-500/20 text-xs h-8"
                    onClick={() => {
                      const newItems = extractedItems.map(item => {
                        if (item.price === 0 && item.reviewReason) {
                          const m = item.reviewReason.match(/candidate ₹(\d+(?:\.\d{1,2})?)/);
                          if (m && Number(m[1]) > 0) {
                            return { ...item, price: Number(m[1]), needsReview: false };
                          }
                        }
                        return item;
                      });
                      setExtractedItems(newItems);
                      toast({ title: "Auto-filled candidate prices for separated items" });
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Auto-Fill Prices
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-primary gap-1 text-xs h-8"
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

            <div className="flex-1 min-h-0 overflow-y-auto border rounded-xl p-4 space-y-3 bg-muted/5 shadow-inner overscroll-contain focus:outline-none">
                {extractedItems.map((item, idx) => {
                  const isDup = duplicateIndices.has(idx);
                  const isSelected = selectedIndices.has(idx);
                  return (
                    <Card key={idx} className={`border-l-4 transition-all ${
                      isSelected ? 'ring-2 ring-primary border-l-primary bg-primary/[0.02]' : isDup ? 'border-l-amber-500 bg-amber-500/[0.02]' : 'border-l-primary/50'
                    }`}>
                      <CardContent className="p-3 space-y-3">
                        <div className="flex items-center justify-between gap-4">
                          {/* Individual select checkbox */}
                          <div className="flex items-center shrink-0 pr-1 cursor-pointer" onClick={() => handleToggleSelect(idx)}>
                            <Checkbox 
                              checked={isSelected}
                              onCheckedChange={() => handleToggleSelect(idx)}
                              className="data-[state=checked]:bg-primary"
                            />
                          </div>

                          {item.image_url && (
                            <div className="h-16 w-16 rounded-md overflow-hidden bg-muted shrink-0">
                              <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1 grid grid-cols-3 gap-3">
                            <div className="col-span-1">
                              <div className="flex items-center gap-1.5">
                                <Label className="text-[10px] uppercase text-muted-foreground font-semibold">Name</Label>
                                {isDup && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-amber-500/10 text-amber-600 border-amber-500/30">
                                    Duplicate
                                  </Badge>
                                )}
                              </div>
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

                      {item.needsReview && (
                        <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span className="font-medium truncate">
                              {item.reviewReason || "Price or attribute requires review before importing."}
                            </span>
                          </div>
                          {(() => {
                            const match = item.reviewReason?.match(/candidate ₹(\d+(?:\.\d{1,2})?)/);
                            if (match && Number(match[1]) > 0 && item.price === 0) {
                              const candidatePrice = Number(match[1]);
                              return (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-[11px] px-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 border-amber-500/40 shrink-0"
                                  onClick={() => {
                                    const newItems = [...extractedItems];
                                    newItems[idx].price = candidatePrice;
                                    newItems[idx].needsReview = false;
                                    setExtractedItems(newItems);
                                  }}
                                >
                                  Apply ₹{candidatePrice}
                                </Button>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      )}

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
                );
              })}
            </div>

            <div className="pt-3 flex gap-3 shrink-0 border-t mt-auto">
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
