import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import RoleGuard from "./components/auth/RoleGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          <Route path="/customer-menu" element={<CustomerMenu />} />
          <Route path="/order" element={<CustomerMenu />} />
          <Route path="/feedback" element={<FeedbackPage />} />

          {/* Staff routes — role-guarded */}
          <Route path="/kitchen" element={
            <RoleGuard allowedRoles={['kitchen_staff', 'restaurant_admin']}>
              <KitchenDashboard />
            </RoleGuard>
          } />
          <Route path="/waiter" element={
            <RoleGuard allowedRoles={['waiter_staff', 'restaurant_admin']}>
              <WaiterDashboard />
            </RoleGuard>
          } />
          <Route path="/billing" element={
            <RoleGuard allowedRoles={['billing_staff', 'restaurant_admin']}>
              <BillingCounter />
            </RoleGuard>
          } />

          {/* Admin routes — role-guarded */}
          <Route path="/admin" element={
            <RoleGuard allowedRoles={['restaurant_admin']}>
              <AdminDashboard />
            </RoleGuard>
          } />
          <Route path="/admin/onboarding" element={
            <RoleGuard allowedRoles={['restaurant_admin']}>
              <AdminOnboarding />
            </RoleGuard>
          } />
          <Route path="/super-admin" element={
            <RoleGuard allowedRoles={['super_admin']}>
              <SuperAdminDashboard />
            </RoleGuard>
          } />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
