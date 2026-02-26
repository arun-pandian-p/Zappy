import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  {
    q: 'Do my customers need to download an app?',
    a: 'No! ZAPPY works entirely in the browser. Customers simply scan the QR code and the menu opens instantly — no downloads, no sign-ups required.',
  },
  {
    q: 'How long does it take to set up?',
    a: 'You can be up and running in under 15 minutes. Just create your account, add your menu items, configure your tables, and print QR codes.',
  },
  {
    q: 'Can I customize the menu design for my brand?',
    a: 'Absolutely. You can set your logo, brand colors, fonts, cover images, and even a custom splash screen animation for your restaurant.',
  },
  {
    q: 'Does it work with my existing POS or printer?',
    a: 'ZAPPY supports Bluetooth and USB thermal printers (ESC/POS compatible). POS integration is available on the Enterprise plan.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. We use enterprise-grade encryption, row-level security policies, and role-based access control to keep your restaurant data safe.',
  },
  {
    q: 'Can I manage multiple restaurant locations?',
    a: 'Yes, our Enterprise plan supports multi-location management with a unified super-admin dashboard for all your outlets.',
  },
];

const FAQSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Frequently Asked{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about ZAPPY.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border rounded-xl px-6 bg-card data-[state=open]:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline py-5">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
