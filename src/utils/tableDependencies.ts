import { supabase } from "@/integrations/supabase/client";

export interface TableDependencyCounts {
  reviews: number;
  orders: number;
  sessions: number;
  payments: number; // Stored inside orders table
  analytics: number; // Stored in customer_events or similar
  waiterCalls: number;
  total: number;
}

/**
 * Checks all dependencies in the database for a given table ID.
 * Returns the count of dependent rows in each related table.
 */
export async function checkTableDependencies(tableId: string): Promise<TableDependencyCounts> {
  if (!tableId) {
    return { reviews: 0, orders: 0, sessions: 0, payments: 0, analytics: 0, waiterCalls: 0, total: 0 };
  }

  try {
    const [
      reviewsRes,
      ordersRes,
      sessionsRes,
      feedbackRes,
      eventsRes,
      waiterCallsRes
    ] = await Promise.all([
      // 1. Enterprise Reviews
      supabase
        .from("enterprise_reviews")
        .select("id", { count: "exact", head: true })
        .eq("table_id", tableId),
      
      // 2. Orders & Payments (Orders represent both)
      supabase
        .from("orders")
        .select("id, payment_status", { count: "exact" })
        .eq("table_id", tableId),

      // 3. Table Sessions
      supabase
        .from("table_sessions")
        .select("id", { count: "exact", head: true })
        .eq("table_id", tableId),

      // 4. Feedback
      supabase
        .from("feedback")
        .select("id", { count: "exact", head: true })
        .eq("table_id", tableId),

      // 5. Analytics (Customer Events)
      supabase
        .from("customer_events")
        .select("id", { count: "exact", head: true })
        .eq("table_id", tableId),

      // 6. Waiter Calls
      supabase
        .from("waiter_calls")
        .select("id", { count: "exact", head: true })
        .eq("table_id", tableId)
    ]);

    // Count payments specifically from order payment status
    const ordersData = ordersRes.data || [];
    const paymentsCount = ordersData.filter(o => o.payment_status === "paid").length;
    const ordersCount = ordersRes.count || 0;

    const reviewsCount = (reviewsRes.count || 0) + (feedbackRes.count || 0);
    const sessionsCount = sessionsRes.count || 0;
    const analyticsCount = eventsRes.count || 0;
    const waiterCallsCount = waiterCallsRes.count || 0;

    const total = reviewsCount + ordersCount + sessionsCount + analyticsCount + waiterCallsCount;

    return {
      reviews: reviewsCount,
      orders: ordersCount,
      sessions: sessionsCount,
      payments: paymentsCount,
      analytics: analyticsCount,
      waiterCalls: waiterCallsCount,
      total
    };
  } catch (err) {
    console.error("Error checking table dependencies:", err);
    return { reviews: 0, orders: 0, sessions: 0, payments: 0, analytics: 0, waiterCalls: 0, total: 0 };
  }
}
