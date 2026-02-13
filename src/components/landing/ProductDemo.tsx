import { motion } from 'framer-motion';
import { Smartphone, Wifi } from 'lucide-react';

const ProductDemo = () => {
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
            See It{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              In Action
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A seamless ordering experience right from the customer's phone.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="flex justify-center"
        >
          <div className="relative">
            {/* Phone frame */}
            <div className="relative w-[280px] h-[560px] bg-foreground rounded-[3rem] p-3 shadow-2xl">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-foreground rounded-b-2xl z-10" />
              <div className="w-full h-full bg-background rounded-[2.25rem] overflow-hidden relative">
                {/* Mock menu screen */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Smartphone className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-bold">QR Dine Pro</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Wifi className="w-3 h-3" />
                      <span>Table 5</span>
                    </div>
                  </div>

                  <div className="flex gap-2 overflow-hidden">
                    {['All', 'Starters', 'Mains', 'Drinks'].map((cat, i) => (
                      <motion.div
                        key={cat}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
                          i === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {cat}
                      </motion.div>
                    ))}
                  </div>

                  {[
                    { name: 'Butter Chicken', price: '₹320', tag: 'Popular' },
                    { name: 'Paneer Tikka', price: '₹250', tag: 'Veg' },
                    { name: 'Biryani Special', price: '₹380', tag: 'Chef\'s Pick' },
                    { name: 'Mango Lassi', price: '₹120', tag: '' },
                  ].map((item, i) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.8 + i * 0.15 }}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-card border"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-lg bg-muted" />
                        <div>
                          <p className="text-xs font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.price}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.tag && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{item.tag}</span>
                        )}
                        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">+</div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Bottom cart bar */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1.5 }}
                  className="absolute bottom-0 left-0 right-0 p-3"
                >
                  <div className="bg-primary text-primary-foreground rounded-2xl p-3 flex items-center justify-between text-xs">
                    <span>2 items · ₹570</span>
                    <span className="font-bold">View Cart →</span>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Glow */}
            <div className="absolute -inset-8 bg-primary/10 rounded-[4rem] blur-3xl -z-10 animate-pulse-ring" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProductDemo;
