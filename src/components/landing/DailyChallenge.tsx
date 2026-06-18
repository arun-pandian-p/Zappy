import { motion } from 'framer-motion';
import { Flame, Clock, ChefHat, PackageCheck, Users } from 'lucide-react';

const challenges = [
  {
    icon: Flame,
    title: 'The Order Rush Chaos',
    desc: 'Servers running back and forth, writing orders on pads. Customers tapping fingers waiting for menus. High tempers, wrong orders, lost sales.',
    metric: '40% delay in peak orders'
  },
  {
    icon: Clock,
    title: 'The Billing Bottleneck',
    desc: 'Long queues at the counter during peak hours. Cashiers manually entering orders into legacy POS, causing delays and card terminal mismatches.',
    metric: '12 min average checkout time'
  },
  {
    icon: ChefHat,
    title: 'Kitchen Miscommunication',
    desc: 'Paper KOTs lost or drenched in oil. Chefs shouting over noise. Zero tracking of preparation time or table delays.',
    metric: '18% food wastage rate'
  },
  {
    icon: PackageCheck,
    title: 'Invisible Inventory Leaks',
    desc: 'Ingredients disappearing without tracking. Daily stockouts of popular dishes or surplus rotting in bins. No real-time cost control.',
    metric: 'Up to 5% revenue leak'
  },
  {
    icon: Users,
    title: 'Forgotten Customers',
    desc: 'Dinners pay, leave, and are gone forever. Zero customer data, no feedback collection, and no way to invite them back for special offers.',
    metric: '85% guest data lost'
  }
];

const DailyChallenge = () => {
  return (
    <section id="challenge" className="py-24 md:py-36 bg-[#F7F5F0] border-t border-[#111111]/5">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-start">
          
          {/* Left Sticky Column */}
          <div className="lg:col-span-5 lg:sticky lg:top-32 space-y-6">
            <span className="landing-label-uppercase">The Daily Struggle</span>
            
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#111111] leading-none uppercase">
              Running a <br />
              restaurant <br />
              should feel <br />
              <span className="text-[#FF6B00]">effortless.</span>
            </h2>
            
            <p className="text-lg text-[#111111]/70 font-light leading-relaxed">
              Every day, independent restaurants bleed revenue, time, and sanity due to fragmented tools. Zappy brings every department under one premium, real-time operating system.
            </p>
          </div>

          {/* Right Scrollable Column */}
          <div className="lg:col-span-7 space-y-8">
            {challenges.map((c, i) => {
              const Icon = c.icon;
              return (
                <motion.div
                  key={c.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                  className="landing-card p-8 flex flex-col md:flex-row gap-6 items-start"
                >
                  <div className="p-4 rounded-2xl bg-[#FF6B00]/5 text-[#FF6B00]">
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className="space-y-3 flex-1">
                    <h3 className="text-2xl font-bold text-[#111111] uppercase tracking-tight">{c.title}</h3>
                    <p className="text-[#111111]/70 leading-relaxed font-light">{c.desc}</p>
                    <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-[#FF6B00] uppercase tracking-wider">
                      <span>Leak:</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FF6B00]/10">{c.metric}</span>
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

export default DailyChallenge;
