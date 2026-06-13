import React from 'react';
import { SEO } from '@/components/seo/SEO';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import MarketingLayout from '@/components/landing/MarketingLayout';

export default function QRMenuGenerator() {
  const navigate = useNavigate();
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "QR Menu Generator | Zappy",
    "description": "Generate custom QR codes for your digital restaurant menus.",
    "url": "https://www.zappy.ind.in/qr-menu-generator"
  };

  return (
    <MarketingLayout>
      <SEO 
        title="Custom QR Menu Generator | Zappy"
        description="Generate beautiful, branded custom QR codes for your tables. Connect customers directly to your digital menu with a quick scan."
        canonical="https://www.zappy.ind.in/qr-menu-generator"
        keywords="QR menu generator, restaurant QR code, create QR menu, scan to order"
        schema={schema}
      />
      <div className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto prose dark:prose-invert">
        <h1>Custom QR Menu Generator</h1>
        <p>Connect the physical world to your digital experience with Zappy's advanced QR Menu Generator.</p>

        <div className="flex gap-4 my-8 not-prose">
          <Button size="lg" onClick={() => navigate('/login')}>Get Started Free</Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/order?slug=arun&table=T1&demo=true')}>Book Demo</Button>
        </div>

        <h2>Branded QR Codes</h2>
        <p>Don't settle for boring black-and-white squares. Our generator allows you to customize the color, shape, and even embed your restaurant's logo directly into the center of the QR code.</p>
        <h2>Table-Specific Tracking</h2>
        <p>Generate unique QR codes for every table in your restaurant. When a customer scans the code, the system automatically knows where they are sitting, streamlining the ordering and delivery process.</p>
        <h2>High-Quality Downloads</h2>
        <p>Export your customized QR codes in high-resolution vector formats (SVG, EPS) ensuring they print perfectly on table tents, stickers, or window decals.</p>
      </div>
    </MarketingLayout>
  );
}
