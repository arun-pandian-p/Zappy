import { motion } from 'framer-motion';
import { UtensilsCrossed, Coffee, Wine, IceCream, Pizza, Salad, Sandwich, Soup } from 'lucide-react';

const brands = [
  { name: 'Spice Garden', icon: UtensilsCrossed },
  { name: 'Urban Bites', icon: Coffee },
  { name: 'Café Bliss', icon: Wine },
  { name: 'Sweet Treats', icon: IceCream },
  { name: 'Pizza Palace', icon: Pizza },
  { name: 'Green Bowl', icon: Salad },
  { name: 'Deli Express', icon: Sandwich },
  { name: 'Soup Kitchen', icon: Soup }
];

const BrandStrip = () => {
  const marqueeItems = [...brands, ...brands, ...brands];

  return (
    <section className="py-10 bg-secondary/20 border-y border-border/40 overflow-hidden relative select-none">
      <div className="container mx-auto px-4 mb-5 text-center">
        <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
          Trusted by over 100+ restaurants across India
        </p>
      </div>

      <div className="relative flex items-center w-full">
        {/* Left & Right gradient fades for premium look */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <motion.div
          className="flex gap-16 whitespace-nowrap items-center"
          animate={{ x: ['0%', '-50%'] }}
          transition={{
            ease: 'linear',
            duration: 25,
            repeat: Infinity,
          }}
        >
          {marqueeItems.map((brand, idx) => {
            const Icon = brand.icon;
            return (
              <div
                key={`${brand.name}-${idx}`}
                className="flex items-center gap-3 text-muted-foreground/60 hover:text-primary transition-colors cursor-pointer group shrink-0"
              >
                <div className="w-9 h-9 rounded-xl bg-card border border-border/50 flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary/5 transition-all duration-300">
                  <Icon className="w-5 h-5 text-muted-foreground/80 group-hover:text-primary transition-colors" />
                </div>
                <span className="text-sm font-bold tracking-wider uppercase">{brand.name}</span>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default BrandStrip;