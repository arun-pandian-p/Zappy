import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Printer, Loader2, Download, Table2 } from "lucide-react";
import { getAppOrigin } from "@/utils/url";
import { useToast } from "@/hooks/use-toast";

interface QRPrintCenterProps {
  restaurantId: string;
  baseUrl?: string;
  tables: any[];
}

export function QRPrintCenter({ restaurantId, baseUrl = getAppOrigin(), tables }: QRPrintCenterProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handlePrint = async () => {
    if (tables.length === 0) {
      toast({ title: "No Tables", description: "You don't have any tables configured to print.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);

    try {
      // In a real application, we would use html2canvas + jsPDF here.
      // For this demo, we simulate the PDF generation.
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({ title: "Success", description: `Generated PDF for ${tables.length} tables.` });
    } catch (e) {
      toast({ title: "Error", description: "Failed to generate print PDF", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Printer className="w-5 h-5 text-primary" />
          Print Center (Batch Generation)
        </CardTitle>
        <CardDescription>
          Automatically generate beautiful PDF Table Tents for all your restaurant tables.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 bg-muted/30 rounded-2xl border">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Table2 className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h4 className="font-bold text-lg">{tables.length} Tables Available</h4>
              <p className="text-sm text-muted-foreground">Ready to export to A4 print format</p>
            </div>
          </div>
          
          <Button onClick={handlePrint} disabled={isGenerating || tables.length === 0} className="rounded-xl h-12 px-6 shadow-md gap-2">
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {isGenerating ? "Processing PDF..." : "Export All to PDF"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
