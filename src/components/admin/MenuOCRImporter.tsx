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

interface OCRItem {
  name: string;
  price: number;
  category: string;
  confidence: number;
  image_url?: string;
  description?: string;
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
  const { toast } = useToast();

  // Single file handler
  const handleSingleFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setProgressStatus("Starting OCR...");
    setProgressValue(0);

    try {
      const items = await processMenuFile(file, (p: OCRProgress) => {
        setProgressStatus(p.status);
        setProgressValue(p.progress);
      });

      const ocrItems: OCRItem[] = items.map(i => ({
        name: i.name,
        price: i.price,
        category: i.category,
        confidence: i.confidence,
        description: i.description,
      }));

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
  }, [toast]);

  // Bulk file handler
  const handleBulkFiles = useCallback(async (files: File[]) => {
    setIsProcessing(true);
    setIsBatchMode(true);
    setProgressStatus(`Processing ${files.length} files...`);

    const results = await processMenuFilesBatch(files, (idx, result) => {
      setBatchResults(prev => {
        const newResults = [...prev];
        newResults[idx] = result;
        return newResults;
      });
      setProgressStatus(`Processing file ${idx + 1}/${files.length}: ${result.fileName}`);
      setProgressValue(Math.round(((idx + 1) / files.length) * 100));
    });

    // Merge all successful items
    const allItems: OCRItem[] = results
      .filter(r => r.status === "completed")
      .flatMap(r =>
        r.items.map(i => ({
          name: i.name,
          price: i.price,
          category: i.category,
          confidence: i.confidence,
          description: i.description,
        }))
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
  }, [toast]);

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
      const itemsToInsert = extractedItems.map(item => ({
        restaurant_id: restaurantId,
        category_id: categoryMap[item.category],
        name: item.name,
        price: item.price,
        image_url: item.image_url,
        description: item.description,
        is_available: true,
      }));

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
          Bulk OCR Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Local OCR Menu Import
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            100% offline — Tesseract.js OCR · No cloud APIs · Supports bulk upload
          </p>
        </DialogHeader>

        {!extractedItems.length ? (
          <div className="flex flex-col space-y-4">
            {/* Upload Zone */}
            <div
              className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-xl space-y-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  <div className="text-center space-y-2">
                    <p className="font-semibold text-lg">Processing with Local OCR...</p>
                    <p className="text-sm text-muted-foreground">{progressStatus}</p>
                    <Progress value={progressValue} className="w-64 mx-auto" />
                  </div>
                </>
              ) : (
                <>
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
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                    multiple
                  />
                  <Button asChild>
                    <label htmlFor="menu-ocr-upload" className="cursor-pointer gap-2">
                      <Files className="w-4 h-4" />
                      Select Files
                    </label>
                  </Button>
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
                    toast({ title: "Generating images...", description: "AI is creating photos for all items." });
                    const newItems = [...extractedItems];
                    for (let i = 0; i < newItems.length; i++) {
                      try {
                        const url = await generateFoodImage(newItems[i].name, "", restaurantId);
                        newItems[i] = { ...newItems[i], image_url: url };
                        setExtractedItems([...newItems]);
                      } catch (e) {
                        console.error("Failed to generate image for " + newItems[i].name);
                      }
                    }
                    toast({ title: "All images generated!" });
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                  AI Generate Images
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
                    <CardContent className="p-3 flex items-center justify-between gap-4">
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <div className="col-span-1">
                          <Label className="text-[10px] uppercase text-muted-foreground">Name</Label>
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
                          <Label className="text-[10px] uppercase text-muted-foreground">Price</Label>
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
                          <Label className="text-[10px] uppercase text-muted-foreground">Category</Label>
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
                      <div className="flex items-center gap-2">
                        {item.confidence > 0.9 && <Check className="w-4 h-4 text-green-500" />}
                        {item.confidence <= 0.9 && item.confidence > 0.7 && <AlertCircle className="w-4 h-4 text-yellow-500" />}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setExtractedItems(items => items.filter((_, i) => i !== idx))}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
