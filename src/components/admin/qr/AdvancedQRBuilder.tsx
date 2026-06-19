import React, { useEffect, useRef, useState } from "react";
import QRCodeStyling, { DotType, CornerSquareType, CornerDotType } from "qr-code-styling";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Palette, Image as ImageIcon, Sparkles, Check, Eye, Trash2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface AdvancedQRBuilderProps {
  onSave: (qrConfig: any) => void;
  onDelete?: () => void;
  isSaving: boolean;
  initialValues?: any;
  tables?: any[];
}

export function AdvancedQRBuilder({ onSave, onDelete, isSaving, initialValues, tables = [] }: AdvancedQRBuilderProps) {
  const [config, setConfig] = useState({
    qr_name: initialValues?.qr_name || "",
    target_url: initialValues?.target_url || "",
    fg_color: initialValues?.fg_color || "#000000",
    bg_color: initialValues?.bg_color || "#FFFFFF",
    error_level: initialValues?.error_level || "H",
    logo_url: initialValues?.logo_url || "",
    logo_excavate: initialValues?.logo_excavate ?? true,
    logo_size: initialValues?.logo_size || 0.2,
    qr_type_selection: initialValues?.qr_type_selection || "custom",
    table_number: initialValues?.table_number || "",
    dots_type: initialValues?.dots_type || "square",
    corners_square_type: initialValues?.corners_square_type || "square",
    corners_dot_type: initialValues?.corners_dot_type || "square",
    use_gradient: initialValues?.use_gradient || false,
    gradient_color: initialValues?.gradient_color || "#ff0000",
  });

  const updateConfig = (key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const PRESET_COLORS = [
    { name: "Classic", fg: "#000000", bg: "#FFFFFF" },
    { name: "Ocean", fg: "#0077B6", bg: "#CAF0F8" },
    { name: "Forest", fg: "#1B4332", bg: "#D8F3DC" },
    { name: "Sunset", fg: "#9D0208", bg: "#FFF0F3" },
    { name: "Royal", fg: "#3C096C", bg: "#F0E6FF" },
    { name: "Night", fg: "#E0E1DD", bg: "#1B1B1B" },
    { name: "Zappy", fg: "#E11D48", bg: "#FFF1F2" },
  ];

  const handleSave = () => {
    onSave(config);
  };

  const qrRef = useRef<HTMLDivElement>(null);
  const [qrCode] = useState(() => new QRCodeStyling({
    width: 1024,
    height: 1024,
    type: "svg",
    margin: 32,  // 32px quiet zone
    imageOptions: { crossOrigin: "anonymous", margin: 10 }
  }));

  useEffect(() => {
    qrCode.update({
      data: config.target_url || "https://zappy.ind.in",
      dotsOptions: {
        type: config.dots_type as DotType,
        color: !config.use_gradient ? config.fg_color : undefined,
        gradient: config.use_gradient ? {
          type: "linear",
          colorStops: [
            { offset: 0, color: config.fg_color },
            { offset: 1, color: config.gradient_color }
          ]
        } : undefined
      },
      backgroundOptions: { color: config.bg_color || "#FFFFFF" },  // explicit white
      cornersSquareOptions: {
        type: config.corners_square_type as CornerSquareType,
        color: config.fg_color
      },
      cornersDotOptions: {
        type: config.corners_dot_type as CornerDotType,
        color: config.fg_color
      },
      image: config.logo_url || undefined,
      imageOptions: {
        crossOrigin: "anonymous",
        margin: config.logo_excavate ? 10 : 0,
        imageSize: Math.min(config.logo_size || 0.2, 0.25)  // cap at 25%
      },
      qrOptions: { errorCorrectionLevel: config.error_level as any }
    });
    
    if (qrRef.current) {
      qrRef.current.innerHTML = "";
      qrCode.append(qrRef.current);
      // Scale down SVG for preview but keep high res export
      const svg = qrRef.current.querySelector("svg");
      if (svg) {
        svg.style.width = "100%";
        svg.style.height = "auto";
        svg.style.maxWidth = "220px";
      }
    }
  }, [config, qrCode]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8 space-y-6">
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-3 p-1 bg-muted/50 rounded-xl h-auto">
            <TabsTrigger value="content" className="py-2.5 rounded-lg data-[state=active]:shadow-sm text-sm">
              <Sparkles className="w-4 h-4 mr-2" /> Content
            </TabsTrigger>
            <TabsTrigger value="colors" className="py-2.5 rounded-lg data-[state=active]:shadow-sm text-sm">
              <Palette className="w-4 h-4 mr-2" /> Design & Colors
            </TabsTrigger>
            <TabsTrigger value="logo" className="py-2.5 rounded-lg data-[state=active]:shadow-sm text-sm">
              <ImageIcon className="w-4 h-4 mr-2" /> Add Logo
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 border rounded-2xl p-6 bg-white dark:bg-zinc-950 shadow-sm">
            <TabsContent value="content" className="space-y-4 m-0 outline-none">
              <div className="space-y-2">
                <Label>QR Code Type</Label>
                <Select 
                  value={config.qr_type_selection} 
                  onValueChange={(val) => {
                    updateConfig("qr_type_selection", val);
                    if (val === "table") {
                      updateConfig("target_url", "");
                    }
                  }}
                >
                  <SelectTrigger className="bg-zinc-50 dark:bg-zinc-900 rounded-xl">
                    <SelectValue placeholder="Select QR Type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="custom">Custom Link / Campaign QR</SelectItem>
                    <SelectItem value="table">Table Ordering QR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {config.qr_type_selection === "table" ? (
                <div className="space-y-2">
                  <Label>Assigned Table</Label>
                  <Select 
                    value={config.table_number} 
                    onValueChange={(val) => {
                      updateConfig("table_number", val);
                      updateConfig("qr_name", `Table ${val}`);
                    }}
                  >
                    <SelectTrigger className="bg-zinc-50 dark:bg-zinc-900 rounded-xl">
                      <SelectValue placeholder="Select Table" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {tables.map((table) => (
                        <SelectItem key={table.id} value={table.table_number}>
                          Table {table.table_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>QR Code Name</Label>
                  <Input
                    placeholder="e.g., Table 5, Main Door, Summer Campaign"
                    value={config.qr_name}
                    onChange={(e) => updateConfig("qr_name", e.target.value)}
                    className="bg-zinc-50 dark:bg-zinc-900 rounded-xl"
                  />
                </div>
              )}

              {config.qr_type_selection !== "table" && (
                <div className="space-y-2">
                  <Label>Target URL / Content</Label>
                  <Input
                    placeholder="https://example.com"
                    value={config.target_url}
                    onChange={(e) => updateConfig("target_url", e.target.value)}
                    className="bg-zinc-50 dark:bg-zinc-900 rounded-xl font-mono text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
                    Leave blank to use the default restaurant menu.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="colors" className="space-y-6 m-0 outline-none">
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Color Presets</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PRESET_COLORS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        updateConfig("fg_color", preset.fg);
                        updateConfig("bg_color", preset.bg);
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all hover:scale-105 ${
                        config.fg_color === preset.fg && config.bg_color === preset.bg
                          ? "border-primary shadow-sm bg-primary/5"
                          : "border-transparent bg-muted/40 hover:bg-muted/80"
                      }`}
                    >
                      <div className="flex w-full h-8 rounded-md overflow-hidden shadow-inner mb-2 border border-black/5">
                        <div className="flex-1" style={{ backgroundColor: preset.fg }} />
                        <div className="flex-1" style={{ backgroundColor: preset.bg }} />
                      </div>
                      <span className="text-xs font-medium">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <Label className="text-sm font-semibold">Body & Frame Shapes</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Body Modules</Label>
                    <Select value={config.dots_type} onValueChange={(val) => updateConfig("dots_type", val)}>
                      <SelectTrigger className="bg-zinc-50 dark:bg-zinc-900 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="square">Square</SelectItem>
                        <SelectItem value="rounded">Rounded</SelectItem>
                        <SelectItem value="dots">Dots</SelectItem>
                        <SelectItem value="classy">Classy</SelectItem>
                        <SelectItem value="classy-rounded">Classy Rounded</SelectItem>
                        <SelectItem value="extra-rounded">Extra Rounded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Eye Frame Shape</Label>
                    <Select value={config.corners_square_type} onValueChange={(val) => updateConfig("corners_square_type", val)}>
                      <SelectTrigger className="bg-zinc-50 dark:bg-zinc-900 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="square">Square</SelectItem>
                        <SelectItem value="extra-rounded">Extra Rounded</SelectItem>
                        <SelectItem value="dot">Dot</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Eye Ball Shape</Label>
                    <Select value={config.corners_dot_type} onValueChange={(val) => updateConfig("corners_dot_type", val)}>
                      <SelectTrigger className="bg-zinc-50 dark:bg-zinc-900 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="square">Square</SelectItem>
                        <SelectItem value="dot">Dot</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Foreground Color</Label>
                  <div className="flex gap-3">
                    <div
                      className="w-10 h-10 rounded-xl border shadow-inner flex-shrink-0"
                      style={{ backgroundColor: config.fg_color }}
                    />
                    <Input
                      type="text"
                      value={config.fg_color}
                      onChange={(e) => updateConfig("fg_color", e.target.value)}
                      className="font-mono text-sm bg-zinc-50 dark:bg-zinc-900 rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <div className="flex gap-3">
                    <div
                      className="w-10 h-10 rounded-xl border shadow-inner flex-shrink-0"
                      style={{ backgroundColor: config.bg_color }}
                    />
                    <Input
                      type="text"
                      value={config.bg_color}
                      onChange={(e) => updateConfig("bg_color", e.target.value)}
                      className="font-mono text-sm bg-zinc-50 dark:bg-zinc-900 rounded-xl"
                    />
                  </div>
                </div>
                
                <div className="space-y-2 col-span-2">
                  <div className="flex items-center h-10">
                    <Switch 
                      checked={config.use_gradient} 
                      onCheckedChange={(val) => updateConfig("use_gradient", val)} 
                    />
                    <Label className="ml-2">Enable Linear Gradient</Label>
                  </div>
                </div>

                {config.use_gradient && (
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label>Gradient End Color</Label>
                    <div className="flex gap-3">
                      <div
                        className="w-10 h-10 rounded-xl border shadow-inner flex-shrink-0"
                        style={{ backgroundColor: config.gradient_color }}
                      />
                      <Input
                        type="text"
                        value={config.gradient_color}
                        onChange={(e) => updateConfig("gradient_color", e.target.value)}
                        className="font-mono text-sm bg-zinc-50 dark:bg-zinc-900 rounded-xl"
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="logo" className="space-y-6 m-0 outline-none">
              <div className="space-y-2">
                <Label>Logo Image URL</Label>
                <div className="flex gap-3">
                  <Input
                    placeholder="https://yourdomain.com/logo.png"
                    value={config.logo_url}
                    onChange={(e) => updateConfig("logo_url", e.target.value)}
                    className="bg-zinc-50 dark:bg-zinc-900 rounded-xl flex-1 font-mono text-sm"
                  />
                  {config.logo_url && (
                    <div className="w-10 h-10 border rounded-xl overflow-hidden bg-white flex items-center justify-center p-1 shadow-sm">
                      <img src={config.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Square, transparent PNGs work best.
                </p>
              </div>

              {config.logo_url && (
                <div className="space-y-6 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Remove Background Behind Logo</Label>
                      <p className="text-xs text-muted-foreground">Makes the logo easier to see (Excavation)</p>
                    </div>
                    <Switch
                      checked={config.logo_excavate}
                      onCheckedChange={(c) => updateConfig("logo_excavate", c)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Error Correction Level (Required for Logos)</Label>
                    <Select value={config.error_level} onValueChange={(v) => updateConfig("error_level", v)}>
                      <SelectTrigger className="w-full bg-zinc-50 dark:bg-zinc-900 rounded-xl h-10">
                        <SelectValue placeholder="Select error correction level" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="L">Low (7%) - Not recommended with logo</SelectItem>
                        <SelectItem value="M">Medium (15%)</SelectItem>
                        <SelectItem value="Q">Quartile (25%) - Good</SelectItem>
                        <SelectItem value="H">High (30%) - Best for logos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <div className="lg:col-span-4 space-y-6">
        <Card className="border-0 shadow-xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl sticky top-6">
          <CardHeader className="pb-4 text-center">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-center gap-2">
              <Eye className="w-4 h-4" /> Live Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-6 pt-2 pb-8">
            <div 
              className="p-6 bg-white rounded-3xl shadow-2xl ring-1 ring-black/5 transition-all duration-300 transform hover:scale-105 flex items-center justify-center min-h-[220px] min-w-[220px]"
              style={{ backgroundColor: config.bg_color }}
            >
              <div ref={qrRef} className="flex items-center justify-center" />
            </div>

            <div className="w-full text-center space-y-1 px-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">
                {config.qr_name || "Untitled QR"}
              </h3>
              <p className="text-xs text-muted-foreground font-mono truncate max-w-full">
                {config.target_url || "Auto-redirects to menu"}
              </p>
            </div>

            <Button 
              className="w-full rounded-xl h-12 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 bg-gradient-to-r from-primary to-rose-500 text-white font-bold text-base"
              onClick={handleSave}
              disabled={isSaving || !config.qr_name}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Generate Enterprise QR
                </>
              )}
            </Button>
            {onDelete && (
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl h-11 border-destructive text-destructive hover:bg-destructive/10"
                onClick={onDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete QR
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
