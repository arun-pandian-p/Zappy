import { motion } from 'framer-motion';
import { Smartphone, Wifi, Printer, CreditCard, Bell, Globe, Shield, Zap, QrCode } from 'lucide-react';

const techs = [
  { name: 'Mobile First', icon: Smartphone, cx: 20, cy: 25, x: '-30%', y: '-25%' },
  { name: 'Real-time Sync', icon: Wifi, cx: 8, cy: 50, x: '-42%', y: '0%' },
  { name: 'Thermal Print', icon: Printer, cx: 18, cy: 75, x: '-32%', y: '25%' },
  { name: 'Payments', icon: CreditCard, cx: 80, cy: 25, x: '30%', y: '-25%' },
  { name: 'Notifications', icon: Bell, cx: 92, cy: 50, x: '42%', y: '0%' },
  { name: 'Multi-Tenant', icon: Globe, cx: 82, cy: 75, x: '32%', y: '25%' },
  { name: 'Secure Auth', icon: Shield, cx: 35, cy: 88, x: '-15%', y: '38%' },
  { name: 'Fast & Light', icon: Zap, cx: 65, cy: 88, x: '15%', y: '38%' }
];

const IntegrationsCloud = () => {
  return (
    <section className="py-20 md:py-28 bg-background overflow-hidden relative">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <span className="text-xs font-semibold tracking-widest uppercase text-primary mb-3 inline-block">
            Built for Scale
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Integrated Ecosystem
          </h2>
          <p className="text-slate-500 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Connecting all your restaurant components into a single, synchronized database in real time.
          </p>
        </div>

        {/* Orbit / Connection Visual */}
        <div className="relative w-full max-w-2xl mx-auto h-[380px] sm:h-[450px] flex items-center justify-center">
          
          {/* Connecting lines SVG */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Ambient circular orbits */}
            <circle cx="50" cy="50" r="35" className="stroke-primary/5 fill-none" strokeWidth="1" />
            <circle cx="50" cy="50" r="22" className="stroke-primary/5 fill-none" strokeWidth="1" />

            {techs.map((tech) => (
              <motion.line
                key={tech.name}
                x1="50"
                y1="50"
                x2={tech.cx}
                y2={tech.cy}
                className="stroke-primary/10"
                strokeWidth="0.8"
                strokeDasharray="4 4"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.2 }}
              />
            ))}
          </svg>

          {/* Central Zappy Hub */}
          <div className="relative z-10 flex items-center justify-center">
            {/* Ambient pulsing glow */}
            <div className="absolute w-24 h-24 rounded-full bg-primary/15 blur-xl animate-pulse" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
              className="absolute w-36 h-36 border border-dashed border-primary/20 rounded-full"
            />
            
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 relative">
              <QrCode className="w-8 h-8 text-primary-foreground" strokeWidth={2.5} />
              <div className="absolute -inset-1 rounded-2xl border border-primary/40 animate-ping opacity-25" />
            </div>
          </div>

          {/* Satellite Nodes */}
          {techs.map((tech, i) => {
            const Icon = tech.icon;
            return (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="absolute z-10 flex flex-col items-center"
                style={{
                  left: `calc(50% + ${tech.x})`,
                  top: `calc(50% + ${tech.y})`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {/* Floating Micro-animation */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4 + (i % 3), repeat: Infinity, ease: 'easeInOut' }}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-card border border-border/60 flex items-center justify-center shadow-sm group-hover:border-primary/30 group-hover:shadow-md group-hover:shadow-primary/5 transition-all duration-300">
                    <Icon className="w-5 h-5 text-slate-700 group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 group-hover:text-primary transition-colors tracking-wide uppercase mt-2 bg-background/80 px-2 py-0.5 rounded-full border border-border/30">
                    {tech.name}
                  </span>
                </motion.div>
              </motion.div>
            );
          })}

        </div>
      </div>
    </section>
  );
};

export default IntegrationsCloud;