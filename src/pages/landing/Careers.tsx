import { SEO } from '@/components/seo/SEO';
import MarketingLayout from "@/components/landing/MarketingLayout";
import { motion } from "framer-motion";
import { Briefcase, Heart, Laptop, Zap, Globe, Coffee, ChevronRight, Upload, Users, Rocket, Target, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const benefits = [
  { icon: Globe, title: "Work Anywhere", desc: "We are a remote-first team spread across multiple timezones." },
  { icon: Heart, title: "Health & Wellness", desc: "Premium health insurance and wellness stipends." },
  { icon: Zap, title: "Equity Package", desc: "Generous equity grants because we want you to own what you build." },
  { icon: Laptop, title: "Home Office Setup", desc: "$1,000 stipend to build your perfect workspace." },
];

const openPositions = [
  { title: "Senior Full Stack Engineer", dept: "Engineering", location: "Remote", type: "Full-time" },
  { title: "Product Designer", dept: "Design", location: "Remote", type: "Full-time" },
  { title: "Customer Success Manager", dept: "Sales & Support", location: "New York / Remote", type: "Full-time" },
];

const values = [
  { icon: Users, title: "Customer First", desc: "Every decision starts with our restaurant partners and ends with their guests." },
  { icon: Target, title: "Act Like an Owner", desc: "Take initiative, solve hard problems, and drive outcomes without waiting for permission." },
  { icon: Rocket, title: "Move Fast", desc: "Speed is our advantage. We ship quickly, gather feedback, and iterate constantly." },
];

const hiringProcess = [
  { step: "1", title: "Application Review", desc: "We review your application and portfolio to ensure baseline alignment with the role." },
  { step: "2", title: "Initial Chat", desc: "A 30-minute introductory call to learn about your background and what you're looking for." },
  { step: "3", title: "Skills Interview", desc: "Deep dive into your technical or domain skills with a practical, real-world exercise." },
  { step: "4", title: "Offer", desc: "Meet the founders, review compensation, and get your offer." },
];

const Careers = () => {
  const [loading, setLoading] = useState(false);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({ title: "Application Submitted", description: "We will review your profile and get back to you soon!" });
    }, 1500);
  };

  return (
    <MarketingLayout>
      <div className="flex flex-col bg-slate-50 dark:bg-[#0B1220]">
        <SEO title="Careers | ZAPPY" description="Join ZAPPY and help build the future of restaurant technology." />
      <main className="flex-1 pt-24 pb-24">
        <div className="container mx-auto px-6 max-w-6xl">
          {/* Hero */}
          <div className="text-center mb-24">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 dark:text-white mb-6"
            >
              Build the <span className="text-blue-600">Future</span> of Dining
            </motion.h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10">
              We are a passionate team of engineers, designers, and foodies building the world's most advanced restaurant operating system.
            </p>
            <Button size="lg" className="rounded-full px-8 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => window.scrollTo({ top: document.getElementById('open-roles')?.offsetTop || 0, behavior: 'smooth'})}>
              View Open Roles
            </Button>
          </div>

          {/* Mission & Values */}
          <div className="mb-32">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold dark:text-white mb-6">Our Mission</h2>
              <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
                We exist to empower restaurants of all sizes with enterprise-grade technology. We believe that by removing operational friction, restaurant owners can focus on what they do best: delivering incredible hospitality.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {values.map((v, i) => (
                <div key={i} className="bg-white dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                    <v.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-xl mb-3 dark:text-white">{v.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div className="mb-24">
            <h2 className="text-3xl font-bold text-center dark:text-white mb-12">Why work at ZAPPY?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((b, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-colors">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                    <b.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 dark:text-white">{b.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hiring Process */}
          <div className="mb-32 max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center dark:text-white mb-16">How We Hire</h2>
            <div className="grid md:grid-cols-4 gap-8">
              {hiringProcess.map((step, i) => (
                <div key={i} className="relative text-center">
                  <div className="w-16 h-16 mx-auto bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-black mb-6 relative z-10 shadow-lg shadow-blue-600/20">
                    {step.step}
                  </div>
                  {i !== hiringProcess.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-1/2 w-full h-[2px] bg-slate-200 dark:bg-slate-800" />
                  )}
                  <h3 className="font-bold text-lg mb-3 dark:text-white">{step.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Open Roles */}
          <div id="open-roles" className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold dark:text-white mb-8">Open Positions</h2>
            <div className="space-y-4">
              {openPositions.map((role, i) => (
                <Dialog key={i}>
                  <DialogTrigger asChild>
                    <div className="group cursor-pointer bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between hover:border-blue-500 transition-all">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors">{role.title}</h3>
                        <div className="flex gap-4 text-sm text-slate-500 dark:text-slate-400">
                          <span>{role.dept}</span> &bull; <span>{role.location}</span> &bull; <span>{role.type}</span>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] bg-white dark:bg-[#0B1220] border-slate-200 dark:border-slate-800">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">{role.title}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleApply} className="space-y-4 mt-6 text-left">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">Full Name</label>
                        <Input required placeholder="John Doe" className="dark:bg-slate-900 dark:border-slate-800" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">Email Address</label>
                        <Input type="email" required placeholder="john@example.com" className="dark:bg-slate-900 dark:border-slate-800" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">LinkedIn / Portfolio URL</label>
                        <Input required placeholder="https://linkedin.com/in/..." className="dark:bg-slate-900 dark:border-slate-800" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">Why ZAPPY?</label>
                        <Textarea required placeholder="Tell us why you'd be a great fit..." className="h-24 dark:bg-slate-900 dark:border-slate-800" />
                      </div>
                      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                        {loading ? "Submitting..." : "Submit Application"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </div>

          {/* Application CTA */}
          <div className="mt-32 text-center bg-blue-600 rounded-[3rem] p-12 md:p-20 shadow-xl shadow-blue-600/20">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Don't see a perfect fit?</h2>
            <p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto mb-10">
              We are always looking for exceptional talent. If you believe you can make a massive impact at ZAPPY, send us a general application.
            </p>
            <Button size="lg" className="rounded-full px-10 bg-white text-blue-600 hover:bg-slate-50 font-bold h-14 text-lg shadow-lg">
              Send General Application
            </Button>
          </div>
        </div>
      </main>
      </div>
    </MarketingLayout>
  );
};
export default Careers;
