import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { emailService } from '@/services/emailService';
import { toast } from '@/hooks/use-toast';

interface FooterProps {
  cms?: Record<string, any>;
}

const Footer = ({ cms }: FooterProps) => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const companyName = cms?.company_name || 'ZAPPY Inc.';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      // Save to Supabase newsletter_subscribers
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email });

      if (error) {
        if (error.code === '23505') {
          toast({ title: "You're already subscribed!", description: "We'll keep you updated." });
          setEmail('');
          return;
        }
        throw error;
      }

      // Send welcome email via Resend
      await emailService.sendNewsletterWelcome(email);
      toast({ title: 'Subscribed!', description: "You'll receive our latest updates & offers." });
      setEmail('');
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Subscription failed', description: err.message || 'Something went wrong.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const footerLinks = [
    {
      title: 'PRODUCT',
      links: [
        { name: 'Core Features', href: '/features' },
        { name: 'AI Menu OCR', href: '/ai-menu-ocr' },
        { name: 'AI Food Images', href: '/ai-food-images' },
        { name: 'Guest Experience', href: '/guest-experience' },
      ],
    },
    {
      title: 'SOLUTIONS',
      links: [
        { name: 'Menu Management', href: '/menu-management' },
        { name: 'Digital Menu', href: '/digital-menu' },
        { name: 'Restaurant OCR', href: '/restaurant-ocr' },
        { name: 'QR Generator', href: '/qr-generator' },
      ],
    },
    {
      title: 'COMPANY',
      links: [
        { name: 'About Us', href: '/about' },
        { name: 'Careers', href: '/careers' },
        { name: 'Blog', href: '/blog' },
        { name: 'Contact Sales', href: '/contact-sales' },
      ],
    },
  ];

  return (
    <footer className="bg-[#0B1220] text-white pt-24 pb-12 border-t border-slate-800/80">
      <div className="container mx-auto px-6 max-w-[1400px]">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
          {/* Left Column (Brand & Newsletter) */}
          <div className="lg:col-span-4 space-y-6 pr-0 lg:pr-12">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <img src="/zappy-uploads/53e47e43-08ad-46f9-a01e-426fd946553a.png" alt="Zappy Logo" className="h-8 w-auto mix-blend-screen" />
              <span className="text-2xl font-black tracking-tight">ZAPPY</span>
            </div>
            <p className="text-[hsl(215,20%,75%)] text-sm leading-relaxed max-w-[320px]">
              The high frequency restaurant operating system unifying QR ordering, live kitchen tracking, payment settlement, and customer analytics.
            </p>
            
            <div className="pt-4">
              <h4 className="text-[11px] font-bold text-white/80 mb-4 uppercase tracking-wider">SUBSCRIBE TO UPDATES</h4>
              <form onSubmit={handleSubscribe} className="flex w-full max-w-[320px]">
                <Input 
                  type="email" 
                  placeholder="Enter your email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-transparent border-white/10 text-white placeholder:text-white/30 h-10 rounded-l-md rounded-r-none focus-visible:ring-1 focus-visible:ring-blue-500 shadow-none"
                />
                <Button type="submit" disabled={loading} className="h-10 rounded-l-none rounded-r-md bg-[#3B82F6] hover:bg-[#2563EB] text-white px-5 font-semibold text-sm">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Subscribe'}
                </Button>
              </form>
            </div>
          </div>

          {/* Right Columns (Links Grid) */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 w-full">
              {footerLinks.map((section) => (
                <div key={section.title}>
                  <h3 className="font-bold text-[13px] text-white mb-6 uppercase tracking-wider">{section.title}</h3>
                  <ul className="space-y-4">
                    {section.links.map((link) => (
                      <li key={link.name}>
                        <Link to={link.href} className="text-[hsl(215,20%,75%)] hover:text-white transition-colors text-[13px]">
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-10 mt-6 flex flex-col-reverse lg:flex-row items-center justify-between gap-8 lg:gap-4">
          <p className="text-[13px] text-[hsl(215,20%,65%)] text-center lg:text-left w-full lg:w-auto">
            © {currentYear} ZAPPY Inc. All rights reserved.
          </p>
          
          <div className="flex items-center justify-center gap-4 w-full lg:w-auto">
            {[Linkedin, Twitter, Instagram, Facebook, Youtube].map((Icon, idx) => (
              <a key={idx} href="#" className="w-10 h-10 lg:w-9 lg:h-9 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>

          <div className="flex items-center justify-center gap-6 lg:gap-8 text-[13px] text-[hsl(215,20%,65%)] w-full lg:w-auto flex-wrap">
            <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link>
          </div>


        </div>
      </div>
    </footer>
  );
};

export default Footer;