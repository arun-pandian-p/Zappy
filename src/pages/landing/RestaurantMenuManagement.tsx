import React from 'react';
import { SEO } from '@/components/seo/SEO';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import MarketingLayout from '@/components/landing/MarketingLayout';

export default function RestaurantMenuManagement() {
  const navigate = useNavigate();
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Restaurant Menu Management Software | Zappy",
    "description": "Centralize and automate your restaurant menu management across all locations.",
    "url": "https://www.zappy.ind.in/restaurant-menu-management"
  };

  return (
    <MarketingLayout>
      <SEO 
        title="Best Restaurant Menu Management Software | Zappy"
        description="Centralize and automate your restaurant menu management across all locations. Sync prices, update dishes, and manage digital menus from one dashboard."
        canonical="https://www.zappy.ind.in/restaurant-menu-management"
        keywords="restaurant menu management software, digital menu management, sync restaurant menus, cloud menu software"
        schema={schema}
      />
      <div className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto prose dark:prose-invert">
        <h1>Restaurant Menu Management Made Simple</h1>
        <p>Managing menus across multiple restaurant locations, digital platforms, and printed materials is a logistical nightmare. Zappy solves this by providing a single source of truth for your entire menu ecosystem.</p>
        
        <div className="flex gap-4 my-8 not-prose">
          <Button size="lg" onClick={() => navigate('/login')}>Get Started Free</Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/order?slug=arun&table=T1&demo=true')}>Book Demo</Button>
        </div>

        <h2>Centralized Dashboard</h2>
        <p>Update a price or description once in the Zappy dashboard, and watch it instantly sync across your QR menus, POS integrations, and kitchen displays. This centralized approach guarantees consistency and prevents customer frustration caused by outdated information.</p>
        <h2>Real-Time Inventory Sync</h2>
        <p>If an item runs out of stock, seamlessly mark it as "sold out" on the Zappy dashboard. The item will instantly become unavailable on your digital menus, preventing orders that the kitchen cannot fulfill.</p>
        <h2>Multi-Location Support</h2>
        <p>For franchises and restaurant groups, maintaining brand consistency while allowing for location-specific pricing is crucial. Zappy's multi-tenant architecture allows super-admins to deploy global menu updates while giving local managers the flexibility to adjust specific offerings.</p>
        <h2>Analytics and Insights</h2>
        <p>Understand your menu's performance with deep analytics. See which items are most viewed, which ones convert to orders, and which ones are ignored. Use these insights to optimize your menu layout and boost your bottom line.</p>
      </div>
    </MarketingLayout>
  );
}
