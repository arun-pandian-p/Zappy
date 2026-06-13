import React from 'react';
import { SEO } from '@/components/seo/SEO';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import MarketingLayout from '@/components/landing/MarketingLayout';

export default function AIFoodImages() {
  const navigate = useNavigate();
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "AI Food Image Generator | Zappy",
    "description": "Generate mouth-watering food photography for your menu instantly using AI.",
    "url": "https://www.zappy.ind.in/ai-food-images"
  };

  return (
    <MarketingLayout>
      <SEO 
        title="AI Food Image Generator for Restaurants | Zappy"
        description="Don't have professional food photography? Use Zappy's AI Food Image Generator to create mouth-watering, realistic photos of your dishes instantly."
        canonical="https://www.zappy.ind.in/ai-food-images"
        keywords="AI food images, food photography AI, generate food pictures, digital menu images"
        schema={schema}
      />
      <div className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto prose dark:prose-invert">
        <h1>AI Food Image Generation</h1>
        <p>Professional food photography is expensive and time-consuming. Zappy changes the game by offering an integrated AI Food Image Generator.</p>

        <div className="flex gap-4 my-8 not-prose">
          <Button size="lg" onClick={() => navigate('/login')}>Get Started Free</Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/order?slug=arun&table=T1&demo=true')}>Book Demo</Button>
        </div>

        <h2>How It Works</h2>
        <p>Simply type in a description of your dish, such as "A juicy double cheeseburger with crispy bacon on a toasted brioche bun," and our AI will generate a photorealistic image in seconds.</p>
        <h2>Increase Conversion</h2>
        <p>Menus with images receive significantly more engagement. Customers are far more likely to order a dish they can visually inspect. Our AI ensures that even restaurants on a tight budget can offer a premium visual experience.</p>
        <h2>Consistent Aesthetics</h2>
        <p>Maintain a consistent visual style across your entire menu. Whether you want a moody, dramatic look or a bright, airy aesthetic, our AI can generate images that match your brand identity.</p>
      </div>
    </MarketingLayout>
  );
}
