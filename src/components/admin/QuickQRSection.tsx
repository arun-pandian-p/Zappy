import { motion } from "framer-motion";
import { Download, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Table {
  id: string;
  table_number: string;
}

interface QuickQRSectionProps {
  tables: Table[];
  selectedTableId: string;
  onTableChange: (tableId: string) => void;
  baseUrl?: string;
}

export function QuickQRSection({
  tables,
  selectedTableId,
  onTableChange,
  baseUrl = window.location.origin,
}: QuickQRSectionProps) {
  const selectedTable = tables.find((t) => t.id === selectedTableId);
  const qrValue = selectedTable
    ? `${baseUrl}/menu?table=${selectedTable.table_number}`
    : "";

  const handleDownload = () => {
    const svg = document.querySelector("#admin-qr-code svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 300;
      canvas.height = 300;
      ctx?.drawImage(img, 0, 0, 300, 300);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR-${selectedTable?.table_number || "table"}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Quick QR Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedTableId} onValueChange={onTableChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select table" />
            </SelectTrigger>
            <SelectContent>
              {tables.map((table) => (
                <SelectItem key={table.id} value={table.id}>
                  {table.table_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedTable && (
            <div className="flex flex-col items-center">
              <div
                id="admin-qr-code"
                className="bg-white p-4 rounded-xl shadow-sm mb-4"
              >
                <QRCodeSVG value={qrValue} size={160} level="H" />
              </div>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Scan to order from {selectedTable.table_number}
              </p>
              <Button onClick={handleDownload} variant="outline" className="w-full gap-2">
                <Download className="w-4 h-4" />
                Download QR Code
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
