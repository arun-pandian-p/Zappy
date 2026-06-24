import { SessionLifecycleService } from "./sessionLifecycleService";

/**
 * Centralized service to handle database-side table session termination and archiving.
 * Delegates to SessionLifecycleService to enforce database constraints and single source of truth.
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
  console.log(`[Session Cleanup Service] Delegating session termination of ${sessionId} to SessionLifecycleService...`);
  await SessionLifecycleService.completeSession({
    sessionId,
    tableId,
    restaurantId,
  });
}
