import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Zap, ChevronDown, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRef, useEffect } from 'react';

interface HeroSectionProps {
  onGetStarted: () => void;
  onBookDemo: () => void;
  onWatchTour: () => void;
  cms?: Record<string, any>;
}

const stats = [
  { value: '100+', label: 'Restaurants' },
  { value: '99.9%', label: 'Uptime' },
  { value: '24/7', label: 'Support' },
  { value: 'AI', label: 'Powered' }
];

const HeroSection = ({ onGetStarted, onBookDemo, onWatchTour, cms }: HeroSectionProps) => {
  const headline = cms?.headline || 'Run Your Entire Restaurant from One Dashboard';
  const subtitle = cms?.subtitle || 'Orders, Tables, Kitchen, Staff, Inventory, Billing, Analytics and Marketing — all powered by ZAPPY.';
  const ctaText = cms?.cta_text || 'Start Free Trial';
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const videoOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.3]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {});
    const handleVisibility = () => {
      if (!document.hidden) {
        video.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  return (
    <section ref={sectionRef} className="relative min-h-screen flex flex-col overflow-hidden bg-foreground">
      {/* Subtle tech grid background */}
      <div className="absolute inset-0 z-0 opacity-[0.08]" style={{
        backgroundImage: `linear-gradient(hsl(var(--primary-foreground) / 0.6) 1px, transparent 1px),
                          linear-gradient(90deg, hsl(var(--primary-foreground) / 0.6) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />
      {/* Animated grid dot accents */}
      <div className="absolute inset-0 z-0 opacity-[0.12]" style={{
        backgroundImage: `radial-gradient(circle, hsl(var(--primary)) 1.2px, transparent 1.2px)`,
        backgroundSize: '60px 60px',
        backgroundPosition: '30px 30px',
      }} />

      {/* Accent glow orbs with parallax */}
      <motion.div
        className="absolute top-1/3 left-0 w-[400px] h-[400px] rounded-full bg-primary/15 blur-[120px] z-[1]"
        style={{ y: useTransform(scrollYProgress, [0, 1], [0, -80]) }}
      />

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center container mx-auto px-6 pt-28 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          
          {/* Left: Logo + Text + CTAs */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.7, type: 'spring' }}
              className="mb-6">
              
              <div className="flex justify-center lg:justify-start">
                <img alt="ZAPPY" className="h-10 w-auto object-contain" src="/zappy-uploads/53e47e43-08ad-46f9-a01e-426fd946553a.png" />
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black text-primary-foreground tracking-tight mb-6 leading-tight max-w-xl">
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">{headline}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-lg md:text-xl text-primary-foreground/60 max-w-lg mb-10 leading-relaxed">
              {subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex flex-col sm:flex-row flex-wrap items-center lg:items-start gap-3 w-full sm:w-auto">
              
              <Button
                size="lg"
                className="w-full sm:w-auto px-6 py-6 text-base rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_30px_hsl(var(--primary)/0.3)] group font-bold"
                onClick={onGetStarted}>
                <Zap className="w-4.5 h-4.5 mr-1.5" />
                {ctaText}
                <ArrowRight className="ml-1.5 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                className="w-full sm:w-auto px-6 py-6 text-base rounded-full bg-primary-foreground text-foreground hover:bg-primary-foreground/90 font-semibold"
                onClick={onBookDemo}>
                Book Demo
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto px-6 py-6 text-base rounded-full border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-foreground font-semibold"
                onClick={onWatchTour}>
                <Play className="w-4 h-4 mr-1.5 fill-current" />
                Watch Tour
              </Button>
            </motion.div>

            {/* Stats / Trust Bar */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.7 }}
              className="mt-12 w-full">
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-lg mx-auto lg:mx-0">
                {stats.map((stat, i) =>
                  <div key={stat.label} className="text-center lg:text-left">
                    <motion.p
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.2 + i * 0.15, duration: 0.5, type: 'spring' }}
                      className="text-2xl md:text-3xl font-black text-primary-foreground">
                      {stat.value}
                    </motion.p>
                    <p className="text-xs md:text-sm text-primary-foreground/40 mt-1 font-semibold tracking-wide uppercase">{stat.label}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right: Video Container */}
          <div className="relative w-full aspect-video lg:col-span-6 flex items-center justify-center">
            {/* Soft ambient glow behind the SVG */}
            <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full scale-75 -z-10" />

            {/* Z-shaped SVG decoration */}
            <svg
              className="absolute -inset-8 w-[calc(100%+64px)] h-[calc(100%+64px)] opacity-30 select-none pointer-events-none -z-10 text-primary/40"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <motion.path
                d="M 15 15 L 85 15 L 15 85 L 85 85"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 3, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
              />
              <circle cx="15" cy="15" r="1.5" fill="currentColor" />
              <circle cx="85" cy="15" r="1.5" fill="currentColor" />
              <circle cx="15" cy="85" r="1.5" fill="currentColor" />
              <circle cx="85" cy="85" r="1.5" fill="currentColor" />
            </svg>

            {/* Video */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 aspect-video w-full"
              style={{ scale: videoScale, opacity: videoOpacity }}>
              
              <video
                ref={videoRef}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                onEnded={(e) => {
                  const video = e.currentTarget;
                  video.currentTime = 0;
                  video.play().catch(() => {});
                }}
                className="w-full h-full object-cover"
                src="/videos/brand-identity-2.mp4" />
              
            </motion.div>
          </div>

        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 1 }}
        className="relative z-10 pb-8 flex justify-center">
        
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
          
          <ChevronDown className="w-6 h-6 text-primary-foreground/30" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;