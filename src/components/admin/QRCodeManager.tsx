import { useState, useRef, useEffect } from "react";
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
  Grid3X3,
  X,
  Loader2,
} from "lucide-react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Table as UITable,
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
import { useTables, useCreateTable, useDeleteTable, type Table } from "@/hooks/useTables";
import { format } from "date-fns";

const REDIRECT_BASE = `https://syvoshzxoedamaijongb.supabase.co/functions/v1/qr-redirect`;
const PUBLISHED_URL = "https://qr-restaurant.lovable.app";

interface QRCodeManagerProps {
  restaurantId: string;
}

export function QRCodeManager({ restaurantId }: QRCodeManagerProps) {
  const { toast } = useToast();
  const { data: qrCodes = [], isLoading } = useQRCodes(restaurantId);
  const { data: tables = [], isLoading: tablesLoading } = useTables(restaurantId);
  const createQR = useCreateQRCode();
  const updateQR = useUpdateQRCode();
  const deleteQR = useDeleteQRCode();
  const createTable = useCreateTable();
  const deleteTable = useDeleteTable();

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
  const canvasRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Table form state
  const [newTableNumber, setNewTableNumber] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState("4");

  const activeQRCodes = qrCodes.filter((q) => q.is_active);
  const tableQRCodes = activeQRCodes.filter(
    (q) => (q.metadata as any)?.table_id
  );
  const customQRCodes = activeQRCodes.filter(
    (q) => !(q.metadata as any)?.table_id && !(q.metadata as any)?.is_base_qr
  );
  const baseQR = activeQRCodes.find((q) => (q.metadata as any)?.is_base_qr);

  const baseQRUrl = `/order?r=${restaurantId}`;

  // Auto-create base QR if it doesn't exist
  useEffect(() => {
    if (!isLoading && !baseQR && restaurantId) {
      createQR.mutate({
        tenant_id: restaurantId,
        qr_name: "Restaurant Base QR",
        target_url: baseQRUrl,
        qr_type: "dynamic",
        metadata: { is_base_qr: true },
      });
    }
  }, [isLoading, baseQR, restaurantId]);

  // Auto-sync orphaned tables: create QR entries for tables missing one
  useEffect(() => {
    if (isLoading || tablesLoading || !restaurantId || tables.length === 0) return;

    const orphaned = tables.filter(
      (t) => !activeQRCodes.some((q) => (q.metadata as any)?.table_id === t.id)
    );

    orphaned.forEach((table) => {
      createQR.mutate({
        tenant_id: restaurantId,
        qr_name: `Table ${table.table_number}`,
        target_url: `/order?r=${restaurantId}&table=${table.table_number}`,
        qr_type: "dynamic",
        metadata: { table_id: table.id, table_number: table.table_number },
      });
    });
  }, [isLoading, tablesLoading, tables.length, activeQRCodes.length, restaurantId]);

  const handleCreateCustomQR = async () => {
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

      // Auto-create QR code for this table
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

  const handleDeleteTable = async (table: Table) => {
    if (!confirm(`Delete table ${table.table_number}? Its QR code will be deactivated.`)) return;
    try {
      await deleteTable.mutateAsync({ id: table.id, restaurantId });

      // Deactivate matching QR code
      const matchingQR = activeQRCodes.find(
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

  const handleDeleteQR = async (qr: QRCode) => {
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
      return `${REDIRECT_BASE}?id=${qr.id}`;
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
    const lines = text.split("\n").filter((l) => l.trim());
    const header = lines[0].toLowerCase();
    const hasHeader = header.includes("name") || header.includes("url");
    const dataLines = hasHeader ? lines.slice(1) : lines;
    let created = 0;
    for (const line of dataLines) {
      const [name, url] = line.split(",").map((s) => s.trim());
      if (name && url) {
        try {
          await createQR.mutateAsync({ tenant_id: restaurantId, qr_name: name, target_url: url, qr_type: "dynamic" });
          created++;
        } catch { /* skip duplicates */ }
      }
    }
    toast({ title: "Bulk Import Done", description: `Created ${created} QR codes.` });
    e.target.value = "";
  };

  const renderQRRow = (qr: QRCode) => {
    const meta = (qr.metadata || {}) as Record<string, any>;
    return (
      <TableRow key={qr.id}>
        <TableCell>
          <div className="bg-white p-1 rounded inline-block border">
            <QRCodeSVG value={getQRValue(qr)} size={48} level="M" fgColor={meta.fg_color || "#000000"} bgColor={meta.bg_color || "#FFFFFF"} />
          </div>
          <div ref={(el) => { canvasRefs.current[qr.id] = el; }} className="hidden">
            <QRCodeCanvas value={getQRValue(qr)} size={512} level="H" includeMargin fgColor={meta.fg_color || "#000000"} bgColor={meta.bg_color || "#FFFFFF"} />
          </div>
        </TableCell>
        <TableCell className="font-medium">{qr.qr_name}</TableCell>
        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{qr.target_url}</TableCell>
        <TableCell>
          <Badge variant={qr.qr_type === "dynamic" ? "default" : "secondary"}>{qr.qr_type}</Badge>
        </TableCell>
        <TableCell className="text-right font-semibold">{qr.scan_count}</TableCell>
        <TableCell className="text-sm text-muted-foreground">{format(new Date(qr.created_at), "MMM d, yyyy")}</TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="icon" onClick={() => handleCopyUrl(qr)} title="Copy URL"><Copy className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => handleDownload(qr)} title="Download PNG"><Download className="w-4 h-4" /></Button>
            {!(meta.is_base_qr) && (
              <Button variant="ghost" size="icon" onClick={() => handleDeleteQR(qr)} title="Deactivate"><Trash2 className="w-4 h-4 text-destructive" /></Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">QR Code Manager</h2>
          <p className="text-muted-foreground">Unified QR system — tables, tracking, and custom codes</p>
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
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Custom QR</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Create Custom QR Code</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input value={newQR.qr_name} onChange={(e) => setNewQR({ ...newQR, qr_name: e.target.value })} placeholder="e.g. Summer Campaign" />
                </div>
                <div className="space-y-2">
                  <Label>Target URL *</Label>
                  <Input value={newQR.target_url} onChange={(e) => setNewQR({ ...newQR, target_url: e.target.value })} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={newQR.qr_type} onValueChange={(v) => setNewQR({ ...newQR, qr_type: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dynamic">Dynamic (trackable)</SelectItem>
                      <SelectItem value="static">Static (direct link)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Expires At (optional)</Label>
                  <Input type="datetime-local" value={newQR.expires_at} onChange={(e) => setNewQR({ ...newQR, expires_at: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>QR Color</Label>
                    <Input type="color" value={newQR.fg_color} onChange={(e) => setNewQR({ ...newQR, fg_color: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Background</Label>
                    <Input type="color" value={newQR.bg_color} onChange={(e) => setNewQR({ ...newQR, bg_color: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Frame Text</Label>
                  <Input value={newQR.frame_text} onChange={(e) => setNewQR({ ...newQR, frame_text: e.target.value })} placeholder="Scan to Order" />
                </div>
                <Button onClick={handleCreateCustomQR} className="w-full" disabled={createQR.isPending}>
                  {createQR.isPending ? "Creating..." : "Create QR Code"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <Grid3X3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{tables.length}</p>
              <p className="text-xs text-muted-foreground">Tables</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ExternalLink className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{customQRCodes.length}</p>
              <p className="text-xs text-muted-foreground">Custom QR Codes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Restaurant Base QR */}
      {baseQR && (
        <Card className="border-primary/20 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              Restaurant Base QR
              <Badge variant="default" className="ml-2">Same QR for all tables</Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Single QR code for the restaurant. Customers select their table after scanning.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="bg-white p-4 rounded-xl shadow-sm border">
                <QRCodeSVG value={getQRValue(baseQR)} size={180} level="H" includeMargin />
              </div>
              <div
                ref={(el) => { canvasRefs.current[baseQR.id] = el; }}
                className="hidden"
              >
                <QRCodeCanvas value={getQRValue(baseQR)} size={512} level="H" includeMargin />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{baseQR.scan_count} scans</Badge>
                  <Badge variant="outline">Dynamic</Badge>
                </div>
                <p className="text-sm text-muted-foreground break-all">
                  Redirect URL: {getQRValue(baseQR)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Target: {baseQR.target_url}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleDownload(baseQR)}>
                    <Download className="w-4 h-4 mr-1" /> Download PNG
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleCopyUrl(baseQR)}>
                    <Copy className="w-4 h-4 mr-1" /> Copy URL
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table Management */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="w-5 h-5" />
            Table Management
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Add tables to auto-generate tracked QR codes. Each table gets its own dynamic QR.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Table Form */}
          <div className="flex items-end gap-3">
            <div className="space-y-1 flex-1">
              <Label className="text-xs">Table Number</Label>
              <Input
                value={newTableNumber}
                onChange={(e) => setNewTableNumber(e.target.value)}
                placeholder="e.g. T1, A1"
              />
            </div>
            <div className="space-y-1 w-24">
              <Label className="text-xs">Capacity</Label>
              <Input
                type="number"
                value={newTableCapacity}
                onChange={(e) => setNewTableCapacity(e.target.value)}
                min="1"
                max="20"
              />
            </div>
            <Button onClick={handleAddTable} disabled={createTable.isPending}>
              {createTable.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
              Add
            </Button>
          </div>

          {/* Tables Grid */}
          {tables.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className="relative group p-3 rounded-lg border-2 border-border hover:border-primary/50 transition-all text-center"
                >
                  <span className="font-bold text-sm block">{table.table_number}</span>
                  <span className="text-xs text-muted-foreground">{table.capacity} seats</span>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteTable(table)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4 text-sm">
              No tables yet. Add one above to auto-generate a tracked QR code.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Table QR Codes */}
      {tableQRCodes.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Table QR Codes ({tableQRCodes.length})</CardTitle>
          </CardHeader>
          <UITable>
            <TableHeader>
              <TableRow>
                <TableHead>QR</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Scans</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{tableQRCodes.map(renderQRRow)}</TableBody>
          </UITable>
        </Card>
      )}

      {/* Custom QR Codes */}
      {customQRCodes.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Custom QR Codes ({customQRCodes.length})</CardTitle>
          </CardHeader>
          <UITable>
            <TableHeader>
              <TableRow>
                <TableHead>QR</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Scans</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{customQRCodes.map(renderQRRow)}</TableBody>
          </UITable>
        </Card>
      )}

      {/* Empty State */}
      {activeQRCodes.length <= 1 && customQRCodes.length === 0 && tableQRCodes.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <QrCode className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="font-semibold mb-1">Add tables or create custom QR codes</h3>
            <p className="text-sm text-muted-foreground">Tables auto-generate tracked QR codes. Use custom QR for campaigns.</p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
