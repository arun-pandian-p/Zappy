import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Upload, Palette, Settings, CheckCircle2,
  Loader2, ArrowRight, ArrowLeft, Rocket, 
  ImagePlus, Sparkles, X, Eye, LayoutGrid, List,
  Tag, Utensils, Monitor,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  { icon: Monitor, label: 'Menu Display', desc: 'Customer view' },
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

const GlassCard = ({ children, icon: Icon, title, desc }: { children: React.ReactNode; icon: any; title: string; desc: string }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8 shadow-2xl">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center">
        <Icon className="w-5 h-5 text-orange-400" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm text-white/50">{desc}</p>
      </div>
    </div>
    {children}
  </div>
);

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

  // Step 4 - Menu Display (NEW)
  const [menuDisplay, setMenuDisplay] = useState({
    menu_title: '',
    view_mode: 'grid' as 'grid' | 'list',
    show_offers: true,
    show_dietary_badges: true,
    card_style: 'standard' as 'compact' | 'standard' | 'detailed',
  });

  // Step 5 - Config
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

      // Load menu display settings
      const md = (restaurant.settings as any)?.menu_display;
      if (md) {
        setMenuDisplay({
          menu_title: restaurant.menu_title || '',
          view_mode: md.view_mode || 'grid',
          show_offers: md.show_offers ?? true,
          show_dietary_badges: md.show_dietary_badges ?? true,
          card_style: md.card_style || 'standard',
        });
      } else {
        setMenuDisplay(prev => ({ ...prev, menu_title: restaurant.menu_title || '' }));
      }
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
          settings: { ...(restaurant?.settings as any || {}), cuisine_type: hotelForm.cuisine_type },
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
        // Menu Display step
        const existingSettings = (restaurant?.settings as any) || {};
        updates = {
          menu_title: menuDisplay.menu_title || null,
          settings: {
            ...existingSettings,
            menu_display: {
              view_mode: menuDisplay.view_mode,
              show_offers: menuDisplay.show_offers,
              show_dietary_badges: menuDisplay.show_dietary_badges,
              card_style: menuDisplay.card_style,
            },
          },
        };
      } else if (stepIdx === 4) {
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-10 h-10 text-orange-400" />
        </motion.div>
      </div>
    );
  }

  const BrandingUploadCard = ({ label, field, hint, aspectHint }: { label: string; field: keyof typeof branding; hint: string; aspectHint?: string }) => (
    <motion.div
      whileHover={{ y: -2 }}
      className="group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 transition-all hover:border-orange-400/30 hover:shadow-lg hover:shadow-orange-400/5"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-sm text-white">{label}</h4>
          <p className="text-xs text-white/50 mt-0.5">{hint}</p>
        </div>
        {branding[field] && (
          <button
            onClick={() => setBranding(prev => ({ ...prev, [field]: '' }))}
            className="p-1 rounded-full hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {branding[field] ? (
        <div className="relative rounded-xl overflow-hidden bg-white/5 border border-white/10">
          <img src={branding[field]} alt={label} className="w-full h-28 object-contain p-2" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Eye className="w-5 h-5 text-white/60" />
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed border-white/10 hover:border-orange-400/30 bg-white/[0.02] cursor-pointer transition-colors">
          {uploading === field ? (
            <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
          ) : (
            <>
              <ImagePlus className="w-7 h-7 text-white/30 mb-1.5" />
              <span className="text-xs text-white/40">Click to upload</span>
              {aspectHint && <span className="text-[10px] text-white/20 mt-0.5">{aspectHint}</span>}
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
  const lastStep = STEPS.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />
      {/* Ambient glow blobs */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-amber-500/8 rounded-full blur-[100px] translate-y-1/2 pointer-events-none" />

      <div className="relative z-10 p-4 md:p-8 max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Set Up Your Restaurant
          </h1>
          <p className="text-white/50 mt-1 text-sm">Complete these steps to get your digital menu live</p>
        </motion.div>

        {/* Stepper */}
        <div className="mb-10">
          <div className="relative flex items-center justify-between mb-2">
            {/* Track line */}
            <div className="absolute top-5 left-[8%] right-[8%] h-0.5 bg-white/10 rounded-full" />
            <motion.div
              className="absolute top-5 left-[8%] h-0.5 bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
              initial={false}
              animate={{ width: `${stepProgress * 0.84}%` }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            />

            {STEPS.map((s, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center">
                <motion.div
                  initial={false}
                  animate={{
                    scale: i === step ? 1.15 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    i === step
                      ? 'bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/30 ring-4 ring-orange-500/20'
                      : i < step
                      ? 'bg-gradient-to-br from-orange-500 to-amber-500 shadow-md'
                      : 'bg-white/10 border border-white/10'
                  }`}
                >
                  {i < step ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : (
                    <s.icon className={`w-4 h-4 ${i <= step ? 'text-white' : 'text-white/40'}`} />
                  )}
                </motion.div>
                <span className={`mt-2 text-[10px] font-medium hidden sm:block ${
                  i === step ? 'text-orange-400' : i < step ? 'text-white/60' : 'text-white/30'
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {step === 0 && (
              <GlassCard icon={Building2} title="Hotel Details" desc="Tell us about your restaurant.">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-white/80">Hotel Name <span className="text-red-400">*</span></Label>
                    <Input
                      value={hotelForm.name}
                      onChange={(e) => setHotelForm({ ...hotelForm, name: e.target.value })}
                      placeholder="Grand Palace"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11 focus:border-orange-400/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-white/80">Cuisine Type</Label>
                    <Select value={hotelForm.cuisine_type} onValueChange={(v) => setHotelForm({ ...hotelForm, cuisine_type: v })}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white h-11">
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
                    <Label className="text-sm font-semibold text-white/80">Phone</Label>
                    <Input
                      value={hotelForm.phone}
                      onChange={(e) => setHotelForm({ ...hotelForm, phone: e.target.value })}
                      placeholder="+91 9876543210"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11 focus:border-orange-400/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-white/80">Email</Label>
                    <Input
                      type="email"
                      value={hotelForm.email}
                      onChange={(e) => setHotelForm({ ...hotelForm, email: e.target.value })}
                      placeholder="info@hotel.com"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11 focus:border-orange-400/50"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-semibold text-white/80">Address</Label>
                    <Input
                      value={hotelForm.address}
                      onChange={(e) => setHotelForm({ ...hotelForm, address: e.target.value })}
                      placeholder="123 Main St, City"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11 focus:border-orange-400/50"
                    />
                  </div>
                </div>
              </GlassCard>
            )}

            {step === 1 && (
              <GlassCard icon={Upload} title="Branding Assets" desc="Upload your restaurant's visual identity. Max 2MB per file.">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <BrandingUploadCard label="Restaurant Logo" field="logo_url" hint="PNG or SVG, square" aspectHint="512×512 recommended" />
                  <BrandingUploadCard label="Favicon" field="favicon_url" hint="Small icon for browser tab" aspectHint="64×64" />
                  <BrandingUploadCard label="Menu Banner" field="banner_image_url" hint="Top of your digital menu" aspectHint="1920×600" />
                  <BrandingUploadCard label="Cover Image" field="cover_image_url" hint="Restaurant showcase" aspectHint="16:9 ratio" />
                </div>
              </GlassCard>
            )}

            {step === 2 && (
              <GlassCard icon={Palette} title="Menu UI Theme" desc="Select a theme preset for your customer-facing menu.">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {THEME_PRESETS.map((preset) => (
                      <motion.div
                        key={preset.id}
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setThemePreset(preset.id)}
                        className={`cursor-pointer rounded-2xl border-2 p-5 transition-all relative overflow-hidden ${
                          themePreset === preset.id
                            ? 'border-orange-400 shadow-lg shadow-orange-400/10 bg-orange-400/5'
                            : 'border-white/10 hover:border-white/20 bg-white/[0.03]'
                        }`}
                      >
                        {themePreset === preset.id && (
                          <motion.div
                            layoutId="themeCheck"
                            className="absolute top-3 right-3"
                          >
                            <CheckCircle2 className="w-5 h-5 text-orange-400" />
                          </motion.div>
                        )}
                        <span className="text-2xl mb-3 block">{preset.emoji}</span>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 rounded-full ring-2 ring-white/20 shadow-sm" style={{ backgroundColor: preset.primary }} />
                          <div className="w-5 h-5 rounded-full ring-2 ring-white/20 shadow-sm" style={{ backgroundColor: preset.secondary }} />
                        </div>
                        <h4 className="font-semibold text-sm text-white">{preset.name}</h4>
                        <p className="text-xs text-white/40 mt-1 leading-relaxed">{preset.desc}</p>
                      </motion.div>
                    ))}
                  </div>

                  {themePreset === 'custom' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="rounded-2xl border border-white/10 p-5 bg-white/[0.03] backdrop-blur-sm space-y-4"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-orange-400" />
                        <h4 className="font-semibold text-sm text-white">Custom Colors & Style</h4>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-white/60">Primary</Label>
                          <div className="flex items-center gap-2">
                            <Input type="color" value={customTheme.primary} onChange={(e) => setCustomTheme({ ...customTheme, primary: e.target.value })} className="w-10 h-10 p-1 rounded-lg cursor-pointer bg-transparent border-white/10" />
                            <span className="text-xs text-white/40 font-mono">{customTheme.primary}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-white/60">Secondary</Label>
                          <div className="flex items-center gap-2">
                            <Input type="color" value={customTheme.secondary} onChange={(e) => setCustomTheme({ ...customTheme, secondary: e.target.value })} className="w-10 h-10 p-1 rounded-lg cursor-pointer bg-transparent border-white/10" />
                            <span className="text-xs text-white/40 font-mono">{customTheme.secondary}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-white/60">Font Family</Label>
                          <Select value={customTheme.font} onValueChange={(v) => setCustomTheme({ ...customTheme, font: v })}>
                            <SelectTrigger className="h-10 bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Inter">Inter</SelectItem>
                              <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                              <SelectItem value="Roboto">Roboto</SelectItem>
                              <SelectItem value="Poppins">Poppins</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-white/60">Button Style</Label>
                          <Select value={customTheme.button_style} onValueChange={(v) => setCustomTheme({ ...customTheme, button_style: v })}>
                            <SelectTrigger className="h-10 bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
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
                      <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                        <span className="text-xs text-white/40">Preview:</span>
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
                </div>
              </GlassCard>
            )}

            {step === 3 && (
              <GlassCard icon={Monitor} title="Menu Display" desc="Control how customers see your menu.">
                <div className="space-y-6">
                  {/* Menu Title */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-white/80">Menu Title</Label>
                    <Input
                      value={menuDisplay.menu_title}
                      onChange={(e) => setMenuDisplay({ ...menuDisplay, menu_title: e.target.value })}
                      placeholder="Our Menu"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11 focus:border-orange-400/50"
                    />
                    <p className="text-xs text-white/30">Custom heading shown on your customer menu page.</p>
                  </div>

                  {/* Default View Mode */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-white/80">Default View Mode</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'grid' as const, icon: LayoutGrid, label: 'Grid View', desc: '2-column card layout' },
                        { value: 'list' as const, icon: List, label: 'List View', desc: 'Single column rows' },
                      ].map((mode) => (
                        <motion.div
                          key={mode.value}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setMenuDisplay({ ...menuDisplay, view_mode: mode.value })}
                          className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                            menuDisplay.view_mode === mode.value
                              ? 'border-orange-400 bg-orange-400/5'
                              : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                          }`}
                        >
                          <mode.icon className={`w-6 h-6 mb-2 ${menuDisplay.view_mode === mode.value ? 'text-orange-400' : 'text-white/40'}`} />
                          <h4 className="text-sm font-medium text-white">{mode.label}</h4>
                          <p className="text-xs text-white/40 mt-0.5">{mode.desc}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="flex items-center gap-3">
                        <Tag className="w-5 h-5 text-orange-400" />
                        <div>
                          <h4 className="text-sm font-medium text-white">Show Offers Slider</h4>
                          <p className="text-xs text-white/40">Display active promotions on the menu</p>
                        </div>
                      </div>
                      <Switch
                        checked={menuDisplay.show_offers}
                        onCheckedChange={(v) => setMenuDisplay({ ...menuDisplay, show_offers: v })}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="flex items-center gap-3">
                        <Utensils className="w-5 h-5 text-green-400" />
                        <div>
                          <h4 className="text-sm font-medium text-white">Show Veg/Non-veg Badges</h4>
                          <p className="text-xs text-white/40">Dietary indicator badges on food cards</p>
                        </div>
                      </div>
                      <Switch
                        checked={menuDisplay.show_dietary_badges}
                        onCheckedChange={(v) => setMenuDisplay({ ...menuDisplay, show_dietary_badges: v })}
                      />
                    </div>
                  </div>

                  {/* Card Style */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-white/80">Card Style</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'compact' as const, label: 'Compact', desc: 'Minimal info' },
                        { value: 'standard' as const, label: 'Standard', desc: 'Balanced' },
                        { value: 'detailed' as const, label: 'Detailed', desc: 'Full info' },
                      ].map((style) => (
                        <motion.div
                          key={style.value}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setMenuDisplay({ ...menuDisplay, card_style: style.value })}
                          className={`cursor-pointer rounded-xl border-2 p-3 text-center transition-all ${
                            menuDisplay.card_style === style.value
                              ? 'border-orange-400 bg-orange-400/5'
                              : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                          }`}
                        >
                          <h4 className={`text-sm font-medium ${menuDisplay.card_style === style.value ? 'text-orange-400' : 'text-white'}`}>{style.label}</h4>
                          <p className="text-xs text-white/40 mt-0.5">{style.desc}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </GlassCard>
            )}

            {step === 4 && (
              <GlassCard icon={Settings} title="Default Configuration" desc="Review and adjust your tax and currency settings.">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-white/80">Tax Rate (%)</Label>
                    <Input
                      type="number"
                      value={config.tax_rate}
                      onChange={(e) => setConfig({ ...config, tax_rate: Number(e.target.value) })}
                      className="bg-white/5 border-white/10 text-white h-11 focus:border-orange-400/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-white/80">Service Charge (%)</Label>
                    <Input
                      type="number"
                      value={config.service_charge_rate}
                      onChange={(e) => setConfig({ ...config, service_charge_rate: Number(e.target.value) })}
                      className="bg-white/5 border-white/10 text-white h-11 focus:border-orange-400/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-white/80">Currency</Label>
                    <Select value={config.currency} onValueChange={(v) => setConfig({ ...config, currency: v })}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white h-11">
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
              </GlassCard>
            )}

            {step === 5 && (
              <div className="rounded-2xl border border-orange-400/20 bg-gradient-to-br from-orange-500/5 via-white/5 to-amber-500/5 backdrop-blur-xl p-10 text-center space-y-8 shadow-2xl">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center shadow-lg shadow-orange-500/10"
                >
                  <Rocket className="w-12 h-12 text-orange-400" />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-2xl font-bold text-white">Almost There!</h2>
                  <p className="text-white/50 mt-2 max-w-md mx-auto">
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
                      className="h-12 gap-2 bg-white/5 hover:bg-white/10 border-white/10 hover:border-orange-400/30 text-white"
                    >
                      <action.icon className="w-4 h-4" />
                      {action.label}
                    </Button>
                  ))}
                </motion.div>
              </div>
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
            className="h-11 px-6 gap-2 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          {step < lastStep ? (
            <Button
              onClick={handleNext}
              disabled={saving}
              className="h-11 px-8 gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/20 border-0"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={saving}
              className="h-11 px-8 gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/20 border-0"
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
