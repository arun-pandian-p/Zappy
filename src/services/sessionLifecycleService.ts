import { supabase } from "@/integrations/supabase/client";

export const SessionLifecycleService = {
  /**
   * Release all seats associated with a table session
   */
  async releaseSeats(sessionId: string, restaurantId: string) {
    if (!sessionId) return;
    console.log(`[SessionLifecycleService] Releasing seats for session ${sessionId}...`);
    
    let query = supabase
      .from("seat_occupancy")
      .update({ status: "available", order_id: null } as any)
      .eq("table_session_id", sessionId)
      .eq("restaurant_id", restaurantId);

    const { error } = await query;
    if (error) {
      console.error("[SessionLifecycleService] Error releasing seats:", error);
      throw error;
    }
  },

  /**
   * Resolve all pending waiter calls for a table
   */
  async resolveWaiterCalls(tableId: string, restaurantId: string) {
    if (!tableId) return;
    console.log(`[SessionLifecycleService] Resolving waiter calls for table ${tableId}...`);
    const { error } = await supabase
      .from("waiter_calls")
      .update({ status: "resolved", responded_at: new Date().toISOString() })
      .eq("table_id", tableId)
      .eq("restaurant_id", restaurantId)
      .eq("status", "pending");

    if (error) {
      console.error("[SessionLifecycleService] Error resolving waiter calls:", error);
    }
  },

  /**
   * Broadcast a session closure/termination event via customer_events
   */
  async broadcastSessionEvent(
    restaurantId: string,
    tableId: string,
    sessionId: string,
    eventType: "session_closed" | "session_terminated"
  ) {
    console.log(`[SessionLifecycleService] Broadcasting event ${eventType} for session ${sessionId}...`);
    const { error } = await supabase
      .from("customer_events")
      .insert({
        restaurant_id: restaurantId,
        table_id: tableId || null,
        session_id: sessionId,
        event_type: eventType,
        event_data: { message: eventType === "session_terminated" ? "Session terminated by staff" : "Session completed and closed" }
      });

    if (error) {
      console.error("[SessionLifecycleService] Error broadcasting event:", error);
    }
  },

  /**
   * The single dining-session termination operation. Customer End Session and
   * Admin Kill Session both use this tenant-scoped cleanup path.
   */
  async terminateSession({
    sessionId,
    tableId,
    restaurantId,
    initiatedBy = "customer",
  }: {
    sessionId: string;
    tableId: string;
    restaurantId: string;
    initiatedBy?: "customer" | "admin";
  }) {
    if (!sessionId) return;
    console.log(`[SessionLifecycleService] Terminating ${sessionId} for ${restaurantId}...`);

    // 1. Update session status to completed
    const { error: sessionError } = await supabase
      .from("table_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString()
      })
      .eq("id", sessionId)
      .eq("restaurant_id", restaurantId);

    if (sessionError) {
      console.error("[SessionLifecycleService] Error completing session:", sessionError);
      throw sessionError;
    }

    // 2. Release seats
    await this.releaseSeats(sessionId, restaurantId);

    // 3. Reset table status to needs_cleaning
    if (tableId) {
      await supabase
        .from("tables")
        .update({ status: "needs_cleaning" })
        .eq("id", tableId)
        .eq("restaurant_id", restaurantId);
    }

    // 4. Resolve waiter calls
    if (tableId) {
      await this.resolveWaiterCalls(tableId, restaurantId);
    }

    // 5. Broadcast the customer/admin-specific terminal event.
    await this.broadcastSessionEvent(
      restaurantId,
      tableId,
      sessionId,
      initiatedBy === "admin" ? "session_terminated" : "session_closed"
    );
  },

  /** Customer-owned End Session wrapper. */
  async completeSession(params: {
    sessionId: string;
    tableId: string;
    restaurantId: string;
  }) {
    return this.terminateSession({ ...params, initiatedBy: "customer" });
  },

  /**
   * Force close the session from the Admin/Staff side
   */
  async forceCloseSession({
    sessionId,
    tableId,
    restaurantId,
  }: {
    sessionId: string;
    tableId: string;
    restaurantId: string;
  }) {
    return this.terminateSession({
      sessionId,
      tableId,
      restaurantId,
      initiatedBy: "admin",
    });
  }
};
