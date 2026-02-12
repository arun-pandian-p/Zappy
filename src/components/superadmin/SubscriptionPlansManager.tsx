import { useState } from 'react';
import { Loader2, Plus, Save, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';

export function SubscriptionPlansManager() {
  const { toast } = useToast();
  const { plans, isLoading, createPlan, updatePlan, deletePlan } = useSubscriptionPlans();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: '', tier: 'free' as 'free' | 'pro' | 'enterprise',
    price_monthly: 0, price_yearly: 0, max_tables: 1, max_orders_per_month: 50,
  });

  const handleCreate = () => {
    if (!form.name) { toast({ title: 'Name required', variant: 'destructive' }); return; }
    createPlan.mutate(form, {
      onSuccess: () => { toast({ title: 'Plan Created' }); setShowAdd(false); setForm({ name: '', tier: 'free', price_monthly: 0, price_yearly: 0, max_tables: 1, max_orders_per_month: 50 }); },
      onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
    });
  };

  const tierColors: Record<string, string> = { free: 'bg-muted text-muted-foreground', pro: 'bg-primary/10 text-primary', enterprise: 'bg-amber-100 text-amber-700' };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div><CardTitle>Subscription Plans</CardTitle><CardDescription>Manage platform subscription tiers.</CardDescription></div>
          <Button onClick={() => setShowAdd(!showAdd)}><Plus className="w-4 h-4 mr-2" />Add Plan</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAdd && (
          <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Basic Plan" /></div>
              <div className="space-y-2">
                <Label>Tier *</Label>
                <Select value={form.tier} onValueChange={(v: any) => setForm({ ...form, tier: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Monthly Price</Label><Input type="number" value={form.price_monthly} onChange={(e) => setForm({ ...form, price_monthly: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Yearly Price</Label><Input type="number" value={form.price_yearly} onChange={(e) => setForm({ ...form, price_yearly: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Max Tables</Label><Input type="number" value={form.max_tables} onChange={(e) => setForm({ ...form, max_tables: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Max Orders/Month</Label><Input type="number" value={form.max_orders_per_month} onChange={(e) => setForm({ ...form, max_orders_per_month: Number(e.target.value) })} /></div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={createPlan.isPending}>{createPlan.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}Create</Button>
              <Button variant="outline" onClick={() => setShowAdd(false)}><X className="w-4 h-4 mr-2" />Cancel</Button>
            </div>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Monthly</TableHead>
              <TableHead>Yearly</TableHead>
              <TableHead>Tables</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell><Badge className={tierColors[p.tier] || ''}>{p.tier}</Badge></TableCell>
                <TableCell>₹{p.price_monthly}</TableCell>
                <TableCell>{p.price_yearly ? `₹${p.price_yearly}` : '-'}</TableCell>
                <TableCell>{p.max_tables}</TableCell>
                <TableCell>{p.max_orders_per_month}</TableCell>
                <TableCell>
                  <Switch checked={p.is_active ?? true} onCheckedChange={(v) => updatePlan.mutate({ id: p.id, updates: { is_active: v } })} />
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deletePlan.mutate(p.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
