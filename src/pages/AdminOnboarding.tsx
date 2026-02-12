import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Upload, Palette, Settings, CheckCircle2,
  Loader2, ArrowRight, ArrowLeft, Rocket, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurant } from '@/hooks/useRestaurant';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const STEPS = [
  { icon: Building2, label: 'Hotel Details' },
  { icon: Upload, label: 'Branding' },
  { icon: Palette, label: 'Menu Theme' },
  { icon: Settings, label: 'Configuration' },
  { icon: CheckCircle2, label: 'Complete' },
];

const THEME_PRESETS = [
  { id: 'classic', name: 'Classic', primary: '#F97316', secondary: '#FDE68A', font: 'Inter', desc: 'Warm & inviting with orange accents' },
  { id: 'dark', name: 'Dark', primary: '#A78BFA', secondary: '#6366F1', font: 'Inter', desc: 'Modern dark theme with violet tones' },
  { id: 'premium', name: 'Premium', primary: '#D4A574', secondary: '#1A1A2E', font: 'Playfair Display', desc: 'Luxurious gold & dark palette' },
  { id: 'minimal', name: 'Minimal', primary: '#374151', secondary: '#E5E7EB', font: 'Inter', desc: 'Clean white with subtle accents' },
  { id: 'custom', name: 'Custom', primary: '#3B82F6', secondary: '#10B981', font: 'Inter', desc: 'Choose your own colors & fonts' },
];

const AdminOnboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, restaurantId, loading: authLoading, role } = useAuth();

  const { data: restaurant, isLoading: restaurantLoading } = useRestaurant(restaurantId || '');

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1 - Hotel details
  const [hotelForm, setHotelForm] = useState({
    name: '', address: '', phone: '', email: '', cuisine_type: '',
  });

  // Step 2 - Branding (URLs after upload)
  const [branding, setBranding] = useState({
    logo_url: '', favicon_url: '', banner_image_url: '', cover_image_url: '',
  });
  const [uploading, setUploading] = useState<string | null>(null);

  // Step 3 - Theme
  const [themePreset, setThemePreset] = useState('classic');
  const [customTheme, setCustomTheme] = useState({
    primary: '#3B82F6', secondary: '#10B981', font: 'Inter', button_style: 'rounded',
  });

  // Step 4 - Config
  const [config, setConfig] = useState({
    tax_rate: 5, service_charge_rate: 0, currency: 'INR',
  });

  // Populate form from existing restaurant
  useEffect(() => {
    if (restaurant) {
      setHotelForm({
        name: restaurant.name || '',
        address: restaurant.address || '',
        phone: restaurant.phone || '',
        email: restaurant.email || '',
        cuisine_type: (restaurant.settings as any)?.cuisine_type || '',
      });
      setBranding({
        logo_url: restaurant.logo_url || '',
        favicon_url: restaurant.favicon_url || '',
        banner_image_url: restaurant.banner_image_url || '',
        cover_image_url: restaurant.cover_image_url || '',
      });
      setConfig({
        tax_rate: Number(restaurant.tax_rate) || 5,
        service_charge_rate: Number(restaurant.service_charge_rate) || 0,
        currency: restaurant.currency || 'INR',
      });
      if (restaurant.primary_color) {
        setCustomTheme(prev => ({ ...prev, primary: restaurant.primary_color! }));
      }
      if (restaurant.secondary_color) {
        setCustomTheme(prev => ({ ...prev, secondary: restaurant.secondary_color! }));
      }
      const tc = restaurant.theme_config as any;
      if (tc?.preset) setThemePreset(tc.preset);
    }
  }, [restaurant]);

  // Redirect checks
  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
    if (!authLoading && role && role !== 'restaurant_admin' && role !== 'super_admin') navigate('/login');
  }, [authLoading, user, role, navigate]);

  // If onboarding already completed, redirect to admin
  useEffect(() => {
    if (restaurant && (restaurant as any).onboarding_completed) {
      navigate('/admin');
    }
  }, [restaurant, navigate]);

  const handleUpload = async (field: keyof typeof branding, file: File) => {
    if (!restaurantId) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 2MB allowed.', variant: 'destructive' });
      return;
    }

    setUploading(field);
    const ext = file.name.split('.').pop();
    const path = `tenants/${restaurantId}/${field}.${ext}`;

    const { error: uploadError } = await supabase.storage.from('menu-images').upload(path, file, { upsert: true });
    if (uploadError) {
      toast({ title: 'Upload Failed', description: uploadError.message, variant: 'destructive' });
      setUploading(null);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('menu-images').getPublicUrl(path);
    setBranding(prev => ({ ...prev, [field]: publicUrl }));
    setUploading(null);
    toast({ title: 'Uploaded', description: `${field.replace(/_/g, ' ')} uploaded successfully.` });
  };

  const saveStep = async (stepIdx: number) => {
    if (!restaurantId) return;
    setSaving(true);

    try {
      let updates: Record<string, any> = {};

      if (stepIdx === 0) {
        updates = {
          name: hotelForm.name,
          address: hotelForm.address || null,
          phone: hotelForm.phone || null,
          email: hotelForm.email || null,
          settings: { cuisine_type: hotelForm.cuisine_type },
        };
      } else if (stepIdx === 1) {
        updates = {
          logo_url: branding.logo_url || null,
          favicon_url: branding.favicon_url || null,
          banner_image_url: branding.banner_image_url || null,
          cover_image_url: branding.cover_image_url || null,
        };
      } else if (stepIdx === 2) {
        const preset = THEME_PRESETS.find(p => p.id === themePreset);
        const isCustom = themePreset === 'custom';
        updates = {
          primary_color: isCustom ? customTheme.primary : preset?.primary,
          secondary_color: isCustom ? customTheme.secondary : preset?.secondary,
          font_family: isCustom ? customTheme.font : preset?.font,
          theme_config: {
            preset: themePreset,
            custom_primary: isCustom ? customTheme.primary : null,
            custom_secondary: isCustom ? customTheme.secondary : null,
            custom_font: isCustom ? customTheme.font : null,
            button_style: customTheme.button_style,
          },
        };
      } else if (stepIdx === 3) {
        updates = {
          tax_rate: config.tax_rate,
          service_charge_rate: config.service_charge_rate,
          currency: config.currency,
        };
      }

      const { error } = await supabase.from('restaurants').update(updates).eq('id', restaurantId);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantId] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (step === 0 && !hotelForm.name) {
      toast({ title: 'Hotel name required', variant: 'destructive' });
      return;
    }
    await saveStep(step);
    setStep(step + 1);
  };

  const handleComplete = async () => {
    if (!restaurantId) return;
    setSaving(true);
    try {
      // Seed default categories
      const defaultCategories = ['Starters', 'Main Course', 'Beverages'];
      for (const name of defaultCategories) {
        await supabase.from('categories').upsert(
          { name, restaurant_id: restaurantId, is_active: true },
          { onConflict: 'restaurant_id,name', ignoreDuplicates: true }
        );
      }

      // Mark onboarding complete
      const { error } = await supabase.from('restaurants').update({ onboarding_completed: true }).eq('id', restaurantId);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantId] });
      toast({ title: '🎉 Setup Complete!', description: 'Your restaurant is ready to go.' });
      navigate('/admin');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || restaurantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const FileUploadField = ({ label, field }: { label: string; field: keyof typeof branding }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleUpload(field, e.target.files[0])}
          disabled={uploading === field}
          className="flex-1"
        />
        {uploading === field && <Loader2 className="w-4 h-4 animate-spin" />}
      </div>
      {branding[field] && (
        <img src={branding[field]} alt={label} className="w-16 h-16 rounded-lg object-cover border" />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Stepper */}
        <div className="flex items-center justify-center mb-8 gap-1">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-all ${
                i === step ? 'bg-primary text-primary-foreground font-medium' :
                i < step ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                <s.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-muted-foreground mx-1" />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" />Hotel Details</CardTitle>
                  <CardDescription>Tell us about your restaurant.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Hotel Name *</Label><Input value={hotelForm.name} onChange={(e) => setHotelForm({ ...hotelForm, name: e.target.value })} placeholder="Grand Palace" /></div>
                    <div className="space-y-2"><Label>Cuisine Type</Label><Input value={hotelForm.cuisine_type} onChange={(e) => setHotelForm({ ...hotelForm, cuisine_type: e.target.value })} placeholder="Multi-cuisine" /></div>
                    <div className="space-y-2"><Label>Phone</Label><Input value={hotelForm.phone} onChange={(e) => setHotelForm({ ...hotelForm, phone: e.target.value })} placeholder="+91 9876543210" /></div>
                    <div className="space-y-2"><Label>Email</Label><Input type="email" value={hotelForm.email} onChange={(e) => setHotelForm({ ...hotelForm, email: e.target.value })} placeholder="info@hotel.com" /></div>
                    <div className="space-y-2 md:col-span-2"><Label>Address</Label><Input value={hotelForm.address} onChange={(e) => setHotelForm({ ...hotelForm, address: e.target.value })} placeholder="123 Main St, City" /></div>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Upload className="w-5 h-5" />Branding Upload</CardTitle>
                  <CardDescription>Upload your restaurant's visual identity. Max 2MB per file.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FileUploadField label="Hotel Logo (PNG/SVG)" field="logo_url" />
                    <FileUploadField label="Favicon (64×64)" field="favicon_url" />
                    <FileUploadField label="Menu Banner" field="banner_image_url" />
                    <FileUploadField label="Cover Image" field="cover_image_url" />
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5" />Menu UI Theme</CardTitle>
                  <CardDescription>Select a theme preset for your customer-facing menu.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {THEME_PRESETS.map((preset) => (
                      <div
                        key={preset.id}
                        onClick={() => setThemePreset(preset.id)}
                        className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                          themePreset === preset.id ? 'border-primary shadow-lg' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.primary }} />
                          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.secondary }} />
                        </div>
                        <h4 className="font-semibold">{preset.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{preset.desc}</p>
                      </div>
                    ))}
                  </div>

                  {themePreset === 'custom' && (
                    <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase">Custom Colors</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2"><Label>Primary</Label><Input type="color" value={customTheme.primary} onChange={(e) => setCustomTheme({ ...customTheme, primary: e.target.value })} className="h-10" /></div>
                        <div className="space-y-2"><Label>Secondary</Label><Input type="color" value={customTheme.secondary} onChange={(e) => setCustomTheme({ ...customTheme, secondary: e.target.value })} className="h-10" /></div>
                        <div className="space-y-2">
                          <Label>Font Family</Label>
                          <Select value={customTheme.font} onValueChange={(v) => setCustomTheme({ ...customTheme, font: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Inter">Inter</SelectItem>
                              <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                              <SelectItem value="Roboto">Roboto</SelectItem>
                              <SelectItem value="Poppins">Poppins</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Button Style</Label>
                          <Select value={customTheme.button_style} onValueChange={(v) => setCustomTheme({ ...customTheme, button_style: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="rounded">Rounded</SelectItem>
                              <SelectItem value="square">Square</SelectItem>
                              <SelectItem value="pill">Pill</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5" />Default Configuration</CardTitle>
                  <CardDescription>Review and adjust your tax and currency settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Tax Rate (%)</Label><Input type="number" value={config.tax_rate} onChange={(e) => setConfig({ ...config, tax_rate: Number(e.target.value) })} /></div>
                    <div className="space-y-2"><Label>Service Charge (%)</Label><Input type="number" value={config.service_charge_rate} onChange={(e) => setConfig({ ...config, service_charge_rate: Number(e.target.value) })} /></div>
                    <div className="space-y-2"><Label>Currency</Label><Input value={config.currency} onChange={(e) => setConfig({ ...config, currency: e.target.value })} /></div>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 4 && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-8 text-center space-y-6">
                  <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                    <Rocket className="w-10 h-10 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Almost There!</h2>
                    <p className="text-muted-foreground mt-2">
                      We'll seed default categories and finalize your setup. Your restaurant will be ready for operations.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Button variant="outline" onClick={() => navigate('/admin')}>
                      Go to Dashboard
                    </Button>
                    <Button variant="outline" onClick={() => { navigate('/admin'); }}>
                      Add Menu Items
                    </Button>
                    <Button variant="outline" onClick={() => { navigate('/admin'); }}>
                      Set Up Tables & QR
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={step === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />Back
          </Button>

          {step < 4 ? (
            <Button onClick={handleNext} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Next<ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={saving} className="bg-primary">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Complete Setup
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOnboarding;
