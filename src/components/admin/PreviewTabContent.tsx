import { useState } from "react";
import { motion } from "framer-motion";
import {
  Smartphone,
  Tablet,
  Monitor,
  RefreshCw,
  ExternalLink,
  Eye,
  ChefHat,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type DeviceType = "mobile" | "tablet" | "desktop";
type PreviewMode = "customer" | "kitchen" | "billing";

interface PreviewTabContentProps {
  customerPreviewUrl: string;
  restaurantId: string;
  externalRefreshKey: number;
}

export function PreviewTabContent({ customerPreviewUrl, restaurantId, externalRefreshKey }: PreviewTabContentProps) {
  const [device, setDevice] = useState<DeviceType>("mobile");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("customer");
  const [refreshKey, setRefreshKey] = useState(0);
  const combinedKey = `${previewMode}-${refreshKey}-${externalRefreshKey}`;

  const deviceConfig = {
    mobile: { width: 375, height: 812, label: "Mobile" },
    tablet: { width: 768, height: 1024, label: "Tablet" },
    desktop: { width: "100%" as const, height: "100%" as const, label: "Desktop" },
  };

  const previewModes = [
    { value: "customer" as const, label: "Customer Menu", icon: Eye, description: "Menu & ordering flow" },
    { value: "kitchen" as const, label: "Kitchen Display", icon: ChefHat, description: "KDS order management" },
    { value: "billing" as const, label: "Billing Counter", icon: Receipt, description: "POS & invoicing" },
  ];

  const getPreviewUrl = () => {
    switch (previewMode) {
      case "kitchen":
        return `/kitchen?r=${restaurantId}&preview=true`;
      case "billing":
        return `/billing?r=${restaurantId}&preview=true`;
      default:
        return customerPreviewUrl;
    }
  };

  const effectiveDevice = previewMode !== "customer" && device === "mobile" ? "tablet" : device;

  return (
    <motion.div
      key="preview"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="sticky top-0 z-30 bg-background pb-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
          <div>
            <h2 className="text-xl font-bold">Site Preview</h2>
            <p className="text-sm text-muted-foreground">Preview all customer & staff interfaces</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-muted rounded-lg p-1 gap-1">
              <Button variant={effectiveDevice === "mobile" ? "default" : "ghost"} size="sm" onClick={() => setDevice("mobile")}>
                <Smartphone className="w-4 h-4" />
              </Button>
              <Button variant={effectiveDevice === "tablet" ? "default" : "ghost"} size="sm" onClick={() => setDevice("tablet")}>
                <Tablet className="w-4 h-4" />
              </Button>
              <Button variant={effectiveDevice === "desktop" ? "default" : "ghost"} size="sm" onClick={() => setDevice("desktop")}>
                <Monitor className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => setRefreshKey(k => k + 1)}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open(getPreviewUrl(), '_blank')}>
              <ExternalLink className="w-4 h-4 mr-1" />
              Open
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-muted/50 rounded-xl p-1.5">
          {previewModes.map((mode) => (
            <button
              key={mode.value}
              onClick={() => setPreviewMode(mode.value)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
                previewMode === mode.value
                  ? "bg-background shadow-sm text-foreground border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              <mode.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{mode.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center bg-muted/30 rounded-xl border p-4 mt-4" style={{ minHeight: '80vh' }}>
        <div
          className={`bg-background rounded-2xl shadow-2xl border-4 border-foreground/10 overflow-hidden transition-all duration-300 ${
            effectiveDevice === "desktop" ? "w-full" : ""
          }`}
          style={
            effectiveDevice !== "desktop"
              ? { width: deviceConfig[effectiveDevice].width, height: deviceConfig[effectiveDevice].height, maxHeight: '78vh' }
              : { height: '78vh', width: '100%' }
          }
        >
          <iframe
            key={combinedKey}
            src={getPreviewUrl()}
            className="w-full h-full border-0"
            title={`${previewModes.find(m => m.value === previewMode)?.label} Preview`}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default PreviewTabContent;
