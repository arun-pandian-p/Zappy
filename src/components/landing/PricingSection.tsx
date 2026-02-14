import { motion } from 'framer-motion';
import { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const plans = [
  {
    name: 'Free',
    priceMonthly: 0,
    priceYearly: 0,
    description: 'Perfect for trying out QR Dine Pro',
    features: [
      '1 Table',
      'Basic menu management',
      'QR code generation',
      '50 orders/month',
      'Email support',
    ],
    cta: 'Start Free',
    popular: false,
  },
  {
    name: 'Pro',
    priceMonthly: 999,
    priceYearly: 799,
    description: 'Best for growing restaurants',
    features: [
      'Up to 20 Tables',
      'Advanced menu with images',
      'Kitchen & Waiter dashboards',
      'Analytics & Reports',
      '1,000 orders/month',
      'Priority support',
      'Receipt printing',
    ],
    cta: 'Get Pro',
    popular: true,
  },
  {
    name: 'Enterprise',
    priceMonthly: 2999,
    priceYearly: 2499,
    description: 'For restaurant chains & franchises',
    features: [
      'Unlimited Tables',
      'Multi-location support',
      'White-label branding',
      'API access',
      'Unlimited orders',
      'Dedicated support',
      'Custom integrations',
      'Advanced analytics',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

interface PricingSectionProps {
  onSelectPlan: (plan: string) => void;
}

const PricingSection = ({ onSelectPlan }: PricingSectionProps) => {
  const [yearly, setYearly] = useState(false);

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple,{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Transparent
            </span>{' '}
            Pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Choose the plan that fits your restaurant. No hidden fees, cancel anytime.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 bg-card border rounded-full px-1 py-1">
            <button
              onClick={() => setYearly(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                !yearly ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                yearly ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              Yearly
              <span className="ml-1.5 text-xs opacity-80">Save 20%</span>
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => {
            const price = yearly ? plan.priceYearly : plan.priceMonthly;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: plan.popular ? 1.02 : 1.04 }}
                className={plan.popular ? 'relative order-first md:order-none' : ''}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground px-4 py-1 animate-pulse-ring">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <Card
                  className={`h-full ${
                    plan.popular
                      ? 'border-primary shadow-lg shadow-primary/20 md:scale-105'
                      : 'border-border'
                  }`}
                >
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-center py-6 border-b mb-6">
                      <motion.span
                        key={price}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-bold"
                      >
                        ₹{price}
                      </motion.span>
                      <span className="text-muted-foreground">/{yearly ? 'mo (billed yearly)' : 'month'}</span>
                    </div>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`w-full ${
                        plan.popular
                          ? 'bg-gradient-to-r from-primary to-accent hover:opacity-90'
                          : ''
                      }`}
                      variant={plan.popular ? 'default' : 'outline'}
                      onClick={() => onSelectPlan(plan.name)}
                    >
                      {plan.cta}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
