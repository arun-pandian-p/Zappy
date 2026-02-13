import { Link } from "react-router-dom";
import { UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartDrawer } from "./CartDrawer";

export function ShopHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center justify-between h-16 px-4">
        <Link to="/shop" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <UtensilsCrossed className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">QR Dine Shop</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="sm">Home</Button>
          </Link>
          <CartDrawer />
        </div>
      </div>
    </header>
  );
}
