import { SEO } from '@/components/seo/SEO';
import MarketingLayout from "@/components/landing/MarketingLayout";
import { motion } from "framer-motion";
import { Users, Target, Zap, Shield, HeartHandshake, Globe, Rocket } from "lucide-react";

const AboutUs = () => {
  return (
    <MarketingLayout>
      <div className="flex flex-col bg-slate-50 dark:bg-[#0B1220]">
        <SEO title="About Us | ZAPPY" description="Learn about ZAPPY's mission to transform the restaurant industry." />
      <main className="flex-1 pt-24 pb-24">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-20">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white mb-6">
              Our Mission to <span className="text-blue-600">Transform</span> Hospitality
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              We started ZAPPY because we believe restaurant operators deserve software as beautifully crafted and reliable as the food they serve.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-24">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 text-center hover:border-blue-500 transition-colors">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4 dark:text-white">Our Vision</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">To build the unified operating system that empowers the next generation of digital-first restaurants globally.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 text-center hover:border-blue-500 transition-colors">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4 dark:text-white">Our Team</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">A passionate group of engineers, designers, and former restaurant operators who know exactly what it takes to run a kitchen.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 text-center hover:border-blue-500 transition-colors">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Rocket className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4 dark:text-white">Our Values</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">Move fast, build things that scale, and obsess over customer success. We only win when our restaurants win.</p>
            </div>
          </div>
        </div>
      </main>
      </div>
    </MarketingLayout>
  );
};
export default AboutUs;
