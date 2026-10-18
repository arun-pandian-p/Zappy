import { describe, it, expect, vi, beforeEach } from "vitest";
import { SessionLifecycleService } from "./sessionLifecycleService";
import { supabase } from "@/integrations/supabase/client";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    }),
  },
}));

describe("SessionLifecycleService - closeSessionIfServedAndPaid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("never closes session if payment is pending or failed", async () => {
    const terminateSpy = vi.spyOn(SessionLifecycleService, "terminateSession");

    // Case 1: payment pending
    const res1 = await SessionLifecycleService.closeSessionIfServedAndPaid({
      orderId: "order-1",
      tableId: "a1b2c3d4-e5f6-4a1b-8c2d-1234567890ab",
      tableSessionId: "b1c2d3e4-f5a6-4b2c-9d3e-2345678901bc",
      restaurantId: "c1d2e3f4-a5b6-4c3d-0e4f-3456789012cd",
      status: "served",
      paymentStatus: "pending",
    });
    expect(res1).toBe(false);
    expect(terminateSpy).not.toHaveBeenCalled();

    // Case 2: payment failed
    const res2 = await SessionLifecycleService.closeSessionIfServedAndPaid({
      orderId: "order-2",
      tableId: "a1b2c3d4-e5f6-4a1b-8c2d-1234567890ab",
      tableSessionId: "b1c2d3e4-f5a6-4b2c-9d3e-2345678901bc",
      restaurantId: "c1d2e3f4-a5b6-4c3d-0e4f-3456789012cd",
      status: "served",
      paymentStatus: "failed",
    });
    expect(res2).toBe(false);
    expect(terminateSpy).not.toHaveBeenCalled();
  });

  it("never closes session if order is not served or completed", async () => {
    const terminateSpy = vi.spyOn(SessionLifecycleService, "terminateSession");

    // Case: paid but still cooking/preparing
    const res = await SessionLifecycleService.closeSessionIfServedAndPaid({
      orderId: "order-3",
      tableId: "a1b2c3d4-e5f6-4a1b-8c2d-1234567890ab",
      tableSessionId: "b1c2d3e4-f5a6-4b2c-9d3e-2345678901bc",
      restaurantId: "c1d2e3f4-a5b6-4c3d-0e4f-3456789012cd",
      status: "preparing",
      paymentStatus: "paid",
    });
    expect(res).toBe(false);
    expect(terminateSpy).not.toHaveBeenCalled();
  });

  it("automatically closes session when order is served AND paid", async () => {
    const terminateSpy = vi.spyOn(SessionLifecycleService, "terminateSession").mockResolvedValue(undefined as any);

    const res = await SessionLifecycleService.closeSessionIfServedAndPaid({
      orderId: "order-4",
      tableId: "a1b2c3d4-e5f6-4a1b-8c2d-1234567890ab",
      tableSessionId: "b1c2d3e4-f5a6-4b2c-9d3e-2345678901bc",
      restaurantId: "c1d2e3f4-a5b6-4c3d-0e4f-3456789012cd",
      status: "served",
      paymentStatus: "paid",
    });

    expect(res).toBe(true);
    expect(terminateSpy).toHaveBeenCalledWith({
      sessionId: "b1c2d3e4-f5a6-4b2c-9d3e-2345678901bc",
      tableId: "a1b2c3d4-e5f6-4a1b-8c2d-1234567890ab",
      restaurantId: "c1d2e3f4-a5b6-4c3d-0e4f-3456789012cd",
      initiatedBy: "customer",
      eventType: "session_closed",
    });
  });

  it("automatically closes session when order is completed AND paid", async () => {
    const terminateSpy = vi.spyOn(SessionLifecycleService, "terminateSession").mockResolvedValue(undefined as any);

    const res = await SessionLifecycleService.closeSessionIfServedAndPaid({
      orderId: "order-5",
      tableId: "a1b2c3d4-e5f6-4a1b-8c2d-1234567890ab",
      seatSessionId: "b1c2d3e4-f5a6-4b2c-9d3e-2345678901bc",
      restaurantId: "c1d2e3f4-a5b6-4c3d-0e4f-3456789012cd",
      status: "completed",
      paymentStatus: "paid",
    });

    expect(res).toBe(true);
    expect(terminateSpy).toHaveBeenCalledWith({
      sessionId: "b1c2d3e4-f5a6-4b2c-9d3e-2345678901bc",
      tableId: "a1b2c3d4-e5f6-4a1b-8c2d-1234567890ab",
      restaurantId: "c1d2e3f4-a5b6-4c3d-0e4f-3456789012cd",
      initiatedBy: "customer",
      eventType: "session_closed",
    });
  });
});
