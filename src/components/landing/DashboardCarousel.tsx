import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { BarChart3, ChefHat, Receipt } from 'lucide-react';
import adminImg from '@/assets/dashboard-admin.png';
import kitchenImg from '@/assets/dashboard-kitchen.png';
import billingImg from '@/assets/dashboard-billing.png';

const screens = [
  {
    title: 'Admin Dashboard',
    description: 'Full restaurant management — revenue, orders & analytics',
    icon: BarChart3,
    color: 'from-primary to-sky-500',
    image: adminImg,
  },
  {
    title: 'Kitchen Display',
    description: 'Live order queue organised by status for kitchen staff',
    icon: ChefHat,
    color: 'from-blue-500 to-indigo-500',
    image: kitchenImg,
  },
  {
    title: 'Billing Counter',
    description: 'Invoice generation, payments & order settlement',
    icon: Receipt,
    color: 'from-emerald-500 to-teal-500',
    image: billingImg,
  },
];

const DashboardCarousel = () => {
  const [active, setActive] = useState(0);

  const next = useCallback(() => setActive((p) => (p + 1) % screens.length), []);

  // Auto-advance every 4 seconds
  useEffect(() => {
    const interval = setInterval(next, 4000);
    return () => clearInterval(interval);
  }, [next]);

  return (
    <section className="py-16 md:py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Powerful{' '}
            <span className="bg-gradient-to-r from-primary to-sky-500 bg-clip-text text-transparent">Dashboards</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Purpose-built interfaces for every role in your restaurant.
          </p>
        </motion.div>

        <div className="relative max-w-5xl mx-auto">
          <div className="overflow-hidden rounded-2xl shadow-xl border">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '-100%', opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              >
                <div className={`bg-gradient-to-r ${screens[active].color} p-4 flex items-center gap-3`}>
                  {(() => { const Icon = screens[active].icon; return <Icon className="w-5 h-5 text-white" />; })()}
                  <div>
                    <h3 className="text-white font-bold text-sm">{screens[active].title}</h3>
                    <p className="text-white/70 text-xs">{screens[active].description}</p>
                  </div>
                </div>
                <img src={screens[active].image} alt={screens[active].title} className="w-full h-auto object-cover" />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mt-6">
            {screens.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`h-2.5 rounded-full transition-all duration-500 ${i === active ? 'bg-primary w-8' : 'bg-muted-foreground/30 w-2.5'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardCarousel;
