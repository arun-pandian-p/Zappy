import { motion } from 'framer-motion';
import { QrCode, Sparkles, ArrowRight, TrendingUp, Receipt, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  onGetStarted: () => void;
  onScanDemo: () => void;
  cms?: Record<string, any>;
}

const floatAnimation = (delay: number, duration: number = 6) => ({
  y: [0, -12, 0],
  transition: { duration, repeat: Infinity, ease: 'easeInOut' as const, delay },
});

const GlassPanel = ({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ delay: 0.8 + delay, duration: 0.7, ease: 'easeOut' }}
    className={`bg-white/[0.08] dark:bg-white/[0.05] backdrop-blur-[30px] border border-white/[0.18] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] ${className}`}
  >
    <motion.div animate={floatAnimation(delay)}>
      {children}
    </motion.div>
  </motion.div>
);

const HeroSection = ({ onGetStarted, onScanDemo, cms }: HeroSectionProps) => {
  const badgeText = cms?.badge_text || 'QR-Powered Dining Experience';
  const title = cms?.title || 'Scan. Order. Serve. Scale.';
  const subtitle = cms?.subtitle || 'Let customers scan, browse menus, place orders, and get billed instantly — powered by real-time kitchen sync and automated POS integration.';
  const ctaText = cms?.cta_text || 'Get Started Free';

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Warm cinematic gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100 dark:from-orange-950/40 dark:via-background dark:to-amber-950/20" />

      {/* Radial light glow behind panels */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-orange-400/30 to-amber-300/20 blur-[100px] hidden lg:block" />
      <div className="absolute top-1/3 right-1/3 w-[300px] h-[300px] rounded-full bg-gradient-to-br from-yellow-300/20 to-orange-400/10 blur-[80px] hidden lg:block" />

      {/* Floating ambient orbs */}
      <motion.div
        className="absolute top-20 left-10 w-32 h-32 rounded-full bg-gradient-to-br from-orange-300 to-amber-400 opacity-40 blur-2xl hidden sm:block"
        animate={{ y: [0, -20, 0], x: [0, 10, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-32 left-1/4 w-40 h-40 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 opacity-20 blur-2xl hidden md:block"
        animate={{ y: [0, -25, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-orange-400/40 hidden md:block"
          style={{ top: `${15 + i * 14}%`, left: `${55 + (i % 3) * 15}%` }}
          animate={{ y: [0, -20, 0], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
        />
      ))}

      {/* Content - Two Column */}
      <div className="relative z-10 container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left - Copy */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-6"
            >
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-600 dark:text-orange-400">{badgeText}</span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 leading-[1.1]">
              {cms?.title ? (
                <span className="bg-gradient-to-r from-foreground via-orange-500 to-foreground/70 bg-clip-text text-transparent">
                  {title}
                </span>
              ) : (
                <>
                  <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                    Scan.{' '}
                  </span>
                  <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                    Order.{' '}
                  </span>
                  <span className="bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">
                    Serve.{' '}
                  </span>
                  <span className="bg-gradient-to-r from-foreground/80 to-foreground/60 bg-clip-text text-transparent">
                    Scale.
                  </span>
                </>
              )}
            </h1>

            <p className="text-xl md:text-2xl font-semibold text-orange-600 dark:text-orange-400 mb-4">
              The Smart Operating System for Restaurants.
            </p>

            <p className="text-lg text-muted-foreground max-w-xl mb-8">
              {subtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-3">
              <Button
                size="lg"
                className="w-full sm:w-auto px-8 py-6 text-lg rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 group"
                onClick={onGetStarted}
              >
                {ctaText}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto px-8 py-6 text-lg rounded-xl border-2 border-orange-300 dark:border-orange-700"
                onClick={onScanDemo}
              >
                View Live Demo
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="w-full sm:w-auto px-6 py-6 text-lg rounded-xl"
                onClick={onScanDemo}
              >
                <QrCode className="mr-2 w-5 h-5" />
                Scan Demo QR
              </Button>
            </div>
          </motion.div>

          {/* Right - Floating Glass Panels */}
          <div className="relative h-[420px] md:h-[500px] hidden lg:block">
            {/* Mobile Menu Preview */}
            <GlassPanel className="absolute top-4 left-8 w-56 p-4" delay={0}>
              <div className="flex items-center gap-2 mb-3">
                <UtensilsCrossed className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-semibold text-foreground/90">Hello, Alex! 👋</span>
              </div>
              <div className="flex gap-2 mb-3">
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-600 font-semibold">Lunch</span>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-foreground/5 text-foreground/60 font-medium">Dinner</span>
              </div>
              <div className="text-[10px] font-semibold text-foreground/60 uppercase tracking-wider mb-1.5">Best Seller</div>
              {[{name: 'Butter Chicken', price: '₹349'}, {name: 'Paneer Tikka', price: '₹249'}, {name: 'Mango Lassi', price: '₹99'}].map((item) => (
                <div key={item.name} className="flex items-center justify-between py-1.5 border-b border-white/10 last:border-0">
                  <span className="text-xs text-foreground/70">{item.name}</span>
                  <span className="text-xs font-semibold text-orange-500">{item.price}</span>
                </div>
              ))}
            </GlassPanel>

            {/* Revenue Badge */}
            <GlassPanel className="absolute top-2 right-4 px-5 py-3" delay={0.2}>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-lg font-bold text-foreground/90">₹42,880</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium">+12%</span>
              </div>
            </GlassPanel>

            {/* QR Digitize Card */}
            <GlassPanel className="absolute bottom-16 left-12 w-36 p-3 text-center" delay={0.4}>
              <div className="relative mb-2 flex justify-center">
                <div className="absolute inset-0 rounded-full bg-orange-400/30 blur-xl animate-pulse-ring" />
                <QrCode className="w-9 h-9 text-orange-400 relative z-10" />
              </div>
              <span className="text-[10px] font-semibold text-foreground/80 leading-tight block">Digitize Your Menu with QR</span>
            </GlassPanel>

            {/* Order Summary */}
            <GlassPanel className="absolute bottom-8 right-8 w-44 p-3" delay={0.6}>
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-[10px] font-semibold text-foreground/80 tracking-wider uppercase">Order #1024</span>
              </div>
              <div className="space-y-1 text-[10px] text-foreground/60 font-mono">
                <div className="flex justify-between"><span>Subtotal</span><span>₹1,240</span></div>
                <div className="flex justify-between"><span>Tax (5%)</span><span>₹62</span></div>
                <div className="border-t border-white/10 pt-1 flex justify-between font-semibold text-foreground/80">
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
