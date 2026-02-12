import { useState, useEffect } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useDefaultTaxSettings } from '@/hooks/useDefaultTaxSettings';

export function DefaultTaxSettings() {
  const { toast } = useToast();
  const { settings, isLoading, updateSettings } = useDefaultTaxSettings();
  const [form, setForm] = useState({
    gst_percent: 5,
    service_charge_percent: 0,
    vat_percent: 0,
    tax_mode: 'exclusive',
    currency: 'INR',
  });

  useEffect(() => {
    if (settings) {
      setForm({
        gst_percent: Number(settings.gst_percent) || 5,
        service_charge_percent: Number(settings.service_charge_percent) || 0,
        vat_percent: Number(settings.vat_percent) || 0,
        tax_mode: settings.tax_mode || 'exclusive',
        currency: settings.currency || 'INR',
      });
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate(form, {
      onSuccess: () => toast({ title: 'Saved', description: 'Default tax settings updated.' }),
      onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
    });
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Default Tax Configuration</CardTitle>
        <CardDescription>These defaults are applied when creating new tenants.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2"><Label>GST %</Label><Input type="number" value={form.gst_percent} onChange={(e) => setForm({ ...form, gst_percent: Number(e.target.value) })} /></div>
          <div className="space-y-2"><Label>Service Charge %</Label><Input type="number" value={form.service_charge_percent} onChange={(e) => setForm({ ...form, service_charge_percent: Number(e.target.value) })} /></div>
          <div className="space-y-2"><Label>VAT %</Label><Input type="number" value={form.vat_percent} onChange={(e) => setForm({ ...form, vat_percent: Number(e.target.value) })} /></div>
          <div className="space-y-2">
            <Label>Tax Mode</Label>
            <Select value={form.tax_mode} onValueChange={(v) => setForm({ ...form, tax_mode: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="inclusive">Inclusive</SelectItem>
                <SelectItem value="exclusive">Exclusive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Currency</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
        </div>
        <Button onClick={handleSave} disabled={updateSettings.isPending}>
          {updateSettings.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Defaults
        </Button>
      </CardContent>
    </Card>
  );
}
