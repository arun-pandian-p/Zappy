import React, { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { FileUp, Loader2, Save, Trash2, Upload, Files } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { processMenuFile, OCRProgress } from "@/services/ocrService";
import type { ParsedMenuItem as ExtractedMenuItem } from "@/services/menuParser";

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
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState("Waiting for files...");
  const [progressValue, setProgressValue] = useState(0);
  const [extractedItems, setExtractedItems] = useState<ParsedMenuItem[]>([]);
  const [error, setError] = useState<string | null>(null);

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
      // 1. Get or create categories
      const categoryNames = Array.from(new Set(extractedItems.map(i => i.category)));
      const categoryMap: Record<string, string> = {};

      for (const name of categoryNames) {
        const { data: cat } = await supabase
          .from("categories")
          .select("id")
          .eq("restaurant_id", restaurantId)
          .eq("name", name)
          .single();
        
        if (cat) {
          categoryMap[name] = cat.id;
        } else {
          const { data: newCat, error: catError } = await supabase
            .from("categories")
            .insert({ restaurant_id: restaurantId, name, is_active: true })
            .select()
            .single();
          if (newCat) categoryMap[name] = newCat.id;
        }
      }

      // 2. Insert items
      const itemsToInsert = extractedItems.map(item => ({
        restaurant_id: restaurantId,
        category_id: categoryMap[item.category],
        name: item.name,
        price: item.price,
        description: item.description || "",
        is_vegetarian: item.is_veg,
        is_available: item.is_available,
        tags: item.is_veg ? ["Veg"] : ["Non-Veg"]
      }));

      const { error } = await supabase.from("menu_items").insert(itemsToInsert);
      
      if (error) throw error;

      if (onSuccess) onSuccess(extractedItems.length);
      setIsOpen(false);
      setExtractedItems([]);
    } catch (err: any) {
      setError(err.message || "Failed to save items to database.");
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
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] flex flex-col">
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
              <a href="/samples/menu_template.xlsx" download="menu_template.xlsx">
                📥 Download Excel Template
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild className="h-8 text-xs font-semibold rounded-lg border-primary/20 hover:bg-primary/5">
              <a href="/samples/menu_template.csv" download="menu_template.csv">
                📥 Download CSV Template
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
          <div className="flex-1 overflow-hidden flex flex-col space-y-4">
            {isProcessing && (
              <div className="flex flex-col items-center justify-center py-6 bg-muted/20 rounded-xl space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="font-semibold text-sm">{progressStatus}</p>
                <Progress value={progressValue} className="w-64 mx-auto" />
              </div>
            )}
            
            {error && <div className="text-red-500 text-sm font-semibold">{error}</div>}

            {extractedItems.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    {extractedItems.length} items extracted — review and edit below.
                  </p>
                  <Button size="sm" variant="ghost" onClick={() => setExtractedItems([])} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                </div>

                <ScrollArea className="flex-1 border rounded-md">
                  <div className="p-4 space-y-3">
                    {extractedItems.map((item, idx) => (
                      <Card key={idx} className="border-l-4 border-l-primary/50">
                        <CardContent className="p-3 space-y-3">
                          <div className="flex items-center justify-between gap-4">
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
                    ))}
                  </div>
                </ScrollArea>

                <div className="pt-4 flex gap-3">
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
