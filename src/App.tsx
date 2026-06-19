import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import LandingPage from "./pages/LandingPage";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import TenantAdminLogin from "./pages/TenantAdminLogin";
import CustomerMenu from "./pages/CustomerMenu";
import KitchenDashboard from "./pages/KitchenDashboard";
import WaiterDashboard from "./pages/WaiterDashboard";
import BillingCounter from "./pages/BillingCounter";
import AdminDashboard from "./pages/AdminDashboard";
import AdminOnboarding from "./pages/AdminOnboarding";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import FeedbackPage from "./pages/FeedbackPage";
import NotFound from "./pages/NotFound";
import UserGuide from "./pages/UserGuide";
import RequestQuote from "./pages/RequestQuote";
import QRRedirect from "./pages/QRRedirect";
import RoleGuard from "./components/auth/RoleGuard";
import { ImpersonationBanner } from "./components/superadmin/ImpersonationBanner";

// SEO Landing Pages
import MenuOCR from "./pages/landing/MenuOCR";
import RestaurantMenuManagement from "./pages/landing/RestaurantMenuManagement";
import DigitalMenuSoftware from "./pages/landing/DigitalMenuSoftware";
import RestaurantOCR from "./pages/landing/RestaurantOCR";
import AIFoodImages from "./pages/landing/AIFoodImages";
import QRMenuGenerator from "./pages/landing/QRMenuGenerator";

// Blog
import BlogIndex from "./pages/blog/BlogIndex";
import BlogPost from "./pages/blog/BlogPost";

const queryClient = new QueryClient();

import { ErrorBoundary } from "./components/ErrorBoundary";

// Redirect from zappy.ind.in to www.zappy.ind.in
if (typeof window !== "undefined" && 
    window.location.hostname === "zappy.ind.in") {
  window.location.replace(`https://www.zappy.ind.in${window.location.pathname}${window.location.search}`);
}

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ImpersonationBanner />
          <Toaster />
          <Sonner />
          <Analytics />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/roles" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/super-admin/login" element={<SuperAdminLogin />} />
              <Route path="/admin/login" element={<TenantAdminLogin />} />
              <Route path="/tenant-admin/login" element={<TenantAdminLogin />} />
              <Route path="/customer-menu" element={<ErrorBoundary><CustomerMenu /></ErrorBoundary>} />
              <Route path="/order" element={<ErrorBoundary><CustomerMenu /></ErrorBoundary>} />
              <Route path="/menu" element={<ErrorBoundary><CustomerMenu /></ErrorBoundary>} />
              <Route path="/feedback" element={<FeedbackPage />} />
              <Route path="/guide" element={<UserGuide />} />
              <Route path="/request-quote" element={<RequestQuote />} />
              <Route path="/r/:id" element={<QRRedirect />} />

              {/* SEO Landing Routes */}
              <Route path="/menu-ocr" element={<MenuOCR />} />
              <Route path="/restaurant-menu-management" element={<RestaurantMenuManagement />} />
              <Route path="/digital-menu-software" element={<DigitalMenuSoftware />} />
              <Route path="/restaurant-ocr" element={<RestaurantOCR />} />
              <Route path="/ai-food-images" element={<AIFoodImages />} />
              <Route path="/qr-menu-generator" element={<QRMenuGenerator />} />

              {/* Blog Routes */}
              <Route path="/blog" element={<BlogIndex />} />
              <Route path="/blog/:slug" element={<BlogPost />} />

            {/* Staff routes — role-guarded */}
            <Route path="/kitchen" element={
              <RoleGuard allowedRoles={['kitchen_staff', 'restaurant_admin']}>
                <ErrorBoundary><KitchenDashboard /></ErrorBoundary>
              </RoleGuard>
            } />
            <Route path="/waiter" element={
              <RoleGuard allowedRoles={['waiter_staff', 'restaurant_admin']}>
                <ErrorBoundary><WaiterDashboard /></ErrorBoundary>
              </RoleGuard>
            } />
            <Route path="/billing" element={
              <RoleGuard allowedRoles={['billing_staff', 'restaurant_admin']}>
                <ErrorBoundary><BillingCounter /></ErrorBoundary>
              </RoleGuard>
            } />

            {/* Admin routes — role-guarded */}
            <Route path="/admin" element={
              <RoleGuard allowedRoles={['restaurant_admin']}>
                <ErrorBoundary><AdminDashboard /></ErrorBoundary>
              </RoleGuard>
            } />
            <Route path="/admin/onboarding" element={
              <RoleGuard allowedRoles={['restaurant_admin']}>
                <ErrorBoundary><AdminOnboarding /></ErrorBoundary>
              </RoleGuard>
            } />
            <Route path="/super-admin" element={
              <RoleGuard allowedRoles={['super_admin']}>
                <ErrorBoundary><SuperAdminDashboard /></ErrorBoundary>
              </RoleGuard>
            } />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
