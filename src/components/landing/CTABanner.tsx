import { motion } from 'framer-motion';
import { ArrowRight, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CTABannerProps {
  onGetStarted: () => void;
  cms?: Record<string, any>;
}

const CTABanner = ({ onGetStarted, cms }: CTABannerProps) => {
  const headline = cms?.headline || 'Ready to Transform Your Restaurant?';
  const subtitle = cms?.subtitle || 'Join 500+ restaurants already using QR Dine Pro to serve customers faster and smarter.';
  const ctaText = cms?.cta_text || 'Get Started Free';

  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-accent" />
      <motion.div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/10 blur-xl" animate={{ y: [0, -20, 0], x: [0, 10, 0] }} transition={{ duration: 6, repeat: Infinity }} />
      <motion.div className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-white/5 blur-2xl" animate={{ y: [0, 15, 0], x: [0, -15, 0] }} transition={{ duration: 8, repeat: Infinity }} />
      <motion.div className="absolute top-1/2 left-1/3 w-20 h-20 rounded-full bg-white/10 blur-lg" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 5, repeat: Infinity }} />

      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold text-white mb-6">{headline}</h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-10">{subtitle}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 px-8 py-6 text-lg rounded-xl shadow-lg group" onClick={onGetStarted}>
              {ctaText}
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-xl">
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
