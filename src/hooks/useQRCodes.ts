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
  const queryClient = useQueryClient();

  const query = useQuery({
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

  // Realtime subscription to keep UI in sync when QR codes change (server-side updates)
  useEffect(() => {
    if (!restaurantId) return;
    const channel = supabase.channel(`qr_codes:${restaurantId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'qr_codes', filter: `tenant_id=eq.${restaurantId}` }, (payload) => {
        console.log('RT_EVENT_qr_codes', { restaurantId, payload });
        queryClient.invalidateQueries({ queryKey: ["qr_codes", restaurantId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, queryClient]);

  return query;
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
      // Prefer server-side deactivation via Edge Function to avoid RLS mismatches
      console.log('DELETE_START', { id, tenantId });
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
      const fnUrl = `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/manage-qr`;
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      // Log current user id for debugging
      try {
        const { data: userData } = await supabase.auth.getUser();
        console.log('USER_ID', userData?.user?.id);
      } catch (e) {
        console.warn('USER_ID_UNAVAILABLE', e);
      }

      const res = await fetch(fnUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: "deactivate", id }),
      });

      const payload = await res.json().catch(() => ({}));
      console.log('DELETE_RESPONSE', { status: res.status, ok: res.ok, payload });
      if (!res.ok) {
        console.error('DELETE_ERROR', { status: res.status, payload });
        // Surface more helpful error for common cases
        if (res.status === 404) throw new Error('manage-qr function not found (404)');
        if (res.status === 401) throw new Error('Unauthorized (401) — check session');
        if (res.status === 403) throw new Error('Forbidden (403) — RLS or role issue');
        throw new Error(payload?.error || `Failed to deactivate QR (status ${res.status})`);
      }
      return payload;
    },
    // Optimistic update: remove/deactivate QR locally for snappy UX
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: ["qr_codes", vars.tenantId] });
      const previous = queryClient.getQueryData<QRCode[]>(["qr_codes", vars.tenantId]);
      queryClient.setQueryData<QRCode[] | undefined>(["qr_codes", vars.tenantId], (old) =>
        (old || []).map((q) => (q.id === vars.id ? { ...q, is_active: false } : q))
      );
      return { previous };
    },
    onError: (err, vars, context: any) => {
      if (context?.previous) {
        queryClient.setQueryData(["qr_codes", vars.tenantId], context.previous);
      }
    },
    onSettled: (_, __, vars) => {
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
