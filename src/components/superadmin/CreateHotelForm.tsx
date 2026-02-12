import { useState } from 'react';
import { Loader2, Check, Copy, Building2, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CreateHotelFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface Credentials {
  email: string;
  username: string;
  password: string;
  login_url: string;
}

export function CreateHotelForm({ onSuccess, onCancel }: CreateHotelFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    address: '',
    cuisine_type: '',
    branch_count: '1',
    admin_email: '',
    logo_url: '',
    theme_color: '#3B82F6',
    subscription_tier: 'free' as 'free' | 'pro' | 'enterprise',
  });

  const handleSubmit = async () => {
    if (!form.name || !form.admin_email) {
      toast({ title: 'Missing Fields', description: 'Hotel name and admin email are required.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await supabase.functions.invoke('create-tenant', { body: form });
      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      setCredentials(response.data.credentials);
      toast({ title: 'Hotel Created!', description: `${form.name} has been provisioned successfully.` });
      onSuccess();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyAll = () => {
    if (!credentials) return;
    const text = `Email: ${credentials.email}\nUsername: ${credentials.username}\nPassword: ${credentials.password}\nLogin: ${credentials.login_url}`;
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Credentials copied to clipboard.' });
  };

  if (credentials) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Key className="w-5 h-5" />
            Admin Credentials Created
          </CardTitle>
          <CardDescription>Share these credentials with the hotel admin. They won't be shown again.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-background rounded-lg border">
            <div><span className="text-xs text-muted-foreground">Email</span><p className="font-mono text-sm">{credentials.email}</p></div>
            <div><span className="text-xs text-muted-foreground">Username</span><p className="font-mono text-sm">{credentials.username}</p></div>
            <div><span className="text-xs text-muted-foreground">Password</span><p className="font-mono text-sm">{credentials.password}</p></div>
            <div><span className="text-xs text-muted-foreground">Login URL</span><p className="font-mono text-sm">{credentials.login_url}</p></div>
          </div>
          <div className="flex gap-2">
            <Button onClick={copyAll} variant="outline"><Copy className="w-4 h-4 mr-2" />Copy All</Button>
            <Button onClick={onCancel}>Done</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" />Create New Hotel</CardTitle>
        <CardDescription>Fill in the details to provision a new tenant with admin credentials.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Restaurant Info */}
        <div>
          <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">Restaurant Info</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Hotel Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })} placeholder="Grand Palace" /></div>
            <div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="grand-palace" /></div>
            <div className="space-y-2"><Label>Cuisine Type</Label><Input value={form.cuisine_type} onChange={(e) => setForm({ ...form, cuisine_type: e.target.value })} placeholder="Multi-cuisine" /></div>
            <div className="space-y-2"><Label>Branch Count</Label><Input value={form.branch_count} onChange={(e) => setForm({ ...form, branch_count: e.target.value })} placeholder="1" /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 9876543210" /></div>
            <div className="space-y-2"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Main St" /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="info@hotel.com" /></div>
            <div className="space-y-2">
              <Label>Subscription</Label>
              <Select value={form.subscription_tier} onValueChange={(v: any) => setForm({ ...form, subscription_tier: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div>
          <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">Branding</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Theme Color</Label><Input type="color" value={form.theme_color} onChange={(e) => setForm({ ...form, theme_color: e.target.value })} className="h-10" /></div>
            <div className="space-y-2"><Label>Logo URL</Label><Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." /></div>
          </div>
        </div>

        {/* Admin Credentials */}
        <div>
          <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">Admin Credentials</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Admin Email *</Label><Input type="email" value={form.admin_email} onChange={(e) => setForm({ ...form, admin_email: e.target.value })} placeholder="admin@hotel.com" /></div>
            <div className="space-y-2"><Label>Auto Username</Label><Input value={form.slug ? `${form.slug.replace(/-/g, '')}_admin` : ''} disabled className="bg-muted" /></div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Password will be auto-generated (12 chars) and shown after creation.</p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
            Create Hotel & Admin
          </Button>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}
