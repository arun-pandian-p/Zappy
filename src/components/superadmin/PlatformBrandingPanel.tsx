import { useState, useEffect } from 'react';
import { Loader2, Save, Lock, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';
import { useAuth } from '@/hooks/useAuth';

const CREATOR_EMAIL = 'arunpandi47777@gmail.com';

export function PlatformBrandingPanel() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { settings, isLoading, updateSettings } = usePlatformSettings();

  const isCreator = user?.email === CREATOR_EMAIL;

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
      onSuccess: () => toast({ title: 'Saved', description: 'Platform branding updated.' }),
      onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
    });
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  if (!isCreator) {
    return (
      <Card className="border-destructive/20">
        <CardContent className="p-8 text-center space-y-4">
          <Lock className="w-12 h-12 mx-auto text-muted-foreground" />
          <div>
            <h3 className="text-lg font-semibold">Platform Branding Locked</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Only the platform creator can modify branding settings.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Contact the platform creator for branding changes.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          Platform Branding
        </h2>
        <p className="text-sm text-muted-foreground">Configure the white-label appearance across all touchpoints.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identity</CardTitle>
            <CardDescription>Platform name and logos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Platform Name</Label><Input value={form.platform_name} onChange={(e) => setForm({ ...form, platform_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Logo URL</Label><Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." /></div>
            <div className="space-y-2"><Label>Favicon URL</Label><Input value={form.favicon_url} onChange={(e) => setForm({ ...form, favicon_url: e.target.value })} placeholder="https://..." /></div>
            <div className="space-y-2"><Label>Email Header Logo</Label><Input value={form.email_logo_url} onChange={(e) => setForm({ ...form, email_logo_url: e.target.value })} placeholder="https://..." /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Theme & Appearance</CardTitle>
            <CardDescription>Colors and backgrounds</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Primary Color</Label>
              <div className="flex gap-2">
                <Input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="h-10 w-16" />
                <Input value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="flex-1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Secondary Color</Label>
              <div className="flex gap-2">
                <Input type="color" value={form.secondary_color} onChange={(e) => setForm({ ...form, secondary_color: e.target.value })} className="h-10 w-16" />
                <Input value={form.secondary_color} onChange={(e) => setForm({ ...form, secondary_color: e.target.value })} className="flex-1" />
              </div>
            </div>
            <div className="space-y-2"><Label>Login Background URL</Label><Input value={form.login_bg_url} onChange={(e) => setForm({ ...form, login_bg_url: e.target.value })} placeholder="https://..." /></div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={updateSettings.isPending}>
          {updateSettings.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Branding
        </Button>
        <span className="text-xs text-muted-foreground">Changes apply to landing page, admin panel, emails, and invoices.</span>
      </div>
    </div>
  );
}
