import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Wifi, Plus, Check, Search } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { menuItems, categories, systemSettings } from '@/data/mockData';

const displayCategories = ['All', 'Starters', 'Burgers', 'Pizza', 'Main Course'];
const displayItems = menuItems.filter((i) => i.is_available).slice(0, 6);

const ProductDemo = () => {
  const [activeCategory, setActiveCategory] = useState(0);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [demoStep, setDemoStep] = useState(0);
  const [isAutoplaying, setIsAutoplaying] = useState(true);

  const filteredItems = activeCategory === 0
    ? displayItems
    : displayItems.filter(item => item.category === displayCategories[activeCategory]);

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

  useEffect(() => {
    if (!isAutoplaying) return;

    const demoSequence = [
      () => setActiveCategory(1),
      () => setActiveCategory(2),
      () => addToCart(displayItems[0]?.id),
      () => setActiveCategory(3),
      () => addToCart(displayItems[2]?.id),
      () => setActiveCategory(4),
      () => addToCart(displayItems[4]?.id),
      () => setActiveCategory(0),
      () => addToCart(displayItems[1]?.id),
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

  const itemsToShow = filteredItems.length > 0 ? filteredItems : displayItems.slice(0, 4);

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
            {/* Phone frame - responsive sizing */}
            <div className="relative w-[300px] sm:w-[340px] md:w-[360px] h-[580px] sm:h-[640px] md:h-[680px] bg-foreground rounded-[3rem] p-3 shadow-2xl">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-foreground rounded-b-2xl z-10" />
              <div className="w-full h-full bg-background rounded-[2.25rem] overflow-hidden relative flex flex-col">
                {/* Header */}
                <div className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Smartphone className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <span className="text-sm font-bold leading-tight block">{systemSettings.restaurant_name}</span>
                        <span className="text-[10px] text-muted-foreground">Digital Menu</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        <Wifi className="w-3 h-3 text-green-500" />
                        <span>Table 5</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Search bar */}
                <div className="px-4 pb-2">
                  <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
                    <Search className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">Search menu...</span>
                  </div>
                </div>

                {/* Category pills */}
                <div className="px-4 pb-3">
                  <div className="flex gap-1.5 overflow-hidden">
                    {displayCategories.map((cat, i) => (
                      <motion.button
                        key={cat}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        onClick={() => { setActiveCategory(i); setIsAutoplaying(false); }}
                        animate={i === activeCategory ? { scale: [1, 1.05, 1] } : {}}
                        className={`px-2.5 py-1 rounded-full text-[10px] whitespace-nowrap transition-all duration-300 ${
                          i === activeCategory
                            ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {cat}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Menu items list */}
                <div className="flex-1 overflow-hidden px-4 space-y-2">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeCategory}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-2"
                    >
                      {itemsToShow.map((item, i) => {
                        const inCart = cart[item.id] || 0;
                        const wasJustAdded = justAdded === item.id;

                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className={`flex items-center justify-between p-2 rounded-xl bg-card border transition-all duration-300 ${
                              wasJustAdded ? 'border-primary/50 shadow-sm shadow-primary/10' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-11 h-11 rounded-lg object-cover"
                                loading="lazy"
                              />
                              <div>
                                <p className="text-[11px] font-semibold leading-tight">{item.name}</p>
                                <p className="text-[11px] text-muted-foreground font-medium">
                                  {systemSettings.currency_symbol}{item.price}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {item.is_vegetarian && (
                                <span className="text-[8px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-600 font-semibold">
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
                    </motion.div>
                  </AnimatePresence>
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
