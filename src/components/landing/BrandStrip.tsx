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
  { name: 'Soup Kitchen', icon: Soup },
];

const BrandStrip = () => {
  return (
    <section className="py-12 border-b bg-background overflow-hidden">
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center text-sm text-muted-foreground mb-8 tracking-widest uppercase"
      >
        Trusted by 500+ restaurants worldwide
      </motion.p>
      <div className="relative group">
        <div className="flex animate-marquee group-hover:[animation-play-state:paused]">
          {[...brands, ...brands].map((brand, i) => (
            <div
              key={i}
              className="flex items-center gap-2 mx-8 shrink-0 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer"
            >
              <brand.icon className="w-6 h-6 text-muted-foreground" />
              <span className="text-lg font-semibold text-muted-foreground whitespace-nowrap">{brand.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandStrip;
