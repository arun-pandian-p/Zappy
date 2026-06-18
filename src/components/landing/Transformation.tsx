import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, TrendingUp, Zap, Sparkles } from 'lucide-react';

const beforeState = [
  { label: 'Table turnarounds', val: '45 mins' },
  { label: 'Order writing errors', val: '1 in 8' },
  { label: 'Kitchen prep delay', val: '18 mins' },
  { label: 'Data captured', val: '0 guests' }
];

const afterState = [
  { label: 'Table turnarounds', val: '28 mins', icon: Zap },
  { label: 'Order writing errors', val: '0.01%', icon: ShieldCheck },
  { label: 'Kitchen prep delay', val: '9 mins', icon: Sparkles },
  { label: 'Data captured', val: '100%', icon: TrendingUp }
];

const Transformation = () => {
  const [activeTab, setActiveTab] = useState<'before' | 'after'>('after');

  return (
    <section className="py-24 md:py-36 bg-[#FFFFFF] border-t border-[#111111]/5 overflow-hidden">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24 space-y-6">
          <span className="landing-label-uppercase">The Evolution</span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#111111] uppercase tracking-tighter leading-none">
            The <span className="text-[#FF6B00]">Transformation</span>
          </h2>
          <p className="text-lg md:text-xl text-[#111111]/60 font-light leading-relaxed">
            See how paper-driven chaos translates into unified digital perfection.
          </p>

          {/* Toggle Tab Switcher */}
          <div className="inline-flex bg-[#F7F5F0] rounded-full p-1 border border-[#111111]/5">
            <button
              onClick={() => setActiveTab('before')}
              className={`px-8 py-3 rounded-full text-sm font-semibold transition-all duration-300 ${activeTab === 'before' ? 'bg-red-500 text-white shadow-sm' : 'text-[#111111]/60 hover:text-[#111111]'}`}
            >
              Fragmented Chaos
            </button>
            <button
              onClick={() => setActiveTab('after')}
              className={`px-8 py-3 rounded-full text-sm font-semibold transition-all duration-300 ${activeTab === 'after' ? 'bg-[#FF6B00] text-white shadow-sm' : 'text-[#111111]/60 hover:text-[#111111]'}`}
            >
              Zappy System
            </button>
          </div>
        </div>

        {/* Split screen display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Visual Showcase (Left Side) */}
          <div className="relative aspect-square w-full max-w-lg mx-auto bg-[#F7F5F0] rounded-3xl border border-[#111111]/5 overflow-hidden flex items-center justify-center p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'before' ? (
                <motion.div
                  key="before-viz"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6 w-full text-center"
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 text-red-500 flex items-center justify-center font-bold text-2xl">?</div>
                  <h3 className="text-2xl font-black text-[#111111] uppercase tracking-tight">Paper & Legacy Bottlenecks</h3>
                  <div className="space-y-3 max-w-md mx-auto text-sm text-[#111111]/70 leading-relaxed font-light">
                    <p className="border border-red-500/20 bg-red-500/5 py-2.5 px-4 rounded-xl">Lost paper KOTs causing chef rage</p>
                    <p className="border border-red-500/20 bg-red-500/5 py-2.5 px-4 rounded-xl">Guests waiting 15 mins just to pay bills</p>
                    <p className="border border-red-500/20 bg-red-500/5 py-2.5 px-4 rounded-xl">Manual inventory sheets updated weekly</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="after-viz"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6 w-full text-center"
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center font-bold text-2xl">✓</div>
                  <h3 className="text-2xl font-black text-[#111111] uppercase tracking-tight">Streamlined Perfection</h3>
                  <div className="space-y-3 max-w-md mx-auto text-sm text-[#111111]/70 leading-relaxed font-light">
                    <p className="border border-[#FF6B00]/20 bg-[#FF6B00]/5 py-2.5 px-4 rounded-xl flex items-center justify-between">
                      <span>Real-time digital kitchen KOTs</span>
                      <span className="text-emerald-600 font-semibold">Done</span>
                    </p>
                    <p className="border border-[#FF6B00]/20 bg-[#FF6B00]/5 py-2.5 px-4 rounded-xl flex items-center justify-between">
                      <span>Scan, order, and pay at table</span>
                      <span className="text-emerald-600 font-semibold">Instant</span>
                    </p>
                    <p className="border border-[#FF6B00]/20 bg-[#FF6B00]/5 py-2.5 px-4 rounded-xl flex items-center justify-between">
                      <span>Automated cost & stock updates</span>
                      <span className="text-emerald-600 font-semibold">Real-time</span>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Metrics Outcome (Right Side) */}
          <div className="flex flex-col justify-center gap-8">
            <h3 className="text-3xl font-black text-[#111111] uppercase tracking-tight">
              {activeTab === 'before' ? 'The Hard Numbers (Daily)' : 'The Business Impact (Zappy)'}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {activeTab === 'before' ? (
                beforeState.map((st, i) => (
                  <motion.div
                    key={st.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-6 rounded-2xl bg-red-500/5 border border-red-500/10 text-left"
                  >
                    <span className="text-3xl font-black text-red-500 block tracking-tight">{st.val}</span>
                    <span className="text-xs font-semibold text-[#111111]/50 tracking-wider uppercase mt-1 block">{st.label}</span>
                  </motion.div>
                ))
              ) : (
                afterState.map((st, i) => {
                  const Icon = st.icon;
                  return (
                    <motion.div
                      key={st.label}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-6 rounded-2xl bg-[#FF6B00]/5 border border-[#FF6B00]/10 text-left relative overflow-hidden group"
                    >
                      <div className="absolute top-4 right-4 text-[#FF6B00]/30 group-hover:text-[#FF6B00] transition-colors duration-300">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-3xl font-black text-[#FF6B00] block tracking-tight">{st.val}</span>
                      <span className="text-xs font-semibold text-[#111111]/60 tracking-wider uppercase mt-1 block">{st.label}</span>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Transformation;
