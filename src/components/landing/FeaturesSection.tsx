import { motion } from 'framer-motion';
import { Monitor, CreditCard, BarChart3, QrCode, Users, Smile } from 'lucide-react';

const iconMap: Record<string, any> = { Monitor, CreditCard, BarChart3, QrCode, Users, Smile };

const defaultFeatures = [
  {
    icon: QrCode,
    title: 'QR Ordering',
    description: 'Customers scan, browse & order instantly from their phones. No app needed.',
    gradientFrom: 'from-blue-50',
    gradientTo: 'to-sky-100/40',
    iconColor: 'text-blue-600',
  },
  {
    icon: Monitor,
    title: 'Kitchen Display',
    description: 'Real-time order management with live KDS for faster preparation.',
    gradientFrom: 'from-indigo-50',
    gradientTo: 'to-violet-100/40',
    iconColor: 'text-indigo-600',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'Track sales, reviews & revenue with powerful insights and reports.',
    gradientFrom: 'from-violet-50',
    gradientTo: 'to-purple-100/40',
    iconColor: 'text-violet-600',
  },
  {
    icon: CreditCard,
    title: 'Smart Billing',
    description: 'Fast checkout, split payments & thermal receipt printing in seconds.',
    gradientFrom: 'from-sky-50',
    gradientTo: 'to-cyan-100/40',
    iconColor: 'text-sky-600',
  },
  {
    icon: Users,
    title: 'Staff Management',
    description: 'Manage waiters, kitchen staff, permissions, and roles seamlessly.',
    gradientFrom: 'from-blue-50',
    gradientTo: 'to-indigo-100/40',
    iconColor: 'text-indigo-600',
  },
  {
    icon: Smile,
    title: 'Customer Experience',
    description: 'Feedback tracking, discount campaigns, and loyalty programs to build retention.',
    gradientFrom: 'from-indigo-50',
    gradientTo: 'to-sky-100/40',
    iconColor: 'text-blue-600',
  },
];

interface FeaturesSectionProps {
  cms?: Record<string, any>;
}

const FeaturesSection = ({ cms }: FeaturesSectionProps) => {
  const heading = cms?.heading || 'The Complete Restaurant OS';
  const subheading = cms?.subheading || 'Powerful features to run your restaurant smarter, faster, and more efficiently.';

  const features = cms?.items
    ? (cms.items as any[]).map((item: any, i: number) => ({
        icon: iconMap[item.icon] || defaultFeatures[i % defaultFeatures.length]?.icon || BarChart3,
        title: item.title,
        description: item.description,
        gradientFrom: defaultFeatures[i % defaultFeatures.length]?.gradientFrom || 'from-blue-100',
        gradientTo: defaultFeatures[i % defaultFeatures.length]?.gradientTo || 'to-blue-50',
        iconColor: defaultFeatures[i % defaultFeatures.length]?.iconColor || 'text-primary',
      }))
    : defaultFeatures;

  return (
    <section className="relative py-24 md:py-32 bg-secondary/10 overflow-hidden border-y border-border/20">
      {/* Decorative background accents */}
      <div className="absolute top-8 left-8 w-3 h-3 rounded-full bg-primary/20" />
      <div className="absolute top-16 left-20 w-2 h-2 rounded-full bg-primary/15" />
      <div className="absolute bottom-12 right-12 w-3 h-3 rounded-full bg-primary/20" />
      <div className="absolute bottom-20 right-24 w-2 h-2 rounded-full bg-primary/10" />
      <div className="absolute top-1/3 right-8 w-2.5 h-2.5 rounded-full bg-accent/25 animate-pulse" />

      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="text-xs font-semibold tracking-widest uppercase text-primary mb-3 inline-block">
            Core Architecture
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight">
            {heading}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">{subheading}</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature: any, i: number) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-card border border-border/40 rounded-2xl shadow-sm hover:shadow-xl hover:border-primary/20 hover:shadow-primary/5 transition-all duration-300 p-8 pt-10 text-center min-h-[320px] flex flex-col items-center"
            >
              <div className={`w-24 h-20 rounded-2xl bg-gradient-to-br ${feature.gradientFrom} ${feature.gradientTo} flex items-center justify-center mb-6 relative`}>
                <feature.icon className={`w-10 h-10 ${feature.iconColor}`} strokeWidth={1.5} />
                {/* Small decorative accent dot */}
                <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-gradient-to-br ${feature.gradientFrom} ${feature.gradientTo} border-2 border-card`} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground tracking-tight">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
