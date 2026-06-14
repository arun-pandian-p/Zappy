import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, MousePointerClick, Flame, Utensils, RotateCcw, LineChart } from 'lucide-react';

const scenes = [
  {
    id: 1,
    title: 'Customer Arrives',
    label: 'Scene 01 / Entrance',
    icon: UserCheck,
    text: 'A guest sits at Table 4. They scan the sleek Zappy QR code disc embedded on the wood surface. Instant menu loading — no paper menus to share, no app downloads required.',
    stat: 'Menu loads in <0.2 seconds'
  },
  {
    id: 2,
    title: 'Order Taken',
    label: 'Scene 02 / Digital Cart',
    icon: MousePointerClick,
    text: 'Guests customize dishes with tags (e.g. "extra spicy", "vegan"), add items to a shared group cart, and check out. Orders immediately hit the cloud with zero server transcription errors.',
    stat: '100% accurate order entry'
  },
  {
    id: 3,
    title: 'Kitchen Prepares',
    label: 'Scene 03 / The Heat',
    icon: Flame,
    text: 'The KDS screens in the kitchen ring. Chefs view organized tickets color-coded by prep priority. Missing ingredient warnings are flagged instantly.',
    stat: 'Prep delays reduced by 50%'
  },
  {
    id: 4,
    title: 'Food Served',
    label: 'Scene 04 / The Table',
    icon: Utensils,
    text: 'The food is served hot. The runner matches the table number digitally. The guest reviews details, dines, pays directly via QR code with instant auto-generated e-receipts.',
    stat: '17 minutes saved per table'
  },
  {
    id: 5,
    title: 'Customer Returns',
    label: 'Scene 05 / Loyalty',
    icon: RotateCcw,
    text: 'Three days later, a personalized WhatsApp reward triggers based on their favorite dish. The guest clicks, books Table 4 again, and becomes a regular.',
    stat: '35% boost in repeat visits'
  },
  {
    id: 6,
    title: 'Business Grows',
    label: 'Scene 06 / Scale',
    icon: LineChart,
    text: 'The owner views consolidated dashboard reviews, daily inventory margins, and staff tips from a phone. Multiple branches run smoothly, hands-free.',
    stat: '+22% average profit margin'
  }
];

const MealStory = () => {
  const [currentIdx, setCurrentIdx] = useState(0);

  return (
    <section className="py-24 md:py-36 bg-[#FFFFFF] border-t border-[#111111]/5 overflow-hidden">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-16 md:mb-24 space-y-4">
          <span className="landing-label-uppercase">The Restaurant Journey</span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#111111] uppercase tracking-tighter leading-none">
            Every Meal <br className="sm:hidden" />
            Has a <span className="text-[#FF6B00]">Story</span>
          </h2>
          <p className="text-lg text-[#111111]/60 font-light max-w-2xl mx-auto">
            Step through the frictionless cycle of modern, Zappy-powered restaurant dining.
          </p>
        </div>

        {/* Cinematic Slide Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-[450px]">
          {/* Navigation Timeline (Left 4 columns) */}
          <div className="lg:col-span-4 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-2 pb-4 lg:pb-0 border-b lg:border-b-0 lg:border-l border-[#111111]/10">
            {scenes.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentIdx(idx)}
                className={`text-left px-6 py-4 rounded-xl lg:rounded-r-xl lg:rounded-l-none border-l-2 lg:border-l-4 transition-all duration-300 whitespace-nowrap lg:whitespace-normal shrink-0 ${currentIdx === idx ? 'border-[#FF6B00] bg-[#FF6B00]/5 text-[#FF6B00] font-bold' : 'border-transparent text-[#111111]/50 hover:text-[#111111]'}`}
              >
                <div className="text-xs uppercase tracking-widest opacity-60 mb-1">Scene 0{s.id}</div>
                <div className="text-lg tracking-tight uppercase">{s.title}</div>
              </button>
            ))}
          </div>

          {/* Cinematic Screen (Right 8 columns) */}
          <div className="lg:col-span-8 bg-[#F7F5F0] rounded-3xl p-8 md:p-12 border border-[#111111]/5 relative min-h-[380px] flex flex-col justify-between overflow-hidden shadow-sm">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIdx}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="space-y-6 flex-1 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-[#FF6B00] uppercase tracking-widest">
                      {scenes[currentIdx].label}
                    </span>
                  </div>
                  
                  <h3 className="text-3xl md:text-4xl font-black text-[#111111] uppercase tracking-tight">
                    {scenes[currentIdx].title}
                  </h3>
                  
                  <p className="text-lg text-[#111111]/75 font-light leading-relaxed max-w-xl">
                    {scenes[currentIdx].text}
                  </p>
                </div>

                <div className="pt-6 border-t border-[#111111]/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-[#FF6B00]/10 text-[#FF6B00]">
                      {(() => {
                        const Icon = scenes[currentIdx].icon;
                        return <Icon className="w-6 h-6" />;
                      })()}
                    </div>
                    <span className="text-base font-semibold text-[#111111]">
                      {scenes[currentIdx].title} workflow
                    </span>
                  </div>
                  
                  <div className="px-5 py-2.5 rounded-full bg-[#FF6B00] text-white font-bold text-sm tracking-tight text-center sm:text-right">
                    {scenes[currentIdx].stat}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

      </div>
    </section>
  );
};

export default MealStory;
