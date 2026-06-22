import { useState, useRef } from "react";
import {
  Plus,
  Trash2,
  GripVertical,
  Loader2,
  ImageIcon,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  type Category,
} from "@/hooks/useCategories";

interface CategoryManagerProps {
  restaurantId: string;
}

/** Tiny inline image uploader — no crop, just direct upload to menu-images bucket */
function CategoryImageUpload({
  categoryId,
  restaurantId,
  currentUrl,
  onUploaded,
}: {
  categoryId: string;
  restaurantId: string;
  currentUrl: string | null;
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${restaurantId}/categories/${categoryId}-${Date.now()}.${ext}`;

      const { data, error } = await supabase.storage
        .from("menu-images")
        .upload(path, file, { cacheControl: "3600", upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("menu-images")
        .getPublicUrl(data.path);
      const url = urlData.publicUrl + `?t=${Date.now()}`;
      onUploaded(url);
      toast({ title: "Image uploaded successfully" });
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="relative group shrink-0">
      <input
        type="file"
        ref={fileRef}
        onChange={handleFile}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-dashed border-border hover:border-primary transition-all bg-muted/55 hover:bg-primary/5 flex items-center justify-center"
        title="Upload category image"
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : currentUrl ? (
          <>
            <img
              src={currentUrl}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-3 h-3 text-white" />
            </div>
          </>
        ) : (
          <ImageIcon className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}

export const CategoryManager = ({ restaurantId }: CategoryManagerProps) => {
  const { data: categories = [], isLoading } = useCategories(restaurantId);
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const { toast } = useToast();

  const [newCategoryName, setNewCategoryName] = useState("");

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      toast({
        title: "Enter a name",
        description: "Category name is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createCategory.mutateAsync({
        restaurant_id: restaurantId,
        name,
        display_order: categories.length,
      });
      setNewCategoryName("");
      toast({
        title: "Category added",
        description: `"${name}" has been created.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create category.",
        variant: "destructive",
      });
    }
  };



  const handleDelete = async (category: Category) => {
    if (
      !confirm(
        `Are you sure you want to delete "${category.name}"? This will affect all menu items in this category.`
      )
    ) {
      return;
    }

    try {
      await deleteCategory.mutateAsync({
        id: category.id,
        restaurantId,
      });
      toast({
        title: "Category deleted",
        description: `"${category.name}" has been removed.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete category.",
        variant: "destructive",
      });
    }
  };

  const handleImageUploaded = async (categoryId: string, url: string) => {
    try {
      await updateCategory.mutateAsync({
        id: categoryId,
        updates: { image_url: url },
      });
    } catch (error: any) {
      toast({
        title: "Error saving image",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <GripVertical className="w-5 h-5" />
          Categories ({categories.length})
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5 animate-pulse">
          Click the image box on each category to upload a photo — shown on the customer menu.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new category */}
        <div className="flex gap-2">
          <Input
            placeholder="New category name..."
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
          />
          <Button
            onClick={handleAddCategory}
            disabled={createCategory.isPending}
            size="icon"
          >
            {createCategory.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Category list */}
        <div className="space-y-2">
          {categories.map((category, index) => (
            <div
              key={category.id}
              className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <Badge
                variant="outline"
                className="w-6 h-6 flex items-center justify-center p-0 shrink-0"
              >
                {index + 1}
              </Badge>

              {/* Category image upload */}
              <CategoryImageUpload
                categoryId={category.id}
                restaurantId={restaurantId}
                currentUrl={category.image_url ?? null}
                onUploaded={(url) => handleImageUploaded(category.id, url)}
              />

              {/* Category name and delete button */}
              <>
                <span className="flex-1 font-medium">{category.name}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(category)}
                  disabled={deleteCategory.isPending}
                >
                  {deleteCategory.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </>
            </div>
          ))}

          {categories.length === 0 && (
            <p className="text-center py-4 text-muted-foreground text-sm">
              No categories yet. Add one above.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
