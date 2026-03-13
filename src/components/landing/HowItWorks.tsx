import { motion } from 'framer-motion';
import { QrCode } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const orders = [
  { table: 'T11', status: 'Pending', badge: 'Sub', dotColor: 'bg-amber-400', badgeClass: 'bg-amber-100 text-amber-700' },
  { table: 'TT3', status: 'Preparing', badge: 'Eat', dotColor: 'bg-sky-400', badgeClass: 'bg-sky-100 text-sky-700' },
  { table: 'TT5', status: 'Ready', badge: 'Eat', dotColor: 'bg-emerald-400', badgeClass: 'bg-emerald-100 text-emerald-700' },
];

interface HowItWorksProps {
  cms?: Record<string, any>;
}

const HowItWorks = ({ cms }: HowItWorksProps) => {
  const heading = cms?.heading || 'How It Works';

  return (
    <section className="py-16 md:py-24 bg-blue-50/30">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-sky-500 bg-clip-text text-transparent">{heading}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Powerful features to improve your service &amp; sales.</p>
        </motion.div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="bg-white border border-border/40 rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <QrCode className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Scan QR Code</h3>
            </div>
            <div className="space-y-4">
              {orders.map((order, i) => (
                <motion.div key={order.table} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 + 0.3 }} className="flex items-center justify-between p-3 rounded-xl bg-blue-50/50 border border-border/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${order.dotColor}`} />
                    <span className="font-mono font-semibold text-sm text-foreground">{order.table}</span>
                    <span className="text-muted-foreground text-sm">— {order.status}</span>
                  </div>
                  <Badge className={`${order.badgeClass} border-0 text-xs`}>{order.badge}</Badge>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="border border-border/40 rounded-2xl shadow-sm overflow-hidden min-h-[280px]">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
              poster="/og-image.png"
            >
              <source src="/videos/brand-identity.mp4" type="video/mp4" />
            </video>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
