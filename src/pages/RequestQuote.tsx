import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, CheckCircle2, Mail, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ZappyLogo } from '@/components/branding/ZappyLogo';

const featureOptions = [
  'QR Code Menu',
  'Kitchen Display System (KDS)',
  'Billing & Invoicing',
  'Waiter Dashboard',
  'Inventory Management',
  'Customer Feedback',
  'Offers & Coupons',
  'Analytics & Reports',
  'Multi-branch Support',
  'Custom Branding',
];

const RequestQuote = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterDone, setNewsletterDone] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    restaurant_name: '',
    city: '',
    num_tables: '',
    current_system: '',
    features_needed: [] as string[],
    message: '',
  });

  const toggleFeature = (feature: string) => {
    setForm((prev) => ({
      ...prev,
      features_needed: prev.features_needed.includes(feature)
        ? prev.features_needed.filter((f) => f !== feature)
        : [...prev.features_needed, feature],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast({ title: 'Please fill in your name and email', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('quote_requests').insert({
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      restaurant_name: form.restaurant_name || null,
      city: form.city || null,
      num_tables: form.num_tables ? parseInt(form.num_tables) : null,
      current_system: form.current_system || null,
      features_needed: form.features_needed.length ? form.features_needed : null,
      message: form.message || null,
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Something went wrong', description: error.message, variant: 'destructive' });
    } else {
      setSubmitted(true);
    }
  };

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterLoading(true);
    const { error } = await supabase.from('newsletter_subscribers').insert({ email: newsletterEmail });
    setNewsletterLoading(false);
    if (error?.code === '23505') {
      toast({ title: "You're already subscribed!", description: "We'll keep you updated." });
      setNewsletterDone(true);
    } else if (error) {
      toast({ title: 'Error subscribing', description: error.message, variant: 'destructive' });
    } else {
      setNewsletterDone(true);
      toast({ title: 'Subscribed!', description: "You'll receive our latest updates & offers." });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <ZappyLogo size={48} compact />
          </div>
          <span className="text-sm text-muted-foreground hidden sm:block">Get a Custom Quote</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-4xl">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Request a <span className="text-primary">Quotation</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Tell us about your restaurant and we'll craft the perfect plan for you. Our team will get back to you within 24 hours.
          </p>
        </motion.div>

        {submitted ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-20 space-y-4"
          >
            <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">Quote Request Sent!</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Thank you, {form.name}! Our team will review your requirements and reach out to <strong>{form.email}</strong> within 24 hours.
            </p>
            <Button onClick={() => navigate('/')} className="mt-6">Back to Home</Button>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit}
            className="space-y-8 bg-card border border-border rounded-2xl p-6 md:p-10 shadow-sm"
          >
            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</span>
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" placeholder="you@restaurant.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" placeholder="+91 98765 43210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Restaurant Info */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</span>
                Restaurant Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="restaurant_name">Restaurant Name</Label>
                  <Input id="restaurant_name" placeholder="My Restaurant" value={form.restaurant_name} onChange={(e) => setForm({ ...form, restaurant_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="Mumbai" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="num_tables">Number of Tables</Label>
                  <Input id="num_tables" type="number" placeholder="20" min={1} value={form.num_tables} onChange={(e) => setForm({ ...form, num_tables: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current_system">Current Ordering System</Label>
                  <Select value={form.current_system} onValueChange={(v) => setForm({ ...form, current_system: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No system (pen & paper)</SelectItem>
                      <SelectItem value="pos">POS System</SelectItem>
                      <SelectItem value="other_qr">Other QR Solution</SelectItem>
                      <SelectItem value="custom">Custom Software</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</span>
                Features You Need
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {featureOptions.map((feature) => (
                  <label key={feature} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/50 cursor-pointer transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <Checkbox
                      checked={form.features_needed.includes(feature)}
                      onCheckedChange={() => toggleFeature(feature)}
                    />
                    <span className="text-sm text-foreground">{feature}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">4</span>
                Additional Details
              </h3>
              <Textarea
                placeholder="Tell us more about your requirements, budget expectations, or any specific questions..."
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>

            <Button type="submit" size="lg" className="w-full text-lg py-6 rounded-xl font-bold" disabled={loading}>
              {loading ? 'Submitting...' : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit Quote Request
                </>
              )}
            </Button>
          </motion.form>
        )}

        {/* Newsletter / Stay Updated */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-8 text-center"
        >
          <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="text-xl font-bold text-foreground mb-2">Stay Updated</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
            Subscribe to get exclusive offers, product updates, and restaurant management tips delivered to your inbox.
          </p>
          {newsletterDone ? (
            <div className="flex items-center justify-center gap-2 text-primary font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              You're subscribed!
            </div>
          ) : (
            <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto">
              <div className="relative flex-1 w-full">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="your@email.com"
                  className="pl-10"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={newsletterLoading} className="w-full sm:w-auto">
                {newsletterLoading ? 'Subscribing...' : 'Subscribe'}
              </Button>
            </form>
          )}
        </motion.section>
      </main>
    </div>
  );
};

export default RequestQuote;
