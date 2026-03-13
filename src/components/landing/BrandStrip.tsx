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
{ name: 'Soup Kitchen', icon: Soup }];


const BrandStrip = () => {
  return (
    <section className="py-12 border-b bg-background overflow-hidden">
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center text-sm text-muted-foreground mb-8 tracking-widest uppercase">
        
        Trusted by 500+ restaurants worldwide
      </motion.p>
      <div className="relative group">
        









        
      </div>
    </section>);

};

export default BrandStrip;