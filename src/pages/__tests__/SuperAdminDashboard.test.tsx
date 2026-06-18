import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SuperAdminDashboard from "../SuperAdminDashboard";
import { useAuth } from "@/hooks/useAuth";
import { useRestaurants, useUpdateRestaurant, useDeleteRestaurant } from "@/hooks/useRestaurant";
import { invokeFunction } from "@/integrations/supabase/functions";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

// Hoist all mocks so they are available before vi.mock calls are evaluated
const { 
  mockNavigate, 
  mockUseAuth, 
  mockMutateUpdate, 
  mockMutateDelete, 
  mockInvokeFunction 
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockUseAuth: {
    role: "super_admin",
    loading: false,
    impersonateRestaurant: vi.fn(),
  },
  mockMutateUpdate: vi.fn().mockResolvedValue({}),
  mockMutateDelete: vi.fn().mockResolvedValue({}),
  mockInvokeFunction: vi.fn().mockResolvedValue({
    data: {
      credentials: {
        email: "newadmin@test.com",
        username: "newadmin",
        password: "securepassword123",
        login_url: "https://zappy.ind.in/login",
      }
    },
    error: null,
  }),
}));

// Mock react-router-dom
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock useAuth
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth,
}));

// Mock useRestaurant hooks
const mockRestaurantsData = [
  {
    id: "tenant-1",
    name: "Hotel Alpha",
    slug: "hotel-alpha",
    email: "alpha@test.com",
    subscription_tier: "free",
    is_active: true,
    ads_enabled: true,
    created_at: "2026-06-01T00:00:00Z",
  },
  {
    id: "tenant-2",
    name: "Hotel Beta",
    slug: "hotel-beta",
    email: "beta@test.com",
    subscription_tier: "pro",
    is_active: false,
    ads_enabled: false,
    created_at: "2026-06-02T00:00:00Z",
  }
];

vi.mock("@/hooks/useRestaurant", () => ({
  useRestaurants: vi.fn(() => ({
    data: mockRestaurantsData,
    isLoading: false,
  })),
  useUpdateRestaurant: vi.fn(() => ({
    mutateAsync: mockMutateUpdate,
    isPending: false,
  })),
  useDeleteRestaurant: vi.fn(() => ({
    mutateAsync: mockMutateDelete,
    isPending: false,
  })),
  useRestaurantDetails: vi.fn(() => ({
    data: null,
    isLoading: false,
  })),
}));

// Mock supabase Client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn((tableName) => {
      let resolveData: any = [];
      if (tableName === "tables") {
        resolveData = [{ id: "table-1", restaurant_id: "tenant-1" }];
      } else if (tableName === "orders") {
        resolveData = [{ id: "order-1", restaurant_id: "tenant-1", total_amount: 500, created_at: "2026-06-02T12:00:00Z", status: "completed" }];
      } else if (tableName === "order_items") {
        resolveData = [{ name: "Idli", quantity: 2, price: 50 }];
      }
      return {
        select: vi.fn().mockResolvedValue({ data: resolveData, error: null }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      };
    }),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({}),
    })),
    removeChannel: vi.fn(),
  },
}));

// Mock supabase functions
vi.mock("@/integrations/supabase/functions", () => ({
  invokeFunction: mockInvokeFunction,
}));

// Mock recharts
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock UI Components that use radix primitives or are complex in JSDOM
vi.mock("@/components/ui/sidebar", () => ({
  SidebarProvider: ({ children }: any) => <div data-testid="sidebar-provider">{children}</div>,
  SidebarInset: ({ children }: any) => <div data-testid="sidebar-inset">{children}</div>,
  SidebarTrigger: () => <button data-testid="sidebar-trigger">Trigger</button>,
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <select data-testid="mock-select" value={value} onChange={(e) => onValueChange(e.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => (
    <option value={value}>{children}</option>
  ),
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="mock-dropdown">{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div data-testid="mock-dropdown-trigger">{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div data-testid="mock-dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick, className }: any) => (
    <button onClick={onClick} className={className}>{children}</button>
  ),
}));

vi.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ children }: any) => <div data-testid="mock-alert-dialog">{children}</div>,
  AlertDialogTrigger: ({ children }: any) => <div data-testid="mock-alert-trigger">{children}</div>,
  AlertDialogContent: ({ children }: any) => <div data-testid="mock-alert-content">{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: any) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogCancel: ({ children }: any) => <button>Cancel</button>,
  AlertDialogAction: ({ children, onClick, className }: any) => (
    <button onClick={onClick} className={className}>{children}</button>
  ),
}));

vi.mock("@/components/ui/tabs", () => {
  return {
    Tabs: ({ children, value, onValueChange }: any) => {
      const childrenWithProps = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { activeValue: value, onValueChange } as any);
        }
        return child;
      });
      return <div data-testid="tabs">{childrenWithProps}</div>;
    },
    TabsList: ({ children, activeValue, onValueChange }: any) => {
      const childrenWithProps = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { activeValue, onValueChange } as any);
        }
        return child;
      });
      return <div data-testid="tabs-list">{childrenWithProps}</div>;
    },
    TabsTrigger: ({ children, value, activeValue, onValueChange }: any) => (
      <button 
        onClick={() => onValueChange && onValueChange(value)}
        data-active={activeValue === value}
        data-testid={`tab-trigger-${value}`}
      >
        {children}
      </button>
    ),
    TabsContent: ({ children, value, activeValue }: any) => {
      return activeValue === value ? <div data-testid={`tab-content-${value}`}>{children}</div> : null;
    },
  };
});

// Mock other sub-components of SuperAdminDashboard to avoid loading unnecessary details
vi.mock("@/components/superadmin/SuperAdminSidebar", () => ({
  SuperAdminSidebar: ({ activeTab, onTabChange }: any) => (
    <div data-testid="super-admin-sidebar">
      <button onClick={() => onTabChange("dashboard")}>Dashboard Tab</button>
      <button onClick={() => onTabChange("restaurants")}>Restaurants Tab</button>
    </div>
  )
}));

vi.mock("@/components/superadmin/TenantStats", () => ({
  TenantStats: () => <div data-testid="tenant-stats" />
}));

vi.mock("@/components/superadmin/MonthlyTrendChart", () => ({
  MonthlyTrendChart: () => <div data-testid="monthly-trend-chart" />
}));

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("SuperAdminDashboard Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.role = "super_admin";
    mockUseAuth.loading = false;
  });

  it("restricts access and shows access denied for regular users", () => {
    mockUseAuth.role = "restaurant_admin";
    renderWithProviders(<SuperAdminDashboard />);

    expect(screen.getByText("Access Denied")).toBeInTheDocument();
    expect(screen.getByText("You need Super Admin privileges.")).toBeInTheDocument();

    const goLoginBtn = screen.getByRole("button", { name: "Go to Login" });
    fireEvent.click(goLoginBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("renders tenant list successfully when accessed as super_admin", async () => {
    renderWithProviders(<SuperAdminDashboard />);

    // Click on restaurants tab in sidebar
    const restaurantsTabBtn = screen.getByText("Restaurants Tab");
    fireEvent.click(restaurantsTabBtn);

    // Verify restaurant names are displayed in the list/table
    await waitFor(() => {
      expect(screen.getByText("Hotel Alpha")).toBeInTheDocument();
      expect(screen.getByText("Hotel Beta")).toBeInTheDocument();
    });

    // Check slug and email
    expect(screen.getByText("hotel-alpha")).toBeInTheDocument();
    expect(screen.getByText("alpha@test.com")).toBeInTheDocument();
  });

  it("handles tenant creation flow successfully", async () => {
    renderWithProviders(<SuperAdminDashboard />);

    // Navigate to restaurants tab
    const restaurantsTabBtn = screen.getByText("Restaurants Tab");
    fireEvent.click(restaurantsTabBtn);

    // Click "Create Hotel"
    const createHotelBtn = screen.getByRole("button", { name: "Create Hotel" });
    fireEvent.click(createHotelBtn);

    // Identity fields
    const hotelNameInput = screen.getByPlaceholderText("Grand Palace");
    fireEvent.change(hotelNameInput, { target: { value: "Hotel Gamma" } });

    // Switch to credentials tab
    const credentialsTabTrigger = screen.getByTestId("tab-trigger-credentials");
    fireEvent.click(credentialsTabTrigger);

    // Fill in admin email
    const adminEmailInput = screen.getByPlaceholderText("admin@hotel.com");
    fireEvent.change(adminEmailInput, { target: { value: "gamma@test.com" } });

    // Submit
    const submitBtn = screen.getByRole("button", { name: "Create Hotel & Admin" });
    fireEvent.click(submitBtn);

    // Verify invokeFunction called
    await waitFor(() => {
      expect(mockInvokeFunction).toHaveBeenCalled();
    });

    // Verify showing credentials
    expect(screen.getByText("Admin Credentials Created")).toBeInTheDocument();
    expect(screen.getByText("newadmin@test.com")).toBeInTheDocument();
    expect(screen.getByText("securepassword123")).toBeInTheDocument();
  });

  it("handles edit hotel profile and updates successfully", async () => {
    renderWithProviders(<SuperAdminDashboard />);

    // Navigate to restaurants tab
    const restaurantsTabBtn = screen.getByText("Restaurants Tab");
    fireEvent.click(restaurantsTabBtn);

    // Click "View Details" (which is direct because dropdown is mocked)
    const viewDetailsButtons = screen.getAllByText("View Details");
    fireEvent.click(viewDetailsButtons[0]); // Hotel Alpha details

    // Verify edit profile screen renders
    expect(screen.getByText("Tenants / Edit Hotel Profile")).toBeInTheDocument();

    // Find and update a field, let's update address or subdomain
    const subdomainInput = screen.getByDisplayValue("hotel-alpha");
    fireEvent.change(subdomainInput, { target: { value: "hotel-alpha-updated" } });

    // Click "Save Changes"
    const saveChangesBtn = screen.getByRole("button", { name: "Save Changes" });
    fireEvent.click(saveChangesBtn);

    // Verify useUpdateRestaurant mutate was called
    await waitFor(() => {
      expect(mockMutateUpdate).toHaveBeenCalledWith({
        id: "tenant-1",
        updates: expect.objectContaining({
          slug: "hotel-alpha-updated",
        }),
      });
    });
  });

  it("handles tenant deletion successfully", async () => {
    renderWithProviders(<SuperAdminDashboard />);

    // Navigate to restaurants tab
    const restaurantsTabBtn = screen.getByText("Restaurants Tab");
    fireEvent.click(restaurantsTabBtn);

    // Click "Delete" on Hotel Alpha row (direct button in mocked dropdown)
    const deleteButtons = screen.getAllByText("Delete");
    fireEvent.click(deleteButtons[0]);

    // Verify deletion mutation triggered
    await waitFor(() => {
      expect(mockMutateDelete).toHaveBeenCalledWith("tenant-1");
    });
  });
});
