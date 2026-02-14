import { motion } from 'framer-motion';
import { QrCode } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const orders = [
  { table: 'T11', status: 'Pending', badge: 'Sub', dotColor: 'bg-yellow-400', badgeClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' },
  { table: 'TT3', status: 'Preparing', badge: 'Eat', dotColor: 'bg-sky-400', badgeClass: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400' },
  { table: 'TT5', status: 'Ready', badge: 'Eat', dotColor: 'bg-emerald-400', badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
];

interface HowItWorksProps {
  cms?: Record<string, any>;
}

const HowItWorks = ({ cms }: HowItWorksProps) => {
  const heading = cms?.heading || 'How It Works';

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">{heading}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Powerful features to improve your service &amp; sales.</p>
        </motion.div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="bg-white/60 dark:bg-card/60 backdrop-blur-sm border border-white/40 dark:border-border/40 rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
                <QrCode className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className="text-lg font-bold">Scan QR Code</h3>
            </div>
            <div className="space-y-4">
              {orders.map((order, i) => (
                <motion.div key={order.table} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 + 0.3 }} className="flex items-center justify-between p-3 rounded-xl bg-background/60 border border-border/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${order.dotColor}`} />
                    <span className="font-mono font-semibold text-sm">{order.table}</span>
                    <span className="text-muted-foreground text-sm">— {order.status}</span>
                  </div>
                  <Badge className={`${order.badgeClass} border-0 text-xs`}>{order.badge}</Badge>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="bg-gradient-to-br from-orange-200/60 via-amber-100/40 to-yellow-200/60 dark:from-orange-900/20 dark:via-amber-900/10 dark:to-yellow-900/20 backdrop-blur-sm border border-white/40 dark:border-border/40 rounded-2xl shadow-lg p-6 flex items-center justify-center min-h-[280px]">
            <div className="text-center">
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} className="w-24 h-24 rounded-2xl bg-white/80 dark:bg-card/80 shadow-lg flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-12 h-12 text-orange-500" />
              </motion.div>
              <p className="text-sm font-medium text-muted-foreground">Scan & Order Instantly</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
