import { motion } from 'framer-motion';
import { Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ZappyLogo } from '@/components/branding/ZappyLogo';

interface FooterProps {
  cms?: Record<string, any>;
}

const Footer = ({ cms }: FooterProps) => {
  const currentYear = new Date().getFullYear();
  const companyName = cms?.company_name || 'ZAPPY Inc.';

  const footerLinks = [
    {
      title: 'Product',
      links: ['Features', 'Pricing', 'Integrations', 'API', 'Changelog', 'Roadmap'],
    },
    {
      title: 'Restaurant Solutions',
      links: ['For Independent Restaurants', 'For Chains', 'For GSR', 'For Fine Dining', 'For Ghost Kitchens'],
    },
    {
      title: 'Company',
      links: ['About Us', 'Careers', 'Blog', 'Press', 'Partners', 'Contact', 'Zappy Atlas'],
    },
    {
      title: 'Resources',
      links: ['Help Center', 'Developers', 'Community', 'Events', 'Status', 'Legal'],
    },
    {
      title: 'Legal',
      links: ['Privacy Policy', 'Terms of Trial', 'Cookie Policy'],
    },
  ];

  return (
    <footer className="relative bg-[#080B1A] text-white overflow-hidden pt-24 pb-6">
      {/* Background Glow / Sparkles (Abstract representation) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-yellow-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="container relative z-10 mx-auto px-4 max-w-6xl">
        {/* Top Header Section */}
        <div className="text-center mb-16 space-y-6">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold tracking-tight text-white"
          >
            Run Your Entire Restaurant
            <br />
            From One Platform
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[hsl(215,20%,75%)] text-lg"
          >
            QR Ordering &bull; Kitchen &bull; Billing &bull; Reviews &bull; Analytics &bull; Inventory
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Button className="bg-[#FFC629] text-black hover:bg-[#FFC629]/90 font-semibold px-8 h-12 rounded-lg">
              Book Demo
            </Button>
            <Button 
              variant="outline" 
              className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white font-semibold px-8 h-12 rounded-lg backdrop-blur-sm relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              Start Free Trial
            </Button>
          </motion.div>
        </div>

        {/* Giant Logo Area */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="flex justify-center mb-24 relative"
        >
          {/* We use the ZappyLogo for now or an image if available */}
          <div className="relative w-full max-w-4xl mx-auto flex justify-center items-center drop-shadow-[0_0_30px_rgba(255,198,41,0.3)]">
            <img 
              src="/zappy-uploads/53e47e43-08ad-46f9-a01e-426fd946553a.png" 
              alt="Zappy Logo" 
              className="w-full h-auto max-w-[800px] object-contain mix-blend-screen"
              onError={(e) => {
                // Fallback to text if image fails to load
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const fallback = document.createElement('h1');
                  fallback.className = "text-8xl md:text-[150px] font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]";
                  fallback.innerText = "ZAPPY";
                  parent.appendChild(fallback);
                }
              }}
            />
          </div>
        </motion.div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-16">
          {footerLinks.map((section, idx) => (
            <motion.div 
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * idx }}
            >
              <h3 className="font-semibold text-lg text-white mb-6">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-[hsl(215,20%,75%)] hover:text-white transition-colors text-sm">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Newsletter & Socials */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
          <div className="w-full md:w-auto flex-1 max-w-md relative flex">
            <Input 
              type="email" 
              placeholder="Glassmorphism newsletter" 
              className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/40 h-12 rounded-l-lg rounded-r-none backdrop-blur-md focus-visible:ring-1 focus-visible:ring-yellow-500/50 pr-24"
            />
            <Button className="absolute right-0 h-12 rounded-l-none rounded-r-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white backdrop-blur-md px-6">
              Subscribe
            </Button>
          </div>

          <div className="flex gap-4">
            {[Linkedin, Twitter, Instagram, Facebook, Youtube].map((Icon, idx) => (
              <a 
                key={idx} 
                href="#" 
                className="w-10 h-10 rounded-full flex items-center justify-center text-[#FFC629] hover:bg-white/5 transition-colors"
              >
                <Icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[hsl(215,20%,65%)]">
          <p>© {currentYear} {companyName} All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;