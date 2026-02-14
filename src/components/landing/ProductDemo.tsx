import { motion } from 'framer-motion';
import { Smartphone, Wifi, Plus } from 'lucide-react';
import { useState } from 'react';
import { menuItems, categories, systemSettings } from '@/data/mockData';

const displayCategories = categories.slice(0, 5);
const displayItems = menuItems.filter((i) => i.is_available).slice(0, 4);

const ProductDemo = () => {
  const [activeCategory, setActiveCategory] = useState(0);
  const [cart, setCart] = useState<Record<string, number>>({});

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = menuItems.find((m) => m.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const addToCart = (id: string) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  return (
    <section className="py-16 md:py-24 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-2xl md:text-4xl font-bold mb-4">
            See It{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              In Action
            </span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
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
            <div className="relative w-[280px] sm:w-[300px] h-[560px] sm:h-[600px] bg-foreground rounded-[3rem] p-3 shadow-2xl">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-foreground rounded-b-2xl z-10" />
              <div className="w-full h-full bg-background rounded-[2.25rem] overflow-hidden relative">
                {/* Mock menu screen */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Smartphone className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-bold">{systemSettings.restaurant_name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Wifi className="w-3 h-3" />
                      <span>Table 5</span>
                    </div>
                  </div>

                  {/* Real category pills */}
                  <div className="flex gap-2 overflow-hidden">
                    {displayCategories.map((cat, i) => (
                      <motion.button
                        key={cat}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        onClick={() => setActiveCategory(i)}
                        className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
                          i === activeCategory
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {cat}
                      </motion.button>
                    ))}
                  </div>

                  {/* Real menu items */}
                  {displayItems.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.8 + i * 0.15 }}
                      className="flex items-center justify-between p-2 rounded-xl bg-card border"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover"
                          loading="lazy"
                        />
                        <div>
                          <p className="text-xs font-medium leading-tight">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {systemSettings.currency_symbol}{item.price}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {item.is_vegetarian && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-600 font-medium">
                            Veg
                          </span>
                        )}
                        <button
                          onClick={() => addToCart(item.id)}
                          className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
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
                    <span>
                      {cartCount || 2} items · {systemSettings.currency_symbol}
                      {cartTotal || 548}
                    </span>
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
