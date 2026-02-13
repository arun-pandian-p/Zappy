import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Download,
  QrCode,
  Trash2,
  ExternalLink,
  BarChart3,
  Upload,
  Copy,
} from "lucide-react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  useQRCodes,
  useCreateQRCode,
  useUpdateQRCode,
  useDeleteQRCode,
  type QRCode,
} from "@/hooks/useQRCodes";
import { format } from "date-fns";

const REDIRECT_BASE = `https://syvoshzxoedamaijongb.supabase.co/functions/v1/qr-redirect`;

interface QRCodeManagerProps {
  restaurantId: string;
}

export function QRCodeManager({ restaurantId }: QRCodeManagerProps) {
  const { toast } = useToast();
  const { data: qrCodes = [], isLoading } = useQRCodes(restaurantId);
  const createQR = useCreateQRCode();
  const updateQR = useUpdateQRCode();
  const deleteQR = useDeleteQRCode();

  const [showCreate, setShowCreate] = useState(false);
  const [newQR, setNewQR] = useState({
    qr_name: "",
    target_url: "",
    qr_type: "dynamic" as "static" | "dynamic",
    expires_at: "",
    fg_color: "#000000",
    bg_color: "#FFFFFF",
    frame_text: "",
  });
  const [selectedQR, setSelectedQR] = useState<QRCode | null>(null);
  const canvasRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleCreate = async () => {
    if (!newQR.qr_name || !newQR.target_url) {
      toast({ title: "Missing fields", description: "Name and URL are required.", variant: "destructive" });
      return;
    }

    try {
      await createQR.mutateAsync({
        tenant_id: restaurantId,
        qr_name: newQR.qr_name,
        target_url: newQR.target_url,
        qr_type: newQR.qr_type,
        expires_at: newQR.expires_at || null,
        metadata: {
          fg_color: newQR.fg_color,
          bg_color: newQR.bg_color,
          frame_text: newQR.frame_text,
        },
      });
      toast({ title: "QR Code Created", description: `${newQR.qr_name} has been created.` });
      setShowCreate(false);
      setNewQR({ qr_name: "", target_url: "", qr_type: "dynamic", expires_at: "", fg_color: "#000000", bg_color: "#FFFFFF", frame_text: "" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (qr: QRCode) => {
    if (!confirm(`Deactivate "${qr.qr_name}"?`)) return;
    try {
      await deleteQR.mutateAsync({ id: qr.id, tenantId: restaurantId });
      toast({ title: "QR Deactivated", description: `${qr.qr_name} has been deactivated.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const getQRValue = (qr: QRCode) => {
    if (qr.qr_type === "dynamic") {
      return `${REDIRECT_BASE}/${qr.id}`;
    }
    return qr.target_url;
  };

  const handleDownload = (qr: QRCode) => {
    const container = canvasRefs.current[qr.id];
    const canvas = container?.querySelector("canvas");
    if (!canvas) return;
    const pngUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `QR-${qr.qr_name}.png`;
    link.href = pngUrl;
    link.click();
  };

  const handleCopyUrl = (qr: QRCode) => {
    navigator.clipboard.writeText(getQRValue(qr));
    toast({ title: "Copied!", description: "QR URL copied to clipboard." });
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split("\n").filter(l => l.trim());
    const header = lines[0].toLowerCase();
    const hasHeader = header.includes("name") || header.includes("url");
    const dataLines = hasHeader ? lines.slice(1) : lines;

    let created = 0;
    for (const line of dataLines) {
      const [name, url] = line.split(",").map(s => s.trim());
      if (name && url) {
        try {
          await createQR.mutateAsync({
            tenant_id: restaurantId,
            qr_name: name,
            target_url: url,
            qr_type: "dynamic",
          });
          created++;
        } catch { /* skip duplicates */ }
      }
    }

    toast({ title: "Bulk Import Done", description: `Created ${created} QR codes.` });
    e.target.value = "";
  };

  const activeQRCodes = qrCodes.filter(q => q.is_active);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">QR Code Manager</h2>
          <p className="text-muted-foreground">Create, customize, and track your QR codes</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer">
            <input type="file" accept=".csv" className="hidden" onChange={handleBulkUpload} />
            <Button variant="outline" size="sm" asChild>
              <span><Upload className="w-4 h-4 mr-1" /> Bulk CSV</span>
            </Button>
          </label>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" /> Create QR
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create QR Code</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input value={newQR.qr_name} onChange={e => setNewQR({ ...newQR, qr_name: e.target.value })} placeholder="e.g. Table 1 Menu" />
                </div>
                <div className="space-y-2">
                  <Label>Target URL *</Label>
                  <Input value={newQR.target_url} onChange={e => setNewQR({ ...newQR, target_url: e.target.value })} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={newQR.qr_type} onValueChange={v => setNewQR({ ...newQR, qr_type: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dynamic">Dynamic (trackable, editable)</SelectItem>
                      <SelectItem value="static">Static (direct link)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Expires At (optional)</Label>
                  <Input type="datetime-local" value={newQR.expires_at} onChange={e => setNewQR({ ...newQR, expires_at: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>QR Color</Label>
                    <Input type="color" value={newQR.fg_color} onChange={e => setNewQR({ ...newQR, fg_color: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Background</Label>
                    <Input type="color" value={newQR.bg_color} onChange={e => setNewQR({ ...newQR, bg_color: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Frame Text</Label>
                  <Input value={newQR.frame_text} onChange={e => setNewQR({ ...newQR, frame_text: e.target.value })} placeholder="Scan to Order" />
                </div>
                <Button onClick={handleCreate} className="w-full" disabled={createQR.isPending}>
                  {createQR.isPending ? "Creating..." : "Create QR Code"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeQRCodes.length}</p>
              <p className="text-xs text-muted-foreground">Active QR Codes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeQRCodes.reduce((s, q) => s + q.scan_count, 0)}</p>
              <p className="text-xs text-muted-foreground">Total Scans</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ExternalLink className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeQRCodes.filter(q => q.qr_type === "dynamic").length}</p>
              <p className="text-xs text-muted-foreground">Dynamic QR Codes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QR Code Table */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading QR codes...</div>
      ) : activeQRCodes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <QrCode className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="font-semibold mb-1">No QR Codes Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first QR code to start tracking scans.</p>
            <Button onClick={() => setShowCreate(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" /> Create QR Code
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>QR Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Target URL</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Scans</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeQRCodes.map((qr) => {
                const meta = (qr.metadata || {}) as Record<string, any>;
                return (
                  <TableRow key={qr.id}>
                    <TableCell>
                      <div className="bg-white p-1 rounded inline-block border">
                        <QRCodeSVG
                          value={getQRValue(qr)}
                          size={48}
                          level="M"
                          fgColor={meta.fg_color || "#000000"}
                          bgColor={meta.bg_color || "#FFFFFF"}
                        />
                      </div>
                      {/* Hidden canvas for download */}
                      <div ref={el => { canvasRefs.current[qr.id] = el; }} className="hidden">
                        <QRCodeCanvas
                          value={getQRValue(qr)}
                          size={512}
                          level="H"
                          includeMargin
                          fgColor={meta.fg_color || "#000000"}
                          bgColor={meta.bg_color || "#FFFFFF"}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{qr.qr_name}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {qr.target_url}
                    </TableCell>
                    <TableCell>
                      <Badge variant={qr.qr_type === "dynamic" ? "default" : "secondary"}>
                        {qr.qr_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{qr.scan_count}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(qr.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleCopyUrl(qr)} title="Copy URL">
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDownload(qr)} title="Download PNG">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(qr)} title="Deactivate">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </motion.div>
  );
}
