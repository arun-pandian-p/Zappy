import { motion } from 'framer-motion';
import { Smartphone, Wifi, Printer, CreditCard, Bell, Globe, Shield, Zap } from 'lucide-react';

const techs = [
  { name: 'Mobile First', icon: Smartphone },
  { name: 'Real-time Sync', icon: Wifi },
  { name: 'Thermal Print', icon: Printer },
  { name: 'Payments', icon: CreditCard },
  { name: 'Notifications', icon: Bell },
  { name: 'Multi-Tenant', icon: Globe },
  { name: 'Secure Auth', icon: Shield },
  { name: 'Fast & Light', icon: Zap },
];

const IntegrationsCloud = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Built with{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Modern Tech
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Enterprise-grade technology stack for reliability and speed.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {techs.map((tech, i) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 150 }}
              whileHover={{ scale: 1.1, y: -5 }}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <tech.icon className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {tech.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IntegrationsCloud;
