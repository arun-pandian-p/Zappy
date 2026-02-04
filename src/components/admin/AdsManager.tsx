import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Plus,
  Trash2,
  Edit2,
  Image as ImageIcon,
  Eye,
  EyeOff,
  ExternalLink,
  BarChart3,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAds, useCreateAd, useUpdateAd, useDeleteAd } from "@/hooks/useAds";
import { useToast } from "@/hooks/use-toast";

interface AdsManagerProps {
  restaurantId?: string;
}

interface AdFormData {
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
  starts_at: string;
  ends_at: string;
}

const defaultFormData: AdFormData = {
  title: "",
  description: "",
  image_url: "",
  link_url: "",
  is_active: true,
  starts_at: "",
  ends_at: "",
};

export function AdsManager({ restaurantId }: AdsManagerProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AdFormData>(defaultFormData);

  const { data: ads = [], isLoading } = useAds();
  const createAd = useCreateAd();
  const updateAd = useUpdateAd();
  const deleteAd = useDeleteAd();

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (ad: typeof ads[0]) => {
    setEditingId(ad.id);
    setFormData({
      title: ad.title,
      description: ad.description || "",
      image_url: ad.image_url || "",
      link_url: ad.link_url || "",
      is_active: ad.is_active || false,
      starts_at: ad.starts_at ? ad.starts_at.split("T")[0] : "",
      ends_at: ad.ends_at ? ad.ends_at.split("T")[0] : "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    const data = {
      ...formData,
      starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : null,
      ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null,
    };

    try {
      if (editingId) {
        await updateAd.mutateAsync({ id: editingId, updates: data });
        toast({ title: "Ad updated successfully" });
      } else {
        await createAd.mutateAsync(data);
        toast({ title: "Ad created successfully" });
      }
      setIsDialogOpen(false);
      setFormData(defaultFormData);
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAd.mutateAsync(id);
      toast({ title: "Ad deleted successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      await updateAd.mutateAsync({
        id,
        updates: { is_active: !currentState },
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ads Management</h2>
          <p className="text-muted-foreground">
            Create and manage promotional campaigns
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create Ad
        </Button>
      </div>

      {/* Ads Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : ads.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-1">No ads yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Create your first promotional campaign
            </p>
            <Button onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Create Ad
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ads.map((ad, index) => (
            <motion.div
              key={ad.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden">
                {/* Image */}
                <div className="aspect-video relative bg-muted">
                  {ad.image_url ? (
                    <img
                      src={ad.image_url}
                      alt={ad.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge variant={ad.is_active ? "default" : "secondary"}>
                      {ad.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1 truncate">{ad.title}</h3>
                  {ad.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {ad.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {ad.impressions || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <ExternalLink className="w-4 h-4" />
                      {ad.clicks || 0}
                    </span>
                    {ad.impressions && ad.impressions > 0 && (
                      <span className="flex items-center gap-1">
                        <BarChart3 className="w-4 h-4" />
                        {((ad.clicks || 0) / ad.impressions * 100).toFixed(1)}% CTR
                      </span>
                    )}
                  </div>

                  {/* Dates */}
                  {(ad.starts_at || ad.ends_at) && (
                    <p className="text-xs text-muted-foreground mb-3">
                      {ad.starts_at && `From ${format(new Date(ad.starts_at), "MMM d")}`}
                      {ad.starts_at && ad.ends_at && " - "}
                      {ad.ends_at && `Until ${format(new Date(ad.ends_at), "MMM d")}`}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <Switch
                      checked={ad.is_active || false}
                      onCheckedChange={() => handleToggleActive(ad.id, ad.is_active || false)}
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(ad)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Ad?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete
                              the ad campaign.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(ad.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Ad" : "Create New Ad"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Ad title"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Ad description"
              />
            </div>

            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                value={formData.image_url}
                onChange={(e) =>
                  setFormData({ ...formData, image_url: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Link URL (CTA)</Label>
              <Input
                value={formData.link_url}
                onChange={(e) =>
                  setFormData({ ...formData, link_url: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.starts_at}
                  onChange={(e) =>
                    setFormData({ ...formData, starts_at: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.ends_at}
                  onChange={(e) =>
                    setFormData({ ...formData, ends_at: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
              <Label>Active</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createAd.isPending || updateAd.isPending}
              >
                {(createAd.isPending || updateAd.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingId ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdsManager;
