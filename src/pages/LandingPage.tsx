import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Menu, X } from 'lucide-react';
import { ZappyLogo } from '@/components/branding/ZappyLogo';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ScrollProgress from '@/components/landing/ScrollProgress';
import HeroSection from '@/components/landing/HeroSection';
import BrandStrip from '@/components/landing/BrandStrip';
import FeaturesSection from '@/components/landing/FeaturesSection';
import ProductDemo from '@/components/landing/ProductDemo';
import HowItWorks from '@/components/landing/HowItWorks';
import DashboardCarousel from '@/components/landing/DashboardCarousel';
import LiveDashboardTeaser from '@/components/landing/LiveDashboardTeaser';
import IntegrationsCloud from '@/components/landing/IntegrationsCloud';
import PricingSection from '@/components/landing/PricingSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import FAQSection from '@/components/landing/FAQSection';
import CTABanner from '@/components/landing/CTABanner';
import Footer from '@/components/landing/Footer';
import TrustCounters from '@/components/landing/TrustCounters';
import ParallaxSection from '@/components/landing/ParallaxSection';
import { useLandingCMS } from '@/hooks/useLandingCMS';

const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showFloatingButton, setShowFloatingButton] = useState(false);
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
  const handleScanDemo = () => navigate('/order?slug=arun&table=T1&demo=true');
  const handleSelectPlan = (plan: string) => {
    console.log('Selected plan:', plan);
    navigate('/login');
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
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' }
  ];

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
              <Button onClick={handleGetStarted}>Get Started</Button>
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
                    className="block text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setMobileMenuOpen(false)}>
                    {link.label}
                  </a>
                )}
                <div className="pt-4 border-t flex flex-col gap-2">
                  <Button variant="outline" onClick={() => navigate('/login')}>Login</Button>
                  <Button onClick={handleGetStarted}>Get Started</Button>
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
          <HeroSection onGetStarted={handleGetStarted} onScanDemo={handleScanDemo} cms={cms.hero?.content} />
        }

        {/* 2. Brand strip */}
        <BrandStrip />

        {/* 3. Live Dashboard Teaser */}
        <ParallaxSection yOffset={30} fadeIn>
          <LiveDashboardTeaser />
        </ParallaxSection>

        {/* 4. Features */}
        {isVisible('features') &&
          <ParallaxSection yOffset={35} fadeIn>
            <div id="features">
              <FeaturesSection cms={cms.features?.content} />
            </div>
          </ParallaxSection>
        }

        {/* 5. Product Demo */}
        <ParallaxSection yOffset={25} fadeIn scaleUp>
          <ProductDemo />
        </ParallaxSection>

        {/* 6. How it works */}
        {isVisible('how_it_works') &&
          <ParallaxSection yOffset={30} fadeIn>
            <div id="how-it-works">
              <HowItWorks cms={cms.how_it_works?.content} />
            </div>
          </ParallaxSection>
        }

        {/* 7. Dashboard Carousel */}
        <ParallaxSection yOffset={20} fadeIn>
          <DashboardCarousel />
        </ParallaxSection>
        
        {/* 8. Integrations Cloud */}
        <ParallaxSection yOffset={25} fadeIn>
          <IntegrationsCloud />
        </ParallaxSection>

        {/* 9. Testimonials */}
        {isVisible('testimonials') &&
          <ParallaxSection yOffset={20} fadeIn>
            <TestimonialsSection cms={cms.testimonials?.content} />
          </ParallaxSection>
        }

        {/* 10. Trust Counters */}
        <ParallaxSection yOffset={20} fadeIn>
          <TrustCounters />
        </ParallaxSection>

        {/* 11. Pricing */}
        {isVisible('pricing') &&
          <ParallaxSection yOffset={30} fadeIn>
            <div id="pricing">
              <PricingSection onSelectPlan={handleSelectPlan} cms={cms.pricing?.content} />
            </div>
          </ParallaxSection>
        }

        {/* 12. FAQ */}
        <ParallaxSection yOffset={20} fadeIn>
          <div id="faq">
            <FAQSection />
          </div>
        </ParallaxSection>

        {/* 13. CTA Banner */}
        {isVisible('cta_banner') &&
          <CTABanner onGetStarted={handleGetStarted} cms={cms.cta_banner?.content} />
        }
      </main>

      {/* 14. Footer */}
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
              onClick={handleScanDemo}
              size="lg"
              className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 px-6 py-6"
            >
              Book Demo
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingPage;