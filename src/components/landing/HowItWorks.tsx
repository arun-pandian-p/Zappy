import { motion, useScroll, useTransform } from 'framer-motion';
import { QrCode, ShoppingCart, ChefHat, Bell, CreditCard, Star } from 'lucide-react';
import { useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface HowItWorksProps {
  cms?: Record<string, any>;
}

const steps = [
  {
    icon: QrCode,
    title: 'Scan QR Code',
    desc: 'Customer scans the QR code placed on the table to instantly open the digital menu.',
    color: 'bg-primary/10 text-primary border-primary/20',
  },
  {
    icon: ShoppingCart,
    title: 'Browse & Order',
    desc: 'Explore the full menu with images, customize items with add-ons, and place the order.',
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  {
    icon: ChefHat,
    title: 'Kitchen Receives Order',
    desc: 'Order appears instantly on the Kitchen Display with item details and table number.',
    color: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
  },
  {
    icon: Bell,
    title: 'Real-Time Status',
    desc: 'Customer tracks order status live — Pending → Preparing → Ready → Served.',
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
  {
    icon: CreditCard,
    title: 'Pay & Checkout',
    desc: 'Generate invoice, apply coupons, split bills, and complete payment seamlessly.',
    color: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  },
  {
    icon: Star,
    title: 'Rate & Review',
    desc: 'Customer leaves feedback which the admin can view from the dashboard.',
    color: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  },
];

// Generate SVG serpentine path that zigzags between steps
const generateSerpentinePath = (stepCount: number, stepHeight: number, amplitude: number) => {
  const points: string[] = [];
  const startY = 40;
  const centerX = 50; // percentage-based center

  points.push(`M ${centerX} ${startY}`);

  for (let i = 0; i < stepCount; i++) {
    const y1 = startY + i * stepHeight;
    const y2 = startY + (i + 0.5) * stepHeight;
    const y3 = startY + (i + 1) * stepHeight;
    const direction = i % 2 === 0 ? 1 : -1;
    const cx1 = centerX + direction * amplitude;

    points.push(`C ${cx1} ${y2}, ${centerX - direction * amplitude} ${y2}, ${centerX} ${y3}`);
  }

  return points.join(' ');
};

const HowItWorks = ({ cms }: HowItWorksProps) => {
  const heading = cms?.heading || 'How It Works';
  const isMobile = useIsMobile();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 0.8', 'end 0.6'],
  });
  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const stepHeight = 120;
  const svgHeight = 40 + steps.length * stepHeight + 40;
  const serpentinePath = generateSerpentinePath(steps.length - 1, stepHeight, 35);

  return (
    <section ref={sectionRef} className="py-16 md:py-24 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-20"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-sky-500 bg-clip-text text-transparent">
              {heading}
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From scan to served — the complete ZAPPY ordering flow.
          </p>
        </motion.div>

        {/* Desktop: Zigzag layout */}
        {!isMobile ? (
          <div className="relative max-w-4xl mx-auto" style={{ minHeight: svgHeight }}>
            {/* SVG Serpentine Road */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox={`0 0 100 ${svgHeight}`}
              preserveAspectRatio="none"
              fill="none"
            >
              {/* Background path (faint) */}
              <path
                d={serpentinePath}
                stroke="hsl(var(--border))"
                strokeWidth="0.4"
                fill="none"
                strokeDasharray="2 2"
              />
              {/* Animated path (draws on scroll) */}
              <motion.path
                d={serpentinePath}
                stroke="hsl(var(--primary))"
                strokeWidth="0.5"
                fill="none"
                style={{ pathLength }}
                strokeLinecap="round"
              />
            </svg>

            {/* Step Cards */}
            <div className="relative" style={{ height: svgHeight }}>
              {steps.map((step, i) => {
                const isLeft = i % 2 === 0;
                const topPos = 40 + i * stepHeight - 20; // center on path point

                return (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, x: isLeft ? -60 : 60 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                    className="absolute w-[42%]"
                    style={{
                      top: topPos,
                      left: isLeft ? '2%' : undefined,
                      right: isLeft ? undefined : '2%',
                    }}
                  >
                    <div className={`flex items-start gap-3 p-4 rounded-xl bg-card border hover:shadow-lg transition-all duration-300 ${isLeft ? '' : 'flex-row-reverse text-right'}`}>
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <span className="text-[10px] font-bold text-muted-foreground tracking-wider">
                          STEP {i + 1}
                        </span>
                        <div className={`w-11 h-11 rounded-xl ${step.color} border flex items-center justify-center`}>
                          <step.icon className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="flex-1 pt-1">
                        <h3 className="text-sm font-bold text-foreground mb-1">{step.title}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Mobile: Vertical timeline */
          <div className="max-w-sm mx-auto space-y-3">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="relative"
              >
                <div className="flex items-start gap-3 p-3 rounded-xl bg-card border hover:shadow-md transition-shadow">
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <span className="text-[9px] font-bold text-muted-foreground">STEP {i + 1}</span>
                    <div className={`w-9 h-9 rounded-lg ${step.color} border flex items-center justify-center`}>
                      <step.icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-sm font-bold text-foreground mb-0.5">{step.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </div>
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="absolute left-[1.65rem] top-full w-0.5 h-3 bg-border" />
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HowItWorks;
