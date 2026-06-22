import { SEO } from '@/components/seo/SEO';
import MarketingLayout from "@/components/landing/MarketingLayout";
import { Star, Clock, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const GuestExperience = () => {
  const navigate = useNavigate();

  return (
    <MarketingLayout>
      <div className="flex flex-col bg-slate-50 dark:bg-[#0B1220]">
        <SEO title="Guest Experience | ZAPPY" description="Elevate your restaurant's guest experience with seamless digital ordering." />
      <main className="flex-1 pt-24 pb-24">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-24">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white mb-6">
              A <span className="text-blue-600">Five-Star</span> Guest Experience
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10">
              No apps to download. No waiting for menus. Just instant access to ordering, calling the waiter, and paying the bill.
            </p>
            <Button size="lg" className="rounded-full px-8 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => navigate('/request-quote')}>
              Book Demo
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center hover:border-blue-500 transition-colors">
              <Clock className="w-12 h-12 text-blue-500 mx-auto mb-6" />
              <h3 className="text-xl font-bold mb-3 dark:text-white">Zero Wait Times</h3>
              <p className="text-slate-600 dark:text-slate-400">Guests order the moment they sit down. No more waving down busy staff during rush hour.</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center hover:border-amber-500 transition-colors">
              <Star className="w-12 h-12 text-amber-500 mx-auto mb-6" />
              <h3 className="text-xl font-bold mb-3 dark:text-white">Beautiful Visuals</h3>
              <p className="text-slate-600 dark:text-slate-400">Appetite-inducing photos of your dishes proven to increase average order value by 20%.</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center hover:border-emerald-500 transition-colors">
              <HeartHandshake className="w-12 h-12 text-emerald-500 mx-auto mb-6" />
              <h3 className="text-xl font-bold mb-3 dark:text-white">Instant Service</h3>
              <p className="text-slate-600 dark:text-slate-400">One-tap buttons to call a waiter, request water, or ask for the check.</p>
            </div>
          </div>
        </div>
      </main>
      </div>
    </MarketingLayout>
  );
};
export default GuestExperience;
