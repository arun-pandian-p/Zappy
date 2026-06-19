import { motion } from 'framer-motion';
import { QrCode, ClipboardList, UtensilsCrossed, BellRing, Receipt } from 'lucide-react';

const steps = [
  {
    icon: QrCode,
    number: '01',
    title: 'Scan Table QR & Pick Seat',
    description: 'Customers scan the unique table QR code, pick their specific seat, and are instantly authenticated with a persistent device ID.'
  },
  {
    icon: ClipboardList,
    number: '02',
    title: 'Order & Generate Token',
    description: 'Guests build their order, request kitchen mods, and place it. Zappy instantly generates an order token (e.g. #023) for simple tracking.'
  },
  {
    icon: UtensilsCrossed,
    number: '03',
    title: 'Kitchen Receives & Prepares',
    description: 'The order syncs directly to the Kitchen Display System (KDS). Status flows automatically: New → Accepted → Preparing → Ready → Served.'
  },
  {
    icon: BellRing,
    number: '04',
    title: 'Live Tracking & Call Waiter',
    description: 'Guests track their live progress timeline via real-time alerts. If they need assistance, they can call a waiter to their exact table in one tap.'
  },
  {
    icon: Receipt,
    number: '05',
    title: 'Instant Billing & Feedback',
    description: 'When finished, customers view their billing summary, settle payments, and submit reviews which feed directly into your Reputation Center.'
  }
];

export const Solution = () => {
  return (
    <section id="solution" className="relative py-24 md:py-32 bg-[#0B1120] text-slate-100 overflow-hidden border-b border-white/5">
      {/* Light highlights */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-blue-500/5 blur-[140px] rounded-full pointer-events-none" />

      {/* Grid structure overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <span className="text-xs font-semibold tracking-widest uppercase text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full inline-block">
            The Zappy Ecosystem
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            One unified flow. <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Zero friction.</span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Eliminate communication gaps by replacing paper workflows and standalone tablets with a single synchronized software environment.
          </p>
        </div>

        {/* Steps Flow Timeline */}
        <div className="relative">
          {/* Connector line (Desktop only) */}
          <div className="hidden lg:block absolute top-[44px] left-[5%] right-[5%] h-0.5 bg-gradient-to-r from-blue-500/10 via-indigo-500/20 to-blue-500/10" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-4 group"
                >
                  {/* Step circle */}
                  <div className="relative z-10 w-20 h-20 rounded-full bg-slate-950 border border-white/5 flex items-center justify-center text-blue-400 group-hover:border-blue-500/30 group-hover:text-white transition-all duration-300">
                    {/* Inner pulse */}
                    <div className="absolute inset-1.5 rounded-full bg-slate-900 border border-white/10 group-hover:bg-blue-600/10 group-hover:border-blue-500/20 transition-all duration-300" />
                    
                    <Icon className="relative z-20 w-8 h-8" strokeWidth={1.5} />
                    
                    {/* Step number badge */}
                    <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold text-white tracking-tighter">
                      {step.number}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors duration-300">
                      {step.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {step.description}
                    </p>
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
