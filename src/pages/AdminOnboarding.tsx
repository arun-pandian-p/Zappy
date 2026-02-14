import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Upload, Palette, Settings, CheckCircle2,
  Loader2, ArrowRight, ArrowLeft, Rocket, ChevronRight,
  ImagePlus, Sparkles, X, Eye,
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
  { icon: Building2, label: 'Hotel Details', desc: 'Restaurant info' },
  { icon: Upload, label: 'Branding', desc: 'Logo & assets' },
  { icon: Palette, label: 'Menu Theme', desc: 'Colors & fonts' },
  { icon: Settings, label: 'Configuration', desc: 'Tax & currency' },
  { icon: CheckCircle2, label: 'Complete', desc: 'Launch!' },
];

const THEME_PRESETS = [
  { id: 'classic', name: 'Classic', primary: '#F97316', secondary: '#FDE68A', font: 'Inter', desc: 'Warm & inviting with orange accents', emoji: '🍽️' },
  { id: 'dark', name: 'Dark', primary: '#A78BFA', secondary: '#6366F1', font: 'Inter', desc: 'Modern dark theme with violet tones', emoji: '🌙' },
  { id: 'premium', name: 'Premium', primary: '#D4A574', secondary: '#1A1A2E', font: 'Playfair Display', desc: 'Luxurious gold & dark palette', emoji: '✨' },
  { id: 'minimal', name: 'Minimal', primary: '#374151', secondary: '#E5E7EB', font: 'Inter', desc: 'Clean white with subtle accents', emoji: '◻️' },
  { id: 'custom', name: 'Custom', primary: '#3B82F6', secondary: '#10B981', font: 'Inter', desc: 'Choose your own colors & fonts', emoji: '🎨' },
];

const CUISINE_OPTIONS = [
  'South Indian', 'North Indian', 'Chinese', 'Continental', 'Multi-cuisine',
  'Café', 'Bakery', 'Fine Dining', 'QSR', 'Street Food',
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
      const defaultCategories = ['Starters', 'Main Course', 'Beverages'];
      for (const name of defaultCategories) {
        await supabase.from('categories').upsert(
          { name, restaurant_id: restaurantId, is_active: true },
          { onConflict: 'restaurant_id,name', ignoreDuplicates: true }
        );
      }

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-10 h-10 text-primary" />
        </motion.div>
      </div>
    );
  }

  const BrandingUploadCard = ({ label, field, hint, aspectHint }: { label: string; field: keyof typeof branding; hint: string; aspectHint?: string }) => (
    <motion.div
      whileHover={{ y: -2 }}
      className="group relative rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-5 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-sm text-foreground">{label}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
        </div>
        {branding[field] && (
          <button
            onClick={() => setBranding(prev => ({ ...prev, [field]: '' }))}
            className="p-1 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {branding[field] ? (
        <div className="relative rounded-xl overflow-hidden bg-muted/50 border border-border/40">
          <img src={branding[field]} alt={label} className="w-full h-28 object-contain p-2" />
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Eye className="w-5 h-5 text-foreground/60" />
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed border-border/60 hover:border-primary/50 bg-muted/30 cursor-pointer transition-colors">
          {uploading === field ? (
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          ) : (
            <>
              <ImagePlus className="w-7 h-7 text-muted-foreground/60 mb-1.5" />
              <span className="text-xs text-muted-foreground">Click to upload</span>
              {aspectHint && <span className="text-[10px] text-muted-foreground/50 mt-0.5">{aspectHint}</span>}
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleUpload(field, e.target.files[0])}
            disabled={uploading === field}
          />
        </label>
      )}
    </motion.div>
  );

  const stepProgress = ((step) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5 relative overflow-hidden">
      {/* Ambient glow blobs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/3 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      <div className="relative z-10 p-4 md:p-8 max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Set Up Your Restaurant
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Complete these steps to get your digital menu live</p>
        </motion.div>

        {/* Enhanced Stepper */}
        <div className="mb-10">
          {/* Progress Bar Background */}
          <div className="relative flex items-center justify-between mb-2">
            {/* Track line */}
            <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-border/50 rounded-full" />
            <motion.div
              className="absolute top-5 left-[10%] h-0.5 bg-gradient-to-r from-primary to-primary/70 rounded-full"
              initial={false}
              animate={{ width: `${stepProgress * 0.8}%` }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            />

            {STEPS.map((s, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center">
                <motion.div
                  initial={false}
                  animate={{
                    scale: i === step ? 1.1 : 1,
                    backgroundColor: i <= step ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-shadow ${
                    i === step ? 'shadow-lg shadow-primary/30 ring-4 ring-primary/10' :
                    i < step ? 'shadow-md' : ''
                  }`}
                >
                  {i < step ? (
                    <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
                  ) : (
                    <s.icon className={`w-4.5 h-4.5 ${i <= step ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                  )}
                </motion.div>
                <span className={`mt-2 text-xs font-medium hidden sm:block ${
                  i === step ? 'text-primary' : i < step ? 'text-foreground/70' : 'text-muted-foreground'
                }`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {step === 0 && (
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl shadow-primary/5">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Hotel Details</CardTitle>
                      <CardDescription>Tell us about your restaurant.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Hotel Name <span className="text-destructive">*</span></Label>
                      <Input
                        value={hotelForm.name}
                        onChange={(e) => setHotelForm({ ...hotelForm, name: e.target.value })}
                        placeholder="Grand Palace"
                        className="bg-background/60 border-border/60 focus:border-primary/60 h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Cuisine Type</Label>
                      <Select value={hotelForm.cuisine_type} onValueChange={(v) => setHotelForm({ ...hotelForm, cuisine_type: v })}>
                        <SelectTrigger className="bg-background/60 border-border/60 h-11">
                          <SelectValue placeholder="Select cuisine" />
                        </SelectTrigger>
                        <SelectContent>
                          {CUISINE_OPTIONS.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Phone</Label>
                      <Input
                        value={hotelForm.phone}
                        onChange={(e) => setHotelForm({ ...hotelForm, phone: e.target.value })}
                        placeholder="+91 9876543210"
                        className="bg-background/60 border-border/60 h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Email</Label>
                      <Input
                        type="email"
                        value={hotelForm.email}
                        onChange={(e) => setHotelForm({ ...hotelForm, email: e.target.value })}
                        placeholder="info@hotel.com"
                        className="bg-background/60 border-border/60 h-11"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-sm font-semibold">Address</Label>
                      <Input
                        value={hotelForm.address}
                        onChange={(e) => setHotelForm({ ...hotelForm, address: e.target.value })}
                        placeholder="123 Main St, City"
                        className="bg-background/60 border-border/60 h-11"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 1 && (
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl shadow-primary/5">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Upload className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Branding Assets</CardTitle>
                      <CardDescription>Upload your restaurant's visual identity. Max 2MB per file.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <BrandingUploadCard label="Restaurant Logo" field="logo_url" hint="PNG or SVG, square" aspectHint="512×512 recommended" />
                    <BrandingUploadCard label="Favicon" field="favicon_url" hint="Small icon for browser tab" aspectHint="64×64" />
                    <BrandingUploadCard label="Menu Banner" field="banner_image_url" hint="Top of your digital menu" aspectHint="1920×600" />
                    <BrandingUploadCard label="Cover Image" field="cover_image_url" hint="Restaurant showcase" aspectHint="16:9 ratio" />
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl shadow-primary/5">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Palette className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Menu UI Theme</CardTitle>
                      <CardDescription>Select a theme preset for your customer-facing menu.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {THEME_PRESETS.map((preset) => (
                      <motion.div
                        key={preset.id}
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setThemePreset(preset.id)}
                        className={`cursor-pointer rounded-2xl border-2 p-5 transition-all relative overflow-hidden ${
                          themePreset === preset.id
                            ? 'border-primary shadow-lg shadow-primary/10 bg-primary/5'
                            : 'border-border/50 hover:border-primary/30 bg-card/60'
                        }`}
                      >
                        {themePreset === preset.id && (
                          <motion.div
                            layoutId="themeCheck"
                            className="absolute top-3 right-3"
                          >
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                          </motion.div>
                        )}
                        <span className="text-2xl mb-3 block">{preset.emoji}</span>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 rounded-full ring-2 ring-background shadow-sm" style={{ backgroundColor: preset.primary }} />
                          <div className="w-5 h-5 rounded-full ring-2 ring-background shadow-sm" style={{ backgroundColor: preset.secondary }} />
                        </div>
                        <h4 className="font-semibold text-sm">{preset.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{preset.desc}</p>
                      </motion.div>
                    ))}
                  </div>

                  {themePreset === 'custom' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="rounded-2xl border border-border/50 p-5 bg-muted/30 backdrop-blur-sm space-y-4"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <h4 className="font-semibold text-sm">Custom Colors & Style</h4>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Primary</Label>
                          <div className="flex items-center gap-2">
                            <Input type="color" value={customTheme.primary} onChange={(e) => setCustomTheme({ ...customTheme, primary: e.target.value })} className="w-10 h-10 p-1 rounded-lg cursor-pointer" />
                            <span className="text-xs text-muted-foreground font-mono">{customTheme.primary}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Secondary</Label>
                          <div className="flex items-center gap-2">
                            <Input type="color" value={customTheme.secondary} onChange={(e) => setCustomTheme({ ...customTheme, secondary: e.target.value })} className="w-10 h-10 p-1 rounded-lg cursor-pointer" />
                            <span className="text-xs text-muted-foreground font-mono">{customTheme.secondary}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Font Family</Label>
                          <Select value={customTheme.font} onValueChange={(v) => setCustomTheme({ ...customTheme, font: v })}>
                            <SelectTrigger className="h-10 bg-background/60"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Inter">Inter</SelectItem>
                              <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                              <SelectItem value="Roboto">Roboto</SelectItem>
                              <SelectItem value="Poppins">Poppins</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Button Style</Label>
                          <Select value={customTheme.button_style} onValueChange={(v) => setCustomTheme({ ...customTheme, button_style: v })}>
                            <SelectTrigger className="h-10 bg-background/60"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="rounded">Rounded</SelectItem>
                              <SelectItem value="square">Sharp</SelectItem>
                              <SelectItem value="pill">Pill</SelectItem>
                              <SelectItem value="glass">Glass</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Live preview swatch */}
                      <div className="flex items-center gap-3 pt-2 border-t border-border/30">
                        <span className="text-xs text-muted-foreground">Preview:</span>
                        <div
                          className="h-8 px-4 rounded-lg flex items-center text-white text-xs font-medium shadow-sm"
                          style={{
                            backgroundColor: customTheme.primary,
                            borderRadius: customTheme.button_style === 'pill' ? '9999px' : customTheme.button_style === 'square' ? '4px' : '8px',
                            fontFamily: customTheme.font,
                          }}
                        >
                          Order Now
                        </div>
                        <div
                          className="h-8 px-4 rounded-lg flex items-center text-white text-xs font-medium shadow-sm"
                          style={{ backgroundColor: customTheme.secondary, borderRadius: '8px' }}
                        >
                          View Menu
                        </div>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl shadow-primary/5">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Settings className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Default Configuration</CardTitle>
                      <CardDescription>Review and adjust your tax and currency settings.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Tax Rate (%)</Label>
                      <Input
                        type="number"
                        value={config.tax_rate}
                        onChange={(e) => setConfig({ ...config, tax_rate: Number(e.target.value) })}
                        className="bg-background/60 border-border/60 h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Service Charge (%)</Label>
                      <Input
                        type="number"
                        value={config.service_charge_rate}
                        onChange={(e) => setConfig({ ...config, service_charge_rate: Number(e.target.value) })}
                        className="bg-background/60 border-border/60 h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Currency</Label>
                      <Select value={config.currency} onValueChange={(v) => setConfig({ ...config, currency: v })}>
                        <SelectTrigger className="bg-background/60 border-border/60 h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INR">INR (₹)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 4 && (
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card/90 to-primary/10 backdrop-blur-sm shadow-xl">
                <CardContent className="p-10 text-center space-y-8">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                    className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-lg shadow-primary/10"
                  >
                    <Rocket className="w-12 h-12 text-primary" />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h2 className="text-2xl font-bold text-foreground">Almost There!</h2>
                    <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                      We'll seed default categories and finalize your setup. Your restaurant will be ready for operations.
                    </p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                  >
                    {[
                      { label: 'Go to Dashboard', icon: Building2 },
                      { label: 'Add Menu Items', icon: Palette },
                      { label: 'Set Up Tables & QR', icon: Settings },
                    ].map((action) => (
                      <Button
                        key={action.label}
                        variant="outline"
                        onClick={() => navigate('/admin')}
                        className="h-12 gap-2 bg-background/60 hover:bg-background border-border/50 hover:border-primary/30"
                      >
                        <action.icon className="w-4 h-4" />
                        {action.label}
                      </Button>
                    ))}
                  </motion.div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-between mt-8"
        >
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={step === 0}
            className="h-11 px-6 gap-2 bg-background/60 border-border/50 hover:border-primary/30"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          {step < 4 ? (
            <Button
              onClick={handleNext}
              disabled={saving}
              className="h-11 px-8 gap-2 shadow-lg shadow-primary/20"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={saving}
              className="h-11 px-8 gap-2 shadow-lg shadow-primary/20"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Complete Setup
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminOnboarding;
