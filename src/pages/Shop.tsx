import { ShopHeader } from "@/components/shop/ShopHeader";
import { ProductCard } from "@/components/shop/ProductCard";
import { useShopifyProducts } from "@/hooks/useShopifyProducts";
import { Loader2, ShoppingBag } from "lucide-react";

const Shop = () => {
  const { data: products = [], isLoading, error } = useShopifyProducts();

  return (
    <div className="min-h-screen bg-background">
      <ShopHeader />
      <main className="container px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Meal Kits & Food Products</h1>
          <p className="text-muted-foreground mt-1">Fresh ingredients delivered to your door</p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="text-center py-20 text-destructive">
            <p>Failed to load products. Please try again later.</p>
          </div>
        )}

        {!isLoading && !error && products.length === 0 && (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No products found</h2>
            <p className="text-muted-foreground">Products will appear here once they're added to the store.</p>
          </div>
        )}

        {products.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.node.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Shop;
