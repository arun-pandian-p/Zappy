import { useState, useEffect, useRef } from 'react';
import { Loader2, Save, Lock, Palette, Upload, X, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const CREATOR_EMAIL = 'arunpandi47777@gmail.com';

function LogoUploadField({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image.', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Too large', description: 'Max 5MB.', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `branding/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('platform-assets').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: publicData } = supabase.storage.from('platform-assets').getPublicUrl(path);
      onChange(publicData.publicUrl);
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-lg border border-border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
          {value ? (
            <img src={value} alt={label} className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <ImageIcon className="w-6 h-6 text-muted-foreground/40" />
          )}
        </div>
        <div className="flex-1 space-y-1.5">
          <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://..." className="text-xs" />
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
              Upload
            </Button>
            {value && (
              <Button type="button" size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => onChange('')}>
                <X className="w-3 h-3 mr-1" /> Remove
              </Button>
            )}
          </div>
        </div>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}

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
            <p className="text-sm text-muted-foreground mt-1">Only the platform creator can modify branding settings.</p>
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
            <LogoUploadField label="Logo" value={form.logo_url} onChange={(url) => setForm({ ...form, logo_url: url })} />
            <LogoUploadField label="Favicon" value={form.favicon_url} onChange={(url) => setForm({ ...form, favicon_url: url })} />
            <LogoUploadField label="Email Header Logo" value={form.email_logo_url} onChange={(url) => setForm({ ...form, email_logo_url: url })} />
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
            <LogoUploadField label="Login Background" value={form.login_bg_url} onChange={(url) => setForm({ ...form, login_bg_url: url })} />
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
