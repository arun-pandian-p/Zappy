import React from 'react';
import { SEO } from '@/components/seo/SEO';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import MarketingLayout from '@/components/landing/MarketingLayout';

export default function RestaurantOCR() {
  const navigate = useNavigate();
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Restaurant OCR Technology | Zappy",
    "description": "The best OCR technology built specifically for the restaurant industry.",
    "url": "https://www.zappy.ind.in/restaurant-ocr"
  };

  return (
    <MarketingLayout>
      <SEO 
        title="Restaurant Menu OCR Technology | Zappy"
        description="Discover how Zappy's specialized Restaurant OCR technology accurately extracts text, prices, and layouts from complex food menus."
        canonical="https://www.zappy.ind.in/restaurant-ocr"
        keywords="restaurant OCR, menu scanning, extract text from menu, food OCR"
        schema={schema}
      />
      <div className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto prose dark:prose-invert">
        <h1>Advanced Restaurant OCR Technology</h1>
        <p>Standard Optical Character Recognition fails when faced with the creative and complex layouts of modern restaurant menus. Zappy has built a proprietary OCR engine trained specifically on restaurant data.</p>

        <div className="flex gap-4 my-8 not-prose">
          <Button size="lg" onClick={() => navigate('/login')}>Get Started Free</Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/order?slug=arun&table=T1&demo=true')}>Book Demo</Button>
        </div>

        <h2>Understanding Context</h2>
        <p>Our OCR doesn't just read words; it understands what those words mean. It knows the difference between a sub-heading ("Appetizers"), a dish name ("Crispy Calamari"), a description ("Served with marinara sauce"), and a price ("$12.99").</p>
        <h2>Handling Complex Layouts</h2>
        <p>Whether your menu is laid out in columns, uses intricate typography, or features overlapping text and images, our engine can parse the structure accurately and reconstruct it digitally.</p>
        <h2>Continuous Learning</h2>
        <p>Our AI is constantly learning. Every menu scanned improves the system's accuracy, meaning Zappy's OCR gets faster and smarter every single day.</p>
      </div>
    </MarketingLayout>
  );
}
