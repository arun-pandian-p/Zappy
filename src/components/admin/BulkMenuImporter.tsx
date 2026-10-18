import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { FileUp, Loader2, Save, Trash2, Upload, Files, CopySlash, Check, AlertCircle, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { processMenuFile, OCRProgress } from "@/services/ocrService";
import type { ParsedMenuItem as ExtractedMenuItem } from "@/services/menuParser";
import { FoodLoader } from "@/components/shared/FoodLoader";

interface ParsedMenuItem {
  name: string;
  price: number;
  category: string;
  description: string;
  is_available: boolean;
  is_veg: boolean;
}

interface BulkMenuImporterProps {
  restaurantId: string;
  onSuccess?: (count: number) => void;
  onClose?: () => void;
}

export default function BulkMenuImporter({ restaurantId, onSuccess, onClose }: BulkMenuImporterProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState("Waiting for files...");
  const [progressValue, setProgressValue] = useState(0);
  const [extractedItems, setExtractedItems] = useState<ParsedMenuItem[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Reset selection when extracted items change
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
    const deduped: ParsedMenuItem[] = [];
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

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      if (onClose) onClose();
    }
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setProgressValue(0);

    try {
      const items = await processMenuFile(
        file,
        { ocrEngine: "tesseract", languageCode: "eng" },
        (p: OCRProgress) => {
          setProgressStatus(p.status);
          setProgressValue(p.progress);
        }
      );

      setExtractedItems((prev) => {
        const newItems = [...prev];
        for (const item of items) {
          if (!newItems.find((i) => i.name.toLowerCase() === item.name.toLowerCase())) {
            newItems.push({
              name: item.name,
              price: item.price,
              category: item.category,
              description: item.description || "",
              is_available: true,
              is_veg: item.isVegetarian !== undefined ? item.isVegetarian : true,
            });
          }
        }
        return newItems;
      });
      setProgressStatus(`Success! Found ${items.length} items in ${file.name}`);
    } catch (err: any) {
      setError(err.message || "Failed to process file.");
      setProgressStatus("Failed");
    } finally {
      setIsProcessing(false);
      setProgressValue(100);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setExtractedItems([]);
    for (const file of Array.from(files)) {
      await processFile(file);
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    setExtractedItems([]);
    for (const file of files) {
      await processFile(file);
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleSaveItems = async () => {
    if (extractedItems.length === 0) return;
    setIsProcessing(true);
    setProgressStatus("Saving items to database...");
    
    try {
      // 1. Fetch all existing categories for this restaurant
      const { data: existingCategories } = await supabase
        .from("categories")
        .select("id, name")
        .eq("restaurant_id", restaurantId);

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
            .from("categories")
            .insert({
              restaurant_id: restaurantId,
              name: catName,
              is_active: true
            })
            .select("id, name")
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
        return {
          restaurant_id: restaurantId,
          category_id: catId,
          name: item.name.trim(),
          price: Number(item.price) || 0,
          description: item.description || "",
          is_vegetarian: !!item.is_veg,
          is_available: item.is_available ?? true,
          tags: item.is_veg ? ["Veg"] : ["Non-Veg"]
        };
      });

      // 4. Pre-check vs Existing Items in the Database for this restaurant to prevent duplicates!
      const { data: existingDbItems } = await supabase
        .from("menu_items")
        .select("name")
        .eq("restaurant_id", restaurantId);

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
        return;
      }

      const { data: inserted, error: insertErr } = await supabase
        .from("menu_items")
        .insert(uniqueItemsToInsert)
        .select("id");
      
      if (insertErr) throw insertErr;

      // Invalidate React Query caches so Admin Menu Management & Customer Menu refresh immediately!
      await queryClient.invalidateQueries({ queryKey: ["menu_items", restaurantId] });
      await queryClient.invalidateQueries({ queryKey: ["categories", restaurantId] });
      await queryClient.invalidateQueries({ queryKey: ["restaurant", restaurantId] });

      const totalSkipped = skippedExistingCount + skippedBatchCount;
      toast({
        title: "Import Complete",
        description: totalSkipped > 0
          ? `Saved ${inserted?.length || uniqueItemsToInsert.length} items (${totalSkipped} duplicates skipped).`
          : `Saved ${inserted?.length || uniqueItemsToInsert.length} items to your menu.`,
      });

      if (onSuccess) onSuccess(inserted?.length || uniqueItemsToInsert.length);
      setIsOpen(false);
      setExtractedItems([]);
    } catch (err: any) {
      setError(err.message || "Failed to save items to database.");
      toast({
        title: "Import Failed",
        description: err.message || "Failed to save items to database.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileUp className="w-4 h-4" />
          Bulk OCR Import
        </Button>
      </DialogTrigger>
      <DialogContent className={`sm:max-w-[800px] w-[95vw] flex flex-col overflow-hidden ${
        extractedItems.length > 0 ? "h-[88vh] max-h-[88vh]" : "max-h-[90vh]"
      }`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Menu Importer (OCR)
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Extracts text from PDF, JPG, PNG, DOCX, CSV, Excel. Automatically recognizes categories and prices.
          </p>
          <div className="flex gap-2.5 mt-2">
            <Button variant="outline" size="sm" asChild className="h-8 text-xs font-semibold rounded-lg border-primary/20 hover:bg-primary/5">
              <a href="/samples/menu_template.xlsx" download="menu_template.xlsx" className="flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" />
                <span>Download Excel Template</span>
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild className="h-8 text-xs font-semibold rounded-lg border-primary/20 hover:bg-primary/5">
              <a href="/samples/menu_template.csv" download="menu_template.csv" className="flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV Template</span>
              </a>
            </Button>
          </div>
        </DialogHeader>

        {!extractedItems.length && !isProcessing ? (
          <div className="flex flex-col space-y-4">
             {error && <div className="text-red-500 text-sm font-semibold">{error}</div>}
            {/* Upload Zone */}
            <div
              className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-xl space-y-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="p-4 bg-primary/10 rounded-full">
                <FileUp className="w-10 h-10 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg">Upload Menu Files</p>
                <p className="text-sm text-muted-foreground">
                  Drag & drop or click · JPG, PNG, PDF, Word, Excel, CSV
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Select multiple files for bulk processing
                </p>
              </div>
              <Input
                type="file"
                className="hidden"
                id="menu-ocr-upload"
                onChange={handleFileUpload}
                accept="image/*,.pdf,.doc,.docx,.csv,.txt,.xls,.xlsx"
                multiple
              />
              <Button asChild>
                <label htmlFor="menu-ocr-upload" className="cursor-pointer gap-2">
                  <Files className="w-4 h-4" />
                  Select Files
                </label>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col space-y-3 pt-1">
            {isProcessing && (
              <div className="py-2 bg-muted/20 rounded-xl">
                <FoodLoader
                  message="Extracting Menu Items..."
                  subMessage={progressStatus}
                  progress={progressValue}
                  size="sm"
                />
              </div>
            )}
            
            {error && <div className="text-red-500 text-sm font-semibold">{error}</div>}

            {extractedItems.length > 0 && (
              <>
                <div className="flex flex-wrap items-center justify-between shrink-0 gap-2 p-2.5 bg-muted/40 rounded-xl border">
                  <div className="flex items-center gap-3">
                    {/* Select All Checkbox */}
                    <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleToggleSelectAll}
                        className="data-[state=checked]:bg-primary"
                      />
                      <span>Select All ({extractedItems.length})</span>
                    </label>

                    {selectedIndices.size > 0 && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleDeleteSelected}
                        className="h-7 text-xs px-2.5 rounded-lg shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Delete Selected ({selectedIndices.size})
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {duplicateCount > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleRemoveDuplicates}
                        className="h-7 text-xs px-2.5 rounded-lg border-amber-500/40 text-amber-600 hover:bg-amber-500/10 font-semibold"
                      >
                        <CopySlash className="w-3.5 h-3.5 mr-1" />
                        Remove Duplicates ({duplicateCount})
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExtractedItems([])}
                      className="h-7 text-xs px-2 text-muted-foreground hover:text-destructive"
                    >
                      Clear All
                    </Button>
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto border rounded-xl p-4 space-y-3 bg-muted/5 shadow-inner overscroll-contain focus:outline-none">
                  {extractedItems.map((item, idx) => {
                    const isDup = duplicateIndices.has(idx);
                    const isSelected = selectedIndices.has(idx);
                    return (
                      <Card 
                        key={idx} 
                        className={`border-l-4 transition-all ${
                          isSelected
                            ? 'ring-2 ring-primary border-l-primary bg-primary/[0.02]'
                            : isDup
                            ? 'border-l-amber-500 bg-amber-500/[0.02]'
                            : 'border-l-primary/50'
                        }`}
                      >
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
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setExtractedItems(items => items.filter((_, i) => i !== idx))}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 border-t pt-2 text-xs flex-wrap">
                            <span className="text-[10px] uppercase text-muted-foreground font-semibold">Type:</span>
                            <label className="flex items-center gap-1.5 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={item.is_veg}
                                onChange={(e) => {
                                  const newItems = [...extractedItems];
                                  newItems[idx].is_veg = e.target.checked;
                                  setExtractedItems(newItems);
                                }}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                              />
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.is_veg 
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                                  : "bg-muted text-muted-foreground"
                              }`}>
                                Veg
                              </span>
                            </label>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <div className="pt-3 flex gap-3 shrink-0 border-t mt-auto">
                  <Button variant="outline" className="flex-1" onClick={() => setIsOpen(false)} disabled={isProcessing}>
                    Cancel
                  </Button>
                  <Button className="flex-1 gap-2" onClick={handleSaveItems} disabled={isProcessing}>
                    <Save className="w-4 h-4" />
                    Confirm & Import {extractedItems.length} Items
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
