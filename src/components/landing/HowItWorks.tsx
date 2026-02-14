import { motion } from 'framer-motion';
import { QrCode, BookOpen, ShoppingCart, BarChart3 } from 'lucide-react';

const steps = [
  {
    icon: QrCode,
    title: 'Scan QR Code',
    description: 'Customers scan the QR code on their table using any smartphone camera.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: BookOpen,
    title: 'Browse Menu',
    description: 'Beautiful digital menu with images, categories, dietary filters, and real-time availability.',
    color: 'bg-accent/10 text-accent-foreground',
  },
  {
    icon: ShoppingCart,
    title: 'Place Order',
    description: 'Add items to cart, customize with special instructions, and place the order instantly.',
    color: 'bg-success/10 text-success',
  },
  {
    icon: BarChart3,
    title: 'Track & Enjoy',
    description: 'Real-time order status updates. Kitchen prepares, waiter serves, customer enjoys.',
    color: 'bg-info/10 text-info',
  },
];

const HowItWorks = () => {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How It{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From scan to serve in four simple steps.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto relative">
          {/* Vertical connector line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-border md:-translate-x-px" />

          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className={`relative flex items-start gap-6 mb-12 last:mb-0 flex-row ${
                i % 2 !== 0 ? 'md:flex-row-reverse' : ''
              }`}
            >
              {/* Step number circle */}
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 + 0.2, type: 'spring', stiffness: 200 }}
                className="relative z-10 shrink-0"
              >
                <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center shadow-lg`}>
                  <step.icon className="w-7 h-7" />
                </div>
              </motion.div>

              {/* Content */}
              <div className={`flex-1 pt-2 ${i % 2 !== 0 ? 'md:text-right' : ''}`}>
                <div className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">
                  Step {i + 1}
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
