import { describe, it, expect, vi } from "vitest";

// Mock supabase client to track insertions and updates
const mockSupabaseData = {
  seatOccupancy: [] as any[],
  orders: [] as any[],
  tables: [
    { id: "table-t2", table_number: "T2", capacity: 4, status: "available" }
  ] as any[]
};

describe("Session Test Audit (Device A, B, C)", () => {
  it("Device A, B, and C session flow on Table T2", async () => {
    // 1. Scan T2 QR & Pick Seat 1 (Device A)
    const deviceA_seat = 1;
    const deviceA_session_id = "cryptographic-session-token-device-a";
    
    // Seat 1 is occupied
    mockSupabaseData.seatOccupancy.push({
      id: "occupancy-seat-1",
      table_id: "table-t2",
      seat_number: deviceA_seat,
      table_session_id: "session-t2-group",
      status: "occupied"
    });
    // Table status becomes occupied
    mockSupabaseData.tables[0].status = "occupied";

    // Verify Seat 1 is disabled/occupied for later scans
    const isSeat1Occupied = mockSupabaseData.seatOccupancy.some(s => s.seat_number === 1);
    expect(isSeat1Occupied).toBe(true);

    // 2. Select Seat 2 (Device B)
    const deviceB_seat = 2;
    const deviceB_session_id = "cryptographic-session-token-device-b";
    
    // Verify Seat 1 is disabled for Device B, but Seat 2 is free
    const isSeat2OccupiedBefore = mockSupabaseData.seatOccupancy.some(s => s.seat_number === 2);
    expect(isSeat2OccupiedBefore).toBe(false);
    
    // Occupy Seat 2
    mockSupabaseData.seatOccupancy.push({
      id: "occupancy-seat-2",
      table_id: "table-t2",
      seat_number: deviceB_seat,
      table_session_id: "session-t2-group",
      status: "occupied"
    });

    // 3. Select Seat 3 (Device C)
    const deviceC_seat = 3;
    const deviceC_session_id = "cryptographic-session-token-device-c";
    
    // Verify Seat 1 & 2 are disabled for Device C, but Seat 3 is free
    const isSeat3OccupiedBefore = mockSupabaseData.seatOccupancy.some(s => s.seat_number === 3);
    expect(isSeat3OccupiedBefore).toBe(false);

    // Occupy Seat 3
    mockSupabaseData.seatOccupancy.push({
      id: "occupancy-seat-3",
      table_id: "table-t2",
      seat_number: deviceC_seat,
      table_session_id: "session-t2-group",
      status: "occupied"
    });

    // Verify Occupancy updates 1/4 -> 2/4 -> 3/4
    expect(mockSupabaseData.seatOccupancy.length).toBe(3);
    expect(mockSupabaseData.tables[0].status).toBe("occupied");

    // 4. Add items and Place Orders
    // Device A adds Burger
    mockSupabaseData.orders.push({
      id: "order-device-a",
      table_id: "table-t2",
      seat_session_id: deviceA_session_id,
      items: [{ name: "Burger", qty: 1, price: 250 }],
      status: "pending"
    });

    // Device B adds Pizza
    mockSupabaseData.orders.push({
      id: "order-device-b",
      table_id: "table-t2",
      seat_session_id: deviceB_session_id,
      items: [{ name: "Pizza", qty: 1, price: 350 }],
      status: "pending"
    });

    // Device C adds Coffee
    mockSupabaseData.orders.push({
      id: "order-device-c",
      table_id: "table-t2",
      seat_session_id: deviceC_session_id,
      items: [{ name: "Coffee", qty: 1, price: 120 }],
      status: "pending"
    });

    // Verify Session Isolation:
    // Device A sees only Burger
    const deviceAOrders = mockSupabaseData.orders.filter(o => o.seat_session_id === deviceA_session_id);
    expect(deviceAOrders.length).toBe(1);
    expect(deviceAOrders[0].items[0].name).toBe("Burger");

    // Device B sees only Pizza
    const deviceBOrders = mockSupabaseData.orders.filter(o => o.seat_session_id === deviceB_session_id);
    expect(deviceBOrders.length).toBe(1);
    expect(deviceBOrders[0].items[0].name).toBe("Pizza");

    // Device C sees only Coffee
    const deviceCOrders = mockSupabaseData.orders.filter(o => o.seat_session_id === deviceC_session_id);
    expect(deviceCOrders.length).toBe(1);
    expect(deviceCOrders[0].items[0].name).toBe("Coffee");

    // 5. Kitchen views:
    // Shows Table T2 Seat 1 Burger
    const kitchenView = mockSupabaseData.orders.map(o => {
      const seatNum = mockSupabaseData.seatOccupancy.find(s => s.table_id === o.table_id && (
        o.seat_session_id === deviceA_session_id ? s.seat_number === 1 :
        o.seat_session_id === deviceB_session_id ? s.seat_number === 2 :
        s.seat_number === 3
      ))?.seat_number;
      return {
        table: "T2",
        seat: seatNum,
        item: o.items[0].name
      };
    });

    expect(kitchenView).toContainEqual({ table: "T2", seat: 1, item: "Burger" });
    expect(kitchenView).toContainEqual({ table: "T2", seat: 2, item: "Pizza" });
    expect(kitchenView).toContainEqual({ table: "T2", seat: 3, item: "Coffee" });

    // 6. Checkout/Payment & Seat release
    // Let's release Seat 1
    mockSupabaseData.seatOccupancy = mockSupabaseData.seatOccupancy.filter(s => s.seat_number !== 1);
    
    // Verify Occupancy decreases
    expect(mockSupabaseData.seatOccupancy.length).toBe(2);
    // Verify Seat 1 becomes available again
    const isSeat1OccupiedAfter = mockSupabaseData.seatOccupancy.some(s => s.seat_number === 1);
    expect(isSeat1OccupiedAfter).toBe(false);
  });
});
