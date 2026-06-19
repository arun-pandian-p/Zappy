import { motion } from 'framer-motion';
import { AlertCircle, Clock, Smartphone, ArrowUpRight } from 'lucide-react';

const painPoints = [
  {
    icon: Smartphone,
    title: 'The Silent Loss of Guest Retention',
    description: 'Unhappy guests leave silently without giving you a chance to recover. Their feedback ends up as damaging public reviews on Google or Yelp, eroding your brand reputation.',
    badge: 'Feedback Churn',
    color: 'from-red-500/20 to-orange-500/10'
  },
  {
    icon: Clock,
    title: 'Fragmented Order Bottlenecks',
    description: 'Waiters waste critical minutes walking to tables, writing orders manually, and typing them into legacy POS systems. Meanwhile, guests wait, tables turn slower, and orders are miscommunicated.',
    badge: 'Labor Overhead',
    color: 'from-amber-500/20 to-orange-500/10'
  },
  {
    icon: AlertCircle,
    title: 'Billing and POS Desynchronization',
    description: 'Legacy POS hardware keeps data in silos. Reconciling digital payments, split tabs, and paper receipts is a manual nightmare that slows down guest exits and causes accounting discrepancies.',
    badge: 'Revenue Leakage',
    color: 'from-rose-500/20 to-red-500/10'
  }
];

export const Problem = () => {
  return (
    <section id="problem" className="relative py-24 md:py-32 bg-[#0B1120] text-slate-100 overflow-hidden border-b border-white/5">
      {/* Dynamic light glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[300px] bg-rose-600/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Subtle Grid overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Heading */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold uppercase tracking-wider">
                <AlertCircle className="w-3.5 h-3.5" />
                The Operations Dilemma
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tight">
                Where is your <span className="bg-gradient-to-r from-red-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">revenue escaping?</span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed">
                Traditional restaurant setups rely on paper tickets, disjointed software tablets, and legacy POS hardware. This friction costs you customer satisfaction and eats away at your hard-earned margins every single day.
              </p>
            </motion.div>
          </div>

          {/* Right Column: Pain Point Cards */}
          <div className="lg:col-span-7 space-y-6">
            {painPoints.map((point, index) => {
              const Icon = point.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  className="group relative p-8 rounded-3xl bg-slate-950/40 border border-white/5 backdrop-blur-md hover:border-white/10 transition-all duration-300 overflow-hidden"
                >
                  {/* Subtle hover gradient glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${point.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

                  <div className="relative z-10 flex flex-col sm:flex-row gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 group-hover:text-white transition-colors duration-300">
                        <Icon className="w-6 h-6" strokeWidth={1.5} />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400 bg-white/5 border border-white/5 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {point.badge}
                        </span>
                        <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                      </div>
                      <h3 className="text-xl font-bold text-white group-hover:translate-x-1 transition-transform duration-300">
                        {point.title}
                      </h3>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        {point.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
};
