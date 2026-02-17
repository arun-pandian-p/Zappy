import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus, Minus } from "lucide-react";
import type { VariantGroup } from "@/hooks/useVariants";
import type { AddonGroup } from "@/hooks/useAddons";

interface ItemCustomizationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string | null;
    isVegetarian?: boolean;
  };
  variantGroups: VariantGroup[];
  addonGroups: AddonGroup[];
  currencySymbol?: string;
  onAddToCart: (config: {
    selectedVariants: Record<string, { optionId: string; name: string; priceModifier: number }>;
    selectedAddons: { optionId: string; name: string; price: number }[];
    specialInstructions: string;
    totalPrice: number;
  }) => void;
}

export function ItemCustomizationSheet({
  open,
  onOpenChange,
  item,
  variantGroups,
  addonGroups,
  currencySymbol = "₹",
  onAddToCart,
}: ItemCustomizationSheetProps) {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, { optionId: string; name: string; priceModifier: number }>>({});
  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({});
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [quantity, setQuantity] = useState(1);

  const totalPrice = useMemo(() => {
    let price = item.price;
    // Add variant price modifiers
    Object.values(selectedVariants).forEach(v => {
      price += v.priceModifier;
    });
    // Add addon prices
    addonGroups.forEach(group => {
      group.options?.forEach(opt => {
        if (selectedAddons[opt.id]) {
          price += Number(opt.price);
        }
      });
    });
    return price * quantity;
  }, [item.price, selectedVariants, selectedAddons, addonGroups, quantity]);

  const handleVariantSelect = (groupId: string, optionId: string, name: string, priceModifier: number) => {
    setSelectedVariants(prev => ({
      ...prev,
      [groupId]: { optionId, name, priceModifier },
    }));
  };

  const handleAddonToggle = (optionId: string) => {
    setSelectedAddons(prev => ({
      ...prev,
      [optionId]: !prev[optionId],
    }));
  };

  const canAdd = useMemo(() => {
    // Check all required variant groups are selected
    return variantGroups
      .filter(g => g.is_required)
      .every(g => selectedVariants[g.id]);
  }, [variantGroups, selectedVariants]);

  const handleAdd = () => {
    const addons = addonGroups.flatMap(group =>
      (group.options || [])
        .filter(opt => selectedAddons[opt.id])
        .map(opt => ({ optionId: opt.id, name: opt.name, price: Number(opt.price) }))
    );

    for (let i = 0; i < quantity; i++) {
      onAddToCart({
        selectedVariants,
        selectedAddons: addons,
        specialInstructions,
        totalPrice: totalPrice / quantity,
      });
    }

    // Reset
    setSelectedVariants({});
    setSelectedAddons({});
    setSpecialInstructions("");
    setQuantity(1);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader className="text-left">
          <div className="flex items-center gap-3">
            {item.imageUrl && (
              <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
            )}
            <div>
              <SheetTitle className="text-lg">{item.name}</SheetTitle>
              <p className="text-sm text-muted-foreground">
                {currencySymbol}{Number(item.price).toFixed(0)}
                {item.isVegetarian && <Badge variant="secondary" className="ml-2 text-[10px]">Veg</Badge>}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Variant Groups */}
          {variantGroups.map(group => (
            <div key={group.id}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold text-sm">{group.name}</h3>
                {group.is_required && <Badge variant="destructive" className="text-[10px]">Required</Badge>}
              </div>
              <RadioGroup
                value={selectedVariants[group.id]?.optionId || ""}
                onValueChange={(val) => {
                  const opt = group.options?.find(o => o.id === val);
                  if (opt) handleVariantSelect(group.id, opt.id, opt.name, Number(opt.price_modifier));
                }}
              >
                <div className="space-y-2">
                  {group.options?.filter(o => o.is_available).map(opt => (
                    <div key={opt.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={opt.id} id={opt.id} />
                        <Label htmlFor={opt.id} className="cursor-pointer font-medium text-sm">{opt.name}</Label>
                      </div>
                      {Number(opt.price_modifier) !== 0 && (
                        <span className="text-sm text-muted-foreground">
                          +{currencySymbol}{Number(opt.price_modifier).toFixed(0)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          ))}

          {/* Addon Groups */}
          {addonGroups.map(group => (
            <div key={group.id}>
              <h3 className="font-semibold text-sm mb-3">{group.name}</h3>
              <div className="space-y-2">
                {group.options?.filter(o => o.is_available).map(opt => (
                  <div key={opt.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`addon-${opt.id}`}
                        checked={!!selectedAddons[opt.id]}
                        onCheckedChange={() => handleAddonToggle(opt.id)}
                      />
                      <Label htmlFor={`addon-${opt.id}`} className="cursor-pointer font-medium text-sm">{opt.name}</Label>
                    </div>
                    {Number(opt.price) > 0 && (
                      <span className="text-sm text-muted-foreground">
                        +{currencySymbol}{Number(opt.price).toFixed(0)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Special Instructions */}
          <div>
            <h3 className="font-semibold text-sm mb-2">Special Instructions</h3>
            <Textarea
              placeholder="e.g. No onions, extra spicy..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="resize-none"
              rows={2}
            />
          </div>

          {/* Quantity + Add Button */}
          <div className="flex items-center gap-4 pt-4 border-t">
            <div className="flex items-center gap-2 bg-muted rounded-xl p-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQuantity(quantity + 1)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <Button
              className="flex-1 h-12 rounded-xl bg-success hover:bg-success/90 text-success-foreground font-semibold"
              onClick={handleAdd}
              disabled={!canAdd}
            >
              Add — {currencySymbol}{totalPrice.toFixed(0)}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
