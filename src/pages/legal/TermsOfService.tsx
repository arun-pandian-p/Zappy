import { SEO } from '@/components/seo/SEO';
import MarketingLayout from "@/components/landing/MarketingLayout";

const TermsOfService = () => {
  return (
    <MarketingLayout>
      <div className="flex flex-col bg-slate-50 dark:bg-[#0B1220]">
        <SEO title="Terms of Service | ZAPPY" description="Terms of Service and conditions for using the ZAPPY Restaurant OS platform." />
      <main className="flex-1 pt-24 pb-24 px-6">
        <div className="max-w-3xl mx-auto prose dark:prose-invert prose-blue">
          <h1>Terms of Service</h1>
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <p>Welcome to ZAPPY. By accessing or using our website and services, you agree to be bound by these Terms of Service.</p>
          <h2>1. Acceptance of Terms</h2>
          <p>By registering for and/or using the Services in any manner, including but not limited to visiting or browsing the Site, you agree to these Terms of Service.</p>
          <h2>2. Description of Service</h2>
          <p>ZAPPY provides a comprehensive restaurant operating system, including QR ordering, digital menus, and analytics.</p>
          <h2>3. User Responsibilities</h2>
          <p>You are responsible for all activities that occur under your account. You must maintain the confidentiality of your password.</p>
          <h2>4. Limitation of Liability</h2>
          <p>In no event shall ZAPPY be liable for any indirect, incidental, special, consequential or punitive damages.</p>
        </div>
      </main>
      </div>
    </MarketingLayout>
  );
};
export default TermsOfService;
