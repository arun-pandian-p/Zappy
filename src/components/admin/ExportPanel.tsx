import { useState } from "react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { Download, FileSpreadsheet, Loader2, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useExportOrders, useExportRevenue, useExportMenuItems } from "@/hooks/useExports";

interface ExportPanelProps {
  restaurantId: string;
}

type DatePreset = "today" | "yesterday" | "last7days" | "last30days" | "thisMonth" | "custom";

export function ExportPanel({ restaurantId }: ExportPanelProps) {
  const { toast } = useToast();
  const [datePreset, setDatePreset] = useState<DatePreset>("last7days");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const exportOrders = useExportOrders();
  const exportRevenue = useExportRevenue();
  const exportMenuItems = useExportMenuItems();

  const getDateRange = (): { startDate: Date; endDate: Date } => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    switch (datePreset) {
      case "today":
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return { startDate: todayStart, endDate: today };
      case "yesterday":
        const yesterdayStart = subDays(today, 1);
        yesterdayStart.setHours(0, 0, 0, 0);
        const yesterdayEnd = subDays(today, 1);
        yesterdayEnd.setHours(23, 59, 59, 999);
        return { startDate: yesterdayStart, endDate: yesterdayEnd };
      case "last7days":
        const last7Start = subDays(today, 6);
        last7Start.setHours(0, 0, 0, 0);
        return { startDate: last7Start, endDate: today };
      case "last30days":
        const last30Start = subDays(today, 29);
        last30Start.setHours(0, 0, 0, 0);
        return { startDate: last30Start, endDate: today };
      case "thisMonth":
        return { startDate: startOfMonth(today), endDate: endOfMonth(today) };
      case "custom":
        return {
          startDate: customStartDate ? new Date(customStartDate) : subDays(today, 7),
          endDate: customEndDate ? new Date(customEndDate) : today,
        };
      default:
        const defaultStart = subDays(today, 6);
        defaultStart.setHours(0, 0, 0, 0);
        return { startDate: defaultStart, endDate: today };
    }
  };

  const handleExportOrders = async () => {
    const { startDate, endDate } = getDateRange();
    try {
      const result = await exportOrders.mutateAsync({
        restaurantId,
        startDate,
        endDate,
        status: statusFilter,
      });
      toast({
        title: "Export Complete",
        description: `Exported ${result.count} orders to CSV.`,
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export orders.",
        variant: "destructive",
      });
    }
  };

  const handleExportRevenue = async () => {
    const { startDate, endDate } = getDateRange();
    try {
      const result = await exportRevenue.mutateAsync({
        restaurantId,
        startDate,
        endDate,
      });
      toast({
        title: "Export Complete",
        description: `Exported ${result.count} invoices to CSV.`,
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export revenue data.",
        variant: "destructive",
      });
    }
  };

  const handleExportMenu = async () => {
    try {
      const result = await exportMenuItems.mutateAsync({ restaurantId });
      toast({
        title: "Export Complete",
        description: `Exported ${result.count} menu items to CSV.`,
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export menu items.",
        variant: "destructive",
      });
    }
  };

  const isExporting = exportOrders.isPending || exportRevenue.isPending || exportMenuItems.isPending;

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Export Data
        </CardTitle>
        <CardDescription>
          Download your data as CSV files for reporting and analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Range Selection */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Date Range</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { value: "today", label: "Today" },
              { value: "yesterday", label: "Yesterday" },
              { value: "last7days", label: "Last 7 Days" },
              { value: "last30days", label: "Last 30 Days" },
              { value: "thisMonth", label: "This Month" },
              { value: "custom", label: "Custom" },
            ].map((preset) => (
              <Button
                key={preset.value}
                variant={datePreset === preset.value ? "default" : "outline"}
                size="sm"
                onClick={() => setDatePreset(preset.value as DatePreset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {datePreset === "custom" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Order Status Filter</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="served">Served</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Export Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
          <Button
            onClick={handleExportOrders}
            disabled={isExporting}
            className="w-full"
          >
            {exportOrders.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export Orders
          </Button>
          
          <Button
            onClick={handleExportRevenue}
            disabled={isExporting}
            variant="secondary"
            className="w-full"
          >
            {exportRevenue.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export Revenue
          </Button>
          
          <Button
            onClick={handleExportMenu}
            disabled={isExporting}
            variant="outline"
            className="w-full"
          >
            {exportMenuItems.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export Menu
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
