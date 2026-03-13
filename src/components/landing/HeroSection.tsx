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
      {/* Accent glow orbs */}
      <div className="absolute top-1/3 left-0 w-[400px] h-[400px] rounded-full bg-primary/15 blur-[120px] z-[1]" />

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center container mx-auto px-4 pt-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center w-full">
          
          {/* Left: Logo + Text + CTAs */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.7, type: 'spring' }}
              className="mb-6"
            >
              <img src={zappyHeroLogo} alt="ZAPPY" className="h-20 sm:h-28 md:h-36 lg:h-44 w-auto object-contain brightness-[2] invert" style={{ mixBlendMode: 'screen' }} />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-lg md:text-xl text-primary-foreground/60 max-w-md mb-8 leading-relaxed"
            >
              {subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center lg:items-start gap-4"
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

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.7 }}
              className="mt-12"
            >
              <div className="flex items-center gap-8 md:gap-12">
                {stats.map((stat, i) => (
                  <div key={stat.label} className="text-center lg:text-left">
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

          {/* Right: Video */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 aspect-video"
            style={{ scale: videoScale, opacity: videoOpacity }}
          >
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
            <div className="absolute inset-0 rounded-2xl ring-1 ring-primary-foreground/10" />
          </motion.div>
        </div>
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
