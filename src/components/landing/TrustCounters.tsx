import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface CounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}

const CountUp = ({ value, duration = 1.5, prefix = '', suffix = '' }: CounterProps) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const end = value;
    if (end === 0) return;
    const totalMiliseconds = duration * 1000;
    const steps = 60;
    const stepTime = totalMiliseconds / steps;
    const stepValue = end / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(Math.floor(stepValue * currentStep));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value, duration, isInView]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString('en-IN')}
      {suffix}
    </span>
  );
};

const counters = [
  { value: 100, label: 'Active Restaurants', prefix: '', suffix: '+' },
  { value: 10000, label: 'Orders Processed', prefix: '', suffix: '+' },
  { value: 48, label: 'Revenue Processed', prefix: '₹', suffix: 'L+' },
  { value: 5000, label: 'Happy Customers', prefix: '', suffix: '+' }
];

export default function TrustCounters() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true });

  return (
    <section ref={containerRef} className="relative py-20 bg-[#0B1220] overflow-hidden border-y border-slate-800">
      {/* Background ambient orbs */}
      <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-[300px] h-[300px] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">
            Zappy in Numbers
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Trusted by restaurants across India
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {counters.map((counter, i) => (
            <motion.div
              key={counter.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-lg shadow-black/10 hover:border-primary/20 transition-all duration-300"
            >
              <p className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
                <CountUp value={counter.value} prefix={counter.prefix} suffix={counter.suffix} />
              </p>
              <p className="text-xs md:text-sm text-slate-400 font-medium tracking-wide uppercase">
                {counter.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
