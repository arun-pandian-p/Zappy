import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Loader2, Gift, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { useEnterprisePromotions, useCreateEnterprisePromotion, useUpdateEnterprisePromotion, useDeleteOffer } from "@/hooks/useEnterprisePromotions";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { generateFoodImage } from "@/services/imageGenService";

interface OffersManagerProps {
  restaurantId: string;
}

export function OffersManager({ restaurantId }: OffersManagerProps) {
  const { toast } = useToast();
  const { data: offers = [], isLoading } = useEnterprisePromotions(restaurantId);
  const createOffer = useCreateEnterprisePromotion();
  const updateOffer = useUpdateEnterprisePromotion();
  const deleteOffer = useDeleteOffer();
  
  const [newOffer, setNewOffer] = useState({
    title: "",
    description: "",
    type: "percentage" as any,
    discount_value: "",
    min_order_value: "0",
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
        type: newOffer.type,
        discount_value: parseFloat(newOffer.discount_value) || 0,
        min_order_value: parseFloat(newOffer.min_order_value) || 0,
        image_url: newOffer.image_url || null,
        start_date: new Date(newOffer.start_date).toISOString(),
        end_date: new Date(newOffer.end_date).toISOString(),
        status: "pending_approval", // New campaigns go to superadmin
      });
      toast({ title: "Offer submitted for approval!" });
      setNewOffer({
        title: "",
        description: "",
        type: "percentage",
        discount_value: "",
        min_order_value: "0",
        image_url: "",
        start_date: new Date().toISOString().split("T")[0],
        end_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleToggle = async (id: string, currentStatus: string) => {
    if (currentStatus === 'pending_approval' || currentStatus === 'rejected') {
      toast({ title: "Cannot toggle", description: "This offer must be approved by the superadmin first.", variant: "destructive" });
      return;
    }
    const nextStatus = currentStatus === 'active' ? 'paused' : 'active';
    await updateOffer.mutateAsync({ id, restaurantId, updates: { status: nextStatus } });
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
            New Campaign
          </CardTitle>
          <CardDescription>Submit a promotional campaign for approval</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Campaign Title *</Label>
            <Input
              value={newOffer.title}
              onChange={(e) => setNewOffer({ ...newOffer, title: e.target.value })}
              placeholder="e.g. Weekend Special"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Discount Type</Label>
              <Select value={newOffer.type} onValueChange={(val: any) => setNewOffer({...newOffer, type: val})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="flat_discount">Flat Discount (₹)</SelectItem>
                  <SelectItem value="free_delivery">Free Delivery</SelectItem>
                  <SelectItem value="bogo">Buy 1 Get 1</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Value</Label>
              <Input
                type="number"
                value={newOffer.discount_value}
                onChange={(e) => setNewOffer({ ...newOffer, discount_value: e.target.value })}
                placeholder={newOffer.type === 'percentage' ? 'e.g. 20' : 'e.g. 150'}
                disabled={newOffer.type === 'free_delivery' || newOffer.type === 'bogo'}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Minimum Order Value (₹)</Label>
            <Input
              type="number"
              value={newOffer.min_order_value}
              onChange={(e) => setNewOffer({ ...newOffer, min_order_value: e.target.value })}
              placeholder="0 for no minimum"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Campaign Banner</Label>
              {newOffer.title && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-[10px] gap-1 text-primary hover:text-primary"
                  onClick={async () => {
                    toast({ title: "Generating image...", description: "AI is creating a photo for " + newOffer.title });
                    const url = await generateFoodImage(newOffer.title, newOffer.description || "", restaurantId);
                    setNewOffer({ ...newOffer, image_url: url });
                    toast({ title: "Image ready!" });
                  }}
                >
                  <Sparkles className="w-3 h-3" />
                  AI Generate
                </Button>
              )}
            </div>
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
            Submit for Approval
          </Button>
        </CardContent>
      </Card>

      {/* Offers List */}
      <div className="lg:col-span-2">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Campaign Management ({offers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {offers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No campaigns yet. Create your first promotional offer!
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
                        className="w-16 h-10 rounded-md object-cover flex-shrink-0 bg-muted"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "https://placehold.co/100x60/png?text=Offer";
                        }}
                      />
                    ) : (
                      <div className="w-16 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                        <Gift className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm truncate">{offer.title}</p>
                        {offer.status === 'pending_approval' && <Badge variant="outline" className="text-[10px] text-amber-600 bg-amber-50">Pending Review</Badge>}
                        {offer.status === 'active' && <Badge variant="outline" className="text-[10px] text-green-600 bg-green-50">Active</Badge>}
                        {offer.status === 'rejected' && <Badge variant="destructive" className="text-[10px]">Rejected</Badge>}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px] font-semibold">
                           {offer.type === 'percentage' ? `${offer.discount_value}% OFF` : 
                            offer.type === 'flat_discount' ? `₹${offer.discount_value} OFF` :
                            offer.type === 'bogo' ? 'BOGO' : 'Free Delivery'}
                        </Badge>
                        {offer.min_order_value > 0 && (
                          <span className="text-[10px] text-muted-foreground">Min ₹{offer.min_order_value}</span>
                        )}
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {format(new Date(offer.start_date), "MMM d")} - {format(new Date(offer.end_date), "MMM d")}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                       <Switch
                        checked={offer.status === 'active'}
                        disabled={offer.status === 'pending_approval' || offer.status === 'rejected'}
                        onCheckedChange={() => handleToggle(offer.id, offer.status)}
                       />
                      {offer.status === 'pending_approval' && (
                        <span className="text-[9px] text-muted-foreground text-center leading-tight max-w-[50px]">Requires Approval</span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive/50 hover:text-destructive transition-colors mt-1"
                        onClick={async () => {
                          if (confirm("Are you sure you want to delete this campaign?")) {
                            try {
                              await deleteOffer.mutateAsync({ id: offer.id, restaurantId });
                              toast({ title: "Campaign deleted" });
                            } catch (err: any) {
                              toast({ title: "Error", description: err.message, variant: "destructive" });
                            }
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
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
