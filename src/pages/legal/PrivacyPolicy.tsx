import { SEO } from '@/components/seo/SEO';
import MarketingLayout from "@/components/landing/MarketingLayout";

const PrivacyPolicy = () => {
  return (
    <MarketingLayout>
      <div className="flex flex-col bg-slate-50 dark:bg-[#0B1220]">
        <SEO title="Privacy Policy | ZAPPY" description="Privacy policy and data protection practices for ZAPPY." />
      <main className="flex-1 pt-24 pb-24 px-6">
        <div className="max-w-3xl mx-auto prose dark:prose-invert prose-blue">
          <h1>Privacy Policy</h1>
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <p>At ZAPPY Inc., we take your privacy seriously. This Privacy Policy describes how we collect, use, and handle your personal information when you use our restaurant operating system and services.</p>
          <h2>1. Information We Collect</h2>
          <p>We collect information that you provide to us directly, such as when you create an account, update your profile, or communicate with us.</p>
          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to provide, maintain, and improve our services, as well as to communicate with you.</p>
          <h2>3. Data Security</h2>
          <p>We implement appropriate technical and organizational measures to protect the security of your personal information.</p>
          <h2>4. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at privacy@zappy.ind.in.</p>
        </div>
      </main>
      </div>
    </MarketingLayout>
  );
};
export default PrivacyPolicy;
