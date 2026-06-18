import { motion } from 'framer-motion';
import { Monitor, QrCode, ClipboardList, PackageCheck, Smile, Megaphone, BarChart3, Truck } from 'lucide-react';
import { useRef } from 'react';

const modules = [
  {
    icon: Monitor,
    title: 'POS (Point of Sale)',
    label: 'Fast Billing',
    desc: 'Lightning-fast cloud billing terminal. Works offline, supports multi-lane queues, and automatically syncs all payment gateways.'
  },
  {
    icon: QrCode,
    title: 'QR Table Ordering',
    label: 'Dine-In Magic',
    desc: 'No-app-required instant ordering. Customers scan, browse, order, and pay directly from their phone browser.'
  },
  {
    icon: ClipboardList,
    title: 'Kitchen Display (KDS)',
    label: 'Workflows',
    desc: 'Digital queue screen for chefs. Groups items, flags prep delays, and notifies servers immediately when orders are ready.'
  },
  {
    icon: PackageCheck,
    title: 'Inventory & Stock',
    label: 'Cost Control',
    desc: 'Real-time raw material tracking. Tracks recipe ingredient deductions, triggers low-stock alerts, and matches purchase receipts.'
  },
  {
    icon: Smile,
    title: 'CRM & Loyalty',
    label: 'Retention',
    desc: 'Automatic customer profile building. Rewards frequent diners, tracks preferences, and increases return rates.'
  },
  {
    icon: Megaphone,
    title: 'Automated Marketing',
    label: 'Growth Campaigns',
    desc: 'Broadcast customized SMS and WhatsApp promotions. Automatically invite lapsed customers back with tailored discount codes.'
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    label: 'Decisions',
    desc: 'Live revenue, item sales, and staff efficiency dashboards. Daily automated digest sent directly to owner emails.'
  },
  {
    icon: Truck,
    title: 'Delivery Manager',
    label: 'Logistics',
    desc: 'Consolidates third-party deliveries (Zomato, Swiggy) and handles private in-house driver dispatching on one screen.'
  }
];

const Ecosystem = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 350, behavior: 'smooth' });
    }
  };

  const scrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -350, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-24 md:py-36 bg-[#F7F5F0] border-t border-[#111111]/5 overflow-hidden">
      <div className="container mx-auto px-6 max-w-6xl">
        
        {/* Title Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="space-y-4">
            <span className="landing-label-uppercase">Everything in One Place</span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#111111] uppercase tracking-tighter leading-none">
              All Your Restaurant <br />
              <span className="text-[#FF6B00]">Tools Together</span>
            </h2>
            <p className="text-lg text-[#111111]/60 font-light max-w-xl">
              Billing, ordering, kitchen screens, stock, and guest rewards — connected so you never enter the same thing twice.
            </p>
          </div>
          
          {/* Custom Arrows */}
          <div className="flex gap-3">
            <button 
              onClick={scrollLeft}
              className="w-12 h-12 rounded-full border border-[#111111]/10 flex items-center justify-center text-[#111111]/60 hover:text-[#111111] hover:border-[#111111]/30 transition-all"
              aria-label="Scroll left"
            >
              ←
            </button>
            <button 
              onClick={scrollRight}
              className="w-12 h-12 rounded-full border border-[#111111]/10 flex items-center justify-center text-[#111111]/60 hover:text-[#111111] hover:border-[#111111]/30 transition-all"
              aria-label="Scroll right"
            >
              →
            </button>
          </div>
        </div>

        {/* Horizontal Scroll Gallery */}
        <div 
          ref={containerRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide pb-8 px-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {modules.map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.div
                key={m.title}
                className="w-[300px] md:w-[350px] shrink-0 snap-start landing-glass rounded-3xl p-8 flex flex-col justify-between border border-[#111111]/5 shadow-sm min-h-[350px] transition-all duration-300 hover:shadow-xl hover:border-[#FF6B00]/20"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#FF6B00] uppercase tracking-widest">{m.label}</span>
                    <div className="p-3 rounded-2xl bg-[#FF6B00]/10 text-[#FF6B00]">
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-black text-[#111111] uppercase tracking-tight leading-tight">{m.title}</h3>
                </div>

                <p className="text-[#111111]/75 text-sm md:text-base font-light leading-relaxed">
                  {m.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default Ecosystem;
