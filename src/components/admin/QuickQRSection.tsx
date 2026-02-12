import { useRef } from "react";
import { motion } from "framer-motion";
import { Download, QrCode } from "lucide-react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PUBLISHED_URL = "https://qr-pal-maker.lovable.app";

interface Table {
  id: string;
  table_number: string;
}

interface QuickQRSectionProps {
  tables: Table[];
  selectedTableId: string;
  onTableChange: (tableId: string) => void;
  baseUrl?: string;
  restaurantId: string;
}

export function QuickQRSection({
  tables,
  selectedTableId,
  onTableChange,
  baseUrl = PUBLISHED_URL,
  restaurantId,
}: QuickQRSectionProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const selectedTable = tables.find((t) => t.id === selectedTableId);
  const qrValue = selectedTable
    ? `${baseUrl}/order?r=${restaurantId}&table=${selectedTable.table_number}`
    : "";

  const handleDownload = () => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const pngUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `QR-${selectedTable?.table_number || "table"}.png`;
    link.href = pngUrl;
    link.click();
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
              {/* Visible QR */}
              <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
                <QRCodeSVG value={qrValue} size={256} level="H" includeMargin />
              </div>
              {/* Hidden high-res canvas for download */}
              <div ref={canvasRef} style={{ position: "absolute", left: "-9999px" }}>
                <QRCodeCanvas value={qrValue} size={512} level="H" includeMargin />
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
