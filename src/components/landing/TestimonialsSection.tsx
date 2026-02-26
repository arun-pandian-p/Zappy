import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const defaultTestimonials = [
  { name: 'Priya Sharma', role: 'Owner, Spice Garden', content: 'ZAPPY transformed our restaurant. Orders are 40% faster and our customers love the seamless experience!', rating: 5, initials: 'PS', color: 'bg-pink-500' },
  { name: 'Rahul Verma', role: 'Manager, Urban Bites', content: 'The kitchen display system is a game-changer. No more missed orders or confusion. Our team efficiency skyrocketed.', rating: 5, initials: 'RV', color: 'bg-blue-500' },
  { name: 'Anita Desai', role: 'Owner, Café Bliss', content: 'From a single table to 20 tables in 6 months. The analytics helped us understand what customers really want.', rating: 5, initials: 'AD', color: 'bg-purple-500' },
  { name: 'Vikram Patel', role: 'Chef, Tandoor Tales', content: 'The kitchen dashboard keeps my team in sync. We cut prep errors by 60% in the first month alone.', rating: 5, initials: 'VP', color: 'bg-green-500' },
  { name: 'Meera Joshi', role: 'Owner, Tea & Toast', content: 'The feedback system helped us improve our service. Happy customers now leave Google Reviews automatically!', rating: 5, initials: 'MJ', color: 'bg-amber-500' },
];

const colors = ['bg-pink-500', 'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-amber-500'];

interface TestimonialsSectionProps {
  cms?: Record<string, any>;
}

const TestimonialsSection = ({ cms }: TestimonialsSectionProps) => {
  const heading = cms?.heading || 'Loved by Restaurant Owners';

  const testimonials = cms?.items?.length
    ? (cms.items as any[]).map((item: any, i: number) => ({
        name: item.name,
        role: item.role,
        content: item.quote || item.content || '',
        rating: 5,
        initials: item.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2) || '??',
        color: colors[i % colors.length],
      }))
    : defaultTestimonials;

  return (
    <section className="py-16 md:py-24 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{heading}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">See what our customers have to say about ZAPPY.</p>
        </motion.div>

        <div className="relative group">
          <div className="flex animate-marquee-slow group-hover:[animation-play-state:paused]">
            {[...testimonials, ...testimonials].map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % testimonials.length) * 0.1 }} className="shrink-0 w-[280px] sm:w-[340px] mx-3">
                <Card className="h-full border bg-card/80 backdrop-blur-sm hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <Quote className="w-8 h-8 text-primary/20 mb-4" />
                    <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{t.content}</p>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 hover:ring-2 hover:ring-primary/50 transition-all">
                        <AvatarFallback className={`${t.color} text-white text-xs font-bold`}>{t.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5 mt-3">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star key={j} className="w-3.5 h-3.5 fill-accent text-accent" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
