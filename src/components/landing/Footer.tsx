import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FooterProps {
  cms?: Record<string, any>;
}

const Footer = ({ cms: _cms }: FooterProps) => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: 'Product',
      links: [
        { name: 'Features', href: '/#features' },
        { name: 'Pricing', href: '/#pricing' },
        { name: 'AI Menu OCR', href: '/menu-ocr' },
        { name: 'AI Food Images', href: '/ai-food-images' },
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
        { name: 'About Us', href: '/#' },
        { name: 'Careers', href: '/#' },
        { name: 'Blog', href: '/blog' },
        { name: 'Contact', href: '/#' },
      ],
    },
  ];

  return (
    <footer className="relative bg-[#F7F5F0] text-[#111111] overflow-hidden pt-24 pb-12 border-t border-[#111111]/8">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#FF6B00] blur-[120px] rounded-full" />
      </div>

      <div className="container relative z-10 mx-auto px-6 max-w-6xl">
        {/* Top Header Section */}
        <div className="text-center mb-16 space-y-4">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black tracking-tight text-[#111111] uppercase"
          >
            Run Your Entire Restaurant on <br />
            <span className="text-[#FF6B00]">Zappy Restaurant OS</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[#111111]/60 text-lg font-light"
          >
            QR Ordering &bull; Kitchen KDS &bull; Cashier Billing &bull; Diner Loyalty &bull; Live Analytics
          </motion.p>
        </div>

        {/* Giant Interactive Morphing Logo Area */}
        <div className="flex justify-center mb-20">
          <div className="footer-massive-text select-none text-center flex items-center justify-center gap-1">
            {['Z', 'A', 'P', 'P', 'Y'].map((letter, idx) => (
              <span key={idx} className="footer-letter-span cursor-pointer">
                {letter}
              </span>
            ))}
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-16 max-w-4xl mx-auto border-t border-[#111111]/8 pt-16">
          {footerLinks.map((section, idx) => (
            <motion.div 
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * idx }}
              className="text-center md:text-left"
            >
              <h3 className="font-bold text-xs uppercase tracking-widest text-[#FF6B00] mb-6">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-[#111111]/70 hover:text-[#FF6B00] transition-colors text-sm font-light">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Newsletter & Socials */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12 border-t border-[#111111]/8 pt-12">
          <div className="w-full md:w-auto flex-1 max-w-md relative flex">
            <Input 
              type="email" 
              placeholder="Join our restaurant newsletter" 
              className="w-full bg-[#FFFFFF] border border-[#111111]/8 text-[#111111] placeholder:text-[#111111]/40 h-12 rounded-l-full rounded-r-none focus-visible:ring-1 focus-visible:ring-[#FF6B00]/50 pr-24"
            />
            <Button className="absolute right-0 h-12 rounded-l-none rounded-r-full bg-[#111111] hover:bg-[#111111]/90 border border-transparent text-white px-6 font-semibold">
              Subscribe
            </Button>
          </div>

          <div className="flex gap-4">
            {[Linkedin, Twitter, Instagram, Facebook, Youtube].map((Icon, idx) => (
              <a 
                key={idx} 
                href="#" 
                className="w-10 h-10 rounded-full border border-[#111111]/8 flex items-center justify-center text-[#111111]/60 hover:text-[#FF6B00] hover:border-[#FF6B00]/20 hover:bg-[#FF6B00]/5 transition-all"
              >
                <Icon className="w-4.5 h-4.5" />
              </a>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#111111]/8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#111111]/50 font-medium">
          <p>© {currentYear} Zappy. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[#FF6B00] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#FF6B00] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[#FF6B00] transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;