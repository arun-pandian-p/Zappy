import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { useShopifyProduct } from "@/hooks/useShopifyProducts";
import { useShopifyCartStore } from "@/stores/shopifyCartStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, ShoppingCart, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

const ShopProduct = () => {
  const { handle } = useParams<{ handle: string }>();
  const { data: product, isLoading } = useShopifyProduct(handle || "");
  const addItem = useShopifyCartStore(state => state.addItem);
  const cartLoading = useShopifyCartStore(state => state.isLoading);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <ShopHeader />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <ShopHeader />
        <div className="container px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Link to="/shop"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back to Shop</Button></Link>
        </div>
      </div>
    );
  }

  const variant = product.variants.edges[selectedVariantIdx]?.node;
  const images = product.images.edges;

  const handleAddToCart = async () => {
    if (!variant) return;
    try {
      await addItem({
        product: { node: product },
        variantId: variant.id,
        variantTitle: variant.title,
        price: variant.price,
        quantity,
        selectedOptions: variant.selectedOptions || [],
      });
      toast.success(`${product.title} added to cart`);
    } catch {
      toast.error("Failed to add to cart");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ShopHeader />
      <main className="container px-4 py-8">
        <Link to="/shop" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" />Back to Shop
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-3">
            <div className="aspect-square rounded-xl overflow-hidden bg-muted">
              {images[selectedImage]?.node ? (
                <img src={images[selectedImage].node.url} alt={images[selectedImage].node.altText || product.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ShoppingCart className="w-16 h-16" />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)} className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 ${i === selectedImage ? 'border-primary' : 'border-transparent'}`}>
                    <img src={img.node.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">{product.title}</h1>
              {variant && (
                <p className="text-2xl font-bold text-primary mt-2">
                  {variant.price.currencyCode} {parseFloat(variant.price.amount).toFixed(2)}
                </p>
              )}
            </div>

            {product.description && (
              <p className="text-muted-foreground">{product.description}</p>
            )}

            {/* Variant selection */}
            {product.variants.edges.length > 1 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Variant</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.edges.map((v, i) => (
                    <Badge
                      key={v.node.id}
                      variant={i === selectedVariantIdx ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSelectedVariantIdx(i)}
                    >
                      {v.node.title}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium">Quantity</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(q => q + 1)}>
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <Button onClick={handleAddToCart} size="lg" className="w-full" disabled={cartLoading || !variant?.availableForSale}>
              {cartLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShoppingCart className="w-4 h-4 mr-2" />}
              Add to Cart
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ShopProduct;
