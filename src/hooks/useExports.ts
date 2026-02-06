import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface ExportOptions {
  restaurantId: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
}

function convertToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return "";
  
  const headers = Object.keys(data[0]);
  const headerRow = headers.join(",");
  
  const rows = data.map((row) => {
    return headers.map((header) => {
      const value = row[header];
      // Handle null/undefined
      if (value === null || value === undefined) return "";
      // Handle strings with commas or quotes
      if (typeof value === "string") {
        if (value.includes(",") || value.includes('"') || value.includes("\n")) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }
      // Handle objects (stringify them)
      if (typeof value === "object") {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      return String(value);
    }).join(",");
  });
  
  return [headerRow, ...rows].join("\n");
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function useExportOrders() {
  return useMutation({
    mutationFn: async ({ restaurantId, startDate, endDate, status }: ExportOptions) => {
      let query = supabase
        .from("orders")
        .select(`
          order_number,
          created_at,
          customer_name,
          customer_phone,
          status,
          payment_status,
          payment_method,
          subtotal,
          tax_amount,
          service_charge,
          total_amount,
          table:tables(table_number)
        `)
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

      if (startDate) {
        query = query.gte("created_at", startDate.toISOString());
      }
      if (endDate) {
        query = query.lte("created_at", endDate.toISOString());
      }
      if (status && status !== "all") {
        query = query.eq("status", status as "pending" | "confirmed" | "preparing" | "ready" | "served" | "completed" | "cancelled");
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data for CSV
      const csvData = (data || []).map((order: any) => ({
        "Order Number": order.order_number,
        "Date": order.created_at ? format(new Date(order.created_at), "yyyy-MM-dd HH:mm") : "",
        "Table": order.table?.table_number || "N/A",
        "Customer Name": order.customer_name || "",
        "Customer Phone": order.customer_phone || "",
        "Status": order.status,
        "Payment Status": order.payment_status,
        "Payment Method": order.payment_method || "",
        "Subtotal": order.subtotal,
        "Tax": order.tax_amount,
        "Service Charge": order.service_charge,
        "Total Amount": order.total_amount,
      }));

      const csv = convertToCSV(csvData);
      const dateRange = startDate && endDate 
        ? `${format(startDate, "yyyyMMdd")}-${format(endDate, "yyyyMMdd")}`
        : format(new Date(), "yyyyMMdd");
      downloadCSV(csv, `orders-${dateRange}.csv`);

      return { count: csvData.length };
    },
  });
}

export function useExportRevenue() {
  return useMutation({
    mutationFn: async ({ restaurantId, startDate, endDate }: ExportOptions) => {
      let query = supabase
        .from("invoices")
        .select(`
          invoice_number,
          created_at,
          customer_name,
          payment_method,
          payment_status,
          subtotal,
          tax_amount,
          service_charge,
          discount_amount,
          total_amount
        `)
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

      if (startDate) {
        query = query.gte("created_at", startDate.toISOString());
      }
      if (endDate) {
        query = query.lte("created_at", endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data for CSV
      const csvData = (data || []).map((invoice: any) => ({
        "Invoice Number": invoice.invoice_number,
        "Date": invoice.created_at ? format(new Date(invoice.created_at), "yyyy-MM-dd HH:mm") : "",
        "Customer": invoice.customer_name || "",
        "Payment Method": invoice.payment_method,
        "Status": invoice.payment_status,
        "Subtotal": invoice.subtotal,
        "Tax": invoice.tax_amount,
        "Service Charge": invoice.service_charge,
        "Discount": invoice.discount_amount || 0,
        "Total": invoice.total_amount,
      }));

      const csv = convertToCSV(csvData);
      const dateRange = startDate && endDate 
        ? `${format(startDate, "yyyyMMdd")}-${format(endDate, "yyyyMMdd")}`
        : format(new Date(), "yyyyMMdd");
      downloadCSV(csv, `revenue-${dateRange}.csv`);

      return { count: csvData.length };
    },
  });
}

export function useExportMenuItems() {
  return useMutation({
    mutationFn: async ({ restaurantId }: { restaurantId: string }) => {
      const { data, error } = await supabase
        .from("menu_items")
        .select(`
          name,
          description,
          price,
          is_available,
          is_vegetarian,
          is_vegan,
          is_popular,
          spicy_level,
          prep_time_minutes,
          category:categories(name)
        `)
        .eq("restaurant_id", restaurantId)
        .order("name");

      if (error) throw error;

      const csvData = (data || []).map((item: any) => ({
        "Name": item.name,
        "Description": item.description || "",
        "Price": item.price,
        "Category": item.category?.name || "",
        "Available": item.is_available ? "Yes" : "No",
        "Vegetarian": item.is_vegetarian ? "Yes" : "No",
        "Vegan": item.is_vegan ? "Yes" : "No",
        "Popular": item.is_popular ? "Yes" : "No",
        "Spicy Level": item.spicy_level || 0,
        "Prep Time (min)": item.prep_time_minutes || 0,
      }));

      const csv = convertToCSV(csvData);
      downloadCSV(csv, `menu-${format(new Date(), "yyyyMMdd")}.csv`);

      return { count: csvData.length };
    },
  });
}
