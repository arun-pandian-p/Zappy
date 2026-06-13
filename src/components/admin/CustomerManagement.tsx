import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { 
  Heart, Star, Gift, Phone, MapPin, Search, 
  Loader2, RefreshCw, Cake, Ticket, Coins 
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface CustomerManagementProps {
  restaurantId: string;
}

interface CustomerRecord {
  phone: string;
  name: string;
  visits: number;
  totalSpend: number;
  favoriteItems: string[];
  points: number;
}

export function CustomerManagement({ restaurantId }: CustomerManagementProps) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Loyalty Points & Offers Storage (stored in localStorage by phone number)
  const [loyaltyPoints, setLoyaltyPoints] = useState<Record<string, number>>({});
  const [pointsRate, setPointsRate] = useState(1); // 1 point per ₹100 spent

  // Dialog state
  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [rewardPointsCost, setRewardPointsCost] = useState("100");
  const [rewardCouponValue, setRewardCouponValue] = useState("50");

  useEffect(() => {
    loadInvoices();
    // Load points registry
    const saved = localStorage.getItem(`zappy_loyalty_${restaurantId}`);
    if (saved) {
      setLoyaltyPoints(JSON.parse(saved));
    }
  }, [restaurantId]);

  async function loadInvoices() {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (e: any) {
      toast({ title: "Failed to load customer data", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  // Aggregate invoices into Customer list
  const customers = useMemo((): CustomerRecord[] => {
    const map: Record<string, { name: string; visits: number; totalSpend: number; items: Record<string, number> }> = {};

    invoices.forEach(inv => {
      const phone = inv.customer_phone?.trim();
      const name = inv.customer_name?.trim() || "Guest Customer";
      if (!phone) return; // Skip if no phone number provided

      if (!map[phone]) {
        map[phone] = { name, visits: 0, totalSpend: 0, items: {} };
      }

      map[phone].visits += 1;
      map[phone].totalSpend += Number(inv.total_amount || 0);

      // Aggregate items
      try {
        const items = typeof inv.items === "string" ? JSON.parse(inv.items) : inv.items;
        if (Array.isArray(items)) {
          items.forEach((it: any) => {
            const itemName = it.name || it.item_name;
            if (itemName) {
              map[phone].items[itemName] = (map[phone].items[itemName] || 0) + (it.quantity || 1);
            }
          });
        }
      } catch (e) {
        // Ignore JSON parse error
      }
    });

    return Object.keys(map).map(phone => {
      const rec = map[phone];
      // Sort items by count
      const favs = Object.keys(rec.items).sort((a, b) => rec.items[b] - rec.items[a]).slice(0, 2);
      
      // Calculate loyalty points: check if already has points, otherwise calculate base points from spend (1 point per ₹100)
      const basePoints = Math.floor(rec.totalSpend / 100) * pointsRate;
      const points = loyaltyPoints[phone] !== undefined ? loyaltyPoints[phone] : basePoints;

      return {
        phone,
        name: rec.name,
        visits: rec.visits,
        totalSpend: rec.totalSpend,
        favoriteItems: favs.length > 0 ? favs : ["Chai / Soft Drink"],
        points
      };
    });
  }, [invoices, loyaltyPoints, pointsRate]);

  // Search filter
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
    );
  }, [customers, searchQuery]);

  // Save points helper
  const updatePoints = (phone: string, newPoints: number) => {
    const updated = { ...loyaltyPoints, [phone]: newPoints };
    setLoyaltyPoints(updated);
    localStorage.setItem(`zappy_loyalty_${restaurantId}`, JSON.stringify(updated));
  };

  // Redeem Rewards (Points -> Coupon)
  const handleRedeemReward = () => {
    if (!selectedCustomer) return;
    const cost = parseInt(rewardPointsCost) || 100;
    if (selectedCustomer.points < cost) {
      toast({ title: "Insufficient Points", description: "Customer does not have enough points.", variant: "destructive" });
      return;
    }

    const nextPoints = selectedCustomer.points - cost;
    updatePoints(selectedCustomer.phone, nextPoints);

    // Create a mock coupon in database or trigger notification
    toast({ 
      title: "Reward Redeemed!", 
      description: `₹${rewardCouponValue} discount coupon generated. Code: ZPY-${Math.random().toString(36).substring(3, 8).toUpperCase()}` 
    });
    setRewardModalOpen(false);
  };

  // Simulate Sending Birthday Offer
  const handleSendBirthdayOffer = (customer: CustomerRecord) => {
    toast({ 
      title: "Birthday Offer Sent", 
      description: `Sent birthday message with 20% discount coupon to ${customer.name} (${customer.phone}) via SMS/WhatsApp.` 
    });
    
    // Add birthday points
    updatePoints(customer.phone, customer.points + 50);
  };

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="flex justify-between items-center bg-card p-6 border rounded-3xl shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Customer CRM & Loyalty</h2>
          <p className="text-sm text-muted-foreground">Store customer spending habits, visit metrics, and manage points programs.</p>
        </div>
        <Button onClick={loadInvoices} variant="outline" className="rounded-xl gap-1.5">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Customer Directory List (Left 3 Columns) */}
        <Card className="lg:col-span-3 border-0 shadow-sm rounded-3xl bg-white dark:bg-zinc-950">
          <CardHeader className="pb-3 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
              Customer Database ({filteredCustomers.length})
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 h-9 rounded-xl"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No customer records with phone numbers found in invoices.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-center">Visits</TableHead>
                    <TableHead className="text-right">Total Spend</TableHead>
                    <TableHead>Favorite Dishes</TableHead>
                    <TableHead className="text-center">Loyalty Points</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map(cust => (
                    <TableRow key={cust.phone}>
                      <TableCell className="font-semibold text-slate-900 dark:text-white">{cust.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{cust.phone}</TableCell>
                      <TableCell className="text-center font-bold text-slate-700">{cust.visits}</TableCell>
                      <TableCell className="text-right font-mono font-bold">₹{cust.totalSpend.toFixed(0)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {cust.favoriteItems.map(item => (
                            <Badge key={item} variant="secondary" className="text-[10px] rounded-lg">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-amber-500 text-white font-bold gap-1 px-2 border-0">
                          <Coins className="w-3.5 h-3.5" />
                          {cust.points} pts
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 rounded-lg text-amber-500" 
                          onClick={() => {
                            setSelectedCustomer(cust);
                            setRewardModalOpen(true);
                          }}
                          title="Redeem Points"
                        >
                          <Gift className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 rounded-lg text-rose-500"
                          onClick={() => handleSendBirthdayOffer(cust)}
                          title="Send Birthday Campaign"
                        >
                          <Cake className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Loyalty Program Settings Panel (Right 1 Column) */}
        <div className="space-y-6">
          <Card className="border-0 shadow-sm rounded-3xl bg-white dark:bg-zinc-950">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-500" />
                Loyalty Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Points Allocation Speed</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    min="1" 
                    value={pointsRate} 
                    onChange={e => setPointsRate(parseInt(e.target.value) || 1)}
                    className="rounded-xl w-20"
                  />
                  <span className="text-xs text-muted-foreground">pts per ₹100 spent</span>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-800">Quick Incentives</h4>
                <Button 
                  onClick={() => {
                    toast({ title: "Incentive campaign launched!", description: "SMS blast scheduled for customers with > 3 visits." });
                  }} 
                  className="w-full rounded-2xl h-10 text-xs font-semibold gap-1.5"
                >
                  <Ticket className="w-4 h-4" /> SMS Blast loyal members
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Redeem Reward Modal */}
      <Dialog open={rewardModalOpen} onOpenChange={setRewardModalOpen}>
        <DialogContent className="max-w-sm rounded-3xl" aria-describedby="reward-desc">
          <DialogHeader>
            <DialogTitle>Redeem Customer Reward</DialogTitle>
            <DialogDescription id="reward-desc">
              Convert {selectedCustomer?.name}'s loyalty points into a dining coupon.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-center">
              <span className="text-xs text-amber-800 block">Available Points</span>
              <span className="text-2xl font-black text-amber-600">{selectedCustomer?.points || 0} pts</span>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Points Cost</Label>
              <Input
                type="number"
                value={rewardPointsCost}
                onChange={e => setRewardPointsCost(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Coupon Value (₹)</Label>
              <Input
                type="number"
                value={rewardCouponValue}
                onChange={e => setRewardCouponValue(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <Button onClick={handleRedeemReward} className="w-full rounded-2xl h-11 font-bold mt-2">
              Generate Reward Coupon
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
