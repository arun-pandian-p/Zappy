import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAtomicBilling } from "./useAtomicBilling";
import { supabase } from "@/integrations/supabase/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: "invoice-123" }, error: null }),
        }),
      }),
    }),
  },
}));

// Mock useAuth hook
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn().mockReturnValue({ user: { id: "user-123" } }),
}));

// Mock rateLimiter
vi.mock("@/utils/rateLimiter", () => ({
  checkRateLimit: vi.fn().mockReturnValue(true),
  getRemainingCooldown: vi.fn().mockReturnValue(30),
  RATE_LIMITS: {
    PAYMENT: { maxAttempts: 3, windowMs: 30000 },
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("useAtomicBilling hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("initializes with 0 offline queue size", () => {
    const { result } = renderHook(() => useAtomicBilling("rest-1"), {
      wrapper: createWrapper(),
    });
    expect(result.current.offlineQueueCount).toBe(0);
    expect(result.current.isProcessing).toBe(false);
  });

  it("successfully completes a billing transaction", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: "invoice-12345",
      error: null,
    });

    const { result } = renderHook(() => useAtomicBilling("rest-1"), {
      wrapper: createWrapper(),
    });

    let invoiceId: string | undefined;
    await act(async () => {
      invoiceId = await result.current.completeBilling.mutateAsync({
        orderId: "order-123",
        paymentMethod: "cash",
        discountAmount: 0,
        totalAmount: 1200,
        customerName: "Rishi",
      });
    });

    expect(invoiceId).toBe("invoice-12345");
    expect(supabase.rpc).toHaveBeenCalledWith("complete_billing_transaction", expect.any(Object));
  });

  it("handles duplicate billing errors from RPC", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: "Invoice already exists for this order", details: "", hint: "", code: "23505" } as any,
    });

    const { result } = renderHook(() => useAtomicBilling("rest-1"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await expect(
        result.current.completeBilling.mutateAsync({
          orderId: "order-123",
          paymentMethod: "cash",
          discountAmount: 0,
          totalAmount: 1200,
        })
      ).rejects.toThrow("DUPLICATE_BILLING");
    });
  });

  it("queues transaction offline when network request throws fetch error", async () => {
    vi.mocked(supabase.rpc).mockRejectedValue(new TypeError("Failed to fetch"));

    const { result } = renderHook(() => useAtomicBilling("rest-1"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await expect(
        result.current.completeBilling.mutateAsync({
          orderId: "order-123",
          paymentMethod: "cash",
          discountAmount: 0,
          totalAmount: 1200,
        })
      ).rejects.toThrow("OFFLINE_QUEUED");
    });

    // Offline queue should have 1 item
    expect(result.current.offlineQueueCount).toBe(1);
    const rawQueue = localStorage.getItem("zappy_offline_billing_queue");
    expect(rawQueue).toContain("order-123");
  });

  it("supports billing fallback method", async () => {
    const { result } = renderHook(() => useAtomicBilling("rest-1"), {
      wrapper: createWrapper(),
    });

    let res: any;
    await act(async () => {
      res = await result.current.completeBillingFallback.mutateAsync({
        orderId: "order-123",
        restaurantId: "rest-1",
        paymentMethod: "cash",
        discountAmount: 0,
        totalAmount: 1200,
        subtotal: 1100,
        taxAmount: 50,
        serviceCharge: 50,
        items: [],
      });
    });

    expect(res).toEqual({ id: "invoice-123" });
    expect(supabase.from).toHaveBeenCalledWith("orders");
    expect(supabase.from).toHaveBeenCalledWith("invoices");
  });
});
