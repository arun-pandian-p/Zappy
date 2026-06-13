import React from 'react';
import { SEO } from '@/components/seo/SEO';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import MarketingLayout from '@/components/landing/MarketingLayout';

export default function DigitalMenuSoftware() {
  const navigate = useNavigate();
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Digital Menu Software | Zappy",
    "description": "Create beautiful, interactive digital menus for your restaurant.",
    "url": "https://www.zappy.ind.in/digital-menu-software"
  };

  return (
    <MarketingLayout>
      <SEO 
        title="Interactive Digital Menu Software | Zappy"
        description="Create beautiful, interactive digital menus for your restaurant. Enhance the dining experience with high-res images and easy navigation."
        canonical="https://www.zappy.ind.in/digital-menu-software"
        keywords="digital menu software, interactive menu, digital dining experience, restaurant digital menu"
        schema={schema}
      />
      <div className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto prose dark:prose-invert">
        <h1>Interactive Digital Menu Software</h1>
        <p>The modern diner expects more than just a list of text. They want a visual, interactive experience that helps them decide what to eat. Zappy's Digital Menu Software delivers exactly that.</p>

        <div className="flex gap-4 my-8 not-prose">
          <Button size="lg" onClick={() => navigate('/login')}>Get Started Free</Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/order?slug=arun&table=T1&demo=true')}>Book Demo</Button>
        </div>

        <h2>Visual Dining Experience</h2>
        <p>Showcase your culinary creations with high-resolution imagery. Visual menus have been proven to increase average order value by up to 20% because customers eat with their eyes first.</p>
        <h2>Dietary Filtering</h2>
        <p>Allow your customers to filter the menu based on their dietary restrictions. Whether they are vegan, gluten-free, or have specific allergies, your digital menu will instantly adapt to show them safe options.</p>
        <h2>Multi-Language Support</h2>
        <p>Cater to a global audience with instant translation features. Your digital menu can be viewed in dozens of languages, removing friction for tourists and non-native speakers.</p>
      </div>
    </MarketingLayout>
  );
}
