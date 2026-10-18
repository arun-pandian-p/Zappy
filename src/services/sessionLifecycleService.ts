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
    eventType,
  }: {
    sessionId: string;
    tableId: string;
    restaurantId: string;
    initiatedBy?: "customer" | "admin";
    eventType?: "session_closed" | "session_terminated";
  }) {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validSessionUuid = sessionId && UUID_REGEX.test(sessionId) ? sessionId : null;
    const validTableUuid = tableId && UUID_REGEX.test(tableId) ? tableId : null;
    const validRestaurantUuid = restaurantId && UUID_REGEX.test(restaurantId) ? restaurantId : null;

    if (!validSessionUuid && !validTableUuid) return;
    console.log(`[SessionLifecycleService] Terminating session/table for ${restaurantId}...`);

    const terminalEventType = eventType || (initiatedBy === "admin" ? "session_terminated" : "session_closed");

    // 1. Try atomic server-side complete_dining_session RPC
    try {
      const { data: rpcData, error: rpcError } = await (supabase.rpc as any)("complete_dining_session", {
        p_session_id: validSessionUuid,
        p_table_id: validTableUuid,
        p_restaurant_id: validRestaurantUuid,
      });

      if (!rpcError && (rpcData as any)?.success) {
        console.log(`[SessionLifecycleService] Successfully completed session via RPC:`, rpcData);
        if (validRestaurantUuid) {
          await this.broadcastSessionEvent(
            validRestaurantUuid,
            validTableUuid || '',
            validSessionUuid || (rpcData as any)?.session_id || '',
            terminalEventType
          );
        }
        return;
      }
    } catch (rpcErr) {
      console.warn("[SessionLifecycleService] RPC fallback to direct updates:", rpcErr);
    }

    // 2. Direct database updates fallback (safe best-effort)
    if (validSessionUuid && validRestaurantUuid) {
      try {
        await supabase
          .from("table_sessions")
          .update({
            status: "completed",
            completed_at: new Date().toISOString()
          })
          .eq("id", validSessionUuid)
          .eq("restaurant_id", validRestaurantUuid);
      } catch (e) {
        console.warn("[SessionLifecycleService] Direct session update warning:", e);
      }

      await this.releaseSeats(validSessionUuid, validRestaurantUuid).catch(e => console.warn(e));
    }

    // 3. Reset table status to needs_cleaning
    if (validTableUuid && validRestaurantUuid) {
      await supabase
        .from("tables")
        .update({ status: "needs_cleaning" })
        .eq("id", validTableUuid)
        .eq("restaurant_id", validRestaurantUuid)
        .catch(e => console.warn(e));

      // 4. Resolve waiter calls
      await this.resolveWaiterCalls(validTableUuid, validRestaurantUuid).catch(e => console.warn(e));
    }

    // 5. Broadcast the customer/admin-specific terminal event.
    if (validRestaurantUuid) {
      await this.broadcastSessionEvent(
        validRestaurantUuid,
        validTableUuid || '',
        validSessionUuid || '',
        terminalEventType
      ).catch(e => console.warn(e));
    }
  },

  /** Customer-owned End Session wrapper. */
  async completeSession(params: {
    sessionId: string;
    tableId: string;
    restaurantId: string;
  }) {
    return this.terminateSession({ ...params, initiatedBy: "customer", eventType: "session_closed" });
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
      eventType: "session_terminated",
    });
  },

  /**
   * Automatically close session after order is marked Served AND payment is confirmed.
   * Never closes session if payment fails or remains pending.
   */
  async closeSessionIfServedAndPaid({
    orderId,
    tableId,
    tableSessionId,
    seatSessionId,
    restaurantId,
    status,
    paymentStatus,
  }: {
    orderId: string;
    tableId?: string | null;
    tableSessionId?: string | null;
    seatSessionId?: string | null;
    restaurantId: string;
    status?: string | null;
    paymentStatus?: string | null;
  }): Promise<boolean> {
    const isServedOrCompleted = status === "served" || status === "completed";
    const isPaid = paymentStatus === "paid";

    // Strictly enforce that payment must be confirmed and order served
    if (!isServedOrCompleted || !isPaid) {
      console.log(
        `[SessionLifecycleService] Not closing session: order=${orderId}, status=${status}, paymentStatus=${paymentStatus}`
      );
      return false;
    }

    const sessionId = tableSessionId || seatSessionId || "";
    const resolvedTableId = tableId || "";

    if (!sessionId && !resolvedTableId) {
      console.warn("[SessionLifecycleService] Cannot close session: missing sessionId and tableId");
      return false;
    }

    console.log(
      `[SessionLifecycleService] Order ${orderId} is served and paid. Automatically closing session...`
    );

    await this.terminateSession({
      sessionId,
      tableId: resolvedTableId,
      restaurantId,
      initiatedBy: "customer",
      eventType: "session_closed",
    });

    return true;
  }
};
