import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { useUpdateMenuItem, type MenuItem, type Category } from "@/hooks/useMenuItems";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";

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
    description: "",
    price: "",
    category_id: "",
    image_url: "",
    is_vegetarian: false,
    is_popular: false,
    prep_time_minutes: "15",
  });

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name,
        description: item.description || "",
        price: String(item.price),
        category_id: item.category_id || "",
        image_url: item.image_url || "",
        is_vegetarian: item.is_vegetarian || false,
        is_popular: item.is_popular || false,
        prep_time_minutes: String(item.prep_time_minutes || 15),
      });
    }
  }, [item]);

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast({ title: "Missing Fields", description: "Name and price are required.", variant: "destructive" });
      return;
    }

    try {
      await updateMenuItem.mutateAsync({
        id: item.id,
        updates: {
          name: form.name,
          description: form.description || null,
          price: parseFloat(form.price),
          category_id: form.category_id || null,
          image_url: form.image_url || null,
          is_vegetarian: form.is_vegetarian,
          is_popular: form.is_popular,
          prep_time_minutes: parseInt(form.prep_time_minutes) || 15,
        },
      });
      toast({ title: "Item Updated", description: `${form.name} has been updated.` });
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update item.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Menu Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Price *</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Prep Time (min)</Label>
              <Input type="number" value={form.prep_time_minutes} onChange={(e) => setForm({ ...form, prep_time_minutes: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
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
          <div className="space-y-2">
            <Label>Image</Label>
            <ImageUpload
              currentImageUrl={form.image_url}
              onImageUploaded={(url) => setForm({ ...form, image_url: url })}
              restaurantId={restaurantId}
              folder="menu"
            />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={form.is_vegetarian} onCheckedChange={(v) => setForm({ ...form, is_vegetarian: v })} />
              <Label>Vegetarian</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_popular} onCheckedChange={(v) => setForm({ ...form, is_popular: v })} />
              <Label>Popular</Label>
            </div>
          </div>
          <Button className="w-full" onClick={handleSave} disabled={updateMenuItem.isPending}>
            {updateMenuItem.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
