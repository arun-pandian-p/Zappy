import { motion } from 'framer-motion';

const stats = [
  { val: '2.5M+', label: 'Orders Processed' },
  { val: '1,200+', label: 'Active Restaurants' },
  { val: '99.98%', label: 'Platform Uptime' },
  { val: '18 min', label: 'Average Prep Saved' }
];

const testimonialsRow1 = [
  {
    quote: "Zappy completely changed our dine-in customer experience. Average order values went up by 18% in the first month.",
    author: "Ranjith Kumar",
    role: "Owner, Sree Annapoorna"
  },
  {
    quote: "Our chefs love the KDS interface. Zero lost orders and extremely easy for new prep staff to learn in minutes.",
    author: "Devi Prasad",
    role: "Head Chef, Spice Route"
  },
  {
    quote: "The multi-branch menu syncing saves us hours of manual work every week. Absolute lifesaver.",
    author: "Ananya Sen",
    role: "Operations Manager, Feast & Fables"
  }
];

const testimonialsRow2 = [
  {
    quote: "Staff tips increased by 20% due to the seamless checkout flow. Highly recommend this for fast-casual joints.",
    author: "Kartik Nair",
    role: "Partner, The Social Deck"
  },
  {
    quote: "We consolidated our billing, inventory, and marketing databases into Zappy. The ROI was clear within two weeks.",
    author: "Siddharth Mehta",
    role: "Director, Green Meadows Group"
  },
  {
    quote: "No app download required is the killer feature. Customers scan, click and pay. It just works.",
    author: "Malathi Rao",
    role: "Owner, Cafe Blossom"
  }
];

const TrustResults = () => {
  return (
    <section className="py-24 md:py-36 bg-[#FFFFFF] border-t border-[#111111]/5 overflow-hidden">
      <div className="container mx-auto px-6 max-w-6xl mb-20">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <span className="landing-label-uppercase">Platform Statistics</span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#111111] uppercase tracking-tighter leading-none">
            Trust & <span className="text-[#FF6B00]">Results</span>
          </h2>
          <p className="text-lg text-[#111111]/60 font-light leading-relaxed">
            Leading dining establishments use Zappy to orchestrate their kitchen workflows, customer billing, and business marketing.
          </p>
        </div>

        {/* Massive Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 max-w-4xl mx-auto text-center">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="space-y-2"
            >
              <span className="text-4xl md:text-5xl lg:text-6xl font-black text-[#FF6B00] tracking-tight block">
                {s.val}
              </span>
              <span className="text-xs font-semibold text-[#111111]/50 tracking-wider uppercase block">
                {s.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Infinite Testimonial Marquees */}
      <div className="space-y-6 select-none">
        
        {/* Row 1 (Right to Left) */}
        <div className="w-full overflow-hidden flex whitespace-nowrap">
          <div className="flex gap-6 animate-marquee shrink-0">
            {[...testimonialsRow1, ...testimonialsRow1].map((t, idx) => (
              <div 
                key={idx}
                className="w-[300px] md:w-[400px] bg-[#F7F5F0] border border-[#111111]/5 p-8 rounded-3xl shrink-0 whitespace-normal flex flex-col justify-between min-h-[200px]"
              >
                <p className="text-[#111111]/80 text-sm md:text-base font-light italic leading-relaxed">
                  "{t.quote}"
                </p>
                <div className="mt-4 pt-4 border-t border-[#111111]/5">
                  <h4 className="font-semibold text-[#111111]">{t.author}</h4>
                  <p className="text-xs text-[#111111]/50">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2 (Left to Right) */}
        <div className="w-full overflow-hidden flex whitespace-nowrap">
          <div className="flex gap-6 animate-marquee shrink-0" style={{ animationDirection: 'reverse' }}>
            {[...testimonialsRow2, ...testimonialsRow2].map((t, idx) => (
              <div 
                key={idx}
                className="w-[300px] md:w-[400px] bg-[#F7F5F0] border border-[#111111]/5 p-8 rounded-3xl shrink-0 whitespace-normal flex flex-col justify-between min-h-[200px]"
              >
                <p className="text-[#111111]/80 text-sm md:text-base font-light italic leading-relaxed">
                  "{t.quote}"
                </p>
                <div className="mt-4 pt-4 border-t border-[#111111]/5">
                  <h4 className="font-semibold text-[#111111]">{t.author}</h4>
                  <p className="text-xs text-[#111111]/50">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default TrustResults;
