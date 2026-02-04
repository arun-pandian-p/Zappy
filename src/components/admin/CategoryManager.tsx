import { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, GripVertical, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  useCategories, 
  useCreateCategory, 
  useUpdateCategory, 
  useDeleteCategory,
  type Category 
} from '@/hooks/useCategories';

interface CategoryManagerProps {
  restaurantId: string;
}

export const CategoryManager = ({ restaurantId }: CategoryManagerProps) => {
  const { data: categories = [], isLoading } = useCategories(restaurantId);
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const { toast } = useToast();

  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      toast({
        title: 'Enter a name',
        description: 'Category name is required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createCategory.mutateAsync({
        restaurant_id: restaurantId,
        name,
        display_order: categories.length,
      });
      setNewCategoryName('');
      toast({
        title: 'Category added',
        description: `"${name}" has been created.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create category.',
        variant: 'destructive',
      });
    }
  };

  const handleStartEdit = (category: Category) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    const name = editingName.trim();
    if (!name) {
      toast({
        title: 'Enter a name',
        description: 'Category name cannot be empty.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateCategory.mutateAsync({
        id: editingId,
        updates: { name },
      });
      setEditingId(null);
      setEditingName('');
      toast({
        title: 'Category updated',
        description: 'Changes have been saved.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update category.',
        variant: 'destructive',
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"? This will affect all menu items in this category.`)) {
      return;
    }

    try {
      await deleteCategory.mutateAsync({
        id: category.id,
        restaurantId,
      });
      toast({
        title: 'Category deleted',
        description: `"${category.name}" has been removed.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete category.',
        variant: 'destructive',
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
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new category */}
        <div className="flex gap-2">
          <Input
            placeholder="New category name..."
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
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
              <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                {index + 1}
              </Badge>

              {editingId === category.id ? (
                <>
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1 h-8"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={handleSaveEdit}
                    disabled={updateCategory.isPending}
                  >
                    {updateCategory.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={handleCancelEdit}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 font-medium">{category.name}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => handleStartEdit(category)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
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
              )}
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
