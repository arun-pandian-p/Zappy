import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface QRCode {
  id: string;
  tenant_id: string;
  qr_name: string;
  target_url: string;
  qr_type: "static" | "dynamic";
  scan_count: number;
  expires_at: string | null;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ScanAnalytic {
  id: string;
  qr_id: string;
  tenant_id: string;
  scanned_at: string;
  device: string | null;
  country: string | null;
  city: string | null;
  user_agent: string | null;
  referrer: string | null;
}

export function useQRCodes(restaurantId: string) {
  return useQuery({
    queryKey: ["qr_codes", restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("qr_codes" as any)
        .select("*")
        .eq("tenant_id", restaurantId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as QRCode[];
    },
    enabled: !!restaurantId,
  });
}

export function useCreateQRCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (qr: {
      tenant_id: string;
      qr_name: string;
      target_url: string;
      qr_type: "static" | "dynamic";
      expires_at?: string | null;
      metadata?: Record<string, any>;
    }) => {
      const { data, error } = await supabase
        .from("qr_codes" as any)
        .insert(qr)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as QRCode;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["qr_codes", vars.tenant_id] });
    },
  });
}

export function useUpdateQRCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      tenantId,
      ...updates
    }: Partial<QRCode> & { id: string; tenantId: string }) => {
      const { data, error } = await supabase
        .from("qr_codes" as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as QRCode;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["qr_codes", vars.tenantId] });
    },
  });
}

export function useDeleteQRCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, tenantId }: { id: string; tenantId: string }) => {
      const { error } = await supabase
        .from("qr_codes" as any)
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["qr_codes", vars.tenantId] });
    },
  });
}

export function useQRScanAnalytics(qrId: string) {
  return useQuery({
    queryKey: ["scan_analytics", qrId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scan_analytics" as any)
        .select("*")
        .eq("qr_id", qrId)
        .order("scanned_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []) as unknown as ScanAnalytic[];
    },
    enabled: !!qrId,
  });
}

export function useAllScanAnalytics(restaurantId: string) {
  return useQuery({
    queryKey: ["scan_analytics_all", restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scan_analytics" as any)
        .select("*")
        .eq("tenant_id", restaurantId)
        .order("scanned_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data || []) as unknown as ScanAnalytic[];
    },
    enabled: !!restaurantId,
  });
}
