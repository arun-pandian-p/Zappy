import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TenantBranding {
  logo_url: string | null;
  favicon_url: string | null;
  banner_image_url: string | null;
  cover_image_url: string | null;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  name: string;
  menu_title: string | null;
  theme_config: any;
}

const defaultBranding: TenantBranding = {
  logo_url: null,
  favicon_url: null,
  banner_image_url: null,
  cover_image_url: null,
  primary_color: '#3B82F6',
  secondary_color: '#10B981',
  font_family: 'Inter',
  name: 'Restaurant',
  menu_title: null,
  theme_config: null,
};

const TenantBrandingContext = createContext<TenantBranding>(defaultBranding);

export function useTenantBranding() {
  return useContext(TenantBrandingContext);
}

/** Append cache-busting param to storage URLs */
function cacheBust(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    u.searchParams.set('v', String(Math.floor(Date.now() / 60000))); // refresh every minute
    return u.toString();
  } catch {
    return url;
  }
}

interface TenantBrandingProviderProps {
  restaurantId: string;
  children: ReactNode;
  /** Optional pre-fetched restaurant data to avoid double-fetch */
  restaurant?: any;
}

export function TenantBrandingProvider({ restaurantId, children, restaurant: prefetched }: TenantBrandingProviderProps) {
  const [branding, setBranding] = useState<TenantBranding>(defaultBranding);

  useEffect(() => {
    if (prefetched) {
      setBranding({
        logo_url: cacheBust(prefetched.logo_url),
        favicon_url: cacheBust(prefetched.favicon_url),
        banner_image_url: cacheBust(prefetched.banner_image_url),
        cover_image_url: cacheBust(prefetched.cover_image_url),
        primary_color: prefetched.primary_color || '#3B82F6',
        secondary_color: prefetched.secondary_color || '#10B981',
        font_family: prefetched.font_family || 'Inter',
        name: prefetched.name || 'Restaurant',
        menu_title: prefetched.menu_title,
        theme_config: prefetched.theme_config,
      });
      return;
    }

    if (!restaurantId) return;

    supabase
      .from('restaurants')
      .select('name, logo_url, favicon_url, banner_image_url, cover_image_url, primary_color, secondary_color, font_family, menu_title, theme_config')
      .eq('id', restaurantId)
      .single()
      .then(({ data }) => {
        if (data) {
          setBranding({
            logo_url: cacheBust(data.logo_url),
            favicon_url: cacheBust(data.favicon_url),
            banner_image_url: cacheBust(data.banner_image_url),
            cover_image_url: cacheBust(data.cover_image_url),
            primary_color: data.primary_color || '#3B82F6',
            secondary_color: data.secondary_color || '#10B981',
            font_family: data.font_family || 'Inter',
            name: data.name || 'Restaurant',
            menu_title: data.menu_title,
            theme_config: data.theme_config,
          });
        }
      });
  }, [restaurantId, prefetched]);

  return (
    <TenantBrandingContext.Provider value={branding}>
      {children}
    </TenantBrandingContext.Provider>
  );
}
