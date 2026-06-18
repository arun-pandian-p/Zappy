import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const plans = [
  {
    name: 'Free',
    priceMonthly: 0,
    priceYearly: 0,
    description: 'Perfect for trying out ZAPPY',
    features: ['1 Table', 'Basic menu management', 'QR code generation', '50 orders/month', 'Email support'],
    cta: 'Start Free',
    popular: false,
  },
  {
    name: 'Pro',
    priceMonthly: 999,
    priceYearly: 799,
    description: 'Best for growing restaurants',
    features: ['Up to 20 Tables', 'Advanced menu with images', 'Kitchen & Waiter dashboards', 'Analytics & Reports', '1,000 orders/month', 'Priority support', 'Receipt printing'],
    cta: 'Get Pro',
    popular: true,
  },
  {
    name: 'Enterprise',
    priceMonthly: 2999,
    priceYearly: 2499,
    description: 'For restaurant chains & franchises',
    features: ['Unlimited Tables', 'Multi-location support', 'White-label branding', 'API access', 'Unlimited orders', 'Dedicated support', 'Custom integrations', 'Advanced analytics'],
    cta: 'Contact Sales',
    popular: false,
  },
];

interface PricingSectionProps {
  onSelectPlan: (plan: string) => void;
  cms?: Record<string, any>;
}

const PricingSection = ({ onSelectPlan, cms }: PricingSectionProps) => {
  const [yearly, setYearly] = useState(false);
  const heading = cms?.heading || 'Pricing';
  const subheading = cms?.subheading || 'Choose the plan that fits your restaurant. No hidden fees, cancel anytime.';

  return (
    <section className="py-24 md:py-36 bg-[#F7F5F0] border-t border-[#111111]/5">
      <div className="container mx-auto px-6 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-6"
        >
          <span className="landing-label-uppercase">Clear Options</span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#111111] uppercase tracking-tighter leading-none">
            Pricing
          </h2>
          <p className="text-lg text-[#111111]/60 font-light max-w-2xl mx-auto">{subheading}</p>
          
          <div className="inline-flex items-center gap-3 bg-white border border-[#111111]/8 rounded-full p-1 shadow-sm mt-4">
            <button
              onClick={() => setYearly(false)}
              className={`px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${!yearly ? 'bg-[#FF6B00] text-white shadow-sm' : 'text-[#111111]/60 hover:text-[#111111]'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${yearly ? 'bg-[#FF6B00] text-white shadow-sm' : 'text-[#111111]/60 hover:text-[#111111]'}`}
            >
              Yearly <span className="opacity-75">(Save 20%)</span>
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
          {plans.map((plan, index) => {
            const price = yearly ? plan.priceYearly : plan.priceMonthly;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={plan.popular ? 'relative' : ''}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-[#FF6B00] text-white border-none px-4 py-1 font-semibold uppercase text-[10px] tracking-wider">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <Card className={`h-full bg-white flex flex-col justify-between border ${plan.popular ? 'border-[#FF6B00] shadow-lg shadow-orange-500/5 md:scale-105' : 'border-[#111111]/8'} p-6 rounded-3xl transition-all duration-300 hover:-translate-y-2`}>
                  <div>
                    <CardHeader className="text-center pb-6 border-b border-[#111111]/5">
                      <CardTitle className="text-2xl font-black text-[#111111] uppercase tracking-tight">{plan.name}</CardTitle>
                      <CardDescription className="text-sm text-[#111111]/50 font-light mt-1">{plan.description}</CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pt-8 space-y-6">
                      <div className="text-center py-4">
                        <span className="text-5xl font-black text-[#111111] tracking-tight">₹{price}</span>
                        <span className="text-sm text-[#111111]/60 font-light">/{yearly ? 'mo (billed yearly)' : 'month'}</span>
                      </div>
                      
                      <ul className="space-y-4">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-[#FF6B00] shrink-0 mt-0.5" />
                            <span className="text-sm text-[#111111]/80 font-light leading-relaxed">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </div>

                  <CardContent className="pt-4">
                    <Button
                      className={`w-full py-6 rounded-full text-sm font-bold uppercase tracking-wider transition-all ${plan.popular ? 'bg-[#FF6B00] hover:bg-[#FF6B00]/95 text-white' : 'border-[#111111]/10 bg-transparent text-[#111111] hover:bg-[#111111]/5'}`}
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
