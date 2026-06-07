import { useState } from "react";
import { useQRCodes, useCreateQRCode, useUpdateQRCode, useDeleteQRCode, type QRCode } from "@/hooks/useQRCodes";
import { useRestaurantDetails } from "@/hooks/useRestaurant";
import { useTables } from "@/hooks/useTables";
import { getAppOrigin } from "@/utils/url";
import { AdvancedQRBuilder } from "@/components/admin/qr/AdvancedQRBuilder";
import { QRPrintCenter } from "@/components/admin/qr/QRPrintCenter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Download, Trash2, QrCode as QrCodeIcon, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface QRCenterProps {
  restaurantId: string;
}

export function QRCenter({ restaurantId }: QRCenterProps) {
  const { data: qrCodes = [], isLoading } = useQRCodes(restaurantId);
  const { data: restaurant } = useRestaurantDetails(restaurantId);
  const { data: tables = [] } = useTables(restaurantId);
  const createQR = useCreateQRCode();
  const updateQR = useUpdateQRCode();
  const deleteQR = useDeleteQRCode();
  const { toast } = useToast();

  const [editingQR, setEditingQR] = useState<QRCode | null>(null);

  const handleDeleteQR = async (qr: QRCode) => {
    if (!confirm(`Are you sure you want to deactivate/delete "${qr.qr_name}"?`)) return;
    try {
      await deleteQR.mutateAsync({ id: qr.id, tenantId: restaurantId });
      toast({ title: "Success", description: "QR Code deactivated successfully!" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete QR code", variant: "destructive" });
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
      if (editingQR) {
        await updateQR.mutateAsync({
          id: editingQR.id,
          tenantId: restaurantId,
          qr_name: config.qr_name,
          target_url: config.target_url,
          metadata: {
            ...((editingQR.metadata as any) || {}),
            fg_color: config.fg_color,
            bg_color: config.bg_color,
            logo_url: config.logo_url,
            logo_excavate: config.logo_excavate,
            error_level: config.error_level,
            logo_size: config.logo_size
          }
        });
        toast({ title: "Success", description: "QR Code updated successfully!" });
        setEditingQR(null);
      } else {
        await createQR.mutateAsync({
          tenant_id: restaurantId,
          qr_name: config.qr_name,
          target_url: config.target_url,
          qr_type: "dynamic",
          metadata: {
            fg_color: config.fg_color,
            bg_color: config.bg_color,
            logo_url: config.logo_url,
            logo_excavate: config.logo_excavate,
            error_level: config.error_level,
            logo_size: config.logo_size
          }
        });
        toast({ title: "Success", description: "QR Code created successfully!" });
        setShowBuilder(false);
      }
    } catch (e) {
      toast({ title: "Error", description: editingQR ? "Failed to update QR code" : "Failed to create QR code", variant: "destructive" });
    }
  };

  const downloadQR = (qr: QRCode, size = 1024) => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use a temporary SVG element to render the exact design, then convert to canvas to export PNG
    // For now, simpler download logic:
    const svgEl = document.getElementById(`qr-svg-${qr.id}`);
    if (!svgEl) return;
    
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = (qr.metadata as any)?.bg_color || "#FFFFFF";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      
      const a = document.createElement("a");
      a.download = `zappy-qr-${qr.qr_name.replace(/\s+/g, '-').toLowerCase()}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
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
              isSaving={createQR.isPending || updateQR.isPending} 
              initialValues={editingQR ? {
                qr_name: editingQR.qr_name,
                target_url: editingQR.target_url,
                fg_color: (editingQR.metadata as any)?.fg_color,
                bg_color: (editingQR.metadata as any)?.bg_color,
                error_level: (editingQR.metadata as any)?.error_level,
                logo_url: (editingQR.metadata as any)?.logo_url,
                logo_excavate: (editingQR.metadata as any)?.logo_excavate,
                logo_size: (editingQR.metadata as any)?.logo_size,
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
          ) : qrCodes.map((qr) => {
            const meta = (qr.metadata as any) || {};
            return (
              <Card key={qr.id} className="group overflow-hidden rounded-3xl border-0 shadow-md hover:shadow-xl transition-all hover:-translate-y-1 bg-white dark:bg-zinc-950">
                <div 
                  className="h-40 flex items-center justify-center relative border-b"
                  style={{ backgroundColor: meta.bg_color || "#FFFFFF" }}
                >
                  <div className="p-2 bg-white rounded-xl shadow-lg ring-1 ring-black/5">
                    <QRCodeSVG
                      id={`qr-svg-${qr.id}`}
                      value={getQRValue(qr)}
                      size={100}
                      level={meta.error_level || "M"}
                      fgColor={meta.fg_color || "#000000"}
                      bgColor="transparent"
                      includeMargin={false}
                      imageSettings={meta.logo_url ? {
                        src: meta.logo_url,
                        height: 100 * (meta.logo_size || 0.2),
                        width: 100 * (meta.logo_size || 0.2),
                        excavate: meta.logo_excavate ?? true,
                      } : undefined}
                    />
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
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="w-full rounded-xl gap-2 h-9 text-xs" onClick={() => downloadQR(qr)}>
                      <Download className="w-3.5 h-3.5" /> Download
                    </Button>
                    <Button variant="outline" size="sm" className="w-full rounded-xl gap-2 h-9 text-xs" onClick={() => {
                        const url = getQRValue(qr);
                        navigator.clipboard.writeText(url);
                        toast({ title: "Copied!", description: "Link copied to clipboard" });
                    }}>
                      Copy Link
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full rounded-xl gap-1.5 h-9 text-xs"
                      onClick={() => setEditingQR(qr)}
                    >
                      Customize
                    </Button>
                    {!(meta.is_base_qr) ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full rounded-xl gap-1.5 h-9 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteQR(qr)}
                        disabled={deleteQR.isPending}
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
          })}
        </div>
      )}

      {!showBuilder && !isLoading && (
        <QRPrintCenter restaurantId={restaurantId} baseUrl={BASE_URL} tables={tables} />
      )}
    </div>
  );
}
