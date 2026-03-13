import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Wifi, Plus, Minus, Check, Search, ShoppingCart, ChefHat, Bell, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ZappyLogo } from '@/components/branding/ZappyLogo';

const DEMO_RESTAURANT_ID = 'b8b1bc0d-ed79-4ed4-a53c-6acccce6efa9';

function useDemoMenu() {
  return useQuery({
    queryKey: ['demo-menu', DEMO_RESTAURANT_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*, category:categories(id, name)')
        .eq('restaurant_id', DEMO_RESTAURANT_ID)
        .eq('is_available', true)
        .order('display_order');
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

function useDemoCategories() {
  return useQuery({
    queryKey: ['demo-categories', DEMO_RESTAURANT_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', DEMO_RESTAURANT_ID)
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

function useDemoRestaurant() {
  return useQuery({
    queryKey: ['demo-restaurant', DEMO_RESTAURANT_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants_public')
        .select('*')
        .eq('id', DEMO_RESTAURANT_ID)
        .single();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

type DemoView = 'menu' | 'cart' | 'order-placed';

const ProductDemo = () => {
  const { data: menuItems = [], isLoading: menuLoading } = useDemoMenu();
  const { data: categories = [] } = useDemoCategories();
  const { data: restaurant } = useDemoRestaurant();

  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [demoStep, setDemoStep] = useState(0);
  const [isAutoplaying, setIsAutoplaying] = useState(true);
  const [view, setView] = useState<DemoView>('menu');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderStatus, setOrderStatus] = useState<string | null>(null);

  const categoryNames = useMemo(() => ['All', ...categories.map(c => c.name)], [categories]);
  const currency = restaurant?.currency === 'INR' ? '₹' : (restaurant?.currency || '₹');
  const restaurantName = restaurant?.name || 'ZAPPY';

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCat = activeCategory === 'All' || (item as any).category?.name === activeCategory;
      const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [menuItems, activeCategory, searchQuery]);

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = menuItems.find((m) => m.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);
  const cartItems = Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({ item: menuItems.find(m => m.id === id)!, qty }))
    .filter(c => c.item);

  const addToCart = useCallback((id: string) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    setJustAdded(id);
    setTimeout(() => setJustAdded(null), 600);
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => {
      const n = (prev[id] || 0) - 1;
      if (n <= 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: n };
    });
  }, []);

  // Autoplay demo sequence
  useEffect(() => {
    if (!isAutoplaying || menuItems.length === 0) return;

    const catNames = categoryNames.length > 1 ? categoryNames : ['All'];
    const availableItems = menuItems.slice(0, 8);

    const demoSequence = [
      () => setActiveCategory(catNames[1] || 'All'),
      () => { if (availableItems[0]) addToCart(availableItems[0].id); },
      () => setActiveCategory(catNames[2] || 'All'),
      () => { if (availableItems[2]) addToCart(availableItems[2].id); },
      () => setActiveCategory(catNames[3] || 'All'),
      () => { if (availableItems[4]) addToCart(availableItems[4].id); },
      () => setActiveCategory('All'),
      () => { if (availableItems[1]) addToCart(availableItems[1].id); },
      () => setView('cart'),
      () => { handleDemoOrder(); },
      () => { /* wait on order status */ },
      () => { setView('menu'); setCart({}); setOrderStatus(null); setDemoStep(-1); },
    ];

    const timer = setTimeout(() => {
      const step = demoStep % demoSequence.length;
      demoSequence[step]?.();
      setDemoStep((s) => s + 1);
    }, demoStep === 0 ? 2500 : 1500);

    return () => clearTimeout(timer);
  }, [demoStep, isAutoplaying, menuItems, categoryNames, addToCart]);

  const handleDemoOrder = () => {
    setView('order-placed');
    setOrderStatus('pending');
    // Simulate order status progression
    setTimeout(() => setOrderStatus('confirmed'), 1500);
    setTimeout(() => setOrderStatus('preparing'), 3000);
    setTimeout(() => setOrderStatus('ready'), 5000);
  };

  const itemsToShow = filteredItems.slice(0, 6);

  return (
    <section className="py-12 md:py-24 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 md:mb-16"
        >
          <h2 className="text-2xl md:text-4xl font-bold mb-3">
            See It{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              In Action
            </span>
          </h2>
          <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Interactive demo — browse the real menu, add items, and watch the order flow. Nothing goes to the kitchen!
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="flex justify-center"
          onMouseEnter={() => setIsAutoplaying(false)}
          onTouchStart={() => setIsAutoplaying(false)}
          onMouseLeave={() => setIsAutoplaying(true)}
        >
          <div className="relative">
            {/* Phone frame */}
            <div className="relative w-[280px] sm:w-[320px] md:w-[360px] h-[540px] sm:h-[600px] md:h-[680px] bg-foreground rounded-[2.5rem] sm:rounded-[3rem] p-2.5 sm:p-3 shadow-2xl">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 sm:w-28 h-5 sm:h-6 bg-foreground rounded-b-2xl z-10" />
              <div className="w-full h-full bg-background rounded-[2rem] sm:rounded-[2.25rem] overflow-hidden relative flex flex-col">

                {/* Header */}
                <div className="p-3 sm:p-4 pb-1.5 sm:pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-bold leading-tight block">{restaurantName}</span>
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground">Digital Menu</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-muted-foreground bg-muted px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                      <Wifi className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-500" />
                      <span>Table 1</span>
                    </div>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {view === 'menu' && (
                    <MenuView
                      key="menu"
                      items={itemsToShow}
                      categories={categoryNames}
                      activeCategory={activeCategory}
                      cart={cart}
                      justAdded={justAdded}
                      currency={currency}
                      loading={menuLoading}
                      onCategoryChange={(cat) => { setActiveCategory(cat); setIsAutoplaying(false); }}
                      onAdd={(id) => { addToCart(id); setIsAutoplaying(false); }}
                      onRemove={(id) => { removeFromCart(id); setIsAutoplaying(false); }}
                    />
                  )}
                  {view === 'cart' && (
                    <CartView
                      key="cart"
                      items={cartItems}
                      currency={currency}
                      cartTotal={cartTotal}
                      onBack={() => setView('menu')}
                      onOrder={handleDemoOrder}
                    />
                  )}
                  {view === 'order-placed' && (
                    <OrderView
                      key="order"
                      status={orderStatus}
                      cartTotal={cartTotal}
                      currency={currency}
                      onBack={() => { setView('menu'); setCart({}); setOrderStatus(null); }}
                    />
                  )}
                </AnimatePresence>

                {/* Bottom bar */}
                {view === 'menu' && (
                  <div className="p-2.5 sm:p-3 pt-1.5 sm:pt-2">
                    <motion.button
                      onClick={() => { if (cartCount > 0) { setView('cart'); setIsAutoplaying(false); } }}
                      animate={{
                        y: cartCount > 0 ? 0 : 8,
                        opacity: cartCount > 0 ? 1 : 0.5,
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      className="w-full bg-primary text-primary-foreground rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex items-center justify-between text-[10px] sm:text-xs shadow-lg shadow-primary/20"
                    >
                      <span className="font-medium flex items-center gap-1.5">
                        <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        {cartCount} items · {currency}{cartTotal.toFixed(0)}
                      </span>
                      <motion.span
                        className="font-bold"
                        animate={cartCount > 0 ? { x: [0, 3, 0] } : {}}
                        transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2 }}
                      >
                        View Cart →
                      </motion.span>
                    </motion.button>
                  </div>
                )}
              </div>
            </div>

            {/* Glow */}
            <div className="absolute -inset-6 sm:-inset-8 bg-primary/10 rounded-[3.5rem] sm:rounded-[4rem] blur-3xl -z-10 animate-pulse-ring" />

            {/* Live Demo badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1.5 }}
              className="absolute -bottom-5 sm:-bottom-6 left-1/2 -translate-x-1/2"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-card border shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">Live Demo · No orders sent</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

/* ─── Menu View ─── */
interface MenuViewProps {
  items: any[];
  categories: string[];
  activeCategory: string;
  cart: Record<string, number>;
  justAdded: string | null;
  currency: string;
  loading: boolean;
  onCategoryChange: (cat: string) => void;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
}

function MenuView({ items, categories, activeCategory, cart, justAdded, currency, loading, onCategoryChange, onAdd, onRemove }: MenuViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col flex-1 overflow-hidden"
    >
      {/* Search */}
      <div className="px-3 sm:px-4 pb-1.5 sm:pb-2">
        <div className="flex items-center gap-2 bg-muted rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2">
          <Search className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" />
          <span className="text-[10px] sm:text-[11px] text-muted-foreground">Search menu...</span>
        </div>
      </div>

      {/* Category pills */}
      <div className="px-3 sm:px-4 pb-2 sm:pb-3">
        <div className="flex gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar">
          {categories.slice(0, 6).map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] whitespace-nowrap transition-all duration-300 shrink-0 ${
                cat === activeCategory
                  ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 space-y-1.5 sm:space-y-2 pb-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-1.5 sm:space-y-2"
            >
              {items.length === 0 && (
                <p className="text-[10px] text-muted-foreground text-center py-4">No items in this category</p>
              )}
              {items.map((item, i) => {
                const inCart = cart[item.id] || 0;
                const wasJustAdded = justAdded === item.id;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center justify-between p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-card border transition-all duration-300 ${
                      wasJustAdded ? 'border-primary/50 shadow-sm shadow-primary/10' : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0">
                      <img
                        src={item.image_url || '/placeholder.svg'}
                        alt={item.name}
                        className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg object-cover shrink-0"
                        loading="lazy"
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-[11px] font-semibold leading-tight truncate">{item.name}</p>
                        <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium">
                          {currency}{item.price}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                      {item.is_vegetarian && (
                        <span className="text-[7px] sm:text-[8px] px-1 sm:px-1.5 py-0.5 rounded bg-green-500/15 text-green-600 font-semibold">
                          Veg
                        </span>
                      )}
                      {inCart > 0 ? (
                        <div className="flex items-center gap-0.5 bg-primary/10 rounded-lg">
                          <button onClick={() => onRemove(item.id)} className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-primary">
                            <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          </button>
                          <span className="text-[9px] sm:text-[10px] font-bold w-3 text-center text-primary">{inCart}</span>
                          <button onClick={() => onAdd(item.id)} className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-primary">
                            <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          </button>
                        </div>
                      ) : (
                        <motion.button
                          onClick={() => onAdd(item.id)}
                          whileTap={{ scale: 0.9 }}
                          className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground overflow-hidden"
                        >
                          <AnimatePresence mode="wait">
                            {wasJustAdded ? (
                              <motion.div key="check" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ duration: 0.3 }}>
                                <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              </motion.div>
                            ) : (
                              <motion.div key="plus" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Cart View ─── */
interface CartViewProps {
  items: { item: any; qty: number }[];
  currency: string;
  cartTotal: number;
  onBack: () => void;
  onOrder: () => void;
}

function CartView({ items, currency, cartTotal, onBack, onOrder }: CartViewProps) {
  const tax = cartTotal * 0.05;
  const total = cartTotal + tax;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col flex-1 overflow-hidden"
    >
      <div className="px-3 sm:px-4 pb-2 flex items-center gap-2">
        <button onClick={onBack} className="text-[10px] sm:text-xs text-primary font-medium">← Back</button>
        <span className="text-[11px] sm:text-xs font-bold">Your Cart</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 sm:px-4 space-y-2">
        {items.map(({ item, qty }) => (
          <div key={item.id} className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-card border">
            <div className="flex items-center gap-2 min-w-0">
              <img src={item.image_url || '/placeholder.svg'} alt={item.name} className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-cover" />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] font-semibold truncate">{item.name}</p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground">{qty} × {currency}{item.price}</p>
              </div>
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold">{currency}{(item.price * qty).toFixed(0)}</span>
          </div>
        ))}
      </div>

      <div className="p-3 sm:p-4 border-t space-y-1.5 sm:space-y-2">
        <div className="flex justify-between text-[9px] sm:text-[10px] text-muted-foreground">
          <span>Subtotal</span><span>{currency}{cartTotal.toFixed(0)}</span>
        </div>
        <div className="flex justify-between text-[9px] sm:text-[10px] text-muted-foreground">
          <span>Tax (5%)</span><span>{currency}{tax.toFixed(0)}</span>
        </div>
        <div className="flex justify-between text-[10px] sm:text-[11px] font-bold">
          <span>Total</span><span>{currency}{total.toFixed(0)}</span>
        </div>
        <motion.button
          onClick={onOrder}
          whileTap={{ scale: 0.97 }}
          className="w-full bg-primary text-primary-foreground rounded-xl p-2.5 sm:p-3 text-[10px] sm:text-xs font-bold shadow-lg shadow-primary/20"
        >
          Place Order (Demo) →
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ─── Order Status View ─── */
const ORDER_STEPS = [
  { key: 'pending', label: 'Placed', icon: ShoppingCart },
  { key: 'confirmed', label: 'Accepted', icon: Check },
  { key: 'preparing', label: 'Preparing', icon: ChefHat },
  { key: 'ready', label: 'Ready', icon: Bell },
] as const;

interface OrderViewProps {
  status: string | null;
  cartTotal: number;
  currency: string;
  onBack: () => void;
}

function OrderView({ status, cartTotal, currency, onBack }: OrderViewProps) {
  const currentIdx = ORDER_STEPS.findIndex(s => s.key === status);
  const activeIdx = currentIdx === -1 ? 0 : currentIdx;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col flex-1 items-center justify-center px-4 sm:px-6 gap-4 sm:gap-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center"
      >
        <Check className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
      </motion.div>
      <div className="text-center">
        <p className="text-xs sm:text-sm font-bold">Order Placed!</p>
        <p className="text-[9px] sm:text-[10px] text-muted-foreground">Demo order · {currency}{(cartTotal * 1.05).toFixed(0)}</p>
      </div>

      {/* Mini pipeline */}
      <div className="w-full px-2">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-4 left-4 right-4 h-0.5 bg-muted" />
          <motion.div
            className="absolute top-4 left-4 h-0.5 bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `calc(${(activeIdx / (ORDER_STEPS.length - 1)) * 100}% - 32px)` }}
            transition={{ duration: 0.5 }}
          />
          {ORDER_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx <= activeIdx;
            const isCurrent = idx === activeIdx;
            return (
              <div key={step.key} className="relative z-10 flex flex-col items-center gap-1">
                <motion.div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isActive ? 'bg-primary border-primary text-primary-foreground' : 'bg-card border-muted text-muted-foreground'
                  }`}
                  animate={isCurrent ? { scale: [1, 1.15, 1] } : {}}
                  transition={isCurrent ? { duration: 1.5, repeat: Infinity } : undefined}
                >
                  <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </motion.div>
                <span className={`text-[8px] sm:text-[9px] font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <button onClick={onBack} className="text-[10px] sm:text-xs text-primary font-medium mt-2">
        ← Back to Menu
      </button>
    </motion.div>
  );
}

export default ProductDemo;
