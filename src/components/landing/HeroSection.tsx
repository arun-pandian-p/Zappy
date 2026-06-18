import { motion } from 'framer-motion';
import { ArrowRight, Play, Check, ChefHat, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ZappyLogo } from '@/components/branding/ZappyLogo';

interface HeroSectionProps {
  onGetStarted: () => void;
  onBookDemo: () => void;
  onWatchTour: () => void;
  cms?: Record<string, any>;
}

const orderSteps = [
  { label: 'Order Received', done: true },
  { label: 'Preparing', active: true },
  { label: 'Ready', done: false },
];

const HeroSection = ({ onGetStarted, onBookDemo, onWatchTour }: HeroSectionProps) => {
  return (
    <section className="landing-hero relative min-h-screen overflow-hidden bg-[#0A1628] text-white">
      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(rgba(94, 168, 255, 0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(94, 168, 255, 0.07) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-[#0A1628] via-[#0A1628] to-[#0F2847]" />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 lg:pt-32 lg:pb-24 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[calc(100vh-8rem)]">
          {/* Left — copy & CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-start gap-6 lg:gap-8"
          >
            <ZappyLogo size={44} compact variant="dark" className="mb-1" />

            <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] xl:text-[3.5rem] font-bold tracking-tight leading-[1.08] text-[#5EA8FF]">
              Run Your Entire Restaurant from One Dashboard
            </h1>

            <p className="text-base sm:text-lg text-white/65 font-light leading-relaxed max-w-xl">
              Take orders, run the kitchen, bill customers, and bring guests back — all without juggling five different apps.
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full sm:w-auto pt-2">
              <Button
                onClick={onGetStarted}
                size="lg"
                className="h-12 px-6 rounded-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all duration-300"
              >
                Get Started Free
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>

              <Button
                onClick={onBookDemo}
                size="lg"
                variant="outline"
                className="h-12 px-6 rounded-full border-white/20 bg-white text-[#0A1628] hover:bg-white/90 font-semibold text-sm transition-all duration-300"
              >
                Book Demo
              </Button>

              <Button
                onClick={onWatchTour}
                size="lg"
                variant="ghost"
                className="h-12 px-6 rounded-full text-white/70 hover:text-white hover:bg-white/5 font-medium text-sm transition-all duration-300"
              >
                <Play className="w-4 h-4 mr-2 fill-current" />
                Watch a Demo
              </Button>
            </div>
          </motion.div>

          {/* Right — visual mockup */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto w-full max-w-lg lg:max-w-none"
          >
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40 aspect-[4/3]">
              <video
                src="/videos/brand-identity-2.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628]/60 via-transparent to-[#0A1628]/20" />
            </div>

            {/* Floating order status card */}
            <div className="absolute -left-2 sm:-left-6 top-8 sm:top-12 w-[220px] sm:w-[260px] bg-white rounded-xl p-4 shadow-xl shadow-black/20 border border-white/20">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#111111]/45 mb-3">Live Order</p>
              <div className="space-y-2.5">
                {orderSteps.map((step) => (
                  <div key={step.label} className="flex items-center gap-2.5">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        step.done
                          ? 'bg-emerald-500 text-white'
                          : step.active
                            ? 'bg-[#3B82F6] text-white'
                            : 'bg-[#111111]/10 text-[#111111]/30'
                      }`}
                    >
                      {step.done ? (
                        <Check className="w-3 h-3" />
                      ) : step.active ? (
                        <ChefHat className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        step.active ? 'text-[#3B82F6]' : step.done ? 'text-[#111111]/70' : 'text-[#111111]/35'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
              {orderSteps[1].active && (
                <div className="mt-3 h-1.5 rounded-full bg-[#111111]/8 overflow-hidden">
                  <div className="h-full w-[65%] rounded-full bg-[#3B82F6]" />
                </div>
              )}
            </div>

            {/* Phone mockup */}
            <div className="absolute -bottom-4 -right-2 sm:-right-4 w-[140px] sm:w-[160px] bg-[#1a1a1a] rounded-[1.75rem] p-1.5 shadow-2xl shadow-black/50 border border-white/10">
              <div className="bg-white rounded-[1.4rem] overflow-hidden p-3 min-h-[200px]">
                <p className="text-[8px] font-bold text-[#111111]/40 uppercase tracking-wider mb-2">Table 4</p>
                <p className="text-[10px] font-semibold text-[#111111] mb-3">Order Status</p>
                <div className="space-y-2 mb-3">
                  {orderSteps.map((step) => (
                    <div key={`phone-${step.label}`} className="flex items-center gap-1.5">
                      <div
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                          step.done ? 'bg-emerald-500' : step.active ? 'bg-[#3B82F6]' : 'bg-[#111111]/10'
                        }`}
                      >
                        {step.done && <Check className="w-2 h-2 text-white" />}
                      </div>
                      <span className={`text-[8px] ${step.active ? 'text-[#3B82F6] font-semibold' : 'text-[#111111]/50'}`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="h-1 rounded-full bg-[#111111]/8 overflow-hidden mb-2">
                  <div className="h-full w-[65%] rounded-full bg-[#3B82F6]" />
                </div>
                <p className="text-[8px] text-[#111111]/45">Estimated time: ~19 min</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
