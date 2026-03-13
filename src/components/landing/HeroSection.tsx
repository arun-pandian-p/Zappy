import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Zap, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRef } from 'react';
import zappyHeroLogo from '@/assets/zappy-hero-logo.png';

interface HeroSectionProps {
  onGetStarted: () => void;
  onScanDemo: () => void;
  cms?: Record<string, any>;
}

const stats = [
  { value: '10K+', label: 'Orders Processed' },
  { value: '500+', label: 'Restaurants' },
  { value: '99.9%', label: 'Uptime' },
];

const HeroSection = ({ onGetStarted, onScanDemo, cms }: HeroSectionProps) => {
  const subtitle = cms?.subtitle || 'Transform your restaurant operations with intelligent digital ordering, real-time kitchen sync, and powerful analytics.';
  const ctaText = cms?.cta_text || 'Get Started Free';
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const videoOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.3]);

  return (
    <section ref={sectionRef} className="relative min-h-screen flex flex-col overflow-hidden bg-foreground">
      {/* Heavy overlay to hide video watermark text */}
      <div className="absolute inset-0 bg-gradient-to-b from-foreground/80 via-foreground/70 to-foreground/90 z-[1]" />

      {/* Video Background */}
      <motion.div className="absolute inset-0 z-0" style={{ scale: videoScale, opacity: videoOpacity }}>
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
          poster="/og-image.png"
        >
          <source src="/videos/brand-identity.mp4" type="video/mp4" />
        </video>
      </motion.div>

      {/* Accent glow orbs */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/15 blur-[120px] z-[1]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/10 blur-[100px] z-[1]" />

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.7, type: 'spring' }}
            className="flex justify-center mb-4"
          >
            <img src={zappyHeroLogo} alt="ZAPPY" className="h-24 sm:h-32 md:h-40 lg:h-52 w-auto object-contain" style={{ mixBlendMode: 'screen' }} />
          </motion.div>


          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-lg md:text-xl text-primary-foreground/60 max-w-xl mx-auto mb-10 leading-relaxed"
          >
            {subtitle}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="lg"
              className="w-full sm:w-auto px-10 py-7 text-lg rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_40px_hsl(var(--primary)/0.4)] group font-bold"
              onClick={onGetStarted}
            >
              <Zap className="w-5 h-5 mr-2" />
              {ctaText}
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto px-10 py-7 text-lg rounded-full border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground backdrop-blur-md font-semibold shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              onClick={onScanDemo}
            >
              View Live Demo
            </Button>
          </motion.div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.7 }}
          className="mt-20 max-w-2xl mx-auto"
        >
          <div className="flex items-center justify-center gap-8 md:gap-16">
            {stats.map((stat, i) => (
              <div key={stat.label} className="text-center">
                <motion.p
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.4 + i * 0.15, duration: 0.5, type: 'spring' }}
                  className="text-2xl md:text-3xl font-black text-primary-foreground"
                >
                  {stat.value}
                </motion.p>
                <p className="text-xs md:text-sm text-primary-foreground/40 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="relative z-10 pb-8 flex justify-center"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-6 h-6 text-primary-foreground/30" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
