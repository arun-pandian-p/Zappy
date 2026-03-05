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
    className={`bg-white/[0.12] backdrop-blur-[30px] border border-white/[0.22] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] ${className}`}
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
      {/* Deep green cinematic gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a3d2a] via-[#0d4f35] to-[#1a5c3a]" />

      {/* Organic blob shapes */}
      <div className="absolute top-1/4 right-1/4 w-[600px] h-[500px] rounded-[60%_40%_50%_50%] bg-gradient-to-br from-emerald-500/25 to-green-400/15 blur-[60px] hidden lg:block" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[400px] rounded-[40%_60%_50%_50%] bg-gradient-to-tl from-emerald-400/20 to-teal-500/10 blur-[80px] hidden lg:block" />
      <div className="absolute top-0 left-1/3 w-[350px] h-[350px] rounded-full bg-gradient-to-br from-green-300/10 to-emerald-600/5 blur-[70px]" />

      {/* Warm rim light at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-amber-500/10 to-transparent" />

      {/* Floating water droplets */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2.5 rounded-full bg-white/15 hidden md:block"
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
              <span className="block text-amber-50/90">SMART</span>
              <span className="block text-amber-50/90">QR</span>
              <span className="block text-amber-50/90">SYSTEM</span>
            </h1>

            <p className="text-xl md:text-2xl font-semibold text-emerald-200/90 mb-3">
              The Digital Operating System for Modern Restaurants.
            </p>

            <p className="text-sm font-semibold tracking-widest text-amber-300/80 uppercase mb-3">
              Scan. Order. Serve.
            </p>

            <p className="text-base text-emerald-100/60 max-w-md mb-8 leading-relaxed">
              {subtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-3">
              <Button
                size="lg"
                className="w-full sm:w-auto px-8 py-6 text-lg rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/30 group font-semibold"
                onClick={onGetStarted}
              >
                {ctaText}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto px-8 py-6 text-lg rounded-full border-2 border-white/20 text-white hover:bg-white/10 hover:text-white"
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
                <UtensilsCrossed className="w-4 h-4 text-amber-300" />
                <span className="text-sm font-semibold text-white/90">Table 5</span>
                <span className="ml-auto text-[10px] px-2.5 py-0.5 rounded-full bg-orange-500/30 text-orange-300 font-medium">Active</span>
              </div>
              {['Truffle Fries', 'Chicken Biriyani', 'Mango Lassi'].map((item, i) => (
                <div key={item} className="flex items-center justify-between py-1.5 border-b border-white/10 last:border-0">
                  <span className="text-xs text-white/70">{item}</span>
                  <span className="text-xs text-white/50">×{i + 1}</span>
                </div>
              ))}
            </GlassPanel>

            {/* Revenue Card */}
            <GlassPanel className="absolute top-20 right-0 w-56 px-5 py-4" delay={0.2}>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xl font-bold text-white/90">₹42,880</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/25 text-emerald-300 font-medium">+12%</span>
              </div>
              <span className="text-[10px] text-white/50">Today's Revenue</span>
              {/* Mini sparkline */}
              <svg viewBox="0 0 100 24" className="w-full h-6 mt-2">
                <polyline
                  points="0,20 15,16 30,18 45,10 60,14 75,6 90,8 100,4"
                  fill="none"
                  stroke="rgba(52,211,153,0.5)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </GlassPanel>

            {/* Receipt Card */}
            <GlassPanel className="absolute bottom-28 left-12 w-48 p-4" delay={0.4}>
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="w-3.5 h-3.5 text-orange-300" />
                <span className="text-[10px] font-bold text-white/80 tracking-widest uppercase">Receipt</span>
              </div>
              <div className="space-y-1 text-[11px] text-white/60 font-mono">
                <div className="flex justify-between"><span>Subtotal</span><span>₹1,240</span></div>
                <div className="flex justify-between"><span>Tax (5%)</span><span>₹62</span></div>
                <div className="border-t border-white/10 pt-1 flex justify-between font-semibold text-white/80">
                  <span>Total</span><span>₹1,302</span>
                </div>
              </div>
            </GlassPanel>

            {/* QR Code block */}
            <GlassPanel className="absolute bottom-6 right-16 w-24 h-24 flex items-center justify-center rounded-xl" delay={0.6}>
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-xl animate-pulse-ring" />
                <QrCode className="w-10 h-10 text-emerald-300 relative z-10" />
              </div>
            </GlassPanel>

            {/* Small receipt duplicate */}
            <GlassPanel className="absolute bottom-2 right-0 w-40 p-3" delay={0.8}>
              <div className="flex items-center gap-2 mb-1.5">
                <Receipt className="w-3 h-3 text-orange-300" />
                <span className="text-[9px] font-bold text-white/70 tracking-widest uppercase">Receipt</span>
              </div>
              <div className="space-y-0.5 text-[9px] text-white/50 font-mono">
                <div className="flex justify-between"><span>Subtotal</span><span>₹1,240</span></div>
                <div className="flex justify-between"><span>Tax (5%)</span><span>₹62</span></div>
                <div className="border-t border-white/10 pt-0.5 flex justify-between font-semibold text-white/70">
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
