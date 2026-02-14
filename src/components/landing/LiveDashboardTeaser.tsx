import { useEffect, useRef } from 'react';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { IndianRupee, ShoppingBag, LayoutGrid, Clock } from 'lucide-react';

const AnimatedCounter = ({ target, prefix = '', suffix = '' }: { target: number; prefix?: string; suffix?: string }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => `${prefix}${Math.round(v).toLocaleString('en-IN')}${suffix}`);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) {
      animate(count, target, { duration: 2, ease: 'easeOut' });
    }
  }, [inView, count, target]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
};

const SparklineSVG = () => {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <svg ref={ref} viewBox="0 0 120 40" className="w-full h-10 mt-2">
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="hsl(25, 95%, 53%)" />
          <stop offset="100%" stopColor="hsl(45, 93%, 47%)" />
        </linearGradient>
      </defs>
      <motion.path
        d="M0 30 Q10 28 20 25 T40 20 T60 15 T80 18 T100 10 T120 8"
        fill="none"
        stroke="url(#spark-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={inView ? { pathLength: 1 } : {}}
        transition={{ duration: 2, ease: 'easeOut' }}
      />
    </svg>
  );
};

const metrics = [
  {
    icon: IndianRupee,
    label: 'Today Revenue',
    value: 42880,
    prefix: '₹',
    color: 'text-orange-400',
    glowColor: 'from-orange-500/20 to-amber-500/10',
    visual: 'sparkline' as const,
  },
  {
    icon: ShoppingBag,
    label: 'Orders Today',
    value: 128,
    color: 'text-sky-400',
    glowColor: 'from-sky-500/20 to-blue-500/10',
    visual: 'pulse' as const,
  },
  {
    icon: LayoutGrid,
    label: 'Active Tables',
    value: 23,
    color: 'text-emerald-400',
    glowColor: 'from-emerald-500/20 to-green-500/10',
    visual: 'heat' as const,
  },
  {
    icon: Clock,
    label: 'Pending Orders',
    value: 7,
    color: 'text-rose-400',
    glowColor: 'from-rose-500/20 to-red-500/10',
    visual: 'alert' as const,
  },
];

const LiveDashboardTeaser = () => {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      {/* Warm atmospheric background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-orange-50/30 to-background dark:via-orange-950/10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-gradient-to-br from-orange-300/15 to-amber-200/10 blur-[100px]" />

      <div className="relative z-10 container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Live Data</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Live Restaurant{' '}
            <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Insights</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Real-time metrics powering 1,500+ restaurants worldwide.
          </p>
        </motion.div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="glass-card p-5 rounded-2xl relative group"
            >
              {/* Glow */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${m.glowColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <m.icon className={`w-5 h-5 ${m.color}`} />
                  {m.visual === 'alert' && (
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
                    </span>
                  )}
                  {m.visual === 'pulse' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
                  )}
                  {m.visual === 'heat' && (
                    <motion.span
                      className="w-2.5 h-2.5 rounded-full bg-emerald-400"
                      animate={{ backgroundColor: ['hsl(160,84%,39%)', 'hsl(142,76%,36%)', 'hsl(160,84%,39%)'] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                  )}
                </div>
                <p className="text-2xl font-bold text-foreground mb-1">
                  <AnimatedCounter target={m.value} prefix={m.prefix || ''} />
                </p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
                {m.visual === 'sparkline' && <SparklineSVG />}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Live updating indicator */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-center mt-8 text-xs text-muted-foreground flex items-center justify-center gap-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live data updating every 30s
        </motion.p>
      </div>
    </section>
  );
};

export default LiveDashboardTeaser;
