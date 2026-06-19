import { motion } from 'framer-motion';
import { QrCode, MonitorPlay, BarChart3, ShieldCheck, HeartHandshake, Compass } from 'lucide-react';

const features = [
  {
    icon: QrCode,
    title: 'Smart QR Seat Selection',
    description: 'Provide an intuitive dining flow. Guests scan a table QR code and select a specific seat (1-N) with persistent device recognition for future visits.',
    glowColor: 'group-hover:shadow-blue-500/10'
  },
  {
    icon: MonitorPlay,
    title: 'Chef-Inspired KDS Dashboard',
    description: 'Ensure accurate preparation pacing. The Kitchen Display System dynamically lists live tokens, order items, seat pairings, and tracking state updates.',
    glowColor: 'group-hover:shadow-indigo-500/10'
  },
  {
    icon: BarChart3,
    title: 'Unified Live Analytics',
    description: 'Analyze food ratings, review volume, and ticket trends. Spot peak hours and table turnover stats instantly using automated reports.',
    glowColor: 'group-hover:shadow-blue-500/10'
  },
  {
    icon: HeartHandshake,
    title: 'Reputation Center Manager',
    description: 'Capture critical feedback before guest exit. Auto-compute ratings, extract sentiment analysis, and trigger recovery flows for ratings under 3 stars.',
    glowColor: 'group-hover:shadow-rose-500/10'
  },
  {
    icon: ShieldCheck,
    title: 'Robust Security & RLS',
    description: 'Protect billing data and user details. Powered by Supabase security policies, ensuring authenticated and guest records are isolated.',
    glowColor: 'group-hover:shadow-emerald-500/10'
  },
  {
    icon: Compass,
    title: 'Real-Time Table Timers',
    description: 'Never miss a late table or order block. Live timers display table duration and average preparation latency to maximize operational throughput.',
    glowColor: 'group-hover:shadow-blue-500/10'
  }
];

export const Features = () => {
  return (
    <section id="features" className="relative py-24 md:py-32 bg-[#0B1120] text-slate-100 overflow-hidden border-b border-white/5">
      {/* Light blobs */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[300px] bg-blue-600/5 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[250px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.02]" style={{
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
        backgroundSize: '30px 30px',
      }} />

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <span className="text-xs font-semibold tracking-widest uppercase text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full inline-block">
            Core capabilities
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            Engineered for <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">high-frequency dining</span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            From QR seat reservations to kitchen queue management, Zappy covers the entire life-cycle of customer dining.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`group relative p-8 rounded-3xl bg-slate-950/40 border border-white/5 hover:border-white/10 transition-all duration-300 flex flex-col justify-between hover:shadow-2xl ${feature.glowColor}`}
              >
                <div className="space-y-6">
                  {/* Icon wrap */}
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-600/10 group-hover:text-white transition-all duration-300">
                    <Icon className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>

                {/* Decorative border bottom-line */}
                <div className="absolute bottom-0 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-transparent via-blue-500/0 to-transparent group-hover:via-blue-500/20 transition-all duration-500" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
