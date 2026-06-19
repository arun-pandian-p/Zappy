import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Menu, X, Play, Loader2, Send, CheckCircle2 } from 'lucide-react';
import { ZappyLogo } from '@/components/branding/ZappyLogo';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ScrollProgress from '@/components/landing/ScrollProgress';
import HeroSection from '@/components/landing/HeroSection';
import FAQSection from '@/components/landing/FAQSection';
import ParallaxSection from '@/components/landing/ParallaxSection';
import { Problem } from '@/pages/landing/sections/Problem';
import { Solution } from '@/pages/landing/sections/Solution';
import { Features } from '@/pages/landing/sections/Features';
import { Proof } from '@/pages/landing/sections/Proof';
import { CTA } from '@/pages/landing/sections/CTA';
import { Footer } from '@/pages/landing/Footer';
import { useLandingCMS } from '@/hooks/useLandingCMS';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { invokeFunction } from '@/integrations/supabase/functions';
import { toast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";

const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [bookDemoOpen, setBookDemoOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [demoSubmitting, setDemoSubmitting] = useState(false);
  const [demoSubmitted, setDemoSubmitted] = useState(false);

  const [demoForm, setDemoForm] = useState({
    name: '',
    restaurantName: '',
    phone: '',
    email: '',
    branches: '1',
    city: ''
  });

  const { sections } = useLandingCMS();

  // Build a map of section_key -> content for easy access
  const cms = useMemo(() => {
    const map: Record<string, {content: Record<string, any>;visible: boolean;}> = {};
    sections.forEach((s) => {
      map[s.section_key] = { content: s.content_json as Record<string, any>, visible: s.is_visible };
    });
    return map;
  }, [sections]);

  const isVisible = (key: string) => cms[key]?.visible !== false;

  const handleGetStarted = () => navigate('/login');

  const handleBookDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoForm.name || !demoForm.email || !demoForm.restaurantName) {
      toast({ title: 'Please fill in Name, Restaurant, and Email', variant: 'destructive' });
      return;
    }
    setDemoSubmitting(true);

    try {
      // 1. Store lead in database
      const { error: dbError } = await supabase.from('leads').insert({
        name: demoForm.name,
        restaurant_name: demoForm.restaurantName,
        phone: demoForm.phone || null,
        email: demoForm.email,
        city: demoForm.city || null,
        branches: parseInt(demoForm.branches) || 1,
        status: 'New'
      });

      if (dbError) throw dbError;

      // 2. Trigger notification Edge function
      const { error } = await invokeFunction('notify-quote', {
        body: {
          name: demoForm.name,
          email: demoForm.email,
          phone: demoForm.phone || null,
          restaurant_name: demoForm.restaurantName,
          city: demoForm.city || null,
          num_tables: 0,
          current_system: 'demo_request',
          features_needed: [`Branches: ${demoForm.branches}`],
          message: `Demo request from Zappy landing page. City: ${demoForm.city}, Branches: ${demoForm.branches}.`,
          is_demo_request: true,
          branches: demoForm.branches
        }
      });

      if (error) throw error;

      setDemoSubmitted(true);
      toast({ title: 'Request Submitted!', description: 'We will contact you shortly.' });
      setDemoForm({
        name: '',
        restaurantName: '',
        phone: '',
        email: '',
        branches: '1',
        city: ''
      });
      setTimeout(() => {
        setBookDemoOpen(false);
        setDemoSubmitted(false);
      }, 3000);
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Submission failed', description: err.message || 'Something went wrong.', variant: 'destructive' });
    } finally {
      setDemoSubmitting(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowFloatingButton(true);
      } else {
        setShowFloatingButton(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Problem', href: '#problem' },
    { label: 'Solution', href: '#solution' },
    { label: 'Features', href: '#features' },
    { label: 'Results', href: '#proof' },
    { label: 'FAQ', href: '#faq' }
  ];

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ScrollProgress />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <ZappyLogo size={56} compact />
            </div>

            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) =>
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleScrollTo(e, link.href)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left">
                  {link.label}
                </a>
              )}
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/login')}>
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </Button>
              <Button onClick={() => setBookDemoOpen(true)}>Book Demo</Button>
              <Button variant="outline" onClick={handleGetStarted}>Start Free Trial</Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen &&
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t bg-background overflow-hidden">
              
              <div className="container mx-auto px-4 py-4 space-y-4">
                {navLinks.map((link) =>
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => handleScrollTo(e, link.href)}
                    className="block text-sm text-muted-foreground hover:text-foreground">
                    {link.label}
                  </a>
                )}
                <div className="pt-4 border-t flex flex-col gap-2">
                  <Button variant="outline" onClick={() => navigate('/login')}>Login</Button>
                  <Button onClick={() => { setMobileMenuOpen(false); setBookDemoOpen(true); }}>Book Demo</Button>
                  <Button onClick={handleGetStarted}>Start Free Trial</Button>
                </div>
              </div>
            </motion.div>
          }
        </AnimatePresence>
      </motion.header>

      {/* Main Content */}
      <main className="pt-16">
        {/* 1. Hero */}
        {isVisible('hero') &&
          <HeroSection 
            onGetStarted={handleGetStarted} 
            onBookDemo={() => setBookDemoOpen(true)} 
            onWatchTour={() => setTourOpen(true)}
            cms={cms.hero?.content} 
          />
        }

        {/* 2. Problem */}
        <ParallaxSection yOffset={35} fadeIn>
          <Problem />
        </ParallaxSection>

        {/* 3. Solution Flow */}
        <ParallaxSection yOffset={30} fadeIn>
          <Solution />
        </ParallaxSection>

        {/* 4. Features */}
        <ParallaxSection yOffset={30} fadeIn>
          <Features />
        </ParallaxSection>

        {/* 5. Proof / Results */}
        <ParallaxSection yOffset={25} fadeIn>
          <Proof />
        </ParallaxSection>

        {/* FAQ */}
        <ParallaxSection yOffset={20} fadeIn>
          <div id="faq">
            <FAQSection />
          </div>
        </ParallaxSection>

        {/* 6. CTA Banner */}
        <ParallaxSection yOffset={20} fadeIn>
          <CTA 
            onGetStarted={handleGetStarted}
            onBookDemo={() => setBookDemoOpen(true)}
            onWatchTour={() => setTourOpen(true)}
          />
        </ParallaxSection>
      </main>

      {/* 9. Footer */}
      <Footer />

      {/* Floating Book Demo button */}
      <AnimatePresence>
        {showFloatingButton && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.8 }}
            className="fixed bottom-6 right-6 z-40"
          >
            <Button
              onClick={() => setBookDemoOpen(true)}
              size="lg"
              className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 px-6 py-6"
            >
              Book Demo
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Book Demo Modal */}
      <Dialog open={bookDemoOpen} onOpenChange={setBookDemoOpen}>
        <DialogContent className="max-w-md rounded-3xl" aria-describedby="demo-desc">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Book ZAPPY Demo</DialogTitle>
            <DialogDescription id="demo-desc">
              Request a live interactive product tour and demo with our restaurant solution specialist.
            </DialogDescription>
          </DialogHeader>

          {demoSubmitted ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-green-500 animate-bounce" />
              <h3 className="text-lg font-bold text-slate-800">Request Received!</h3>
              <p className="text-sm text-muted-foreground">We'll reach out to schedule your tour shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleBookDemoSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="demo-name" className="text-xs font-semibold">Your Name *</Label>
                <Input
                  id="demo-name"
                  placeholder="John Doe"
                  value={demoForm.name}
                  onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="demo-rest" className="text-xs font-semibold">Restaurant Name *</Label>
                <Input
                  id="demo-rest"
                  placeholder="Bella Italia Bistro"
                  value={demoForm.restaurantName}
                  onChange={(e) => setDemoForm({ ...demoForm, restaurantName: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="demo-phone" className="text-xs font-semibold">Phone *</Label>
                  <Input
                    id="demo-phone"
                    placeholder="+91 98765 43210"
                    value={demoForm.phone}
                    onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="demo-email" className="text-xs font-semibold">Email *</Label>
                  <Input
                    id="demo-email"
                    type="email"
                    placeholder="john@restaurant.com"
                    value={demoForm.email}
                    onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="demo-branches" className="text-xs font-semibold">Number of Branches</Label>
                  <Input
                    id="demo-branches"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={demoForm.branches}
                    onChange={(e) => setDemoForm({ ...demoForm, branches: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="demo-city" className="text-xs font-semibold">City *</Label>
                  <Input
                    id="demo-city"
                    placeholder="Mumbai"
                    value={demoForm.city}
                    onChange={(e) => setDemoForm({ ...demoForm, city: e.target.value })}
                    required
                  />
                </div>
              </div>

              <Button type="submit" disabled={demoSubmitting} className="w-full rounded-2xl h-11 font-bold gap-2">
                {demoSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Submit Demo Request
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Watch Tour Modal */}
      <Dialog open={tourOpen} onOpenChange={setTourOpen}>
        <DialogContent className="max-w-3xl rounded-3xl overflow-hidden p-0 border-0 bg-black" aria-describedby="tour-desc">
          <DialogHeader className="p-4 bg-zinc-900 flex flex-row items-center justify-between text-white border-b border-zinc-800">
            <div>
              <DialogTitle className="text-base font-bold">ZAPPY Product Tour</DialogTitle>
              <DialogDescription id="tour-desc" className="text-xs text-zinc-400">
                A brief overview of our integrated Restaurant OS.
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setTourOpen(false)} className="text-white hover:bg-zinc-800">
              <X className="w-4 h-4" />
            </Button>
          </DialogHeader>
          <div className="aspect-video w-full">
            <video
              src="/videos/brand-identity-2.mp4"
              controls
              autoPlay
              className="w-full h-full object-cover"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingPage;