import { motion } from 'framer-motion';
import { Smartphone, Wifi, Printer, CreditCard, Bell, Globe, Shield, Zap } from 'lucide-react';
import techStackImg from '@/assets/tech-stack-visual.png';

const techs = [
{ name: 'Mobile First', icon: Smartphone, x: '-60%', y: '-40%' },
{ name: 'Real-time Sync', icon: Wifi, x: '-85%', y: '10%' },
{ name: 'Thermal Print', icon: Printer, x: '-70%', y: '60%' },
{ name: 'Payments', icon: CreditCard, x: '60%', y: '-40%' },
{ name: 'Notifications', icon: Bell, x: '85%', y: '10%' },
{ name: 'Multi-Tenant', icon: Globe, x: '70%', y: '60%' },
{ name: 'Secure Auth', icon: Shield, x: '-30%', y: '80%' },
{ name: 'Fast & Light', icon: Zap, x: '30%', y: '80%' }];


const IntegrationsCloud = () => {
  return (
    <section className="py-24 bg-foreground overflow-hidden">
      <div className="container mx-auto px-4">

        {/* Central visual with floating badges */}
        <div className="relative max-w-4xl mx-auto flex items-center justify-center min-h-[400px] md:min-h-[500px]">
          {/* Glow orbs */}
          <div className="absolute w-[300px] h-[300px] rounded-full bg-primary/20 blur-[120px] z-0" />
          <div className="absolute w-[200px] h-[200px] rounded-full bg-accent/15 blur-[80px] translate-x-20 translate-y-10 z-0" />

          {/* Central image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, type: 'spring' }}
            className="relative z-10 w-full max-w-2xl">
            
            



            
          </motion.div>

          {/* Floating tech badges */}
          {techs.map((tech, i) =>
          <motion.div
            key={tech.name}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + i * 0.1, type: 'spring', stiffness: 200 }}
            animate={{ y: [0, -8, 0] }}
            // @ts-ignore
            style={{ position: 'absolute', left: '50%', top: '50%', x: tech.x, y: tech.y }}
            className="z-20 hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-card/90 backdrop-blur-md border border-border/50 shadow-lg shadow-primary/5 cursor-pointer group"
            whileHover={{ scale: 1.15 }}>
            
              <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}>
              
                <tech.icon className="w-4 h-4 text-primary" />
              </motion.div>
              <span className="text-xs font-medium text-foreground whitespace-nowrap">{tech.name}</span>
            </motion.div>
          )}
        </div>

        {/* Mobile: horizontal scroll badges */}
        <div className="md:hidden mt-8 overflow-hidden">
          <motion.div
            className="flex gap-3 w-max"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ x: { duration: 15, repeat: Infinity, ease: 'linear' } }}>
            
            {[...techs, ...techs].map((tech, i) =>
            <div
              key={`${tech.name}-${i}`}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/90 border border-border/50 shrink-0">
              
                <tech.icon className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-foreground whitespace-nowrap">{tech.name}</span>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>);

};

export default IntegrationsCloud;