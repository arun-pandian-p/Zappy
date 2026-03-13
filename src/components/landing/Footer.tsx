import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { ZappyLogo } from '@/components/branding/ZappyLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FooterProps {
  cms?: Record<string, any>;
}

const Footer = ({ cms }: FooterProps) => {
  const currentYear = new Date().getFullYear();
  const companyName = cms?.company_name || 'ZAPPY';
  const tagline = cms?.tagline || 'Scan, Order, Eat, Repeat — Smart QR-powered digital ordering for restaurants.';

  return (
    <footer className="bg-[hsl(222,47%,11%)] text-[hsl(210,40%,98%)] border-t border-[hsl(217,32%,17%)]">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-3 mb-4">
              <ZappyLogo size={56} compact />
            </div>
            <p className="text-[hsl(215,20%,65%)] text-sm mb-6">{tagline}</p>
            <div className="flex gap-3">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, index) => (
                <Button key={index} variant="outline" size="icon" className="rounded-full border-[hsl(217,32%,17%)] bg-primary text-primary-foreground hover:bg-primary/80 transition-colors">
                  <Icon className="w-4 h-4" />
                </Button>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}>
            <h3 className="font-semibold mb-4 text-[hsl(210,40%,98%)]">Product</h3>
            <ul className="space-y-3 text-sm text-[hsl(215,20%,65%)]">
              {['Features', 'Pricing', 'Integrations', 'Changelog', 'API'].map((link) => (
                <li key={link}><a href="#" className="hover:text-[hsl(210,40%,98%)] transition-colors">{link}</a></li>
              ))}
            </ul>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}>
            <h3 className="font-semibold mb-4 text-[hsl(210,40%,98%)]">Company</h3>
            <ul className="space-y-3 text-sm text-[hsl(215,20%,65%)]">
              {['About Us', 'Careers', 'Blog', 'Press', 'Partners'].map((link) => (
                <li key={link}><a href="#" className="hover:text-[hsl(210,40%,98%)] transition-colors">{link}</a></li>
              ))}
            </ul>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3 }}>
            <h3 className="font-semibold mb-4 text-[hsl(210,40%,98%)]">Stay Updated</h3>
            <p className="text-sm text-[hsl(215,20%,65%)] mb-4">Get the latest updates and news directly in your inbox.</p>
            <div className="flex gap-2">
              <Input type="email" placeholder="Enter your email" className="flex-1 bg-[hsl(217,32%,17%)] border-[hsl(217,32%,25%)] text-[hsl(210,40%,98%)] placeholder:text-[hsl(215,20%,50%)]" />
              <Button>Subscribe</Button>
            </div>
            <div className="mt-6 space-y-2 text-sm text-[hsl(215,20%,65%)]">
              <div className="flex items-center gap-2"><Mail className="w-4 h-4" /><span>zappyscan@gmail.com</span></div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4" /><span>+91 99940 93784</span></div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="border-t border-[hsl(217,32%,17%)]">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[hsl(215,20%,65%)]">
          <p>© {currentYear} {companyName}. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[hsl(210,40%,98%)] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[hsl(210,40%,98%)] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[hsl(210,40%,98%)] transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;