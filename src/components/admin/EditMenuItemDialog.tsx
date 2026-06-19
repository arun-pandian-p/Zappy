import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { UnsplashPicker } from "@/components/admin/UnsplashPicker";
import { StorageImagePicker } from "@/components/admin/StorageImagePicker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUpdateMenuItem, type MenuItem, type Category } from "@/hooks/useMenuItems";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Sparkles, Upload } from "lucide-react";
import { sanitize } from "@/utils/sanitize";
import { generateFoodImage } from "@/services/imageGenService";
import { executeOpenAIChatCall } from "@/services/openaiService";

interface EditMenuItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MenuItem & { category?: Pick<Category, "id" | "name"> | null };
  categories: Category[];
  restaurantId: string;
}

export function EditMenuItemDialog({ open, onOpenChange, item, categories, restaurantId }: EditMenuItemDialogProps) {
  const { toast } = useToast();
  const updateMenuItem = useUpdateMenuItem();

  const [form, setForm] = useState({
    name: "",
    short_description: "",
    full_description: "",
    price: "",
    category_id: "",
    image_url: "",
    is_vegetarian: false,
    is_popular: false,
    prep_time_minutes: "15",
    tags: "",
  });

  const [imageSource, setImageSource] = useState<"ai" | "unsplash" | "upload" | "storage">("ai");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isEnrichingText, setIsEnrichingText] = useState(false);
  const [isFeaturedItem, setIsFeaturedItem] = useState(false);

  useEffect(() => {
    if (item) {
      const descParts = (item.description || "").split("\n\n");
      const shortDesc = descParts[0] || "";
      const fullDesc = descParts.slice(1).join("\n\n") || "";

      setForm({
        name: item.name || "",
        short_description: shortDesc,
        full_description: fullDesc,
        price: String(item.price || ""),
        category_id: item.category_id || "",
        image_url: item.image_url || "",
        is_vegetarian: item.is_vegetarian || false,
        is_popular: (item as any).is_popular || false,
        prep_time_minutes: String(item.prep_time_minutes || 15),
        tags: item.tags ? item.tags.join(", ") : "",
      });

      if (!item.image_url) {
        setImageSource("ai");
      } else {
        setImageSource("upload");
      }
    }
  }, [item]);

  const handleAIEnrich = async () => {
    if (!form.name) {
      toast({ title: "Item Name Required", description: "Please enter an item name to enrich.", variant: "destructive" });
      return;
    }
    setIsEnrichingText(true);
    toast({ title: "AI Enriching...", description: "Generating descriptions and tags." });

    try {
      const categoryName = categories.find(c => c.id === form.category_id)?.name || "General";
      const prompt = `You are a culinary expert writing copy for a restaurant menu.
Item: ${form.name}
Category: ${categoryName}

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

      setForm(prev => ({
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
    if (!form.name) {
      toast({ title: "Item Name Required", description: "Please enter an item name first.", variant: "destructive" });
      return;
    }
    setIsGeneratingImage(true);
    toast({ title: "Generating Image...", description: "Creating a realistic food photo." });
    try {
      const categoryName = categories.find(c => c.id === form.category_id)?.name || "General";
      const url = await generateFoodImage(form.name, categoryName, restaurantId, isFeaturedItem ? "medium" : "low");
      setForm(prev => ({ ...prev, image_url: url }));
      toast({ title: "AI Image Generated", description: "Image attached successfully." });
    } catch (err: any) {
      toast({ title: "Image Generation Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.short_description) {
      toast({ title: "Missing Fields", description: "Name, price, and short description are required.", variant: "destructive" });
      return;
    }

    try {
      const cleanName = sanitize(form.name);
      let combinedDesc = sanitize(form.short_description);
      if (form.full_description) {
        combinedDesc += "\n\n" + sanitize(form.full_description);
      }

      await updateMenuItem.mutateAsync({
        id: item.id,
        updates: {
          name: cleanName,
          description: combinedDesc,
          price: parseFloat(form.price),
          category_id: form.category_id || null,
          image_url: form.image_url || null,
          is_vegetarian: form.is_vegetarian,
          prep_time_minutes: parseInt(form.prep_time_minutes) || 15,
          tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
        },
      });
      toast({ title: "Item Updated", description: `${cleanName} has been updated.` });
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update item.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-white/20 shadow-2xl rounded-2xl">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-xl">Edit Menu Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-12 space-y-2">
              <Label>Item Name *</Label>
              <div className="flex gap-2">
                <Input className="flex-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
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
                  value={form.short_description} 
                  onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                  maxLength={80}
                  className="resize-none h-16"
                />
                <p className="text-[10px] text-right text-muted-foreground">{form.short_description.length}/80</p>
              </div>
              <div className="space-y-1">
                <Label>Full Description</Label>
                <Textarea 
                  value={form.full_description} 
                  onChange={(e) => setForm({ ...form, full_description: e.target.value })}
                  maxLength={200}
                  className="resize-none h-24"
                />
                <p className="text-[10px] text-right text-muted-foreground">{form.full_description.length}/200</p>
              </div>
            </div>

            <div className="md:col-span-6 space-y-2">
              <Label>Price *</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            
            <div className="md:col-span-6 space-y-2">
              <Label>Category</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-6 space-y-2">
              <Label>Prep Time (min)</Label>
              <Input type="number" value={form.prep_time_minutes} onChange={(e) => setForm({ ...form, prep_time_minutes: e.target.value })} />
            </div>

            <div className="md:col-span-6 space-y-2">
              <Label>Tags (comma separated)</Label>
              <Input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
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
                      disabled={!form.name || isGeneratingImage}
                      className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl shadow-lg border-0 h-10"
                    >
                      {isGeneratingImage ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                      {form.image_url ? "Regenerate Image" : "Generate Image"}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="unsplash" className="mt-3">
                  <UnsplashPicker
                    query={form.name}
                    onSelect={(url) => {
                      setForm({ ...form, image_url: url });
                      toast({ title: "Unsplash image selected!" });
                    }}
                  />
                </TabsContent>

                <TabsContent value="upload" className="mt-3">
                  <ImageUpload
                    currentImageUrl={form.image_url}
                    onImageUploaded={(url) => setForm({ ...form, image_url: url })}
                    restaurantId={restaurantId}
                    folder="menu"
                  />
                </TabsContent>

                <TabsContent value="storage" className="mt-3">
                  <StorageImagePicker
                    query={form.name}
                    currentImageUrl={form.image_url}
                    onSelect={(url, name) => {
                      setForm(prev => ({ 
                        ...prev, 
                        image_url: url,
                        name: prev.name || name || ""
                      }));
                      toast({ title: "Image selected from library!" });
                    }}
                  />
                </TabsContent>
              </Tabs>
              
              {form.image_url ? (
                <div className="mt-4 rounded-xl overflow-hidden border bg-muted aspect-square max-w-[200px] mx-auto relative group">
                  <img src={form.image_url} alt="Item" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button size="sm" variant="destructive" onClick={() => setForm({ ...form, image_url: "" })}>Remove</Button>
                  </div>
                </div>
              ) : isGeneratingImage ? (
                <div className="mt-4 rounded-xl border bg-muted aspect-square max-w-[200px] mx-auto animate-pulse flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-muted-foreground/30" />
                </div>
              ) : null}
            </div>

            <div className="md:col-span-12 flex items-center gap-6 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_vegetarian} onCheckedChange={(v) => setForm({ ...form, is_vegetarian: v })} />
                <Label>Vegetarian</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_popular} onCheckedChange={(v) => setForm({ ...form, is_popular: v })} />
                <Label>Popular Recommendation</Label>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button className="w-full h-11 rounded-xl shadow-lg" onClick={handleSave} disabled={updateMenuItem.isPending}>
              {updateMenuItem.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
