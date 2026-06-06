import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { checkRateLimit, RATE_LIMITS, getRemainingCooldown } from "@/utils/rateLimiter";

/**
 * Parameters for the atomic billing transaction RPC.
 */
export interface BillingTransactionParams {
  orderId: string;
  paymentMethod: string;
  discountAmount: number;
  totalAmount: number;
  customerName?: string | null;
  customerPhone?: string | null;
  notes?: string | null;
  invoiceNumber?: string | null;
}

/**
 * Offline billing queue entry stored in localStorage.
 */
interface OfflineQueueEntry {
  id: string;
  params: BillingTransactionParams;
  timestamp: number;
  retryCount: number;
}

const OFFLINE_QUEUE_KEY = "zappy_offline_billing_queue";

function getOfflineQueue(): OfflineQueueEntry[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setOfflineQueue(queue: OfflineQueueEntry[]): void {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    console.error("[Billing] Failed to save offline queue to localStorage");
  }
}

function addToOfflineQueue(params: BillingTransactionParams): string {
  const queue = getOfflineQueue();
  const id = crypto.randomUUID();
  queue.push({
    id,
    params,
    timestamp: Date.now(),
    retryCount: 0,
  });
  setOfflineQueue(queue);
  return id;
}

function removeFromOfflineQueue(id: string): void {
  const queue = getOfflineQueue().filter((e) => e.id !== id);
  setOfflineQueue(queue);
}

/**
 * Hook for atomic billing transactions using the `complete_billing_transaction` Postgres RPC.
 * 
 * Features:
 * - Single atomic database transaction (no partial state)
 * - Duplicate billing prevention (unique constraint on invoices.order_id)
 * - Optimistic locking (order version check)
 * - Offline queue with localStorage fallback
 * - Rate limiting (3 attempts per 30s)
 * - Automatic query cache invalidation
 */
export function useAtomicBilling(restaurantId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const completeBilling = useMutation({
    mutationFn: async (params: BillingTransactionParams) => {
      // Rate limit check
      if (!checkRateLimit(`payment_${params.orderId}`, RATE_LIMITS.PAYMENT.maxAttempts, RATE_LIMITS.PAYMENT.windowMs)) {
        const cooldown = getRemainingCooldown(`payment_${params.orderId}`);
        throw new Error(`Payment rate limited. Try again in ${cooldown}s.`);
      }

      try {
        const { data, error } = await supabase.rpc("complete_billing_transaction", {
          p_order_id: params.orderId,
          p_payment_method: params.paymentMethod,
          p_discount_amount: params.discountAmount,
          p_total_amount: params.totalAmount,
          p_customer_name: params.customerName || null,
          p_customer_phone: params.customerPhone || null,
          p_notes: params.notes || null,
          p_invoice_number: params.invoiceNumber || null,
          p_user_id: user?.id || null,
        });

        if (error) {
          // Check for known error types
          if (error.message?.includes("Invoice already exists")) {
            throw new Error("DUPLICATE_BILLING: This order has already been billed.");
          }
          if (error.message?.includes("locked by another")) {
            throw new Error("ORDER_LOCKED: Another staff member is processing this order.");
          }
          if (error.message?.includes("already closed or cancelled")) {
            throw new Error("ORDER_CLOSED: This order is already completed or cancelled.");
          }
          if (error.message?.includes("Order not found")) {
            throw new Error("ORDER_NOT_FOUND: The order could not be found.");
          }
          throw error;
        }

        return data as string; // Returns invoice_id
      } catch (err) {
        // If network error, queue offline
        if (err instanceof TypeError && err.message.includes("fetch")) {
          const queueId = addToOfflineQueue(params);
          throw new Error(`OFFLINE_QUEUED:${queueId}: Payment queued for when connection resumes.`);
        }
        throw err;
      }
    },
    onSuccess: () => {
      // Invalidate all relevant caches atomically
      queryClient.invalidateQueries({ queryKey: ["orders", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["invoices", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["invoices", "today", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["invoices", "stats", restaurantId] });
    },
  });

  /**
   * Process any queued offline billing transactions.
   * Call this when connectivity is restored.
   */
  const processOfflineQueue = async () => {
    const queue = getOfflineQueue();
    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const entry of queue) {
      try {
        await completeBilling.mutateAsync(entry.params);
        removeFromOfflineQueue(entry.id);
        results.push({ id: entry.id, success: true });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        // Don't retry duplicate billing errors
        if (errorMsg.includes("DUPLICATE_BILLING") || errorMsg.includes("ORDER_CLOSED")) {
          removeFromOfflineQueue(entry.id);
          results.push({ id: entry.id, success: false, error: errorMsg });
        } else {
          // Increment retry count
          const updatedQueue = getOfflineQueue().map((e) =>
            e.id === entry.id ? { ...e, retryCount: e.retryCount + 1 } : e
          );
          setOfflineQueue(updatedQueue);
          results.push({ id: entry.id, success: false, error: errorMsg });
        }
      }
    }

    return results;
  };

  /**
   * Fallback billing: uses the old two-step approach if the RPC doesn't exist yet.
   * This allows the app to work before migrations are applied.
   */
  const completeBillingFallback = useMutation({
    mutationFn: async (params: BillingTransactionParams & { 
      restaurantId: string;
      subtotal: number;
      taxAmount: number;
      serviceCharge: number;
      items: Array<{ id: string; name: string; quantity: number; price: number; total: number }>;
    }) => {
      // Step 1: Update order status and payment
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          status: "completed",
          payment_method: params.paymentMethod,
          payment_status: "paid",
        })
        .eq("id", params.orderId);

      if (orderError) throw orderError;

      // Step 2: Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          restaurant_id: params.restaurantId,
          order_id: params.orderId,
          invoice_number: params.invoiceNumber || `INV-${Date.now()}`,
          subtotal: params.subtotal,
          tax_amount: params.taxAmount,
          service_charge: params.serviceCharge,
          discount_amount: params.discountAmount,
          total_amount: params.totalAmount,
          payment_method: params.paymentMethod,
          payment_status: "paid",
          items: params.items as any,
          customer_name: params.customerName,
          customer_phone: params.customerPhone,
          notes: params.notes,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;
      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["invoices", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["invoices", "today", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["invoices", "stats", restaurantId] });
    },
  });

  return {
    completeBilling,
    completeBillingFallback,
    processOfflineQueue,
    offlineQueueCount: getOfflineQueue().length,
    isProcessing: completeBilling.isPending || completeBillingFallback.isPending,
  };
}
