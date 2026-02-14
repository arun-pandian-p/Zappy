import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Invoice {
  id: string;
  restaurant_id: string;
  order_id: string;
  invoice_number: string;
  subtotal: number;
  tax_amount: number;
  service_charge: number;
  discount_amount: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  items: InvoiceItem[];
  customer_name: string | null;
  customer_phone: string | null;
  notes: string | null;
  printed: boolean;
  created_at: string;
}

export interface InvoiceInsert {
  restaurant_id: string;
  order_id: string;
  invoice_number: string;
  subtotal: number;
  tax_amount: number;
  service_charge: number;
  discount_amount?: number;
  total_amount: number;
  payment_method: string;
  payment_status?: string;
  items: InvoiceItem[];
  customer_name?: string;
  customer_phone?: string;
  notes?: string;
}

// Helper to transform DB response to Invoice type
function transformInvoice(data: Record<string, unknown>): Invoice {
  return {
    ...data,
    items: (data.items as InvoiceItem[]) || [],
    subtotal: Number(data.subtotal),
    tax_amount: Number(data.tax_amount),
    service_charge: Number(data.service_charge),
    discount_amount: Number(data.discount_amount || 0),
    total_amount: Number(data.total_amount),
  } as Invoice;
}

export function useInvoices(restaurantId?: string) {
  return useQuery({
    queryKey: ["invoices", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(transformInvoice);
    },
    enabled: !!restaurantId,
    staleTime: 60 * 1000,
  });
}

export function useTodayInvoices(restaurantId?: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return useQuery({
    queryKey: ["invoices", "today", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(transformInvoice);
    },
    enabled: !!restaurantId,
    staleTime: 30 * 1000,
  });
}

export function useInvoiceStats(restaurantId?: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return useQuery({
    queryKey: ["invoices", "stats", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return null;
      
      const { data, error } = await supabase
        .from("invoices")
        .select("total_amount, payment_method, created_at, discount_amount")
        .eq("restaurant_id", restaurantId)
        .gte("created_at", today.toISOString());

      if (error) throw error;

      const invoices = data || [];
      const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
      const totalDiscount = invoices.reduce((sum, inv) => sum + Number(inv.discount_amount || 0), 0);
      const invoiceCount = invoices.length;
      const paymentBreakdown = {
        cash: invoices.filter(i => i.payment_method === "cash").length,
        card: invoices.filter(i => i.payment_method === "card").length,
        upi: invoices.filter(i => i.payment_method === "upi").length,
        wallet: invoices.filter(i => i.payment_method === "wallet").length,
        split: invoices.filter(i => i.payment_method === "split").length,
      };

      return {
        totalRevenue,
        totalDiscount,
        invoiceCount,
        paymentBreakdown,
      };
    },
    enabled: !!restaurantId,
    staleTime: 30 * 1000,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoice: InvoiceInsert) => {
      const { data, error } = await supabase
        .from("invoices")
        .insert({
          ...invoice,
          items: invoice.items as unknown as Json,
        })
        .select()
        .single();

      if (error) throw error;
      return transformInvoice(data as Record<string, unknown>);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invoices", data.restaurant_id] });
      queryClient.invalidateQueries({ queryKey: ["invoices", "today", data.restaurant_id] });
      queryClient.invalidateQueries({ queryKey: ["invoices", "stats", data.restaurant_id] });
    },
  });
}

export function useMarkInvoicePrinted() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { data, error } = await supabase
        .from("invoices")
        .update({ printed: true })
        .eq("id", invoiceId)
        .select()
        .single();

      if (error) throw error;
      return transformInvoice(data as Record<string, unknown>);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invoices", data.restaurant_id] });
    },
  });
}

export function generateInvoiceNumber(restaurantId: string): string {
  const date = new Date();
  const prefix = "INV";
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${dateStr}-${random}`;
}
