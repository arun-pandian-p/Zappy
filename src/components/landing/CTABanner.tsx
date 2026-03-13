import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import ctaBannerBg from '@/assets/cta-banner-bg.jpg';

interface CTABannerProps {
  onGetStarted: () => void;
  cms?: Record<string, any>;
}

const animatedWords = ['Restaurant', 'Café', 'Cloud Kitchen', 'Food Court', 'Bar & Lounge'];

const CTABanner = ({ onGetStarted, cms }: CTABannerProps) => {
  const subtitle = cms?.subtitle || 'Join hundreds of restaurants already using ZAPPY QR MANAGEMENT';
  const ctaText = cms?.cta_text || 'Get Started Free';
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % animatedWords.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={ctaBannerBg}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/80 to-sky-500/85" />
      <motion.div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/10 blur-xl" animate={{ y: [0, -20, 0], x: [0, 10, 0] }} transition={{ duration: 6, repeat: Infinity }} />
      <motion.div className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-white/5 blur-2xl" animate={{ y: [0, 15, 0], x: [0, -15, 0] }} transition={{ duration: 8, repeat: Infinity }} />

      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold text-primary-foreground mb-6">
            Ready to Transform Your{' '}
            <span className="inline-block relative min-w-[200px] md:min-w-[280px]">
              <AnimatePresence mode="wait">
                <motion.span
                  key={animatedWords[wordIndex]}
                  initial={{ y: 30, opacity: 0, rotateX: -90 }}
                  animate={{ y: 0, opacity: 1, rotateX: 0 }}
                  exit={{ y: -30, opacity: 0, rotateX: 90 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                  className="inline-block bg-primary-foreground/20 backdrop-blur-sm px-3 py-1 rounded-lg border border-primary-foreground/20"
                >
                  {animatedWords[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
            ?
          </h2>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto mb-10">{subtitle}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={onGetStarted}
              className="w-full sm:w-auto bg-primary-foreground text-primary hover:bg-primary-foreground/90 px-8 py-6 text-lg rounded-xl shadow-lg group font-bold"
            >
              {ctaText}
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              className="w-full sm:w-auto bg-white/20 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-primary px-8 py-6 text-lg rounded-xl font-bold shadow-lg transition-colors"
            >
              <Headphones className="mr-2 w-5 h-5" />
              Contact Sales
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTABanner;
