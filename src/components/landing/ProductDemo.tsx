import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Wifi, Plus, Check } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { menuItems, categories, systemSettings } from '@/data/mockData';

const displayCategories = categories.slice(0, 4);
const displayItems = menuItems.filter((i) => i.is_available).slice(0, 4);

const ProductDemo = () => {
  const [activeCategory, setActiveCategory] = useState(0);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [demoStep, setDemoStep] = useState(0);
  const [isAutoplaying, setIsAutoplaying] = useState(true);

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = menuItems.find((m) => m.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const addToCart = useCallback((id: string) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    setJustAdded(id);
    setTimeout(() => setJustAdded(null), 600);
  }, []);

  // Auto-demo: cycle through categories and add items
  useEffect(() => {
    if (!isAutoplaying) return;

    const demoSequence = [
      // Switch to Starters
      () => setActiveCategory(1),
      // Switch to Burgers
      () => setActiveCategory(2),
      // Add Classic Burger
      () => addToCart(displayItems[0]?.id),
      // Switch to Pizza
      () => setActiveCategory(3),
      // Add Margherita Pizza
      () => addToCart(displayItems[2]?.id),
      // Switch to All
      () => setActiveCategory(0),
      // Add Veggie Delight
      () => addToCart(displayItems[1]?.id),
      // Pause then reset
      () => {
        setCart({});
        setDemoStep(-1);
      },
    ];

    const timer = setTimeout(() => {
      const step = demoStep % demoSequence.length;
      demoSequence[step]?.();
      setDemoStep((s) => s + 1);
    }, demoStep === 0 ? 2000 : 1200);

    return () => clearTimeout(timer);
  }, [demoStep, isAutoplaying, addToCart]);

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
          onMouseEnter={() => setIsAutoplaying(false)}
          onMouseLeave={() => setIsAutoplaying(true)}
        >
          <div className="relative">
            {/* Phone frame */}
            <div className="relative w-[280px] sm:w-[320px] h-[560px] sm:h-[620px] bg-foreground rounded-[3rem] p-3 shadow-2xl">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-foreground rounded-b-2xl z-10" />
              <div className="w-full h-full bg-background rounded-[2.25rem] overflow-hidden relative flex flex-col">
                {/* Header */}
                <div className="p-4 pb-2">
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
                </div>

                {/* Category pills */}
                <div className="px-4 pb-3">
                  <div className="flex gap-2 overflow-hidden">
                    {displayCategories.map((cat, i) => (
                      <motion.button
                        key={cat}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        onClick={() => { setActiveCategory(i); setIsAutoplaying(false); }}
                        animate={i === activeCategory ? { scale: [1, 1.05, 1] } : {}}
                        className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all duration-300 ${
                          i === activeCategory
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {cat}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Menu items list */}
                <div className="flex-1 overflow-hidden px-4 space-y-2.5">
                  {displayItems.map((item, i) => {
                    const inCart = cart[item.id] || 0;
                    const wasJustAdded = justAdded === item.id;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.8 + i * 0.15 }}
                        animate={wasJustAdded ? { scale: [1, 1.02, 1], borderColor: ['hsl(var(--border))', 'hsl(var(--primary))', 'hsl(var(--border))'] } : {}}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-card border"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-11 h-11 rounded-lg object-cover"
                            loading="lazy"
                          />
                          <div>
                            <p className="text-xs font-semibold leading-tight">{item.name}</p>
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
                          <motion.button
                            onClick={() => { addToCart(item.id); setIsAutoplaying(false); }}
                            whileTap={{ scale: 0.9 }}
                            className="relative w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground overflow-hidden"
                          >
                            <AnimatePresence mode="wait">
                              {wasJustAdded ? (
                                <motion.div
                                  key="check"
                                  initial={{ scale: 0, rotate: -90 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  exit={{ scale: 0 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="plus"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                            {inCart > 0 && !wasJustAdded && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-accent text-[8px] font-bold flex items-center justify-center text-accent-foreground"
                              >
                                {inCart}
                              </motion.span>
                            )}
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Bottom cart bar */}
                <div className="p-3 pt-2">
                  <motion.div
                    animate={{
                      y: cartCount > 0 ? 0 : 10,
                      opacity: cartCount > 0 ? 1 : 0.7,
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="bg-primary text-primary-foreground rounded-2xl p-3 flex items-center justify-between text-xs shadow-lg shadow-primary/20"
                  >
                    <span className="font-medium">
                      {cartCount || 2} items · {systemSettings.currency_symbol}
                      {cartTotal || 548}
                    </span>
                    <motion.span
                      className="font-bold"
                      animate={cartCount > 0 ? { x: [0, 3, 0] } : {}}
                      transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2 }}
                    >
                      View Cart →
                    </motion.span>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Glow */}
            <div className="absolute -inset-8 bg-primary/10 rounded-[4rem] blur-3xl -z-10 animate-pulse-ring" />

            {/* "Live Demo" badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1.5 }}
              className="absolute -bottom-6 left-1/2 -translate-x-1/2"
            >
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-card border shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-xs font-medium text-muted-foreground">Live Demo</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProductDemo;
