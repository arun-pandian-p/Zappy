import { motion } from 'framer-motion';
import { Smartphone, RefreshCw, Printer, UtensilsCrossed } from 'lucide-react';

const features = [
  {
    icon: Smartphone,
    title: 'Mobile First',
    description: 'Your fast mobile menu with ease and spending.',
    iconBg: 'bg-violet-100 dark:bg-violet-900/40',
    iconColor: 'text-violet-500',
  },
  {
    icon: RefreshCw,
    title: 'Real-time Sync',
    description: 'Fast sync of your orders.',
    iconBg: 'bg-sky-100 dark:bg-sky-900/40',
    iconColor: 'text-sky-500',
  },
  {
    icon: Printer,
    title: 'Thermal Print',
    description: 'Add items to cart, and customize receipts.',
    iconBg: 'bg-orange-100 dark:bg-orange-900/40',
    iconColor: 'text-orange-500',
  },
  {
    icon: UtensilsCrossed,
    title: 'Get Served',
    description: 'Kitchen prepares, serves & manages orders.',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconColor: 'text-emerald-500',
  },
];

const LiveDashboardSection = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-orange-50 via-amber-50/50 to-yellow-50 dark:from-orange-950/20 dark:via-background dark:to-amber-950/10">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Live Dashboard for Smart{' '}
            <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              Management
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get started today and join 1,500+ restaurants supercharging their service.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white/60 dark:bg-card/60 backdrop-blur-sm border border-white/40 dark:border-border/40 rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow"
            >
              <div className={`w-14 h-14 rounded-full ${feature.iconBg} flex items-center justify-center mx-auto mb-4`}>
                <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LiveDashboardSection;
