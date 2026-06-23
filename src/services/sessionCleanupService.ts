import { supabase } from "@/integrations/supabase/client";

/**
 * Centralized service to handle database-side table session termination and archiving.
 * Safely updates table session status, releases occupied seats, resets table status,
 * resolves pending waiter calls, and broadcasts a realtime session closed event.
 */
export async function terminateTableSessionDb({
  sessionId,
  tableId,
  restaurantId,
}: {
  sessionId: string;
  tableId: string;
  restaurantId: string;
}) {
  if (!sessionId) return;

  console.log(`[Session Cleanup Service] Terminating session ${sessionId} for table ${tableId}...`);

  // 1. Update table session status to 'closed'
  const p1 = supabase
    .from("table_sessions")
    .update({ 
      status: "closed", 
      completed_at: new Date().toISOString() 
    })
    .eq("id", sessionId);

  // 2. Release occupied seats -> update seat_occupancy status to 'vacant'
  const p2 = supabase
    .from("seat_occupancy")
    .update({ status: "vacant" } as any)
    .eq("table_session_id", sessionId);

  // 3. Reset table status to 'needs_cleaning'
  const p3 = tableId
    ? supabase
        .from("tables")
        .update({ status: "needs_cleaning" })
        .eq("id", tableId)
    : Promise.resolve();

  // 4. Resolve any pending waiter calls for this table with reason 'Bill requested' or any customer assistance
  const p4 = tableId
    ? supabase
        .from("waiter_calls")
        .update({ status: "resolved", responded_at: new Date().toISOString() })
        .eq("table_id", tableId)
        .eq("status", "pending")
    : Promise.resolve();

  // 5. Insert realtime event for clients
  const p5 = supabase
    .from("customer_events")
    .insert({
      restaurant_id: restaurantId,
      table_id: tableId || null,
      session_id: sessionId,
      event_type: "session_closed",
      event_data: { message: "Session terminated and closed" }
    });

  // Run all database updates in parallel
  const results = await Promise.allSettled([p1, p2, p3, p4, p5]);
  
  // Log any database operation failures
  results.forEach((res, index) => {
    if (res.status === 'rejected') {
      console.error(`[Session Cleanup Service] Task ${index + 1} failed:`, res.reason);
    }
  });

  console.log(`[Session Cleanup Service] Session ${sessionId} database cleanup completed.`);
}
