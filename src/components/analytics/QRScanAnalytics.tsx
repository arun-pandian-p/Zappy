import { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3, Smartphone, Monitor, Tablet, Globe, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAllScanAnalytics, useQRCodes, type ScanAnalytic } from "@/hooks/useQRCodes";
import { format, subDays, startOfDay } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "#f59e0b", "#8b5cf6"];

interface QRScanAnalyticsProps {
  restaurantId: string;
}

export function QRScanAnalytics({ restaurantId }: QRScanAnalyticsProps) {
  const { data: scans = [] } = useAllScanAnalytics(restaurantId);
  const { data: qrCodes = [] } = useQRCodes(restaurantId);

  // Scan volume over last 14 days
  const volumeData = useMemo(() => {
    const days = 14;
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = startOfDay(subDays(new Date(), i));
      const dayStr = format(day, "yyyy-MM-dd");
      const count = scans.filter(s => format(new Date(s.scanned_at), "yyyy-MM-dd") === dayStr).length;
      result.push({ date: format(day, "MMM d"), scans: count });
    }
    return result;
  }, [scans]);

  // Device breakdown
  const deviceData = useMemo(() => {
    const counts: Record<string, number> = {};
    scans.forEach(s => {
      const d = s.device || "Unknown";
      counts[d] = (counts[d] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [scans]);

  // Top QR codes by scan count
  const topQRCodes = useMemo(() => {
    return [...qrCodes]
      .filter(q => q.is_active)
      .sort((a, b) => b.scan_count - a.scan_count)
      .slice(0, 5);
  }, [qrCodes]);

  // Hourly heatmap
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, scans: 0 }));
    scans.forEach(s => {
      const h = new Date(s.scanned_at).getHours();
      hours[h].scans++;
    });
    return hours;
  }, [scans]);

  const totalScans = scans.length;
  const todayScans = scans.filter(s => format(new Date(s.scanned_at), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5" /> QR Scan Analytics
        </h3>
        <p className="text-sm text-muted-foreground">Track how your QR codes are performing</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{totalScans}</p>
            <p className="text-xs text-muted-foreground">Total Scans</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{todayScans}</p>
            <p className="text-xs text-muted-foreground">Today's Scans</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{qrCodes.filter(q => q.is_active).length}</p>
            <p className="text-xs text-muted-foreground">Active QR Codes</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{deviceData.find(d => d.name === "Mobile")?.value || 0}</p>
            <p className="text-xs text-muted-foreground">Mobile Scans</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scan Volume Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Scan Volume (14 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 11 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="scans" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="w-4 h-4" /> Device Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deviceData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No scan data yet</p>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={deviceData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {deviceData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top QR Codes */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top QR Codes</CardTitle>
          </CardHeader>
          <CardContent>
            {topQRCodes.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No QR codes yet</p>
            ) : (
              <div className="space-y-3">
                {topQRCodes.map((qr, i) => (
                  <div key={qr.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-muted-foreground w-5">{i + 1}</span>
                      <span className="font-medium text-sm">{qr.qr_name}</span>
                    </div>
                    <span className="font-semibold text-sm">{qr.scan_count} scans</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hourly Heatmap */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Peak Scan Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={3} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="scans" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
