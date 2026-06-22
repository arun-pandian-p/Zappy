import { Helmet } from "react-helmet-async";
import MarketingLayout from "@/components/landing/MarketingLayout";
import { Layers, QrCode, Smartphone, ChefHat, Activity, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const featuresList = [
  { icon: QrCode, title: "QR & Digital Menus", desc: "Interactive, multi-language digital menus directly on guest smartphones." },
  { icon: ChefHat, title: "Kitchen Display System", desc: "Streamline back-of-house operations with real-time order tracking." },
  { icon: Receipt, title: "Frictionless Billing", desc: "Split bills, add tips, and settle payments instantly via UPI or cards." },
  { icon: Smartphone, title: "Waiter App", desc: "Empower your staff to take orders and process payments tableside." },
  { icon: Activity, title: "Real-time Analytics", desc: "Track sales, popular items, and staff performance from anywhere." },
  { icon: Layers, title: "Menu Management", desc: "Update prices, add photos, and mark items out of stock in seconds." },
];

const Features = () => {
  const navigate = useNavigate();
  return (
    <MarketingLayout>
      <div className="flex flex-col bg-slate-50 dark:bg-[#0B1220]">
        <SEO title="Features | ZAPPY" description="Explore all features of the ZAPPY Restaurant OS." />
      <main className="flex-1 pt-24 pb-24">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-24">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white mb-6">
              Everything You Need to <span className="text-blue-600">Run Your Restaurant</span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10">
              A complete ecosystem built to increase table turnover, boost ticket sizes, and delight your guests.
            </p>
            <Button size="lg" className="rounded-full px-8 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => navigate('/request-quote')}>
              Get Started Now
            </Button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuresList.map((f, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-colors">
                <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <f.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3 dark:text-white">{f.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      </div>
    </MarketingLayout>
  );
};
export default Features;
