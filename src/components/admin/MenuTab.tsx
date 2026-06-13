import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  Save,
  Loader2,
  Download,
  Edit2,
  Sparkles,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { MenuOCRImporter } from "@/components/admin/MenuOCRImporter";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { MenuPreviewCard } from "@/components/admin/MenuPreviewCard";
import { EditMenuItemDialog } from "@/components/admin/EditMenuItemDialog";
import { 
  useCreateMenuItem, 
  useDeleteMenuItem, 
  useToggleMenuItemAvailability,
  type MenuItem,
  type Category,
} from "@/hooks/useMenuItems";
import { bulkEnrichMenu, generateFoodImage } from "@/services/imageGenService";
import { useRestaurantDetails } from "@/hooks/useRestaurant";
import { FoodGraphReasoning } from "./FoodGraphReasoning";

interface MenuTabProps {
  restaurantId: string;
  menuItems: any[];
  categories: any[];
  currencySymbol: string;
}

export function MenuTab({
  restaurantId,
  menuItems = [],
  categories = [],
  currencySymbol,
}: MenuTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAdminCategory, setSelectedAdminCategory] = useState("All");
  const [editingItem, setEditingItem] = useState<(MenuItem & { category?: Pick<Category, "id" | "name"> | null }) | null>(null);

  const { data: restaurant } = useRestaurantDetails(restaurantId);
  const subscriptionTier = restaurant?.subscription_tier || "free";

  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: "",
    category: categories[0]?.name || "Starters",
    image_url: "",
    is_vegetarian: false,
    prep_time_minutes: "15",
    tags: "",
  });

  const createMenuItem = useCreateMenuItem();
  const deleteMenuItem = useDeleteMenuItem();
  const toggleAvailability = useToggleMenuItemAvailability();

  const filteredMenuItems = useMemo(() => {
    if (!menuItems) return [];
    return menuItems.filter(item => 
      selectedAdminCategory === "All" || item.category?.name === selectedAdminCategory
    );
  }, [menuItems, selectedAdminCategory]);

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const category = categories.find(c => c.name === newItem.category);

    try {
      await createMenuItem.mutateAsync({
        restaurant_id: restaurantId,
        name: newItem.name,
        description: newItem.description || undefined,
        price: parseFloat(newItem.price),
        category_id: category?.id,
        image_url: newItem.image_url || undefined,
        is_vegetarian: newItem.is_vegetarian,
        prep_time_minutes: parseInt(newItem.prep_time_minutes) || 15,
        is_available: true,
        tags: newItem.tags.split(",").map(t => t.trim()).filter(Boolean),
      });
      
      toast({
        title: "Item Added",
        description: `${newItem.name} has been added to the menu.`,
      });
      
      setNewItem({
        name: "",
        description: "",
        price: "",
        category: categories[0]?.name || "Starters",
        image_url: "",
        is_vegetarian: false,
        prep_time_minutes: "15",
        tags: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add menu item.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    
    try {
      await deleteMenuItem.mutateAsync({ id, restaurantId });
      toast({
        title: "Item Deleted",
        description: "Menu item has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete item.",
        variant: "destructive",
      });
    }
  };

  const handleToggleAvailability = async (id: string, currentValue: boolean) => {
    try {
      await toggleAvailability.mutateAsync({ id, isAvailable: !currentValue });
      toast({
        title: "Availability Updated",
        description: `Item is now ${!currentValue ? 'available' : 'unavailable'}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update availability.",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      key="menu"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Menu Management</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-sm text-muted-foreground">Connected to Supabase Realtime</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl px-6">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" aria-describedby="add-category-description">
              <DialogHeader>
                <DialogTitle>Add Menu Item</DialogTitle>
                <DialogDescription>Create a new dish for your menu.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Item Name</Label>
                  <Input
                    placeholder="e.g., Butter Chicken"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Price ({currencySymbol})</Label>
                    <Input
                      type="number"
                      placeholder="299"
                      value={newItem.price}
                      onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Prep Time (min)</Label>
                    <Input
                      type="number"
                      placeholder="15"
                      value={newItem.prep_time_minutes}
                      onChange={(e) => setNewItem({ ...newItem, prep_time_minutes: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={newItem.category || (categories[0]?.name || "Starters")}
                    onValueChange={(v) => setNewItem({ ...newItem, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tags (comma separated)</Label>
                  <Input
                    value={newItem.tags}
                    onChange={(e) => setNewItem({ ...newItem, tags: e.target.value })}
                    placeholder="e.g. Spicy, Vegan, Chef Special"
                  />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Image</Label>
                      {newItem.name && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-[10px] gap-1 text-primary hover:text-primary"
                          onClick={async () => {
                            toast({ title: "Generating image...", description: "AI is creating a photo for " + newItem.name });
                            const url = await generateFoodImage(newItem.name, newItem.description || "", restaurantId);
                            setNewItem({ ...newItem, image_url: url });
                            toast({ title: "Image ready!" });
                          }}
                        >
                          <Sparkles className="w-3 h-3" />
                          AI Generate
                        </Button>
                      )}
                    </div>
                  <ImageUpload
                    currentImageUrl={newItem.image_url}
                    onImageUploaded={(url) => setNewItem({ ...newItem, image_url: url })}
                    restaurantId={restaurantId}
                    folder="menu"
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    checked={newItem.is_vegetarian}
                    onCheckedChange={(v) => setNewItem({ ...newItem, is_vegetarian: v })}
                  />
                  <Label>Vegetarian Dish</Label>
                </div>
                <Button 
                  className="w-full mt-4 h-11 rounded-xl" 
                  onClick={handleAddItem}
                  disabled={createMenuItem.isPending}
                >
                  {createMenuItem.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Publish to Menu
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <MenuOCRImporter restaurantId={restaurantId} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <CategoryManager restaurantId={restaurantId} />
          
          <Card className="border-0 shadow-xl bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Menu Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Items</span>
                <span className="font-bold">{menuItems.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Items</span>
                <span className="font-bold text-green-500">{menuItems.filter(i => i.is_available).length}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-500" 
                  style={{ width: `${(menuItems.filter(i => i.is_available).length / (menuItems.length || 1)) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-9 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-sm">
            <div className="flex overflow-x-auto pb-1 gap-2 no-scrollbar max-w-full sm:max-w-[60%]">
              <Button
                variant={selectedAdminCategory === "All" ? "default" : "ghost"}
                size="sm"
                className="rounded-full px-4"
                onClick={() => setSelectedAdminCategory("All")}
              >
                All
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat.id}
                  variant={selectedAdminCategory === cat.name ? "default" : "ghost"}
                  size="sm"
                  className="rounded-full px-4 whitespace-nowrap"
                  onClick={() => setSelectedAdminCategory(cat.name)}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
               <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary hover:bg-primary/10 rounded-full"
                onClick={() => {
                  toast({ title: "Enriching items...", description: "AI is generating descriptions and images." });
                  bulkEnrichMenu(restaurantId, menuItems).then(() => {
                    toast({ title: "Menu Enriched!", description: "All items now have AI content." });
                    queryClient.invalidateQueries({ queryKey: ["menu_items", restaurantId] });
                  });
                }}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Enrich
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full"
                onClick={() => {
                  const blob = new Blob([JSON.stringify(menuItems, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `menu_backup_${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredMenuItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-3xl -m-1 group-hover:m-0 transition-all duration-300" />
                  <div className="relative bg-white/60 backdrop-blur-sm border border-white/40 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                    <MenuPreviewCard
                      id={item.id}
                      name={item.name}
                      description={item.description}
                      price={item.price}
                      imageUrl={item.image_url}
                      isVegetarian={item.is_vegetarian}
                      currencySymbol={currencySymbol}
                      index={index}
                    />
                    <div className="p-4 flex items-center justify-between border-t border-black/5 bg-white/20">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.is_available}
                          onCheckedChange={() =>
                            handleToggleAvailability(item.id, item.is_available ?? true)
                          }
                          className="data-[state=checked]:bg-green-500"
                        />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {item.is_available ? 'Live' : 'Hidden'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="w-8 h-8 rounded-full bg-white shadow-sm hover:scale-110 transition-transform"
                          onClick={() => setEditingItem(item as any)}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="w-8 h-8 rounded-full shadow-sm hover:scale-110 transition-transform"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {!item.is_available && (
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] rounded-2xl flex items-center justify-center pointer-events-none">
                      <Badge className="bg-white/90 text-slate-900 hover:bg-white border-0 shadow-lg px-3 py-1">
                        Offline
                      </Badge>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {subscriptionTier === "enterprise" && (
        <div className="border-t pt-8 mt-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">AI Recommendations & Food Graph</h3>
              <p className="text-xs text-muted-foreground">Culinary reasoning & seasonal food pairings advisor.</p>
            </div>
          </div>
          <FoodGraphReasoning restaurantId={restaurantId} menuItems={menuItems} />
        </div>
      )}

      {editingItem && (
        <EditMenuItemDialog
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
          item={editingItem}
          categories={categories}
          restaurantId={restaurantId}
        />
      )}
    </motion.div>
  );
}

export default MenuTab;
