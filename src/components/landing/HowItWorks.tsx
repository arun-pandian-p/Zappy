import { motion } from 'framer-motion';
import { QrCode, ShoppingCart, ChefHat, Bell, CreditCard, Star } from 'lucide-react';

interface HowItWorksProps {
  cms?: Record<string, any>;
}

const steps = [
  {
    icon: QrCode,
    title: 'Scan QR Code',
    desc: 'Customer scans the QR code placed on the table to instantly open the digital menu.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: ShoppingCart,
    title: 'Browse & Order',
    desc: 'Explore the full menu with images, customize items with add-ons, and place the order.',
    color: 'bg-amber-500/10 text-amber-600',
  },
  {
    icon: ChefHat,
    title: 'Kitchen Receives Order',
    desc: 'Order appears instantly on the Kitchen Display with item details and table number.',
    color: 'bg-sky-500/10 text-sky-600',
  },
  {
    icon: Bell,
    title: 'Real-Time Status',
    desc: 'Customer tracks order status live — Pending → Preparing → Ready → Served.',
    color: 'bg-emerald-500/10 text-emerald-600',
  },
  {
    icon: CreditCard,
    title: 'Pay & Checkout',
    desc: 'Generate invoice, apply coupons, split bills, and complete payment seamlessly.',
    color: 'bg-violet-500/10 text-violet-600',
  },
  {
    icon: Star,
    title: 'Rate & Review',
    desc: 'Customer leaves feedback which the admin can view from the dashboard.',
    color: 'bg-rose-500/10 text-rose-600',
  },
];

const HowItWorks = ({ cms }: HowItWorksProps) => {
  const heading = cms?.heading || 'How It Works';

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-sky-500 bg-clip-text text-transparent">{heading}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">From scan to served — the complete ZAPPY ordering flow.</p>
        </motion.div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Steps flow */}
          <div className="space-y-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="relative"
              >
                <div className="flex items-start gap-4 p-4 rounded-xl bg-card border hover:shadow-md transition-shadow">
                  {/* Step number + icon */}
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-muted-foreground">STEP {i + 1}</span>
                    <div className={`w-10 h-10 rounded-xl ${step.color} flex items-center justify-center`}>
                      <step.icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-sm font-bold text-foreground mb-1">{step.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </div>
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="absolute left-[2.15rem] top-full w-0.5 h-4 bg-border" />
                )}
              </motion.div>
            ))}
          </div>

          {/* Video preview */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="sticky top-24 border border-border/40 rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="bg-foreground/5 px-4 py-2 border-b border-border/30 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium ml-2">ZAPPY — Live Demo</span>
            </div>
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full aspect-[9/16] object-cover"
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
