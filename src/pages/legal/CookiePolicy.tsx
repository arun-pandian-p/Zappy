import { SEO } from '@/components/seo/SEO';
import MarketingLayout from "@/components/landing/MarketingLayout";

const CookiePolicy = () => {
  return (
    <MarketingLayout>
      <div className="flex flex-col bg-slate-50 dark:bg-[#0B1220]">
        <SEO title="Cookie Policy | ZAPPY" description="Learn how we use cookies at ZAPPY." />
      <main className="flex-1 pt-24 pb-24 px-6">
        <div className="max-w-3xl mx-auto prose dark:prose-invert prose-blue">
          <h1>Cookie Policy</h1>
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <p>This Cookie Policy explains how ZAPPY uses cookies and similar technologies to recognize you when you visit our website.</p>
          <h2>1. What are cookies?</h2>
          <p>Cookies are small data files that are placed on your computer or mobile device when you visit a website.</p>
          <h2>2. Why do we use cookies?</h2>
          <p>We use first party and third party cookies for several reasons. Some cookies are required for technical reasons in order for our website to operate.</p>
          <h2>3. Types of cookies we use</h2>
          <ul>
            <li><strong>Essential Cookies:</strong> Strictly necessary to provide you with services available through our website.</li>
            <li><strong>Analytics Cookies:</strong> Help us understand how our website is being used.</li>
          </ul>
        </div>
      </main>
      </div>
    </MarketingLayout>
  );
};
export default CookiePolicy;
