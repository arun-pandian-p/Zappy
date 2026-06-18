import { motion } from 'framer-motion';
import { Cloud, Zap, ArrowUpRight, Compass } from 'lucide-react';

const traits = [
  {
    icon: Cloud,
    title: 'Bulletproof Reliability',
    label: '99.99% Uptime',
    desc: 'Dual-active cloud instances and offline POS fallback ensure your restaurant keeps printing bills even when your internet drops.'
  },
  {
    icon: Zap,
    title: 'Sub-second Speed',
    label: '0.2s Load Time',
    desc: 'Lightweight code structure optimized for fast cellular networks. Customers scan and dine without loading delay bottlenecks.'
  },
  {
    icon: ArrowUpRight,
    title: 'Elastic Scalability',
    label: 'Multi-Location Control',
    desc: 'Synchronize 1 to 100+ branches from a single super-admin. Share menus, compare reports, and manage ingredients instantly.'
  },
  {
    icon: Compass,
    title: 'Operational Simplicity',
    label: 'No Learning Curve',
    desc: 'User-friendly layouts designed in coordination with waiter staff and kitchen chefs. Train new employees in under 5 minutes.'
  }
];

const ModernRestaurants = () => {
  return (
    <section className="py-24 md:py-36 bg-[#F7F5F0] border-t border-[#111111]/5 overflow-hidden">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Text */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-32">
            <span className="landing-label-uppercase">Core Infrastructure</span>
            
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#111111] uppercase tracking-tighter leading-none">
              Built for <br />
              Modern <br />
              <span className="text-[#FF6B00]">Restaurants</span>
            </h2>
            
            <p className="text-lg text-[#111111]/70 font-light leading-relaxed">
              We design software for the trenches of restaurant operations. Speed, stability, and extreme ease-of-use are baked directly into Zappy's core codebase.
            </p>
          </div>

          {/* Right Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {traits.map((t, i) => {
              const Icon = t.icon;
              return (
                <motion.div
                  key={t.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="landing-card p-8 flex flex-col justify-between min-h-[300px] border border-[#111111]/5 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-[#FF6B00]/20"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="p-3 rounded-2xl bg-[#FF6B00]/10 text-[#FF6B00]">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-semibold text-[#FF6B00] uppercase tracking-widest bg-[#FF6B00]/10 px-3 py-1 rounded-full">
                        {t.label}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-[#111111] uppercase tracking-tight leading-tight">{t.title}</h3>
                  </div>

                  <p className="text-[#111111]/75 text-sm font-light leading-relaxed mt-4">
                    {t.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
};

export default ModernRestaurants;
