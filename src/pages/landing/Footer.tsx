import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const Footer = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: 'Product',
      links: [
        { name: 'Core Features', href: '/#features' },
        { name: 'AI Menu OCR', href: '/menu-ocr' },
        { name: 'AI Food Images', href: '/ai-food-images' },
        { name: 'Guest Experience', href: '/#solution' }
      ],
    },
    {
      title: 'Solutions',
      links: [
        { name: 'Menu Management', href: '/restaurant-menu-management' },
        { name: 'Digital Menu', href: '/digital-menu-software' },
        { name: 'Restaurant OCR', href: '/restaurant-ocr' },
        { name: 'QR Generator', href: '/qr-menu-generator' },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'About Us', href: '#' },
        { name: 'Careers', href: '#' },
        { name: 'Blog', href: '/blog' },
        { name: 'Contact Sales', href: '#' },
      ],
    },
  ];

  return (
    <footer className="relative bg-[#0B1120] text-slate-300 overflow-hidden pt-24 pb-12 border-t border-white/5">
      {/* Background radial glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-blue-600/5 blur-[120px] rounded-full" />
      </div>

      <div className="container relative z-10 mx-auto px-6 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          
          {/* Brand Info & Newsletter */}
          <div className="md:col-span-5 space-y-6">
            <div className="flex items-center gap-3">
              <img 
                src="/zappy-uploads/53e47e43-08ad-46f9-a01e-426fd946553a.png" 
                alt="Zappy Logo" 
                className="h-8 w-auto object-contain cursor-pointer"
                onClick={() => { navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              />
              <span className="text-xl font-black text-white tracking-wider">ZAPPY</span>
            </div>
            
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              The high-frequency restaurant operating system unifying QR ordering, live kitchen tracking, payment settlement, and customer analytics.
            </p>

            {/* Newsletter input */}
            <div className="space-y-3 max-w-sm">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Subscribe to updates</h4>
              <div className="flex relative">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-slate-950/60 border-white/10 text-white placeholder:text-slate-600 h-12 rounded-l-full rounded-r-none focus-visible:ring-1 focus-visible:ring-blue-500/50 pr-28"
                />
                <Button className="absolute right-0 h-12 rounded-l-none rounded-r-full bg-blue-500 hover:bg-blue-600 border border-white/10 text-white px-6">
                  <Send className="w-4 h-4 mr-2" />
                  Subscribe
                </Button>
              </div>
            </div>
          </div>

          {/* Links columns (3 columns) */}
          <div className="md:col-span-7 grid grid-cols-3 gap-8">
            {footerLinks.map((column, idx) => (
              <div key={column.title} className="space-y-4">
                <h4 className="font-bold text-white text-sm tracking-wide uppercase">{column.title}</h4>
                <ul className="space-y-3 text-sm">
                  {column.links.map((link) => (
                    <li key={link.name}>
                      <a href={link.href} className="hover:text-white transition-colors text-slate-400">
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

        </div>

        {/* Socials & Bottom Meta */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs text-slate-500">
            © {currentYear} ZAPPY Inc. All rights reserved.
          </p>

          <div className="flex gap-4">
            {[Linkedin, Twitter, Instagram, Facebook, Youtube].map((Icon, idx) => (
              <a 
                key={idx} 
                href="#" 
                className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-300"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>

          <div className="flex gap-6 text-xs text-slate-500">
            <a href="#" className="hover:text-slate-300">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300">Terms of Service</a>
            <a href="#" className="hover:text-slate-300">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
