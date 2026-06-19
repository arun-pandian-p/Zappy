import { useState, useEffect, useRef } from "react";
import { useQRCodes, useCreateQRCode, useUpdateQRCode, useDeleteQRCode, type QRCode } from "@/hooks/useQRCodes";
import { useRestaurantDetails } from "@/hooks/useRestaurant";
import { useTables, useCreateTable, useDeleteTable } from "@/hooks/useTables";
import { getAppOrigin } from "@/utils/url";
import { AdvancedQRBuilder } from "@/components/admin/qr/AdvancedQRBuilder";
import { QRPrintCenter } from "@/components/admin/qr/QRPrintCenter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Download, Trash2, QrCode as QrCodeIcon, Loader2, Grid3X3, X, ExternalLink, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import jsPDF from "jspdf";
import QRCodeStyling, { DotType, CornerSquareType, CornerDotType } from "qr-code-styling";

interface QRCenterProps {
  restaurantId: string;
}

// Sub-component to manage the individual QRCodeStyling instance for each list item
function QRPreviewCard({ 
  qr, 
  getQRValue, 
  onCustomize, 
  onDelete, 
  isDeleting, 
  toast 
}: { 
  qr: QRCode; 
  getQRValue: (qr: QRCode) => string;
  onCustomize: (qr: QRCode) => void;
  onDelete: (qr: QRCode) => void;
  isDeleting: boolean;
  toast: any;
}) {
  const meta = (qr.metadata as any) || {};
  const qrRef = useRef<HTMLDivElement>(null);
  const [qrCode] = useState(() => new QRCodeStyling({
    width: 1024,
    height: 1024,
    type: "svg",
    margin: 32,  // 32px quiet zone for ISO 18004 compliance
    imageOptions: { crossOrigin: "anonymous", margin: 10 }
  }));

  useEffect(() => {
    qrCode.update({
      data: getQRValue(qr),
      dotsOptions: {
        type: (meta.dots_type || "square") as DotType,  // square = max scan reliability
        color: !meta.use_gradient ? (meta.fg_color || "#000000") : undefined,
        gradient: meta.use_gradient ? {
          type: "linear",
          colorStops: [
            { offset: 0, color: meta.fg_color || "#000000" },
            { offset: 1, color: meta.gradient_color || "#000000" }
          ]
        } : undefined
      },
      backgroundOptions: { color: meta.bg_color || "#FFFFFF" },  // always explicit white
      cornersSquareOptions: {
        type: (meta.corners_square_type || "square") as CornerSquareType,  // square corners = max scan reliability
        color: meta.fg_color || "#000000"
      },
      cornersDotOptions: {
        type: (meta.corners_dot_type || "square") as CornerDotType,
        color: meta.fg_color || "#000000"
      },
      image: meta.logo_url || undefined,
      imageOptions: {
        crossOrigin: "anonymous",
        margin: (meta.logo_excavate ?? true) ? 10 : 0,
        imageSize: Math.min(meta.logo_size || 0.2, 0.25)  // cap at 25% — never cover scan area
      },
      qrOptions: { errorCorrectionLevel: (meta.error_level || "H") as any }
    });

    if (qrRef.current) {
      qrRef.current.innerHTML = "";
      qrCode.append(qrRef.current);
      const svg = qrRef.current.querySelector("svg");
      if (svg) {
        svg.style.width = "100%";
        svg.style.height = "auto";
        svg.style.maxWidth = "120px";
      }
    }
  }, [qr, qrCode, getQRValue, meta]);

  const downloadQR = async (ext: "png" | "svg") => {
    try {
      await qrCode.download({ extension: ext, name: `zappy-qr-${qr.qr_name.replace(/\\s+/g, '-').toLowerCase()}` });
      toast({ title: "Success", description: `Downloaded QR code as ${ext.toUpperCase()}` });
    } catch (e) {
      console.error("Export error", e);
      toast({ title: "Error", description: `Failed to download ${ext.toUpperCase()}`, variant: "destructive" });
    }
  };

  const downloadPDF = async () => {
    try {
      const rawSvg = await qrCode.getRawData("svg");
      if (!rawSvg) throw new Error("Could not get SVG data");
      
      const svgData = new XMLSerializer().serializeToString(rawSvg as Node);
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          ctx.fillStyle = meta.bg_color || "#FFFFFF";  // always white base for print
          ctx.fillRect(0, 0, 1024, 1024);
          // add 32px quiet zone margin around QR
          ctx.drawImage(img, 0, 0, 1024, 1024);
          
          const imgData = canvas.toDataURL("image/png");
          const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
          });
          
          pdf.setFontSize(22);
          pdf.text(qr.qr_name || "QR Code", 105, 30, { align: "center" });
          pdf.addImage(imgData, 'PNG', 55, 50, 100, 100);
          
          pdf.setFontSize(12);
          pdf.text("Scan me!", 105, 160, { align: "center" });
          
          pdf.save(`zappy-qr-${qr.qr_name.replace(/\\s+/g, '-').toLowerCase()}.pdf`);
        } catch (e) {
          console.error("PDF generation error:", e);
          toast({ title: "Error", description: "Failed to generate PDF.", variant: "destructive" });
        }
      };
      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
    }
  };

  return (
    <Card className="group overflow-hidden rounded-3xl border-0 shadow-md hover:shadow-xl transition-all hover:-translate-y-1 bg-white dark:bg-zinc-950">
      <div 
        className="h-40 flex items-center justify-center relative border-b"
        style={{ backgroundColor: meta.bg_color || "#FFFFFF" }}
      >
        <div className="p-2 bg-white rounded-xl shadow-lg ring-1 ring-black/5 flex items-center justify-center" style={{ width: 136, height: 136 }}>
          <div ref={qrRef} className="flex items-center justify-center" />
        </div>
      </div>
      <CardContent className="p-5">
        <h4 className="font-bold text-base mb-1 truncate" title={qr.qr_name}>{qr.qr_name}</h4>
        <p className="text-xs text-muted-foreground font-mono truncate mb-4" title={qr.target_url}>
          {qr.target_url || "Auto-redirects to menu"}
        </p>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-4">
          <span>
            {(() => {
              try {
                return qr.created_at ? format(new Date(qr.created_at), "MMM d, yyyy") : "N/A";
              } catch (e) {
                return "N/A";
              }
            })()}
          </span>
          <span className="font-medium bg-muted px-2 py-0.5 rounded-full">{qr.scan_count || 0} scans</span>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" className="w-full rounded-xl gap-1 h-9 text-[10px]" onClick={() => downloadQR("png")}>
            <Download className="w-3 h-3" /> PNG
          </Button>
          <Button variant="outline" size="sm" className="w-full rounded-xl gap-1 h-9 text-[10px]" onClick={downloadPDF}>
            <Download className="w-3 h-3" /> PDF
          </Button>
          <Button variant="outline" size="sm" className="w-full rounded-xl gap-1 h-9 text-[10px]" onClick={() => downloadQR("svg")}>
            <Download className="w-3 h-3" /> SVG
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full rounded-xl gap-1.5 h-9 text-xs"
            onClick={() => onCustomize(qr)}
          >
            Customize
          </Button>
          {!(meta.is_base_qr) ? (
            <Button
              variant="ghost"
              size="sm"
              className="w-full rounded-xl gap-1.5 h-9 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(qr)}
              disabled={isDeleting}
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          ) : (
            <div />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function QRCenter({ restaurantId }: QRCenterProps) {
  const { data: qrCodes = [], isLoading } = useQRCodes(restaurantId);
  const { data: restaurant } = useRestaurantDetails(restaurantId);
  const { data: tables = [] } = useTables(restaurantId);
  const createQR = useCreateQRCode();
  const updateQR = useUpdateQRCode();
  const deleteQR = useDeleteQRCode();
  
  const createTable = useCreateTable();
  const deleteTable = useDeleteTable();
  const [newTableNumber, setNewTableNumber] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState("4");
  
  const { toast } = useToast();
  const [editingQR, setEditingQR] = useState<QRCode | null>(null);

  const handleDeleteQR = async (qr: QRCode) => {
    if (!confirm(`Are you sure you want to deactivate/delete "${qr.qr_name}"?`)) return;
    try {
      await deleteQR.mutateAsync({ id: qr.id, tenantId: restaurantId });
      toast({ title: "Success", description: "QR Code deactivated successfully!" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : JSON.stringify(e);
      toast({ title: "Error", description: msg || "Failed to delete QR code", variant: "destructive" });
    }
  };

  const handleAddTable = async () => {
    if (!newTableNumber.trim()) {
      toast({ title: "Enter table number", description: "Table number is required.", variant: "destructive" });
      return;
    }
    try {
      const table = await createTable.mutateAsync({
        restaurant_id: restaurantId,
        table_number: newTableNumber.trim(),
        capacity: parseInt(newTableCapacity) || 4,
        status: "available",
      });

      await createQR.mutateAsync({
        tenant_id: restaurantId,
        qr_name: `Table ${newTableNumber.trim()}`,
        target_url: `/order?r=${restaurantId}&table=${newTableNumber.trim()}`,
        qr_type: "dynamic",
        metadata: {
          table_id: table.id,
          table_number: newTableNumber.trim(),
        },
      });

      toast({ title: "Table Added", description: `Table ${newTableNumber} created with tracked QR code.` });
      setNewTableNumber("");
      setNewTableCapacity("4");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteTable = async (table: any) => {
    if (!confirm(`Delete table ${table.table_number}? Its QR code will be deactivated.`)) return;
    try {
      await deleteTable.mutateAsync({ id: table.id, restaurantId });
      const matchingQR = qrCodes.find(
        (q) => (q.metadata as any)?.table_id === table.id
      );
      if (matchingQR) {
        await deleteQR.mutateAsync({ id: matchingQR.id, tenantId: restaurantId });
      }
      toast({ title: "Table Deleted", description: `Table ${table.table_number} removed.` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const [showBuilder, setShowBuilder] = useState(false);

  const BASE_URL = (restaurant?.settings as any)?.qr_base_url || getAppOrigin();
  const REDIRECT_BASE = `${BASE_URL}/r`;

  const getQRValue = (qr: QRCode) => {
    if (qr.qr_type === "dynamic") {
      return `${REDIRECT_BASE}/${qr.id}`;
    }
    if (qr.target_url?.startsWith('/')) {
      return `${BASE_URL}${qr.target_url}`;
    }
    return qr.target_url || BASE_URL;
  };

  const handleSaveQR = async (config: any) => {
    try {
      let computedTarget = config.target_url;
      if (config.qr_type_selection === "table") {
        computedTarget = `/menu?r=${restaurantId}&table=${config.table_number}`;
      }

      if (editingQR) {
        await updateQR.mutateAsync({
          id: editingQR.id,
          tenantId: restaurantId,
          qr_name: config.qr_name,
          target_url: computedTarget,
          metadata: {
            ...((editingQR.metadata as any) || {}),
            ...config
          }
        });
        toast({ title: "Success", description: "QR Code updated successfully!" });
        setEditingQR(null);
      } else {
        await createQR.mutateAsync({
          tenant_id: restaurantId,
          qr_name: config.qr_name,
          target_url: computedTarget,
          qr_type: "dynamic",
          metadata: config
        });
        toast({ title: "Success", description: "QR Code created successfully!" });
        setShowBuilder(false);
      }
    } catch (e) {
      toast({ title: "Error", description: editingQR ? "Failed to update QR code" : "Failed to create QR code", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Enterprise QR Center</h2>
          <p className="text-muted-foreground text-sm">Build, customize, and manage smart dynamic QR codes.</p>
        </div>
        {!showBuilder && !editingQR && (
          <Button onClick={() => setShowBuilder(true)} className="rounded-xl shadow-md gap-2 h-10">
            <Plus className="w-4 h-4" /> Create New QR
          </Button>
        )}
      </div>

      {showBuilder || editingQR ? (
        <Card className="border-0 shadow-lg rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-lg font-bold">{editingQR ? "Customize QR Code" : "QR Code Builder"}</h3>
              <Button variant="ghost" size="sm" onClick={() => { setShowBuilder(false); setEditingQR(null); }}>Cancel</Button>
            </div>
            <AdvancedQRBuilder 
              onSave={handleSaveQR}
              onDelete={editingQR ? () => handleDeleteQR(editingQR) : undefined}
              isSaving={createQR.isPending || updateQR.isPending}
              tables={tables}
              initialValues={editingQR ? {
                ...((editingQR.metadata as any) || {}),
                qr_name: editingQR.qr_name,
                target_url: editingQR.target_url,
              } : undefined}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            <div className="col-span-full py-12 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : qrCodes.filter((qr) => qr.is_active !== false).map((qr) => (
            <QRPreviewCard 
              key={qr.id}
              qr={qr}
              getQRValue={getQRValue}
              onCustomize={setEditingQR}
              onDelete={handleDeleteQR}
              isDeleting={deleteQR.isPending}
              toast={toast}
            />
          ))}
        </div>
      )}

      {!showBuilder && !editingQR && !isLoading && (
        <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white dark:bg-zinc-950">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Grid3X3 className="w-5 h-5 text-primary" />
              Table Management
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Add tables to auto-generate tracked QR codes. Each table gets its own dynamic QR.
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-end gap-3 max-w-md">
              <div className="space-y-1 flex-1 w-full">
                <Label className="text-xs font-semibold">Table Number</Label>
                <Input
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  placeholder="e.g. 1, 2, T3"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1 w-full sm:w-24">
                <Label className="text-xs font-semibold">Capacity</Label>
                <Input
                  type="number"
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(e.target.value)}
                  min="1"
                  max="20"
                  className="rounded-xl"
                />
              </div>
              <Button onClick={handleAddTable} disabled={createTable.isPending} className="rounded-xl gap-2 h-10 w-full sm:w-auto">
                {createTable.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Table
              </Button>
            </div>

            {tables.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-2">
                {tables.map((table) => {
                  const menuUrl = `/order?r=${restaurantId}&table=${table.table_number}`;
                  return (
                    <div
                      key={table.id}
                      className="relative group p-4 rounded-2xl border bg-slate-50 dark:bg-zinc-900/50 hover:border-primary/50 transition-all text-center space-y-3"
                    >
                      <div>
                        <span className="font-bold text-base block text-slate-800 dark:text-slate-100">Table {table.table_number}</span>
                        <span className="text-xs text-muted-foreground block">{table.capacity} seats</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-8 rounded-xl gap-1"
                        onClick={() => window.open(menuUrl, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3" /> Test Menu
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                        onClick={() => handleDeleteTable(table)}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-6 text-sm border border-dashed rounded-2xl">
                No tables configured yet. Add one above to get started.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {!showBuilder && !isLoading && (
        <QRPrintCenter restaurantId={restaurantId} baseUrl={BASE_URL} tables={tables} />
      )}
    </div>
  );
}
