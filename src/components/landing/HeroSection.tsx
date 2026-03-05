import { motion } from 'framer-motion';
import { QrCode, ArrowRight, TrendingUp, Receipt, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  onGetStarted: () => void;
  onScanDemo: () => void;
  cms?: Record<string, any>;
}

const floatAnimation = (delay: number, duration: number = 6) => ({
  y: [0, -14, 0],
  transition: { duration, repeat: Infinity, ease: 'easeInOut' as const, delay },
});

const GlassPanel = ({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9, y: 24 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ delay: 0.8 + delay, duration: 0.7, ease: 'easeOut' }}
    className={`bg-white/80 backdrop-blur-[30px] border border-white/60 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] ${className}`}
  >
    <motion.div animate={floatAnimation(delay)}>
      {children}
    </motion.div>
  </motion.div>
);

const HeroSection = ({ onGetStarted, onScanDemo, cms }: HeroSectionProps) => {
  const subtitle = cms?.subtitle || 'Transform restaurant operations with QR ordering, kitchen sync, real-time analytics, and seamless digital payments.';
  const ctaText = cms?.cta_text || 'Start Free';

  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden">
      {/* Clean white-blue gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-sky-50" />

      {/* Soft blue orbs */}
      <div className="absolute top-1/4 right-1/4 w-[600px] h-[500px] rounded-[60%_40%_50%_50%] bg-gradient-to-br from-blue-200/30 to-sky-100/20 blur-[80px] hidden lg:block" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[400px] rounded-[40%_60%_50%_50%] bg-gradient-to-tl from-blue-100/30 to-sky-200/15 blur-[80px] hidden lg:block" />
      <div className="absolute top-0 left-1/3 w-[350px] h-[350px] rounded-full bg-gradient-to-br from-sky-100/20 to-blue-200/10 blur-[70px]" />

      {/* Floating particles */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2.5 rounded-full bg-blue-300/20 hidden md:block"
          style={{ top: `${10 + i * 18}%`, right: `${5 + (i % 3) * 12}%` }}
          animate={{ y: [0, -15, 0], opacity: [0.15, 0.4, 0.15] }}
          transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.8 }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left - Copy */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-black mb-6 leading-[0.95] tracking-tight">
              <span className="block text-foreground">SMART</span>
              <span className="block bg-gradient-to-r from-primary to-sky-500 bg-clip-text text-transparent">QR</span>
              <span className="block text-foreground">SYSTEM</span>
            </h1>

            <p className="text-xl md:text-2xl font-semibold text-primary mb-3">
              The Digital Operating System for Modern Restaurants.
            </p>

            <p className="text-sm font-semibold tracking-widest text-muted-foreground uppercase mb-3">
              Scan. Order. Serve.
            </p>

            <p className="text-base text-muted-foreground max-w-md mb-8 leading-relaxed">
              {subtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-3">
              <Button
                size="lg"
                className="w-full sm:w-auto px-8 py-6 text-lg rounded-full bg-gradient-to-r from-primary to-sky-500 hover:from-primary/90 hover:to-sky-600 text-white shadow-lg shadow-primary/25 group font-semibold"
                onClick={onGetStarted}
              >
                {ctaText}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto px-8 py-6 text-lg rounded-full border-2 border-primary/20 text-primary hover:bg-primary/5"
                onClick={onScanDemo}
              >
                View Live Demo
              </Button>
            </div>
          </motion.div>

          {/* Right - Floating Glass Panels */}
          <div className="relative h-[460px] md:h-[540px] hidden lg:block">
            {/* Table Order Card */}
            <GlassPanel className="absolute top-0 left-4 w-60 p-4" delay={0}>
              <div className="flex items-center gap-2 mb-3">
                <UtensilsCrossed className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Table 5</span>
                <span className="ml-auto text-[10px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Active</span>
              </div>
              {['Truffle Fries', 'Chicken Biriyani', 'Mango Lassi'].map((item, i) => (
                <div key={item} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                  <span className="text-xs text-foreground/70">{item}</span>
                  <span className="text-xs text-muted-foreground">×{i + 1}</span>
                </div>
              ))}
            </GlassPanel>

            {/* Revenue Card */}
            <GlassPanel className="absolute top-20 right-0 w-56 px-5 py-4" delay={0.2}>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-sky-500" />
                <span className="text-xl font-bold text-foreground">₹42,880</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 font-medium">+12%</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Today's Revenue</span>
              <svg viewBox="0 0 100 24" className="w-full h-6 mt-2">
                <polyline
                  points="0,20 15,16 30,18 45,10 60,14 75,6 90,8 100,4"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.5"
                />
              </svg>
            </GlassPanel>

            {/* Receipt Card */}
            <GlassPanel className="absolute bottom-28 left-12 w-48 p-4" delay={0.4}>
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-bold text-foreground/80 tracking-widest uppercase">Receipt</span>
              </div>
              <div className="space-y-1 text-[11px] text-muted-foreground font-mono">
                <div className="flex justify-between"><span>Subtotal</span><span>₹1,240</span></div>
                <div className="flex justify-between"><span>Tax (5%)</span><span>₹62</span></div>
                <div className="border-t border-border/30 pt-1 flex justify-between font-semibold text-foreground/80">
                  <span>Total</span><span>₹1,302</span>
                </div>
              </div>
            </GlassPanel>

            {/* QR Code block */}
            <GlassPanel className="absolute bottom-6 right-16 w-24 h-24 flex items-center justify-center rounded-xl" delay={0.6}>
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl animate-pulse-ring" />
                <QrCode className="w-10 h-10 text-primary relative z-10" />
              </div>
            </GlassPanel>

            {/* Small receipt duplicate */}
            <GlassPanel className="absolute bottom-2 right-0 w-40 p-3" delay={0.8}>
              <div className="flex items-center gap-2 mb-1.5">
                <Receipt className="w-3 h-3 text-primary" />
                <span className="text-[9px] font-bold text-foreground/70 tracking-widest uppercase">Receipt</span>
              </div>
              <div className="space-y-0.5 text-[9px] text-muted-foreground font-mono">
                <div className="flex justify-between"><span>Subtotal</span><span>₹1,240</span></div>
                <div className="flex justify-between"><span>Tax (5%)</span><span>₹62</span></div>
                <div className="border-t border-border/30 pt-0.5 flex justify-between font-semibold text-foreground/70">
                  <span>Total</span><span>₹1,302</span>
                </div>
              </div>
            </GlassPanel>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
