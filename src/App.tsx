import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Index from "./pages/Index";
import Login from "./pages/Login";
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
import ArchitectureDiagram from "./pages/ArchitectureDiagram";
import Shop from "./pages/Shop";
import ShopProduct from "./pages/ShopProduct";
import { useCartSync } from "./hooks/useCartSync";

const queryClient = new QueryClient();

function CartSyncProvider({ children }: { children: React.ReactNode }) {
  useCartSync();
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CartSyncProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/product/:handle" element={<ShopProduct />} />
          <Route path="/roles" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/super-admin/login" element={<SuperAdminLogin />} />
          <Route path="/admin/login" element={<TenantAdminLogin />} />
          <Route path="/order" element={<CustomerMenu />} />
          <Route path="/feedback" element={<FeedbackPage />} />

          {/* Staff routes */}
          <Route path="/kitchen" element={<KitchenDashboard />} />
          <Route path="/waiter" element={<WaiterDashboard />} />
          <Route path="/billing" element={<BillingCounter />} />

          {/* Admin routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/onboarding" element={<AdminOnboarding />} />
          <Route path="/super-admin" element={<SuperAdminDashboard />} />
          <Route path="/architecture" element={<ArchitectureDiagram />} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </CartSyncProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
