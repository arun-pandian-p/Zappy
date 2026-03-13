import { motion } from 'framer-motion';
import { Monitor, CreditCard, Bell, BarChart3, QrCode, ChefHat } from 'lucide-react';

const iconMap: Record<string, any> = { Monitor, CreditCard, Bell, BarChart3, QrCode, ChefHat };

const defaultFeatures = [
  { icon: Monitor, title: 'Kitchen Display', description: 'Real-time order management with KDS.', iconBg: 'bg-blue-100', iconColor: 'text-blue-500' },
  { icon: CreditCard, title: 'Easy Billing', description: 'Fast checkout and receipt printing.', iconBg: 'bg-sky-100', iconColor: 'text-sky-500' },
  { icon: Bell, title: 'Waiter Calls', description: 'Instant table-side assistance with orders.', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-500' },
  { icon: BarChart3, title: 'Analytics', description: 'Track sales, reviews, & revenue in orders.', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
];

interface FeaturesSectionProps {
  cms?: Record<string, any>;
}

const FeaturesSection = ({ cms }: FeaturesSectionProps) => {
  const heading = cms?.heading || 'Streamline Your Restaurant';
  const subheading = cms?.subheading || 'Powerful features to improve your service & sales.';

  const features = cms?.items
    ? (cms.items as any[]).map((item: any, i: number) => ({
        icon: iconMap[item.icon] || defaultFeatures[i % defaultFeatures.length]?.icon || BarChart3,
        title: item.title,
        description: item.description,
        iconBg: defaultFeatures[i % defaultFeatures.length]?.iconBg || 'bg-primary/10',
        iconColor: defaultFeatures[i % defaultFeatures.length]?.iconColor || 'text-primary',
      }))
    : defaultFeatures;

  return (
    <section className="py-16 md:py-24 bg-foreground">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary-foreground">
            {heading.includes('Restaurant') ? (
              <>
                {heading.split('Restaurant')[0]}
                <span className="bg-gradient-to-r from-primary to-sky-400 bg-clip-text text-transparent">Restaurant</span>
                {heading.split('Restaurant')[1]}
              </>
            ) : heading}
          </h2>
          <p className="text-lg text-primary-foreground/60 max-w-2xl mx-auto">{subheading}</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature: any, i: number) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-primary-foreground/5 backdrop-blur-sm border border-primary-foreground/10 rounded-2xl shadow-sm hover:shadow-lg hover:bg-primary-foreground/10 transition-all p-6 text-center"
            >
              <div className={`w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4`}>
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-primary-foreground">{feature.title}</h3>
              <p className="text-primary-foreground/60 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
