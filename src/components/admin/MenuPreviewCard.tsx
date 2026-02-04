import { motion } from "framer-motion";
import { Plus, Leaf } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MenuPreviewCardProps {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl: string;
  isVegetarian?: boolean;
  currencySymbol?: string;
  index?: number;
  onAdd?: (id: string) => void;
}

export function MenuPreviewCard({
  id,
  name,
  description,
  price,
  imageUrl,
  isVegetarian,
  currencySymbol = "₹",
  index = 0,
  onAdd,
}: MenuPreviewCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 + index * 0.05 }}
    >
      <Card className="group overflow-hidden border-0 shadow-md card-hover">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {isVegetarian && (
            <Badge className="absolute top-2 left-2 bg-success text-success-foreground border-0 gap-1">
              <Leaf className="w-3 h-3" />
              Veg
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <h4 className="font-semibold text-foreground mb-1 truncate">{name}</h4>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{description}</p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-primary">
              {currencySymbol}{price}
            </span>
            <Button
              size="sm"
              onClick={() => onAdd?.(id)}
              className="rounded-full h-8 w-8 p-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
