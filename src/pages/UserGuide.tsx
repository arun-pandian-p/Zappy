import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserGuide = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Zappy — Complete User Guide';
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Toolbar — hidden when printing */}
      <div className="print:hidden sticky top-0 z-50 bg-white border-b shadow-sm px-6 py-3 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" /> Print / Save as PDF
          </Button>
        </div>
      </div>

      {/* Guide Content */}
      <div className="max-w-4xl mx-auto px-8 py-12 print:px-0 print:py-0 space-y-10 leading-relaxed text-[15px] print:text-[12px]">

        {/* Cover */}
        <section className="text-center py-16 print:py-10 border-b-2 border-gray-200">
          <h1 className="text-5xl print:text-3xl font-black tracking-tight mb-4">ZAPPY</h1>
          <p className="text-2xl print:text-xl font-light text-gray-500 mb-2">QR-Based Restaurant Management Platform</p>
          <p className="text-lg font-semibold text-gray-700 mt-6">Complete User Guide</p>
          <p className="text-sm text-gray-400 mt-2">Version 1.0 · March 2026</p>
        </section>

        {/* Table of Contents */}
        <section>
          <h2 className="text-2xl font-bold border-b pb-2 mb-4">📑 Table of Contents</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="space-y-1">
              <p className="font-semibold mt-2">Part 1 — Super Admin</p>
              <p>1.1 Logging In</p>
              <p>1.2 Dashboard Overview</p>
              <p>1.3 Managing Tenants / Hotels</p>
              <p>1.4 Creating a New Hotel</p>
              <p>1.5 Editing Hotel Profiles</p>
              <p>1.6 Restaurant Admins Management</p>
              <p>1.7 Subscription Plans</p>
              <p>1.8 Platform Ads</p>
              <p>1.9 Promotions Overview</p>
              <p>1.10 Leaderboard</p>
              <p>1.11 Landing Page CMS</p>
              <p>1.12 Settings (Tax & Email)</p>
              <p>1.13 System Logs</p>
              <p>1.14 Profile Management</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold mt-2">Part 2 — Restaurant Admin</p>
              <p>2.1 Logging In</p>
              <p>2.2 Admin Dashboard</p>
              <p>2.3 Appearance Studio</p>
              <p>2.4 Menu Management</p>
              <p>2.5 Category Management</p>
              <p>2.6 QR Code Manager</p>
              <p>2.7 Order Management</p>
              <p>2.8 Kitchen Display</p>
              <p>2.9 Billing Counter</p>
              <p>2.10 Offers & Coupons</p>
              <p>2.11 Reviews & Feedback</p>
              <p>2.12 Inventory Management</p>
              <p>2.13 Staff / User Management</p>
              <p>2.14 Settings</p>
              <p className="font-semibold mt-2">Part 3 — Customer Flow</p>
              <p>3.1 Scanning QR Code</p>
              <p>3.2 Browsing the Menu</p>
              <p>3.3 Placing an Order</p>
              <p>3.4 Leaving Feedback</p>
            </div>
          </div>
        </section>

        <div className="border-t-4 border-gray-900 pt-8">
          <h2 className="text-3xl font-black mb-1">PART 1</h2>
          <p className="text-xl text-gray-500 font-light mb-8">Super Admin Guide</p>
        </div>

        {/* 1.1 */}
        <section>
          <h3 className="text-xl font-bold mb-3">1.1 Logging In as Super Admin</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Navigate to <code className="bg-gray-100 px-2 py-0.5 rounded text-sm">/super-admin/login</code></li>
            <li>Enter your Super Admin email and password.</li>
            <li>Click <strong>"Sign In"</strong>. You'll be redirected to the Super Admin Dashboard.</li>
          </ol>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-3 text-sm">
            <strong>Note:</strong> Super Admin accounts are created via the platform's backend function. Contact the platform owner if you need access.
          </div>
        </section>

        {/* 1.2 */}
        <section>
          <h3 className="text-xl font-bold mb-3">1.2 Dashboard Overview</h3>
          <p>The main dashboard provides a bird's-eye view of the entire platform:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Total Tenants</strong> — Number of registered restaurants</li>
            <li><strong>Active Tenants</strong> — Currently active restaurants</li>
            <li><strong>Total Revenue</strong> — Platform-wide revenue summary</li>
            <li><strong>Monthly Trend Chart</strong> — Visual revenue trends over the last 6 months</li>
          </ul>
          <p className="mt-2">The sidebar on the left provides navigation to all modules. Click the <strong>hamburger icon (☰)</strong> to collapse/expand it.</p>
        </section>

        {/* 1.3 */}
        <section>
          <h3 className="text-xl font-bold mb-3">1.3 Managing Tenants / Hotels</h3>
          <p>Navigate to <strong>Tenants / Hotels</strong> from the sidebar.</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Search</strong> — Filter restaurants by name, slug, or email</li>
            <li><strong>View Modes</strong> — Toggle between Table View (📋) and Grid View (⊞)</li>
            <li><strong>Toggle Active/Inactive</strong> — Enable or disable a restaurant instantly</li>
            <li><strong>Change Plan</strong> — Switch between Free, Pro, and Enterprise tiers</li>
            <li><strong>Toggle Ads</strong> — Enable/disable ad display for each restaurant</li>
            <li><strong>View Details</strong> — Open the full hotel profile editor</li>
            <li><strong>Delete</strong> — Permanently remove a restaurant (irreversible)</li>
          </ul>
        </section>

        {/* 1.4 */}
        <section>
          <h3 className="text-xl font-bold mb-3">1.4 Creating a New Hotel</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Go to <strong>Tenants / Hotels</strong></li>
            <li>Click the <strong>"Create Hotel"</strong> button (top right)</li>
            <li>Fill in the required fields:
              <ul className="list-disc pl-6 mt-1">
                <li><strong>Hotel Name</strong> — Display name of the restaurant</li>
                <li><strong>Slug</strong> — Unique URL identifier (auto-generated, editable)</li>
                <li><strong>Admin Email</strong> — Login email for the restaurant admin</li>
                <li><strong>Admin Password</strong> — Initial password (min 6 characters)</li>
                <li><strong>Subscription Plan</strong> — Free, Pro, or Enterprise</li>
              </ul>
            </li>
            <li>Click <strong>"Create Hotel & Admin Account"</strong></li>
            <li>The system will create the restaurant record AND the admin user account automatically.</li>
          </ol>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mt-3 text-sm">
            <strong>Tip:</strong> Share the admin email and password with the restaurant owner so they can log in at <code>/admin/login</code>.
          </div>
        </section>

        {/* 1.5 */}
        <section>
          <h3 className="text-xl font-bold mb-3">1.5 Editing Hotel Profiles</h3>
          <p>Click <strong>"View Details"</strong> on any restaurant to open the profile editor. Editable fields include:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Hotel name, description, address, phone, email</li>
            <li>Logo URL, banner image, cover image</li>
            <li>Primary & secondary brand colors</li>
            <li>Font family selection</li>
            <li>Currency and tax/service charge rates</li>
            <li>Google Review URL for feedback redirection</li>
            <li>Subscription tier and active status</li>
            <li><strong>Feature Controls</strong> — Toggle individual modules (Inventory, Coupons, Offers, etc.)</li>
          </ul>
        </section>

        {/* 1.6 */}
        <section>
          <h3 className="text-xl font-bold mb-3">1.6 Restaurant Admins Management</h3>
          <p>Navigate to <strong>Restaurant Admins</strong> from the sidebar. This table shows all restaurant admin accounts across the platform.</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>View admin name, email, associated restaurant, and status</li>
            <li>Only <code>restaurant_admin</code> roles appear here (sub-staff are hidden)</li>
            <li>Admins are created automatically when you create a hotel</li>
          </ul>
        </section>

        {/* 1.7 */}
        <section>
          <h3 className="text-xl font-bold mb-3">1.7 Subscription Plans</h3>
          <p>Navigate to <strong>Subscription Plans</strong>. Here you can:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>View all plan tiers (Free, Pro, Enterprise)</li>
            <li>Edit monthly/yearly pricing</li>
            <li>Set limits: max tables, max orders/month</li>
            <li>Define features included in each plan</li>
            <li>Activate or deactivate plans</li>
          </ul>
        </section>

        {/* 1.8 */}
        <section>
          <h3 className="text-xl font-bold mb-3">1.8 Platform Ads</h3>
          <p>Manage platform-wide advertisements that appear on customer menus.</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Create Ad</strong> — Title, description, image, CTA, link URL</li>
            <li><strong>Placement Types</strong> — Header banner, category divider, footer promo, popup</li>
            <li><strong>Targeting</strong> — Target specific restaurants, categories, or locations</li>
            <li><strong>Campaign Settings</strong> — Start/end dates, budget, revenue model</li>
            <li><strong>Analytics</strong> — Track impressions and clicks per ad</li>
          </ul>
        </section>

        {/* 1.9 */}
        <section>
          <h3 className="text-xl font-bold mb-3">1.9 Promotions Overview</h3>
          <p>A bird's-eye view of all restaurant promotions across the platform. Each card shows:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Restaurant name and branding</li>
            <li>Subscription tier</li>
            <li>Number of active offers</li>
            <li>Ads enabled/disabled toggle</li>
          </ul>
        </section>

        {/* 1.10–1.14 */}
        <section>
          <h3 className="text-xl font-bold mb-3">1.10 Leaderboard</h3>
          <p>Ranks restaurants by revenue, order count, and average order value. Use this to identify top-performing tenants.</p>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">1.11 Landing Page CMS</h3>
          <p>Edit the public landing page content — hero text, features, testimonials, FAQ, and pricing sections. Changes are reflected immediately on the <code>/</code> route.</p>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">1.12 Settings</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Default Tax Config</strong> — Set GST%, VAT%, service charge%, currency, and tax mode (inclusive/exclusive) as defaults for new restaurants</li>
            <li><strong>Email Templates</strong> — Manage email templates for welcome emails, order confirmations, etc.</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">1.13 System Logs</h3>
          <p>Audit trail of all platform actions — who did what, when, and on which entity. Filterable by action type, actor, and date range.</p>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">1.14 Profile Management</h3>
          <p>Update your Super Admin profile:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Avatar</strong> — WhatsApp-style photo upload. Hover over the avatar and click to change.</li>
            <li><strong>Display Name</strong> — Shown in the sidebar</li>
            <li><strong>Phone</strong> — Contact number</li>
            <li><strong>Theme Preference</strong> — Light/dark mode</li>
          </ul>
        </section>

        {/* PART 2 */}
        <div className="border-t-4 border-gray-900 pt-8 mt-12">
          <h2 className="text-3xl font-black mb-1">PART 2</h2>
          <p className="text-xl text-gray-500 font-light mb-8">Restaurant Admin Guide</p>
        </div>

        <section>
          <h3 className="text-xl font-bold mb-3">2.1 Logging In as Restaurant Admin</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Navigate to <code className="bg-gray-100 px-2 py-0.5 rounded text-sm">/admin/login</code></li>
            <li>Enter the email and password provided by the Super Admin.</li>
            <li>Click <strong>"Sign In"</strong>. First-time users will see the Onboarding wizard.</li>
          </ol>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">2.2 Admin Dashboard</h3>
          <p>The main hub showing real-time statistics for your restaurant:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Today's Orders</strong> — Count and total revenue</li>
            <li><strong>Active Tables</strong> — Currently occupied tables</li>
            <li><strong>Revenue Charts</strong> — Daily/weekly/monthly trends</li>
            <li><strong>Recent Orders</strong> — Latest orders with status pipeline</li>
            <li><strong>Quick Actions</strong> — Jump to Kitchen, Billing, or Menu</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">2.3 Appearance Studio</h3>
          <p>Customize your restaurant's customer-facing branding:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Logo</strong> — Upload your restaurant logo</li>
            <li><strong>Colors</strong> — Primary and secondary brand colors</li>
            <li><strong>Font</strong> — Choose from available font families</li>
            <li><strong>Banner/Cover Images</strong> — Header images for the menu</li>
            <li><strong>Menu Title</strong> — Custom title shown on the digital menu</li>
            <li><strong>Preview</strong> — See changes in real-time before saving</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">2.4 Menu Management</h3>
          <p>Add, edit, and organize your food items:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Add Item</strong> — Name, price, description, category, image</li>
            <li><strong>Tags</strong> — Vegetarian, Vegan, Popular, Spicy Level (1–5)</li>
            <li><strong>Variants</strong> — Size options (Small/Medium/Large) with price differences</li>
            <li><strong>Add-ons</strong> — Extra toppings/sides with pricing</li>
            <li><strong>Availability Toggle</strong> — Show/hide items from the customer menu</li>
            <li><strong>Drag & Drop</strong> — Reorder items within categories</li>
            <li><strong>Prep Time</strong> — Estimated preparation time in minutes</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">2.5 Category Management</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Create categories: Starters, Main Course, Beverages, Desserts, etc.</li>
            <li>Reorder categories by display order</li>
            <li>Add category images for visual navigation</li>
            <li>Toggle active/inactive per category</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">2.6 QR Code Manager</h3>
          <p>Generate and manage QR codes for your tables:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Create QR</strong> — Link a QR code to a specific table or general menu</li>
            <li><strong>Download</strong> — Get printable QR code images</li>
            <li><strong>Scan Analytics</strong> — Track how many times each QR was scanned</li>
            <li><strong>Device & Location data</strong> — See scan patterns</li>
            <li><strong>Expire/Deactivate</strong> — Disable old QR codes</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">2.7 Order Management</h3>
          <p>View and manage all incoming orders:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Status Pipeline</strong> — Pending → Preparing → Ready → Served → Completed</li>
            <li><strong>Order Details</strong> — Items, quantities, special instructions, variants, add-ons</li>
            <li><strong>Cancel Order</strong> — With mandatory reason for audit trail</li>
            <li><strong>Real-time Updates</strong> — Orders appear instantly via live subscriptions</li>
            <li><strong>Order History</strong> — View past orders with filters</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">2.8 Kitchen Display System (KDS)</h3>
          <p>Access via <code>/kitchen</code> route (role-guarded).</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Shows active orders in a card-based Kanban view</li>
            <li>Kitchen staff can mark items as <strong>Preparing → Ready</strong></li>
            <li>Sound notifications for new orders</li>
            <li>Table number and special instructions highlighted</li>
            <li>Timer shows how long each order has been active</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">2.9 Billing Counter</h3>
          <p>Access via <code>/billing</code> route.</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Table Selector</strong> — Pick a table to generate the bill</li>
            <li><strong>Bill Breakdown</strong> — Subtotal, tax, service charge, discounts</li>
            <li><strong>Payment Methods</strong> — Cash, Card, UPI, Split Payment</li>
            <li><strong>Discount Options</strong> — Apply flat or percentage discounts</li>
            <li><strong>Coupon Redemption</strong> — Apply customer coupon codes</li>
            <li><strong>Print Receipt</strong> — Thermal receipt generation (Bluetooth/USB)</li>
            <li><strong>Invoice Generation</strong> — Auto-numbered invoices saved to database</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">2.10 Offers & Coupons</h3>
          <p><strong>Offers:</strong></p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Create promotional offers with images, discount text, and date ranges</li>
            <li>Link offers to specific menu items</li>
            <li>Offers appear in the customer menu's offer slider</li>
          </ul>
          <p className="mt-2"><strong>Coupons:</strong></p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Create coupon codes with percentage or flat discounts</li>
            <li>Set minimum order amount and maximum discount caps</li>
            <li>Set usage limits and expiry dates</li>
            <li>Track usage count</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">2.11 Reviews & Feedback</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>View all customer feedback with star ratings and comments</li>
            <li>Feedback linked to specific orders and tables</li>
            <li>Configure Google Review redirect for high-rating customers (4–5 stars)</li>
            <li>Review Settings allow customizing the feedback threshold</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">2.12 Inventory Management</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Track raw materials with current stock and unit types</li>
            <li>Set low-stock thresholds for alerts</li>
            <li>Recipe Mappings — Link inventory items to menu items with quantity-per-serve</li>
            <li>Stock auto-decrements when orders are placed (if configured)</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">2.13 Staff / User Management</h3>
          <p>Manage your restaurant's team:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Add Staff</strong> — Email, name, and role assignment</li>
            <li><strong>Roles</strong> — Kitchen Staff, Waiter Staff, Billing Staff</li>
            <li><strong>Toggle Active</strong> — Disable staff access without deleting</li>
            <li><strong>Delete Staff</strong> — Remove user completely</li>
          </ul>
          <div className="bg-green-50 border-l-4 border-green-400 p-3 mt-3 text-sm">
            <strong>Role Access:</strong><br />
            • Kitchen Staff → <code>/kitchen</code> (KDS only)<br />
            • Waiter Staff → <code>/waiter</code> (Table & order management)<br />
            • Billing Staff → <code>/billing</code> (Bills & invoices only)
          </div>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">2.14 Settings</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Tax Rate</strong> — GST/VAT percentage</li>
            <li><strong>Service Charge</strong> — Percentage added to bills</li>
            <li><strong>Currency</strong> — ₹, $, €, etc.</li>
            <li><strong>Printer Settings</strong> — Bluetooth/USB thermal printer configuration</li>
            <li><strong>Google Review URL</strong> — Link for feedback redirection</li>
            <li><strong>Google Maps</strong> — Auto-generated "View on Google Maps" link from address</li>
          </ul>
        </section>

        {/* PART 3 */}
        <div className="border-t-4 border-gray-900 pt-8 mt-12">
          <h2 className="text-3xl font-black mb-1">PART 3</h2>
          <p className="text-xl text-gray-500 font-light mb-8">Customer Flow Guide</p>
        </div>

        <section>
          <h3 className="text-xl font-bold mb-3">3.1 Scanning the QR Code</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Customer scans the QR code on their table using their phone camera.</li>
            <li>The QR redirects to the restaurant's branded digital menu.</li>
            <li>Table number is automatically detected from the QR code.</li>
          </ol>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">3.2 Browsing the Menu</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Category slider at the top for quick navigation</li>
            <li>Search bar to find specific items</li>
            <li>Food cards with images, prices, veg/non-veg tags</li>
            <li>Offer banners displayed at the top</li>
            <li>Click any item to see details, variants, and add-ons</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">3.3 Placing an Order</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Tap <strong>"Add"</strong> on desired items (select variants/add-ons if available).</li>
            <li>View cart via the <strong>floating cart bar</strong> at the bottom.</li>
            <li>Add special instructions for any item.</li>
            <li>Optionally enter a coupon code for discounts.</li>
            <li>Enter your name (optional) and tap <strong>"Place Order"</strong>.</li>
            <li>Track order status in real-time: Pending → Preparing → Ready → Served.</li>
            <li>Call waiter anytime using the <strong>"Call Waiter"</strong> button.</li>
          </ol>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">3.4 Leaving Feedback</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>After order completion, a review prompt appears.</li>
            <li>Rate your experience from 1 to 5 stars.</li>
            <li>Add an optional comment.</li>
            <li>If rating is 4–5 stars, you may be redirected to Google Reviews.</li>
          </ol>
        </section>

        {/* Footer */}
        <section className="border-t-2 border-gray-200 pt-8 mt-12 text-center text-sm text-gray-400">
          <p className="font-semibold text-gray-600">Zappy — QR-Based Restaurant Management Platform</p>
          <p className="mt-1">© 2026 Zappy. All rights reserved.</p>
          <p className="mt-1">For support, contact the platform administrator.</p>
        </section>
      </div>
    </div>
  );
};

export default UserGuide;
