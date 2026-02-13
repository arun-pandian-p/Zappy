import { motion } from 'framer-motion';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, ShoppingCart, BarChart3, Settings, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';

const screens = [
  {
    title: 'Order Management',
    description: 'Real-time order tracking with status updates',
    icon: ShoppingCart,
    color: 'from-primary to-primary/60',
    mockRows: ['Order #142 - Table 3 - Preparing', 'Order #141 - Table 7 - Ready', 'Order #140 - Table 1 - Served'],
  },
  {
    title: 'Kitchen Display',
    description: 'Live order queue for kitchen staff',
    icon: ChefHat,
    color: 'from-orange-500 to-amber-500',
    mockRows: ['Butter Chicken x2 - 5min', 'Paneer Tikka x1 - 3min', 'Biryani x3 - 8min'],
  },
  {
    title: 'Analytics Dashboard',
    description: 'Revenue, trends, and customer insights',
    icon: BarChart3,
    color: 'from-green-500 to-emerald-500',
    mockRows: ['Revenue: ₹45,230 today', 'Orders: 87 completed', 'Avg time: 12 min'],
  },
  {
    title: 'Admin Panel',
    description: 'Full control over menu, tables, and staff',
    icon: Settings,
    color: 'from-purple-500 to-pink-500',
    mockRows: ['12 menu items active', '8 tables configured', '5 staff members'],
  },
];

const DashboardCarousel = () => {
  const [active, setActive] = useState(0);

  const next = () => setActive((p) => (p + 1) % screens.length);
  const prev = () => setActive((p) => (p - 1 + screens.length) % screens.length);

  return (
    <section className="py-24 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Powerful{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Dashboards
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Purpose-built interfaces for every role in your restaurant.
          </p>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="shrink-0 rounded-full" onClick={prev}>
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="flex-1 overflow-hidden">
              <motion.div
                key={active}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
              >
                <div className="bg-card border rounded-2xl overflow-hidden shadow-xl">
                  {/* Title bar */}
                  <div className={`bg-gradient-to-r ${screens[active].color} p-4 flex items-center gap-3`}>
                    {(() => { const Icon = screens[active].icon; return <Icon className="w-5 h-5 text-white" />; })()}
                    <div>
                      <h3 className="text-white font-bold text-sm">{screens[active].title}</h3>
                      <p className="text-white/70 text-xs">{screens[active].description}</p>
                    </div>
                  </div>
                  {/* Mock content */}
                  <div className="p-6 space-y-3">
                    {screens[active].mockRows.map((row, i) => (
                      <motion.div
                        key={row}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                      >
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-sm text-muted-foreground">{row}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            <Button variant="outline" size="icon" className="shrink-0 rounded-full" onClick={next}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {screens.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  i === active ? 'bg-primary w-8' : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardCarousel;
