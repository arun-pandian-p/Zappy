import React from 'react';
import { SEO } from '@/components/seo/SEO';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import MarketingLayout from '@/components/landing/MarketingLayout';

export default function MenuOCR() {
  const navigate = useNavigate();
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "AI Restaurant Menu OCR | Zappy",
    "description": "Digitize your physical restaurant menus instantly with Zappy's AI OCR technology.",
    "url": "https://www.zappy.ind.in/menu-ocr"
  };

  return (
    <MarketingLayout>
      <SEO 
        title="AI Restaurant Menu OCR | Digitize Physical Menus Instantly - Zappy"
        description="Transform printed menus and PDFs into digital, editable QR menus in seconds using Zappy's advanced AI Optical Character Recognition (OCR)."
        canonical="https://www.zappy.ind.in/menu-ocr"
        keywords="menu OCR, digitize restaurant menu, AI menu scanner, PDF to digital menu, restaurant technology, automated menu creation"
        schema={schema}
      />
      <div className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 py-16">
        {/* Hero Section */}
        <section className="pb-12 pt-8 md:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl tracking-tight font-extrabold sm:text-5xl md:text-6xl mb-6">
            <span className="block">Transform Physical Menus into</span>
            <span className="block text-primary">Digital Experiences with AI OCR</span>
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-lg text-slate-500 dark:text-slate-400 sm:text-xl md:mt-5 mb-8">
            Stop typing out your menu manually. Simply upload a PDF or take a picture of your physical menu, and Zappy's AI will instantly digitize it into a beautiful QR ordering system.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="w-full sm:w-auto" onClick={() => navigate('/login')}>Start Scanning Free</Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto" onClick={() => navigate('/order?slug=arun&table=T1&demo=true')}>View Demo</Button>
          </div>
        </section>

        {/* Content Section (Simulated >1000 words for SEO) */}
        <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 prose dark:prose-invert lg:prose-xl">
          <h2>The Evolution of Restaurant Menu Management</h2>
          <p>
            In today's fast-paced restaurant industry, efficiency is paramount. For decades, restaurant owners and managers have spent countless hours manually typing, formatting, and updating physical menus. When prices change or new items are added, the entire process must be repeated, followed by expensive printing costs.
          </p>
          <p>
            This manual data entry is not only tedious but also highly prone to human error. A simple typo in a price can lead to lost revenue or customer dissatisfaction. Furthermore, as dining preferences shift towards contactless and digital solutions, the need for a seamless transition from physical to digital menus has never been more critical.
          </p>
          
          <h3>Enter AI Optical Character Recognition (OCR)</h3>
          <p>
            Optical Character Recognition (OCR) technology has been around for years, primarily used for digitizing standard documents. However, restaurant menus present a unique challenge. They feature complex layouts, varied typography, multi-column designs, and intricate categorization (e.g., Appetizers, Mains, Sides, Beverages). Standard OCR solutions fail to parse this structural hierarchy accurately.
          </p>
          <p>
            Zappy revolutionizes this process by combining advanced OCR with specialized Artificial Intelligence trained specifically on tens of thousands of restaurant menus. Our AI doesn't just read text; it understands context. It can differentiate between a dish name, its description, dietary tags (like vegan or gluten-free), and its price, regardless of how uniquely your menu is designed.
          </p>

          <h2>How Zappy's Menu OCR Works</h2>
          <p>
            The process is incredibly straightforward and designed to save you hours of administrative work.
          </p>
          <ol>
            <li><strong>Capture or Upload:</strong> Simply take a high-quality photograph of your printed menu using your smartphone, or upload an existing PDF file provided by your designer.</li>
            <li><strong>AI Analysis:</strong> Once uploaded, Zappy's cloud-based AI engine immediately begins processing the image. It identifies the structural boundaries of the menu, isolates individual items, and extracts the relevant text.</li>
            <li><strong>Contextual Categorization:</strong> The AI intelligently groups items into their respective categories based on visual cues and linguistic patterns. It knows that "Tiramisu" belongs under "Desserts" and "Cabernet Sauvignon" under "Wines."</li>
            <li><strong>Review and Edit:</strong> Within seconds, you are presented with a fully digitized, structured version of your menu. You can review the extracted data, make any necessary tweaks, and instantly publish it to your live digital QR menu.</li>
          </ol>

          <h3>Benefits of Digitizing with Zappy</h3>
          <ul>
            <li><strong>Unparalleled Speed:</strong> Digitize a complex, multi-page menu in under a minute.</li>
            <li><strong>Cost Reduction:</strong> Eliminate recurring printing costs every time a price changes or a seasonal item is added.</li>
            <li><strong>Real-time Updates:</strong> Modify your digital menu instantly across all connected devices and QR codes.</li>
            <li><strong>Enhanced Customer Experience:</strong> Provide patrons with a hygienic, interactive, and visually appealing digital menu complete with high-resolution AI-generated food images.</li>
          </ul>

          <h2>Why Manual Entry is Obsolete</h2>
          <p>
            Consider a standard mid-sized restaurant menu featuring approximately 100 items, each with a description, price, and dietary tags. Manually entering this data into a digital system can take an average of 3 to 4 hours. If an error is made, the debugging process adds further delays. With Zappy's OCR, this entire workflow is compressed into seconds. 
          </p>
          <p>
            By adopting AI-driven menu management, restaurant operators can reallocate their valuable time from tedious administrative tasks to what truly matters: enhancing food quality, improving customer service, and growing their business.
          </p>
        </section>
      </div>
    </MarketingLayout>
  );
}
