import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, ClipboardList, QrCode, BarChart3, Users, Play } from 'lucide-react';

const products = [
  {
    id: 'pos',
    icon: Monitor,
    title: 'Editorial Cloud POS',
    subtitle: 'High-speed billing & checkout terminal',
    desc: 'Run multi-lane billing, handle split-checks, calculate tax structures, and print thermal receipts. Syncs live with your kitchen and inventory databases.',
    badge: 'Terminal'
  },
  {
    id: 'kds',
    icon: ClipboardList,
    title: 'Kitchen Display',
    subtitle: 'Zero paper, zero chef bottlenecks',
    desc: 'Displays incoming orders instantly by table or order time. Group matching dishes (e.g. "5 Rava Idlis") to batch cooking and minimize preparation delays.',
    badge: 'Kitchen Screen'
  },
  {
    id: 'qr',
    icon: QrCode,
    title: 'QR Diner Menu',
    subtitle: 'Zero friction contactless ordering',
    desc: 'Let customers scan, view rich food descriptions, select serving sizes, and complete UPI / card checkouts directly from Table 4 without waiting for servers.',
    badge: 'Mobile Browser'
  },
  {
    id: 'analytics',
    icon: BarChart3,
    title: 'Live Analytics',
    subtitle: 'Insights from anywhere in the world',
    desc: 'Real-time sales tracking, ingredient consumption patterns, staff tips, and customer feedback digests. Spot cost leaks instantly.',
    badge: 'Manager App'
  },
  {
    id: 'crm',
    icon: Users,
    title: 'Loyalty & CRM',
    subtitle: 'Automate guest returns',
    desc: 'Build detailed diner profiles automatically. Trigger WhatsApp coupons on customer birthdays or follow up with lapsed diners who haven\'t scanned in 30 days.',
    badge: 'Marketing Console'
  }
];

const ProductExperience = () => {
  const [activeId, setActiveId] = useState('pos');

  return (
    <section className="py-24 md:py-36 bg-[#F7F5F0] border-t border-[#111111]/5">
      <div className="container mx-auto px-6 max-w-6xl">
        
        {/* Title Block */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24 space-y-4">
          <span className="landing-label-uppercase">Product Experience</span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#111111] uppercase tracking-tighter leading-none">
            Built for <span className="text-[#FF6B00]">Performance</span>
          </h2>
          <p className="text-lg text-[#111111]/60 font-light">
            An Apple-style showcase of our core restaurant interfaces.
          </p>
        </div>

        {/* Split Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-stretch">
          
          {/* Left Panel (Interactive Tabs, 5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-center gap-3">
            {products.map((p) => {
              const Icon = p.icon;
              const isActive = activeId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setActiveId(p.id)}
                  className={`text-left p-6 rounded-3xl border transition-all duration-500 flex gap-5 items-start ${isActive ? 'bg-[#FFFFFF] border-[#111111]/8 shadow-lg' : 'bg-transparent border-transparent hover:bg-[#FFFFFF]/50'}`}
                >
                  <div className={`p-3 rounded-2xl border transition-colors ${isActive ? 'bg-[#FF6B00] text-white border-transparent' : 'bg-white text-[#111111]/60 border-[#111111]/5'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-[#111111] uppercase tracking-tight">{p.title}</h3>
                      {isActive && <span className="text-[10px] bg-[#FF6B00]/10 text-[#FF6B00] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full">{p.badge}</span>}
                    </div>
                    <p className="text-xs text-[#111111]/50 font-medium">{p.subtitle}</p>
                    {isActive && (
                      <motion.p 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-sm text-[#111111]/70 leading-relaxed font-light mt-3 pt-2 border-t border-[#111111]/5"
                      >
                        {p.desc}
                      </motion.p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Panel (Sleek Apple Mockup, 7 cols) */}
          <div className="lg:col-span-7 flex items-center justify-center">
            <div className="w-full aspect-[4/3] bg-[#FFFFFF] border border-[#111111]/8 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
              
              {/* Browser bar */}
              <div className="flex items-center justify-between pb-4 border-b border-[#111111]/5 mb-4 shrink-0">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#111111]/10" />
                  <div className="w-3 h-3 rounded-full bg-[#111111]/10" />
                  <div className="w-3 h-3 rounded-full bg-[#111111]/10" />
                </div>
                <div className="text-[10px] text-[#111111]/40 font-mono tracking-wider bg-[#F7F5F0] px-6 py-1 rounded-full border border-[#111111]/5">
                  zappy.os/{activeId}
                </div>
                <div className="w-12" />
              </div>

              {/* Screen Content Wrapper */}
              <div className="flex-1 overflow-hidden relative">
                <AnimatePresence mode="wait">
                  {activeId === 'pos' && (
                    <motion.div
                      key="pos-screen"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="absolute inset-0 flex flex-col justify-between"
                    >
                      <div className="grid grid-cols-12 gap-4 h-full">
                        <div className="col-span-8 border border-[#111111]/5 rounded-2xl p-4 flex flex-col justify-between h-[80%]">
                          <div className="space-y-2">
                            <span className="text-[10px] font-semibold text-[#FF6B00] uppercase tracking-wider">Checkout Cart</span>
                            <div className="flex justify-between items-center text-sm border-b pb-2">
                              <span>3x Rava Idli</span>
                              <span className="font-semibold">₹270</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b pb-2">
                              <span>1x Green Gram Dosa</span>
                              <span className="font-semibold">₹120</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-end border-t pt-4">
                            <span className="text-xs text-[#111111]/50">Subtotal</span>
                            <span className="text-xl font-bold">₹390</span>
                          </div>
                        </div>
                        <div className="col-span-4 space-y-2 h-[80%] flex flex-col">
                          <button className="w-full py-3 bg-[#FF6B00] text-white text-xs font-semibold rounded-xl text-center shadow-md shadow-orange-500/10">Cash Checkout</button>
                          <button className="w-full py-3 border border-[#111111]/10 text-xs font-semibold rounded-xl text-center hover:bg-[#111111]/5 transition-colors">Print Receipt</button>
                          <button className="w-full py-3 border border-[#111111]/10 text-xs font-semibold rounded-xl text-center hover:bg-[#111111]/5 transition-colors">Split Bill</button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeId === 'kds' && (
                    <motion.div
                      key="kds-screen"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="absolute inset-0 flex flex-col"
                    >
                      <div className="grid grid-cols-3 gap-4 h-[85%]">
                        <div className="border border-[#111111]/5 rounded-2xl p-3 bg-red-500/5 space-y-3">
                          <div className="flex justify-between text-xs font-semibold text-red-600">
                            <span>Table 4</span>
                            <span>08:12</span>
                          </div>
                          <ul className="text-xs space-y-1.5">
                            <li className="font-bold">2x Rava Idli</li>
                            <li>1x Masala Dosa</li>
                          </ul>
                          <span className="inline-block text-[9px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-bold uppercase">Preparing</span>
                        </div>
                        <div className="border border-[#111111]/5 rounded-2xl p-3 bg-amber-500/5 space-y-3">
                          <div className="flex justify-between text-xs font-semibold text-amber-600">
                            <span>Table 12</span>
                            <span>04:30</span>
                          </div>
                          <ul className="text-xs space-y-1.5">
                            <li className="font-bold">1x Green Gram Dosa</li>
                            <li>1x Filter Coffee</li>
                          </ul>
                          <span className="inline-block text-[9px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-bold uppercase">Ready</span>
                        </div>
                        <div className="border border-[#111111]/5 rounded-2xl p-3 bg-emerald-500/5 space-y-3">
                          <div className="flex justify-between text-xs font-semibold text-emerald-600">
                            <span>Table 1</span>
                            <span>Completed</span>
                          </div>
                          <ul className="text-xs opacity-50 space-y-1.5">
                            <li>3x Sweet Pongal</li>
                          </ul>
                          <span className="inline-block text-[9px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold uppercase">Served</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeId === 'qr' && (
                    <motion.div
                      key="qr-screen"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="w-[180px] h-[90%] border border-[#111111]/10 rounded-2xl p-3 bg-[#F7F5F0] shadow-sm flex flex-col justify-between overflow-hidden">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] pb-1 border-b">
                            <span className="font-bold">Sree Annapoorna</span>
                            <span className="text-[#FF6B00]">T4</span>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-[#111111]/5 text-center space-y-1">
                            <span className="text-[9px] font-bold block">Green Gram Dosa</span>
                            <span className="text-[8px] text-[#111111]/60 block leading-tight">Moong dal crepe, local Andhra style.</span>
                            <span className="text-[10px] font-black text-[#FF6B00] block mt-1">₹120</span>
                          </div>
                        </div>
                        <button className="w-full py-2 bg-[#FF6B00] text-white text-[9px] font-bold rounded-lg uppercase tracking-wider">Place Order</button>
                      </div>
                    </motion.div>
                  )}

                  {activeId === 'analytics' && (
                    <motion.div
                      key="analytics-screen"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="absolute inset-0 flex flex-col justify-between"
                    >
                      <div className="grid grid-cols-3 gap-4 h-[40%]">
                        <div className="border border-[#111111]/5 rounded-2xl p-4 text-left">
                          <span className="text-xs text-[#111111]/50 block font-medium">Daily Revenue</span>
                          <span className="text-2xl font-black text-[#FF6B00] block mt-1">₹84,350</span>
                          <span className="text-[9px] text-emerald-600 font-bold block mt-1">+14% vs yesterday</span>
                        </div>
                        <div className="border border-[#111111]/5 rounded-2xl p-4 text-left">
                          <span className="text-xs text-[#111111]/50 block font-medium">Table Turn Rate</span>
                          <span className="text-2xl font-black text-[#FF6B00] block mt-1">28 min</span>
                          <span className="text-[9px] text-emerald-600 font-bold block mt-1">Saved 17 mins avg</span>
                        </div>
                        <div className="border border-[#111111]/5 rounded-2xl p-4 text-left">
                          <span className="text-xs text-[#111111]/50 block font-medium">Reviews Captured</span>
                          <span className="text-2xl font-black text-[#FF6B00] block mt-1">284 feedback</span>
                          <span className="text-[9px] text-emerald-600 font-bold block mt-1">92.5% positive rating</span>
                        </div>
                      </div>
                      
                      {/* Fake Chart representation */}
                      <div className="border border-[#111111]/5 rounded-2xl p-4 flex-1 mt-4 flex flex-col justify-between h-[45%]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#111111]/50">Hourly Peak Orders</span>
                        <div className="flex items-end justify-between h-[70%] pt-2">
                          <div className="w-[12%] h-[20%] bg-[#FF6B00]/20 rounded-t-md" />
                          <div className="w-[12%] h-[45%] bg-[#FF6B00]/40 rounded-t-md" />
                          <div className="w-[12%] h-[95%] bg-[#FF6B00] rounded-t-md" />
                          <div className="w-[12%] h-[80%] bg-[#FF6B00] rounded-t-md" />
                          <div className="w-[12%] h-[35%] bg-[#FF6B00]/30 rounded-t-md" />
                          <div className="w-[12%] h-[60%] bg-[#FF6B00]/60 rounded-t-md" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeId === 'crm' && (
                    <motion.div
                      key="crm-screen"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="absolute inset-0 flex flex-col justify-between"
                    >
                      <div className="grid grid-cols-12 gap-4 h-full">
                        <div className="col-span-7 border border-[#111111]/5 rounded-2xl p-4 space-y-3">
                          <span className="text-xs font-semibold text-[#FF6B00] uppercase tracking-wider">WhatsApp Broadcast</span>
                          <div className="bg-[#F7F5F0] p-3 rounded-xl border text-[11px] text-[#111111]/80 leading-relaxed font-mono">
                            "Hi Ranjith, we noticed you haven't dined with us in 2 weeks! Here is a coupon for 15% off your favorite Rava Idli on your next table scan. Click here..."
                          </div>
                        </div>
                        
                        <div className="col-span-5 space-y-2">
                          <div className="border border-[#111111]/5 p-2 rounded-xl flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-xs font-bold">Ranjith Kumar</span>
                          </div>
                          <div className="border border-[#111111]/5 p-2 rounded-xl flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-xs font-bold">Devi Prasad</span>
                          </div>
                          <div className="border border-[#111111]/5 p-2 rounded-xl flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-xs font-bold">Ananya Sen</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default ProductExperience;
