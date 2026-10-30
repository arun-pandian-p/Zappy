import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { apiClient } from "@/services/apiClient";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { logActivity } from "@/services/auditLogger";

export type MenuItem = Tables<"menu_items"> & {
  category?: Pick<Category, "id" | "name" | "display_order"> | null;
  recommended_with?: string[] | null;
};
export type Category = Tables<"categories">;
export type MenuItemInsert = TablesInsert<"menu_items">;
export type MenuItemUpdate = TablesUpdate<"menu_items">;

export function useMenuItems(restaurantId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`menu-items-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "menu_items",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["menu_items", restaurantId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, queryClient]);

  return useQuery({
    queryKey: ["menu_items", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];

      try {
        const items = await apiClient.getMenuItems(restaurantId);
        return items as (MenuItem & { category: Pick<Category, "id" | "name" | "display_order"> | null })[];
      } catch (err) {
        console.warn("Java API getMenuItems error, falling back to Supabase client:", err);
        const { data, error } = await supabase
          .from("menu_items")
          .select(`
            *,
            category:categories(id, name, display_order)
          `)
          .eq("restaurant_id", restaurantId)
          .order("display_order");

        if (error) throw error;
        return data as (MenuItem & { category: Pick<Category, "id" | "name" | "display_order"> | null })[];
      }
    },
    enabled: !!restaurantId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCategories(restaurantId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`categories-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "categories",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["categories", restaurantId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, queryClient]);

  return useQuery({
    queryKey: ["categories", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];

      try {
        const categories = await apiClient.getCategories(restaurantId);
        return (categories as Category[]).filter(
          (c) => c.name && c.name.trim().toLowerCase() !== "uncategorized"
        );
      } catch (err) {
        console.warn("Java API getCategories error, falling back to Supabase client:", err);
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .eq("restaurant_id", restaurantId)
          .eq("is_active", true)
          .order("display_order");

        if (error) throw error;
        return (data as Category[]).filter(
          (c) => c.name && c.name.trim().toLowerCase() !== "uncategorized"
        );
      }
    },
    enabled: !!restaurantId,
    staleTime: 5 * 60 * 1000,
  });
}

const embeddingDebounce = new Map<string, number>();

async function debouncedEmbedding(
  id: string, name: string, description: string, restaurantId: string
) {
  const key = `${restaurantId}_${name}`;
  const existing = embeddingDebounce.get(key);
  if (existing) clearTimeout(existing);
  await new Promise<void>((resolve) => {
    const timer = window.setTimeout(() => {
      embeddingDebounce.delete(key);
      resolve();
    }, 2000);
    embeddingDebounce.set(key, timer);
  });
  const { generateAndSaveMenuEmbedding } = await import(
    "@/services/recommendations/embeddingService"
  );
  await generateAndSaveMenuEmbedding(id, name, description, restaurantId);
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: MenuItemInsert) => {
      try {
        return await apiClient.createMenuItem(item.restaurant_id, item);
      } catch (err) {
        console.warn("Java API createMenuItem error, falling back to Supabase client:", err);
        const { data, error } = await supabase
          .from("menu_items")
          .insert(item)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["menu_items", data.restaurant_id] });
      
      debouncedEmbedding(data.id, data.name, data.description || "", data.restaurant_id)
        .catch(() => {});

      logActivity({
        restaurantId: data.restaurant_id,
        action: "Create Menu Item",
        tableName: "menu_items",
        recordId: data.id,
        newValues: data
      });
    },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: MenuItemUpdate }) => {
      try {
        return await apiClient.updateMenuItem(id, updates);
      } catch (err) {
        console.warn("Java API updateMenuItem error, falling back to Supabase client:", err);
        const { data, error } = await supabase
          .from("menu_items")
          .update(updates)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["menu_items", data.restaurant_id] });

      debouncedEmbedding(data.id, data.name, data.description || "", data.restaurant_id)
        .catch(() => {});

      logActivity({
        restaurantId: data.restaurant_id,
        action: "Update Menu Item",
        tableName: "menu_items",
        recordId: data.id,
        newValues: data
      });
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, restaurantId }: { id: string; restaurantId: string }) => {
      try {
        await apiClient.deleteMenuItem(id);
        return { id, restaurantId };
      } catch (err) {
        console.warn("Java API deleteMenuItem error, falling back to Supabase client:", err);
        const { error } = await supabase
          .from("menu_items")
          .delete()
          .eq("id", id);

        if (error) throw error;
        return { id, restaurantId };
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["menu_items", data.restaurantId] });
      logActivity({
        restaurantId: data.restaurantId,
        action: "Delete Menu Item",
        tableName: "menu_items",
        recordId: data.id
      });
    },
  });
}

export function useToggleMenuItemAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isAvailable }: { id: string; isAvailable: boolean }) => {
      try {
        return await apiClient.toggleMenuItemAvailability(id, isAvailable);
      } catch (err) {
        console.warn("Java API toggleMenuItemAvailability error, falling back to Supabase client:", err);
        const { data, error } = await supabase
          .from("menu_items")
          .update({ is_available: isAvailable })
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["menu_items", data.restaurant_id] });
      logActivity({
        restaurantId: data.restaurant_id,
        action: "Toggle Menu Item Availability",
        tableName: "menu_items",
        recordId: data.id,
        newValues: { is_available: data.is_available }
      });
    },
  });
}
