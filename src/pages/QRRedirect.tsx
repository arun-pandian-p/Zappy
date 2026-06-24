import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";
import { analyticsService } from "@/services/analyticsService";
import { ZappyLogo } from "@/components/branding/ZappyLogo";

export default function QRRedirect() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleRedirect() {
      if (!id) {
        setError("Invalid QR Code Link");
        return;
      }

      // Validate UUID format to prevent database query crashes on malformed route params
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!UUID_REGEX.test(id)) {
        setError("This QR code reference is invalid.");
        return;
      }

      try {
        // Fetch the QR code from the database
        const { data: qrCode, error: fetchError } = await supabase
          .from("qr_codes")
          .select("*")
          .eq("id", id)
          .single();

        if (fetchError || !qrCode || !qrCode.is_active) {
          setError("This QR code is inactive or does not exist.");
          return;
        }

        // Parse target URL and resolve table mappings
        let targetUrl = qrCode.target_url;
        const metadata = qrCode.metadata as any;
        const tableNum = metadata?.table_number || metadata?.table_id || qrCode.qr_name;

        if (!targetUrl) {
          targetUrl = `/menu?r=${qrCode.tenant_id}`;
          if (tableNum) {
            targetUrl += `&table=${tableNum}`;
          }
        }

        // Get device info
        const userAgent = navigator.userAgent;
        let os = "Unknown";
        if (/android/i.test(userAgent)) os = "Android";
        else if (/iPad|iPhone|iPod/.test(userAgent)) os = "iOS";
        else if (/Windows/.test(userAgent)) os = "Windows";
        else if (/Mac/.test(userAgent)) os = "MacOS";
        else if (/Linux/.test(userAgent)) os = "Linux";

        let browser = "Unknown";
        if (/Chrome/.test(userAgent) && !/Edg/.test(userAgent)) browser = "Chrome";
        else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) browser = "Safari";
        else if (/Firefox/.test(userAgent)) browser = "Firefox";
        else if (/Edg/.test(userAgent)) browser = "Edge";

        // Extract query params to preserve them
        const searchParams = new URLSearchParams(window.location.search);
        
        // Ensure the target URL is well-formed
        if (targetUrl.startsWith('/')) {
          // If it's a relative path to our app, keep the search params
          const targetUrlObj = new URL(targetUrl, window.location.origin);
          searchParams.forEach((val, key) => targetUrlObj.searchParams.set(key, val));
          targetUrl = targetUrlObj.pathname + targetUrlObj.search;
        } else {
          // External URL
          try {
            const targetUrlObj = new URL(targetUrl);
            searchParams.forEach((val, key) => targetUrlObj.searchParams.set(key, val));
            targetUrl = targetUrlObj.toString();
          } catch (e) {
            console.error("Invalid external target URL", e);
          }
        }

        // Fire and forget analytics logging
        const sessionId = typeof window !== 'undefined' ? sessionStorage.getItem('zappy_analytics_session') || 'unknown' : 'server';
        
        // Log to scan_analytics table
        supabase.from("scan_analytics").insert({
          qr_id: qrCode.id,
          tenant_id: qrCode.tenant_id,
          scanned_at: new Date().toISOString(),
          device: os,
          browser: browser,
          user_agent: userAgent,
          referrer: document.referrer || null
        }).then(({ error: analyticsError }) => {
          if (analyticsError) console.error("Failed to log scan", analyticsError);
        });

        // Also log to campaign_events if this is part of a marketing campaign
        if (qrCode.campaign_id) {
          analyticsService.trackEvent({
            campaignId: qrCode.campaign_id,
            eventType: 'redirect_opened',
            tenantId: qrCode.tenant_id,
            metadata: {
              qr_id: qrCode.id,
              os,
              browser,
              original_target: qrCode.target_url
            }
          });
        }

        // Increment scan count on qr_codes using correct RPC
        supabase.rpc('increment_scan_count', { qr_code_id: qrCode.id }).then(({ error: rpcError }) => {
          if (rpcError) console.error("RPC scan count increment failed:", rpcError);
        });

        // Wait a tiny bit to ensure events are dispatched before redirecting
        setTimeout(() => {
          // A terminal customer session may only be unlocked by a new QR scan.
          // CustomerMenu consumes this one-time marker after the redirect.
          sessionStorage.setItem('zappy_fresh_qr_scan', crypto.randomUUID());
          if (targetUrl.startsWith('/')) {
            navigate(targetUrl, { replace: true });
          } else {
            window.location.replace(targetUrl);
          }
        }, 300);

      } catch (err) {
        console.error("Redirect Error:", err);
        setError("Failed to process redirect.");
      }
    }

    handleRedirect();
  }, [id, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6">
        <ZappyLogo size={80} className="mb-8 opacity-50 grayscale" />
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 max-w-sm w-full text-center shadow-lg border">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">QR Code Unavailable</h1>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center">
      <div className="animate-pulse flex flex-col items-center justify-center">
        <ZappyLogo size={100} className="mb-8" />
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">Redirecting to menu...</p>
      </div>
    </div>
  );
}
