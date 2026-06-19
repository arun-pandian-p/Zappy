import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  Save,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnsplashPicker } from "@/components/admin/UnsplashPicker";
import { StorageImagePicker } from "@/components/admin/StorageImagePicker";
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
import { generateFoodImage } from "@/services/imageGenService";
import { executeOpenAIChatCall } from "@/services/openaiService";
import { useRestaurantDetails } from "@/hooks/useRestaurant";
import { sanitize } from "@/utils/sanitize";

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

  const [newItem, setNewItem] = useState({
    name: "",
    short_description: "",
    full_description: "",
    price: "",
    category: categories[0]?.name || "Starters",
    image_url: "",
    is_vegetarian: false,
    is_popular: false,
    prep_time_minutes: "15",
    tags: "",
  });

  const createMenuItem = useCreateMenuItem();
  const deleteMenuItem = useDeleteMenuItem();
  const toggleAvailability = useToggleMenuItemAvailability();

  const [imageSource, setImageSource] = useState<"ai" | "unsplash" | "upload" | "storage">("ai");
  const [isFeaturedItem, setIsFeaturedItem] = useState(false);
  const [generatingAIImage, setGeneratingAIImage] = useState(false);
  const [isEnrichingText, setIsEnrichingText] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  
  const [isCompletingMenu, setIsCompletingMenu] = useState(false);
  const [completionStatus, setCompletionStatus] = useState<"Scanning" | "Generating" | "Saving" | "">("");
  const [completionProgress, setCompletionProgress] = useState({ current: 0, total: 0 });
  const [failedItems, setFailedItems] = useState<{item: any, reason: string}[]>([]);

  const runCompletion = async (itemsList: any[]) => {
    setIsCompletingMenu(true);
    setCompletionStatus("Scanning");
    
    await new Promise(r => setTimeout(r, 500));
    
    const itemsToProcess = itemsList.filter(item => 
      !item.description || item.description.length < 20 || !item.image_url || !item.tags || item.tags.length === 0
    );

    if (itemsToProcess.length === 0) {
      toast({ title: "Menu is already complete!", description: "No missing data found." });
      setIsCompletingMenu(false);
      setCompletionStatus("");
      return;
    }

    setCompletionProgress({ current: 0, total: itemsToProcess.length });
    setFailedItems([]);
    
    let imagesGenerated = 0;
    let descriptionsGenerated = 0;
    let currentFailed: {item: any, reason: string}[] = [];

    const { enrichMenuItem } = await import("@/services/imageDiscoveryService");
    const { supabase } = await import("@/integrations/supabase/client");

    for (let i = 0; i < itemsToProcess.length; i++) {
      const item = itemsToProcess[i];
      setCompletionStatus("Generating");
      setCompletionProgress({ current: i + 1, total: itemsToProcess.length });
      
      try {
        const categoryName = item.category?.name || categories[0]?.name || "Main Course";
        const enriched = await enrichMenuItem(item.name, categoryName, restaurantId);
        
        setCompletionStatus("Saving");
        
        const newImageUrl = item.image_url || enriched.imageUrl;
        const newDescription = (item.description && item.description.length >= 20) ? item.description : (enriched.mediumDescription || enriched.shortDescription);
        
        if (!item.image_url && newImageUrl) imagesGenerated++;
        if ((!item.description || item.description.length < 20) && newDescription) descriptionsGenerated++;

        await supabase
          .from("menu_items")
          .update({
            image_url: newImageUrl,
            description: newDescription,
            tags: item.tags?.length ? item.tags : enriched.tags
          })
          .eq("id", item.id);
          
      } catch (e: any) {
        console.error(`Failed to complete item ${item.name}:`, e);
        currentFailed.push({ item, reason: e.message });
      }
    }
    
    queryClient.invalidateQueries({ queryKey: ["menuItems", restaurantId] });
    setFailedItems(currentFailed);
    setIsCompletingMenu(false);
    setCompletionStatus("");

    toast({
      title: "Menu Completion Report",
      description: (
        <div className="mt-2 space-y-1">
          <p>Total Items Processed: {itemsToProcess.length}</p>
          <p>Images Generated: {imagesGenerated}</p>
          <p>Descriptions Generated: {descriptionsGenerated}</p>
          <p>Failed: {currentFailed.length}</p>
          {currentFailed.length > 0 && (
            <div className="mt-2 text-red-500 text-xs line-clamp-3">
              Failed: {currentFailed.map(f => f.item.name).join(", ")}
            </div>
          )}
        </div>
      ),
      duration: 10000,
    });
  };

  const handleCompleteMenu = () => runCompletion(menuItems);
  const handleFixMissing = () => runCompletion(failedItems.map(f => f.item));

  const handleAIEnrich = async () => {
    if (!newItem.name) {
      toast({ title: "Item Name Required", description: "Please enter an item name to enrich.", variant: "destructive" });
      return;
    }
    setIsEnrichingText(true);
    toast({ title: "AI Enriching...", description: "Generating descriptions and tags." });

    try {
      const prompt = `You are a culinary expert writing copy for a restaurant menu.
Item: ${newItem.name}
Category: ${newItem.category}

Respond with ONLY a valid JSON object containing:
- short_description: A mouth-watering, concise 50-80 character description.
- full_description: A detailed 120-200 character description highlighting ingredients and flavor profile.
- prep_time_minutes: Recommended prep time as an integer (e.g. 15).
- is_popular: boolean indicating if this is typically a popular dish.
- tags: Array of 3-5 string tags (e.g., ["Spicy", "Chef Special"]).
`;
      const responseText = await executeOpenAIChatCall(
        restaurantId, 
        "menu_description", 
        [{ role: "user", content: prompt }],
        { type: "json_object" }
      );
      const data = JSON.parse(responseText);

      setNewItem(prev => ({
        ...prev,
        short_description: prev.short_description || data.short_description || "",
        full_description: prev.full_description || data.full_description || "",
        prep_time_minutes: prev.prep_time_minutes || String(data.prep_time_minutes || 15),
        is_popular: prev.is_popular || data.is_popular || false,
        tags: prev.tags || (data.tags ? data.tags.join(", ") : ""),
      }));

      toast({ title: "AI content generated successfully" });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    } finally {
      setIsEnrichingText(false);
    }
  };

  const handleAIGenerateImage = async () => {
    if (!newItem.name) {
      toast({ title: "Please enter item name first", variant: "destructive" });
      return;
    }
    setGeneratingAIImage(true);
    toast({ title: "Generating Image...", description: "Creating a realistic food photo." });
    try {
      const url = await generateFoodImage(
        newItem.name,
        newItem.category || (categories[0]?.name || "Main Course"),
        restaurantId,
        isFeaturedItem ? "medium" : "low"
      );
      setNewItem(prev => ({ ...prev, image_url: url }));
      toast({ title: "AI Image Generated", description: "Image attached successfully." });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Image Generation Failed", description: err.message, variant: "destructive" });
    } finally {
      setGeneratingAIImage(false);
    }
  };

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
      const cleanName = sanitize(newItem.name);
      let combinedDesc = sanitize(newItem.short_description);
      if (newItem.full_description) {
        combinedDesc += "\n\n" + sanitize(newItem.full_description);
      }

      await createMenuItem.mutateAsync({
        restaurant_id: restaurantId,
        name: cleanName,
        description: combinedDesc || undefined,
        price: parseFloat(newItem.price),
        category_id: category?.id,
        image_url: newItem.image_url || undefined,
        is_vegetarian: newItem.is_vegetarian,
        is_popular: newItem.is_popular,
        prep_time_minutes: parseInt(newItem.prep_time_minutes) || 15,
        is_available: true,
        tags: newItem.tags.split(",").map(t => t.trim()).filter(Boolean),
      });
      
      toast({
        title: "Item Added",
        description: `${cleanName} has been added to the menu.`,
      });
      
      setNewItem({
        name: "",
        short_description: "",
        full_description: "",
        price: "",
        category: categories[0]?.name || "Starters",
        image_url: "",
        is_vegetarian: false,
        is_popular: false,
        prep_time_minutes: "15",
        tags: "",
      });
      setAddDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add menu item.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this item?")) return;
    
    try {
      console.log("Deleting item:", id);
      const res = await deleteMenuItem.mutateAsync({ id, restaurantId });
      console.log("Delete response:", res);
      
      queryClient.invalidateQueries();
      
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
          {failedItems.length > 0 && !isCompletingMenu && (
            <Button 
              variant="outline" 
              className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl px-4 shadow-sm"
              onClick={handleFixMissing}
            >
              Fix Missing Items ({failedItems.length})
            </Button>
          )}

          <Button 
            variant="secondary" 
            className="bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-200 shadow-sm rounded-xl px-4 min-w-[160px]"
            onClick={handleCompleteMenu}
            disabled={isCompletingMenu}
          >
            {isCompletingMenu ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {completionStatus} {completionProgress.current}/{completionProgress.total}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
                ✨ AI Enhance
              </>
            )}
          </Button>

          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl px-6">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-white/20 shadow-2xl rounded-2xl" aria-describedby="add-category-description">
              <DialogHeader className="pb-4 border-b">
                <DialogTitle className="text-xl">Add Menu Item</DialogTitle>
                <DialogDescription>Create a new dish with AI enriched content.</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-12 space-y-2">
                    <Label>Item Name *</Label>
                    <div className="flex gap-2">
                      <Input className="flex-1" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="e.g., Butter Chicken" />
                      <Button 
                        onClick={handleAIEnrich} 
                        disabled={isEnrichingText}
                        className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white border-0"
                      >
                        {isEnrichingText ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        AI Enrich
                      </Button>
                    </div>
                  </div>

                  <div className="md:col-span-12 space-y-4">
                    <div className="space-y-1">
                      <Label>Short Description *</Label>
                      <Textarea 
                        value={newItem.short_description} 
                        onChange={(e) => setNewItem({ ...newItem, short_description: e.target.value })}
                        maxLength={80}
                        className="resize-none h-16"
                        placeholder="A concise, mouth-watering description."
                      />
                      <p className="text-[10px] text-right text-muted-foreground">{newItem.short_description.length}/80</p>
                    </div>
                    <div className="space-y-1">
                      <Label>Full Description</Label>
                      <Textarea 
                        value={newItem.full_description} 
                        onChange={(e) => setNewItem({ ...newItem, full_description: e.target.value })}
                        maxLength={200}
                        className="resize-none h-24"
                        placeholder="Highlight ingredients and flavor profile here."
                      />
                      <p className="text-[10px] text-right text-muted-foreground">{newItem.full_description.length}/200</p>
                    </div>
                  </div>

                  <div className="md:col-span-6 space-y-2">
                    <Label>Price ({currencySymbol}) *</Label>
                    <Input type="number" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} placeholder="299" />
                  </div>
                  
                  <div className="md:col-span-6 space-y-2">
                    <Label>Category</Label>
                    <Select value={newItem.category} onValueChange={(v) => setNewItem({ ...newItem, category: v })}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-6 space-y-2">
                    <Label>Prep Time (min)</Label>
                    <Input type="number" value={newItem.prep_time_minutes} onChange={(e) => setNewItem({ ...newItem, prep_time_minutes: e.target.value })} />
                  </div>

                  <div className="md:col-span-6 space-y-2">
                    <Label>Tags (comma separated)</Label>
                    <Input
                      value={newItem.tags}
                      onChange={(e) => setNewItem({ ...newItem, tags: e.target.value })}
                      placeholder="e.g. Spicy, Vegan"
                    />
                  </div>

                  <div className="md:col-span-12 space-y-3 pt-4 border-t">
                    <Label>Item Image</Label>
                    <Tabs value={imageSource} onValueChange={(v) => setImageSource(v as any)} className="w-full">
                      <TabsList className="grid grid-cols-4 w-full bg-muted/50 p-1 rounded-xl">
                        <TabsTrigger value="ai" className="rounded-lg text-xs gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
                          <Sparkles className="w-3 h-3" /> AI Generate
                        </TabsTrigger>
                        <TabsTrigger value="unsplash" className="rounded-lg text-xs">🔍 Unsplash</TabsTrigger>
                        <TabsTrigger value="upload" className="rounded-lg text-xs">⬆ Upload</TabsTrigger>
                        <TabsTrigger value="storage" className="rounded-lg text-xs">📦 Storage</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="ai" className="mt-3 space-y-3">
                        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">High Definition Output</Label>
                            <Switch checked={isFeaturedItem} onCheckedChange={setIsFeaturedItem} />
                          </div>
                          <Button 
                            onClick={handleAIGenerateImage} 
                            disabled={!newItem.name || generatingAIImage}
                            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl shadow-lg border-0 h-10"
                          >
                            {generatingAIImage ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                            {newItem.image_url ? "Regenerate Image" : "Generate Image"}
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="unsplash" className="mt-3">
                        <UnsplashPicker
                          query={newItem.name}
                          onSelect={(url) => {
                            setNewItem({ ...newItem, image_url: url });
                            toast({ title: "Unsplash image selected!" });
                          }}
                        />
                      </TabsContent>

                      <TabsContent value="upload" className="mt-3">
                        <ImageUpload
                          currentImageUrl={newItem.image_url}
                          onImageUploaded={(url) => setNewItem({ ...newItem, image_url: url })}
                          restaurantId={restaurantId}
                          folder="menu"
                        />
                      </TabsContent>

                      <TabsContent value="storage" className="mt-3">
                        <StorageImagePicker
                          query={newItem.name}
                          currentImageUrl={newItem.image_url}
                          onSelect={(url, name) => {
                            setNewItem(prev => ({ 
                              ...prev, 
                              image_url: url,
                              name: prev.name || name || ""
                            }));
                            toast({ title: "Image selected from library!" });
                          }}
                        />
                      </TabsContent>
                    </Tabs>
                    
                    {newItem.image_url ? (
                      <div className="mt-4 rounded-xl overflow-hidden border bg-muted aspect-square max-w-[200px] mx-auto relative group">
                        <img src={newItem.image_url} alt="Item" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button size="sm" variant="destructive" onClick={() => setNewItem({ ...newItem, image_url: "" })}>Remove</Button>
                        </div>
                      </div>
                    ) : generatingAIImage ? (
                      <div className="mt-4 rounded-xl border bg-muted aspect-square max-w-[200px] mx-auto animate-pulse flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                    ) : null}
                  </div>

                  <div className="md:col-span-12 flex items-center gap-6 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Switch checked={newItem.is_vegetarian} onCheckedChange={(v) => setNewItem({ ...newItem, is_vegetarian: v })} />
                      <Label>Vegetarian</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={newItem.is_popular} onCheckedChange={(v) => setNewItem({ ...newItem, is_popular: v })} />
                      <Label>Popular Recommendation</Label>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button className="w-full h-11 rounded-xl shadow-lg" onClick={handleAddItem} disabled={createMenuItem.isPending}>
                    {createMenuItem.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Publish to Menu
                  </Button>
                </div>
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
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={selectedAdminCategory === "All" ? "default" : "outline"}
              className="rounded-full px-6"
              onClick={() => setSelectedAdminCategory("All")}
            >
              All Categories
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedAdminCategory === cat.name ? "default" : "outline"}
                className="rounded-full px-6 whitespace-nowrap"
                onClick={() => setSelectedAdminCategory(cat.name)}
              >
                {cat.name}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredMenuItems.map((item) => (
                <MenuPreviewCard 
                  key={item.id} 
                  item={item} 
                  currencySymbol={currencySymbol}
                  onEdit={() => setEditingItem(item)}
                  onDelete={() => handleDeleteItem(item.id)}
                  onToggleAvailability={(val) => handleToggleAvailability(item.id, val)}
                />
              ))}
            </AnimatePresence>
            
            {filteredMenuItems.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-3xl">
                No menu items found in this category.
              </div>
            )}
          </div>
        </div>
      </div>

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
