import { motion } from 'framer-motion';
import { Star, TrendingUp, Users, Zap } from 'lucide-react';

const stats = [
  {
    icon: TrendingUp,
    value: '+22%',
    label: 'Avg. Ticket Value',
    description: 'Smart upsells and seamless re-ordering increase guest spending.'
  },
  {
    icon: Zap,
    value: '-30%',
    label: 'Table Turn Time',
    description: 'Instant seat QR ordering and rapid billing speed up checkout cycles.'
  },
  {
    icon: Users,
    value: '94%',
    label: 'Staff Satisfaction',
    description: 'Reduced manual coordination stress, leading to better gratuities.'
  }
];

const testimonials = [
  {
    quote: "Integrating Zappy completely changed our dinner rush. Orders reach the kitchen instantly, billing is frictionless, and our average checkout time dropped by over 4 minutes per table.",
    author: "Elena Rostova",
    role: "General Manager, Bistro L'Avenue",
    stars: 5
  },
  {
    quote: "The reputation engine and recovery flow are pure gold. Catching unhappy diners before they walk out the door saved us from multiple negative online reviews.",
    author: "Marcus Vance",
    role: "Owner, Smokehouse Grill Group",
    stars: 5
  }
];

export const Proof = () => {
  return (
    <section id="proof" className="relative py-24 md:py-32 bg-[#0B1120] text-slate-100 overflow-hidden border-b border-white/5">
      {/* Light highlights */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[300px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[450px] h-[300px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
        backgroundSize: '50px 50px',
      }} />

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <span className="text-xs font-semibold tracking-widest uppercase text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full inline-block">
            Proven Results
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            Loved by operations. <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Trusted by guests.</span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            See the business growth metrics restaurants achieve when upgrading to Zappy Restaurant OS.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="group relative p-8 rounded-3xl bg-slate-950/40 border border-white/5 hover:border-white/10 transition-all duration-300 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 mx-auto mb-6">
                  <Icon className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <h3 className="text-4xl md:text-5xl font-black text-white mb-2 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  {stat.value}
                </h3>
                <h4 className="text-base font-bold text-slate-300 mb-2">{stat.label}</h4>
                <p className="text-slate-400 text-xs leading-relaxed">{stat.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {testimonials.map((test, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="p-8 rounded-3xl bg-slate-950/40 border border-white/5 relative flex flex-col justify-between"
            >
              <div className="space-y-6">
                {/* Stars */}
                <div className="flex gap-1">
                  {[...Array(test.stars)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-base italic leading-relaxed">
                  "{test.quote}"
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-white/5">
                <h5 className="font-bold text-white">{test.author}</h5>
                <p className="text-xs text-slate-500">{test.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
