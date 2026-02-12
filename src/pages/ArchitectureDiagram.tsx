import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ArchitectureDiagram = () => {
  const diagramRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleDownload = () => {
    if (!diagramRef.current) return;
    
    import('html2canvas').then(({ default: html2canvas }) => {
      html2canvas(diagramRef.current!, { 
        scale: 2, 
        backgroundColor: '#ffffff',
        useCORS: true,
      }).then((canvas) => {
        const link = document.createElement('a');
        link.download = 'QR-Dine-Pro-Architecture.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-xl font-bold">QR Dine Pro — Full Architecture</h1>
        <Button onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" />
          Download PNG
        </Button>
      </div>

      {/* Diagram */}
      <div ref={diagramRef} className="p-8 max-w-[1400px] mx-auto">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900">🍽️ QR Dine Pro — System Architecture</h1>
          <p className="text-gray-500 mt-1">Multi-Tenant Restaurant SaaS Platform</p>
        </div>

        {/* Row 1: Public Layer */}
        <Section title="🌐 PUBLIC LAYER" color="bg-emerald-50 border-emerald-300">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Box title="Landing Page" items={['Hero + CTA', 'Features', 'Pricing Plans', 'Testimonials']} color="bg-emerald-100" />
            <Box title="QR Code Scan" items={['Table-specific URL', '/order?table=X', 'No login required', 'Session token']} color="bg-emerald-100" />
            <Box title="Customer Menu" items={['Browse categories', 'Add to cart (Zustand)', 'Place order', 'Call waiter']} color="bg-emerald-100" />
            <Box title="Feedback" items={['Star rating (1-5)', 'Comments', 'Google redirect ≥4★', 'Anonymous']} color="bg-emerald-100" />
          </div>
        </Section>

        {/* Arrow */}
        <Arrow />

        {/* Row 2: Auth Layer */}
        <Section title="🔐 AUTHENTICATION LAYER" color="bg-amber-50 border-amber-300">
          <div className="grid grid-cols-3 gap-3">
            <Box title="Super Admin Login" items={['/super-admin/login', 'Platform owners only', 'Dark branded theme', 'arunpandi47777@gmail.com']} color="bg-purple-100" />
            <Box title="Tenant Admin Login" items={['/admin/login', 'Restaurant staff', 'Warm branded theme', 'arun4709s@gmail.com']} color="bg-blue-100" />
            <Box title="General Staff Login" items={['/login', 'All staff roles', 'Login + Sign Up tabs', 'Role-based redirect']} color="bg-amber-100" />
          </div>
          <div className="mt-3 p-3 bg-amber-100 rounded-lg text-center text-sm font-medium">
            Auth Flow: Supabase Auth → onAuthStateChange → user_roles table lookup → Role-based redirect
          </div>
        </Section>

        {/* Arrow */}
        <Arrow />

        {/* Row 3: Role Dashboards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <Section title="👑 SUPER ADMIN" color="bg-purple-50 border-purple-300" compact>
            <div className="space-y-2">
              <Item emoji="🏢" text="Tenant Management" />
              <Item emoji="📋" text="Subscription Plans" />
              <Item emoji="📢" text="Platform-wide Ads" />
              <Item emoji="📈" text="Revenue Analytics" />
              <Item emoji="👤" text="Role: super_admin" />
            </div>
          </Section>

          <Section title="🏪 TENANT ADMIN" color="bg-blue-50 border-blue-300" compact>
            <div className="space-y-2">
              <Item emoji="📊" text="Dashboard + Charts" />
              <Item emoji="🍕" text="Menu CRUD" />
              <Item emoji="📋" text="Tables & QR" />
              <Item emoji="📦" text="Order Management" />
              <Item emoji="👥" text="Staff Management" />
              <Item emoji="🎫" text="Coupons" />
              <Item emoji="📢" text="Ads Manager" />
              <Item emoji="⭐" text="Reviews" />
              <Item emoji="📥" text="Data Exports" />
              <Item emoji="⚙️" text="Settings" />
            </div>
          </Section>

          <Section title="👨‍🍳 KITCHEN" color="bg-orange-50 border-orange-300" compact>
            <div className="space-y-2">
              <Item emoji="📋" text="Order Queue" />
              <Item emoji="⏱️" text="Prep Timers" />
              <Item emoji="🔊" text="Sound Alerts" />
              <Item emoji="🔄" text="Realtime Updates" />
              <Item emoji="👤" text="Role: kitchen_staff" />
            </div>
          </Section>

          <Section title="🤵 WAITER" color="bg-cyan-50 border-cyan-300" compact>
            <div className="space-y-2">
              <Item emoji="🔔" text="Waiter Calls" />
              <Item emoji="🪑" text="Table Status" />
              <Item emoji="📦" text="Active Orders" />
              <Item emoji="🔄" text="Realtime Updates" />
              <Item emoji="👤" text="Role: waiter_staff" />
            </div>
          </Section>

          <Section title="💰 BILLING POS" color="bg-green-50 border-green-300" compact>
            <div className="space-y-2">
              <Item emoji="🪑" text="Table Selector" />
              <Item emoji="🔢" text="Numeric Keypad" />
              <Item emoji="💸" text="Quick Discounts" />
              <Item emoji="💳" text="Payment Processing" />
              <Item emoji="🖨️" text="Receipt Printing" />
              <Item emoji="👤" text="Role: billing_staff" />
            </div>
          </Section>
        </div>

        {/* Arrow */}
        <Arrow />

        {/* Row 4: Security + Database */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Section title="🔒 SECURITY LAYER" color="bg-red-50 border-red-300">
            <div className="grid grid-cols-2 gap-3">
              <Box title="Row Level Security" items={['All tables scoped by restaurant_id', 'has_role() function', 'get_user_restaurant_id()', 'Privilege escalation prevention']} color="bg-red-100" />
              <Box title="Edge Functions" items={['manage-staff (Service Role)', 'Admin API for user CRUD', 'No client-side signUp', 'verify_jwt = false + code auth']} color="bg-red-100" />
            </div>
          </Section>

          <Section title="💾 DATABASE SCHEMA (19 Tables)" color="bg-gray-50 border-gray-300">
            <div className="grid grid-cols-3 gap-1 text-xs">
              {[
                'restaurants', 'user_roles', 'staff_profiles',
                'menu_items', 'categories', 'tables',
                'orders', 'order_items', 'invoices',
                'feedback', 'waiter_calls', 'table_sessions',
                'coupons', 'ads', 'subscription_plans',
                'analytics_daily', 'analytics_events', 'customer_events',
                'printer_queue'
              ].map(t => (
                <span key={t} className="bg-gray-200 rounded px-2 py-1 font-mono text-center">{t}</span>
              ))}
            </div>
          </Section>
        </div>

        {/* Credentials */}
        <Section title="🔑 CREDENTIALS" color="bg-indigo-50 border-indigo-300">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Email</th>
                <th className="text-left py-2 px-3">Role</th>
                <th className="text-left py-2 px-3">Login URL</th>
                <th className="text-left py-2 px-3">Password</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b bg-purple-50">
                <td className="py-2 px-3 font-mono">arunpandi47777@gmail.com</td>
                <td className="py-2 px-3"><span className="bg-purple-200 text-purple-800 px-2 py-0.5 rounded text-xs font-bold">super_admin</span></td>
                <td className="py-2 px-3 font-mono">/super-admin/login</td>
                <td className="py-2 px-3 text-gray-400">(existing)</td>
              </tr>
              <tr className="border-b bg-blue-50">
                <td className="py-2 px-3 font-mono">arun4709s@gmail.com</td>
                <td className="py-2 px-3"><span className="bg-blue-200 text-blue-800 px-2 py-0.5 rounded text-xs font-bold">restaurant_admin</span></td>
                <td className="py-2 px-3 font-mono">/admin/login</td>
                <td className="py-2 px-3 font-mono">Tenant@123</td>
              </tr>
              <tr className="bg-blue-50">
                <td className="py-2 px-3 font-mono">arun@gmail.com</td>
                <td className="py-2 px-3"><span className="bg-blue-200 text-blue-800 px-2 py-0.5 rounded text-xs font-bold">restaurant_admin</span></td>
                <td className="py-2 px-3 font-mono">/admin/login</td>
                <td className="py-2 px-3 text-gray-400">(existing)</td>
              </tr>
            </tbody>
          </table>
        </Section>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">QR Dine Pro © 2026 — Built with Lovable</p>
      </div>
    </div>
  );
};

const Section = ({ title, color, children, compact }: { title: string; color: string; children: React.ReactNode; compact?: boolean }) => (
  <div className={`border-2 rounded-xl p-4 mb-4 ${color}`}>
    <h2 className={`font-bold mb-3 ${compact ? 'text-sm' : 'text-lg'}`}>{title}</h2>
    {children}
  </div>
);

const Box = ({ title, items, color }: { title: string; items: string[]; color: string }) => (
  <div className={`rounded-lg p-3 ${color}`}>
    <h3 className="font-semibold text-sm mb-2">{title}</h3>
    <ul className="text-xs space-y-1">
      {items.map((item, i) => <li key={i}>• {item}</li>)}
    </ul>
  </div>
);

const Item = ({ emoji, text }: { emoji: string; text: string }) => (
  <div className="flex items-center gap-2 text-xs">
    <span>{emoji}</span>
    <span>{text}</span>
  </div>
);

const Arrow = () => (
  <div className="flex justify-center my-2">
    <div className="w-0.5 h-6 bg-gray-400" />
    <div className="absolute mt-4 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-gray-400" />
  </div>
);

export default ArchitectureDiagram;
