import { useQuery } from "@tanstack/react-query";
import { storefrontApiRequest, PRODUCTS_QUERY, PRODUCT_BY_HANDLE_QUERY, type ShopifyProduct } from "@/lib/shopify";

export function useShopifyProducts(first = 20) {
  return useQuery({
    queryKey: ["shopify-products", first],
    queryFn: async () => {
      const data = await storefrontApiRequest(PRODUCTS_QUERY, { first });
      return (data?.data?.products?.edges || []) as ShopifyProduct[];
    },
  });
}

export function useShopifyProduct(handle: string) {
  return useQuery({
    queryKey: ["shopify-product", handle],
    queryFn: async () => {
      const data = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
      return data?.data?.product || null;
    },
    enabled: !!handle,
  });
}
