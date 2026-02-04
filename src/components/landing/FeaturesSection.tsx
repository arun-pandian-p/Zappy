import { motion } from 'framer-motion';
import { QrCode, ChefHat, Bell, CreditCard, BarChart3, Users, Clock, Star, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: QrCode,
    title: 'QR Code Ordering',
    description: 'Customers scan and order instantly from their phones. No app required.',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: ChefHat,
    title: 'Kitchen Display',
    description: 'Real-time order management with sound alerts and prep timers.',
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-500/10',
  },
  {
    icon: Bell,
    title: 'Waiter Calls',
    description: 'Instant notifications when customers need assistance.',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    icon: CreditCard,
    title: 'Easy Billing',
    description: 'Process payments and print thermal receipts seamlessly.',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-500/10',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'Track revenue, popular items, and peak hours in real-time.',
    color: 'from-indigo-500 to-blue-500',
    bgColor: 'bg-indigo-500/10',
  },
  {
    icon: Users,
    title: 'Multi-Role Access',
    description: 'Separate dashboards for kitchen, waiters, billing, and admin.',
    color: 'from-teal-500 to-cyan-500',
    bgColor: 'bg-teal-500/10',
  },
  {
    icon: Clock,
    title: 'Real-time Updates',
    description: 'Live order tracking for customers and staff alike.',
    color: 'from-rose-500 to-red-500',
    bgColor: 'bg-rose-500/10',
  },
  {
    icon: Star,
    title: 'Feedback System',
    description: 'Collect ratings and redirect happy customers to Google Reviews.',
    color: 'from-yellow-500 to-orange-500',
    bgColor: 'bg-yellow-500/10',
  },
  {
    icon: Globe,
    title: 'Multi-Tenant SaaS',
    description: 'Run multiple restaurant brands from a single platform.',
    color: 'from-violet-500 to-purple-500',
    bgColor: 'bg-violet-500/10',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Modernize
            </span>{' '}
            Your Restaurant
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A complete digital ordering ecosystem designed to increase efficiency, 
            reduce costs, and delight your customers.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div key={feature.title} variants={itemVariants}>
              <Card className="h-full border-0 bg-card/50 backdrop-blur-sm hover:bg-card transition-colors duration-300 group">
                <CardContent className="p-6">
                  <motion.div
                    className={`w-14 h-14 rounded-2xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                    whileHover={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <feature.icon
                      className={`w-7 h-7 bg-gradient-to-r ${feature.color} bg-clip-text`}
                      style={{
                        stroke: `url(#gradient-${index})`,
                      }}
                    />
                    <svg width="0" height="0">
                      <defs>
                        <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{ stopColor: feature.color.split(' ')[0].replace('from-', '') }} />
                          <stop offset="100%" style={{ stopColor: feature.color.split(' ')[1].replace('to-', '') }} />
                        </linearGradient>
                      </defs>
                    </svg>
                  </motion.div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
