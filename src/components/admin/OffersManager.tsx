import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Loader2, Gift } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { useOffers, useCreateOffer, useUpdateOffer, useDeleteOffer } from "@/hooks/useOffers";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface OffersManagerProps {
  restaurantId: string;
}

export function OffersManager({ restaurantId }: OffersManagerProps) {
  const { toast } = useToast();
  const { data: offers = [], isLoading } = useOffers(restaurantId);
  const createOffer = useCreateOffer();
  const updateOffer = useUpdateOffer();
  const deleteOffer = useDeleteOffer();

  const [newOffer, setNewOffer] = useState({
    title: "",
    description: "",
    discount_text: "",
    image_url: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
  });

  const handleCreate = async () => {
    if (!newOffer.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    try {
      await createOffer.mutateAsync({
        restaurant_id: restaurantId,
        title: newOffer.title,
        description: newOffer.description || null,
        discount_text: newOffer.discount_text || null,
        image_url: newOffer.image_url || null,
        linked_menu_item_id: null,
        start_date: new Date(newOffer.start_date).toISOString(),
        end_date: new Date(newOffer.end_date).toISOString(),
        is_active: true,
        sort_order: offers.length,
      });
      toast({ title: "Offer created!" });
      setNewOffer({
        title: "",
        description: "",
        discount_text: "",
        image_url: "",
        start_date: new Date().toISOString().split("T")[0],
        end_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await updateOffer.mutateAsync({ id, updates: { is_active: !isActive } });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this offer?")) return;
    await deleteOffer.mutateAsync({ id, restaurantId });
    toast({ title: "Offer deleted" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Add Offer */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            New Offer
          </CardTitle>
          <CardDescription>Create promotional banners for your menu</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              value={newOffer.title}
              onChange={(e) => setNewOffer({ ...newOffer, title: e.target.value })}
              placeholder="e.g. Weekend Special"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={newOffer.description}
              onChange={(e) => setNewOffer({ ...newOffer, description: e.target.value })}
              placeholder="Optional description"
            />
          </div>
          <div className="space-y-2">
            <Label>Discount Text</Label>
            <Input
              value={newOffer.discount_text}
              onChange={(e) => setNewOffer({ ...newOffer, discount_text: e.target.value })}
              placeholder="e.g. 20% OFF, Buy 1 Get 1"
            />
          </div>
          <div className="space-y-2">
            <Label>Image</Label>
            <ImageUpload
              currentImageUrl={newOffer.image_url}
              onImageUploaded={(url) => setNewOffer({ ...newOffer, image_url: url })}
              restaurantId={restaurantId}
              folder="offers"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={newOffer.start_date}
                onChange={(e) => setNewOffer({ ...newOffer, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={newOffer.end_date}
                onChange={(e) => setNewOffer({ ...newOffer, end_date: e.target.value })}
              />
            </div>
          </div>
          <Button className="w-full" onClick={handleCreate} disabled={createOffer.isPending}>
            {createOffer.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Create Offer
          </Button>
        </CardContent>
      </Card>

      {/* Offers List */}
      <div className="lg:col-span-2">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Active Offers ({offers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {offers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No offers yet. Create your first promotional offer!
              </div>
            ) : (
              <div className="space-y-3">
                {offers.map((offer) => (
                  <motion.div
                    key={offer.id}
                    layout
                    className="flex items-center gap-4 p-3 rounded-lg border bg-card"
                  >
                    {offer.image_url ? (
                      <img
                        src={offer.image_url}
                        alt={offer.title}
                        className="w-16 h-10 rounded-md object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                        <Gift className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{offer.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {offer.discount_text && (
                          <Badge variant="secondary" className="text-xs">{offer.discount_text}</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(offer.start_date), "MMM d")} - {format(new Date(offer.end_date), "MMM d")}
                        </span>
                      </div>
                    </div>
                    <Switch
                      checked={offer.is_active}
                      onCheckedChange={() => handleToggle(offer.id, offer.is_active)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(offer.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
