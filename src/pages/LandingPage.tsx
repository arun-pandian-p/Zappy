import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Menu, X, Loader2, Send, CheckCircle2 } from 'lucide-react';
import { ZappyLogo } from '@/components/branding/ZappyLogo';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ScrollProgress from '@/components/landing/ScrollProgress';
import HeroSection from '@/components/landing/HeroSection';
import DailyChallenge from '@/components/landing/DailyChallenge';
import Transformation from '@/components/landing/Transformation';
import Ecosystem from '@/components/landing/Ecosystem';
import MealStory from '@/components/landing/MealStory';
import ModernRestaurants from '@/components/landing/ModernRestaurants';
import ProductExperience from '@/components/landing/ProductExperience';
import ProductDemo from '@/components/landing/ProductDemo';
import FAQSection from '@/components/landing/FAQSection';
import FinalCTA from '@/components/landing/FinalCTA';
import Footer from '@/components/landing/Footer';
import { useLandingCMS } from '@/hooks/useLandingCMS';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { invokeFunction } from '@/integrations/supabase/functions';
import { toast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { cn } from '@/lib/utils';

const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [headerDark, setHeaderDark] = useState(true);
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
      const y = window.scrollY;
      setShowFloatingButton(y > 300);
      setHeaderDark(y < 640);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Daily Struggles', href: '#challenge' },
    { label: 'How It Works', href: '#ecosystem' },
    { label: 'Common Questions', href: '#faq' }
  ];

  return (
    <div className="landing-theme min-h-screen bg-[#F7F5F0] text-[#111111]">
      <ScrollProgress />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b transition-colors duration-300',
          headerDark
            ? 'bg-[#0A1628]/90 border-white/10 text-white'
            : 'bg-[#F7F5F0]/90 border-[#111111]/8 text-[#111111]'
        )}>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex lg:grid lg:grid-cols-[auto_1fr_auto] items-center justify-between h-16 lg:h-[72px] gap-x-4 lg:gap-x-6">
            <div className="flex items-center shrink-0">
              <ZappyLogo size={48} compact variant={headerDark ? 'dark' : 'light'} />
            </div>

            <nav className="hidden lg:flex items-center justify-center gap-x-5 xl:gap-x-8 min-w-0">
              {navLinks.map((link) =>
                <a
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'text-[11px] xl:text-xs uppercase tracking-widest font-semibold transition-colors whitespace-nowrap relative after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[2px] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left',
                    headerDark
                      ? 'text-white/65 hover:text-[#5EA8FF] after:bg-[#5EA8FF]'
                      : 'text-[#111111]/60 hover:text-[#3B82F6] after:bg-[#3B82F6]'
                  )}>
                  {link.label}
                </a>
              )}
            </nav>

            <div className="hidden lg:flex items-center justify-end gap-2 shrink-0">
              <Button 
                variant="ghost" 
                className={cn(
                  'h-10 px-3 text-xs uppercase tracking-wider font-bold hover:bg-transparent',
                  headerDark ? 'text-white/80 hover:text-[#5EA8FF]' : 'text-[#111111]/80 hover:text-[#3B82F6]'
                )}
                onClick={() => navigate('/login')}
              >
                <LogIn className="w-4 h-4 mr-1.5" />
                Login
              </Button>
              <Button 
                onClick={() => setBookDemoOpen(true)}
                className="h-10 px-5 rounded-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs uppercase tracking-wider shadow-sm shadow-blue-500/20"
              >
                Book Demo
              </Button>
              <Button 
                variant="outline" 
                onClick={handleGetStarted}
                className={cn(
                  'h-10 px-5 rounded-full font-bold text-xs uppercase tracking-wider',
                  headerDark
                    ? 'border-white/25 bg-transparent text-white hover:bg-white/10'
                    : 'border-[#111111]/10 bg-transparent text-[#111111] hover:bg-[#111111]/5'
                )}
              >
                Start Free Trial
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className={cn('lg:hidden shrink-0', headerDark ? 'text-white' : 'text-[#111111]')}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen &&
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={cn(
                'lg:hidden border-t overflow-hidden',
                headerDark ? 'border-white/10 bg-[#0A1628]' : 'border-[#111111]/8 bg-[#F7F5F0]'
              )}>
              
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-3">
                {navLinks.map((link) =>
                  <a
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'block text-xs uppercase tracking-widest font-bold transition-colors',
                      headerDark ? 'text-white/65 hover:text-[#5EA8FF]' : 'text-[#111111]/60 hover:text-[#3B82F6]'
                    )}
                    onClick={() => setMobileMenuOpen(false)}>
                    {link.label}
                  </a>
                )}
                <div className={cn('pt-4 border-t flex flex-col gap-2', headerDark ? 'border-white/10' : 'border-[#111111]/5')}>
                  <Button variant="outline" className={cn('font-bold text-xs uppercase tracking-wider rounded-full h-11', headerDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-[#111111]/10 text-[#111111]')} onClick={() => navigate('/login')}>Login</Button>
                  <Button className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs uppercase tracking-wider rounded-full h-11" onClick={() => { setMobileMenuOpen(false); setBookDemoOpen(true); }}>Book Demo</Button>
                  <Button className={cn('font-bold text-xs uppercase tracking-wider rounded-full h-11', headerDark ? 'border border-white/20 text-white bg-transparent hover:bg-white/10' : 'border-[#111111]/10 text-[#111111]')} onClick={handleGetStarted}>Start Free Trial</Button>
                </div>
              </div>
            </motion.div>
          }
        </AnimatePresence>
      </motion.header>

      {/* Main Content */}
      <main>
        {/* Section 1: Hero */}
        {isVisible('hero') &&
          <HeroSection 
            onGetStarted={handleGetStarted} 
            onBookDemo={() => setBookDemoOpen(true)} 
            onWatchTour={() => setTourOpen(true)}
            cms={cms.hero?.content} 
          />
        }

        {/* Section 2: The Daily Challenge */}
        {isVisible('features') &&
          <div id="challenge">
            <DailyChallenge />
          </div>
        }

        {/* Section 3: The Transformation */}
        {isVisible('how_it_works') &&
          <Transformation />
        }

        {/* Section 4: Ecosystem horizontal showcase */}
        <div id="ecosystem">
          <Ecosystem />
        </div>

        {/* Section 5: Every Meal Has A Story */}
        <MealStory />

        {/* Section 6: Built for Modern Restaurants */}
        <ModernRestaurants />

        {/* Section 8: Product Experience */}
        <ProductExperience />

        {/* Section 9: Interactive Product Demo */}
        <ProductDemo />

        {/* Section FAQ */}
        <div id="faq">
          <FAQSection />
        </div>

        {/* Section 11: Final CTA */}
        {isVisible('cta_banner') &&
          <FinalCTA onGetStarted={handleGetStarted} />
        }
      </main>

      {/* Footer */}
      {isVisible('footer') && <Footer cms={cms.footer?.content} />}

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
              className="rounded-full bg-[#FF6B00] hover:bg-[#FF6B00]/95 text-white font-bold shadow-lg shadow-orange-500/20 px-6 py-6 uppercase text-xs tracking-wider"
            >
              Book Demo
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Book Demo Modal */}
      <Dialog open={bookDemoOpen} onOpenChange={setBookDemoOpen}>
        <DialogContent className="max-w-md rounded-3xl bg-[#F7F5F0] border border-[#111111]/8" aria-describedby="demo-desc">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-[#111111] uppercase tracking-tight">Book ZAPPY Demo</DialogTitle>
            <DialogDescription id="demo-desc" className="text-sm text-[#111111]/60 font-light">
              Request a live interactive product tour and demo with our restaurant solution specialist.
            </DialogDescription>
          </DialogHeader>

          {demoSubmitted ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-[#FF6B00] animate-bounce" />
              <h3 className="text-lg font-bold text-[#111111] uppercase">Request Received!</h3>
              <p className="text-sm text-[#111111]/60">We'll reach out to schedule your tour shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleBookDemoSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="demo-name" className="text-xs font-semibold uppercase tracking-wider text-[#111111]/60">Your Name *</Label>
                <Input
                  id="demo-name"
                  placeholder="John Doe"
                  className="bg-white border-[#111111]/8 rounded-xl focus-visible:ring-[#FF6B00]"
                  value={demoForm.name}
                  onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="demo-rest" className="text-xs font-semibold uppercase tracking-wider text-[#111111]/60">Restaurant Name *</Label>
                <Input
                  id="demo-rest"
                  placeholder="Bella Italia Bistro"
                  className="bg-white border-[#111111]/8 rounded-xl focus-visible:ring-[#FF6B00]"
                  value={demoForm.restaurantName}
                  onChange={(e) => setDemoForm({ ...demoForm, restaurantName: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="demo-phone" className="text-xs font-semibold uppercase tracking-wider text-[#111111]/60">Phone *</Label>
                  <Input
                    id="demo-phone"
                    placeholder="+91 98765 43210"
                    className="bg-white border-[#111111]/8 rounded-xl focus-visible:ring-[#FF6B00]"
                    value={demoForm.phone}
                    onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="demo-email" className="text-xs font-semibold uppercase tracking-wider text-[#111111]/60">Email *</Label>
                  <Input
                    id="demo-email"
                    type="email"
                    placeholder="john@restaurant.com"
                    className="bg-white border-[#111111]/8 rounded-xl focus-visible:ring-[#FF6B00]"
                    value={demoForm.email}
                    onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="demo-branches" className="text-xs font-semibold uppercase tracking-wider text-[#111111]/60">Number of Branches</Label>
                  <Input
                    id="demo-branches"
                    type="number"
                    min="1"
                    placeholder="1"
                    className="bg-white border-[#111111]/8 rounded-xl focus-visible:ring-[#FF6B00]"
                    value={demoForm.branches}
                    onChange={(e) => setDemoForm({ ...demoForm, branches: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="demo-city" className="text-xs font-semibold uppercase tracking-wider text-[#111111]/60">City *</Label>
                  <Input
                    id="demo-city"
                    placeholder="Mumbai"
                    className="bg-white border-[#111111]/8 rounded-xl focus-visible:ring-[#FF6B00]"
                    value={demoForm.city}
                    onChange={(e) => setDemoForm({ ...demoForm, city: e.target.value })}
                    required
                  />
                </div>
              </div>

              <Button type="submit" disabled={demoSubmitting} className="w-full bg-[#FF6B00] hover:bg-[#FF6B00]/95 text-white font-bold rounded-full py-6 uppercase text-xs tracking-wider gap-2 mt-2">
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