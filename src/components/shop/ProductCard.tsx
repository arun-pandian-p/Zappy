import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Loader2 } from "lucide-react";
import { useShopifyCartStore } from "@/stores/shopifyCartStore";
import type { ShopifyProduct } from "@/lib/shopify";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface ProductCardProps {
  product: ShopifyProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useShopifyCartStore(state => state.addItem);
  const isLoading = useShopifyCartStore(state => state.isLoading);
  const [adding, setAdding] = useState(false);
  const p = product.node;
  const variant = p.variants.edges[0]?.node;
  const image = p.images.edges[0]?.node;
  const price = p.priceRange.minVariantPrice;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!variant) return;
    setAdding(true);
    try {
      await addItem({
        product,
        variantId: variant.id,
        variantTitle: variant.title,
        price: variant.price,
        quantity: 1,
        selectedOptions: variant.selectedOptions || [],
      });
      toast.success(`${p.title} added to cart`);
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  return (
    <Link to={`/shop/product/${p.handle}`}>
      <Card className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer">
        <div className="aspect-square overflow-hidden bg-muted">
          {image ? (
            <img
              src={image.url}
              alt={image.altText || p.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <ShoppingCart className="w-12 h-12" />
            </div>
          )}
        </div>
        <CardContent className="p-4 space-y-2">
          <h3 className="font-semibold text-sm line-clamp-2">{p.title}</h3>
          {p.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
          )}
          <div className="flex items-center justify-between pt-1">
            <Badge variant="secondary" className="font-bold">
              {price.currencyCode} {parseFloat(price.amount).toFixed(2)}
            </Badge>
            <Button
              size="sm"
              onClick={handleAddToCart}
              disabled={adding || isLoading || !variant?.availableForSale}
              className="h-8"
            >
              {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShoppingCart className="w-3 h-3" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
