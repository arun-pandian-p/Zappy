import { useState, useEffect } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';

export function PlatformSettings() {
  const { toast } = useToast();
  const { settings, isLoading, updateSettings } = usePlatformSettings();
  const [form, setForm] = useState({
    platform_name: '',
    logo_url: '',
    favicon_url: '',
    primary_color: '#3B82F6',
    secondary_color: '#10B981',
    email_logo_url: '',
    login_bg_url: '',
  });

  useEffect(() => {
    if (settings) {
      setForm({
        platform_name: settings.platform_name || '',
        logo_url: settings.logo_url || '',
        favicon_url: settings.favicon_url || '',
        primary_color: settings.primary_color || '#3B82F6',
        secondary_color: settings.secondary_color || '#10B981',
        email_logo_url: settings.email_logo_url || '',
        login_bg_url: settings.login_bg_url || '',
      });
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate(form, {
      onSuccess: () => toast({ title: 'Saved', description: 'Platform settings updated.' }),
      onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
    });
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Branding</CardTitle>
        <CardDescription>Configure the white-label appearance of your platform.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Platform Name</Label><Input value={form.platform_name} onChange={(e) => setForm({ ...form, platform_name: e.target.value })} /></div>
          <div className="space-y-2"><Label>Logo URL</Label><Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." /></div>
          <div className="space-y-2"><Label>Favicon URL</Label><Input value={form.favicon_url} onChange={(e) => setForm({ ...form, favicon_url: e.target.value })} placeholder="https://..." /></div>
          <div className="space-y-2"><Label>Email Header Logo</Label><Input value={form.email_logo_url} onChange={(e) => setForm({ ...form, email_logo_url: e.target.value })} placeholder="https://..." /></div>
          <div className="space-y-2"><Label>Primary Color</Label><Input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="h-10" /></div>
          <div className="space-y-2"><Label>Secondary Color</Label><Input type="color" value={form.secondary_color} onChange={(e) => setForm({ ...form, secondary_color: e.target.value })} className="h-10" /></div>
          <div className="space-y-2 md:col-span-2"><Label>Login Background URL</Label><Input value={form.login_bg_url} onChange={(e) => setForm({ ...form, login_bg_url: e.target.value })} placeholder="https://..." /></div>
        </div>
        <Button onClick={handleSave} disabled={updateSettings.isPending}>
          {updateSettings.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
}
