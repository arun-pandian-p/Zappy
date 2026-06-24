import { useQueryClient } from "@tanstack/react-query";
import { SessionLifecycleService } from "@/services/sessionLifecycleService";

interface SessionCleanupParams {
  restaurantId: string;
  tableId: string;
  tableNumber: string;
  tableSessionId: string;
  clearCart: () => void;
  setSeatSessionData: (data: any) => void;
  setDynamicTableId: (id: string) => void;
  setIsSessionEnded: (ended: boolean) => void;
  setSessionFullyEnded: (ended: boolean) => void;
  setCheckoutSummary: (summary: any) => void;
  setCheckoutFlowStep: (step: any) => void;
}

export function useSessionCleanup() {
  const queryClient = useQueryClient();

  const performClientCleanup = (params: SessionCleanupParams) => {
    console.log("[Client Cleanup] Performing customer-side session cleanup...");

    // 1. Clear cart
    params.clearCart();

    // 2. Clear localStorage parameters
    if (params.restaurantId && params.tableNumber) {
      localStorage.removeItem(`zappy_seat_session_${params.restaurantId}_${params.tableNumber}`);
      localStorage.removeItem(`qr_table_${params.restaurantId}`);
    }

    // 3. Clear seat session state
    params.setSeatSessionData(null);
    params.setDynamicTableId("");

    // 4. Remove cached orders and sessions from React Query
    queryClient.removeQueries({ queryKey: ["orders"] });
    queryClient.removeQueries({ queryKey: ["current-seat-occupancy"] });
    queryClient.removeQueries({ queryKey: ["active-table-session"] });
    queryClient.removeQueries({ queryKey: ["table-session-status"] });

    // Keep the current QR URL intact. The locked terminal state is released only
    // when QRRedirect records a new, one-time scan marker.
  };

  const handleEndSessionFlow = async (params: SessionCleanupParams) => {
    // 1. Terminate database session, release seats, and reset table status to needs_cleaning
    if (params.tableSessionId) {
      try {
        await SessionLifecycleService.completeSession({
          sessionId: params.tableSessionId,
          tableId: params.tableId,
          restaurantId: params.restaurantId,
        });
      } catch (err) {
        console.error("[Session Cleanup] Error terminating database session:", err);
        throw err;
      }
    }

    // 2. Perform local client cleanup
    performClientCleanup(params);

    // 3. Update status to fully ended
    sessionStorage.setItem('zappy_session_fully_ended', 'true');
    params.setSessionFullyEnded(true);
  };

  return {
    performClientCleanup,
    handleEndSessionFlow,
  };
}
