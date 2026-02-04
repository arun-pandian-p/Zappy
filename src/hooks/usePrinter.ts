import { useState, useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BluetoothPrinter } from "@/lib/printer/bluetooth";
import { USBPrinter } from "@/lib/printer/usb";
import { ESCPOSBuilder, ReceiptData } from "@/lib/printer/escpos";
import type { Tables, Json } from "@/integrations/supabase/types";

export type PrinterQueue = Tables<"printer_queue">;

type PrinterType = "bluetooth" | "usb" | "none";

interface PrinterState {
  type: PrinterType;
  isConnected: boolean;
  deviceName: string | null;
  isConnecting: boolean;
  error: string | null;
}

export function usePrinter(restaurantId?: string) {
  const [bluetoothPrinter] = useState(() => new BluetoothPrinter());
  const [usbPrinter] = useState(() => new USBPrinter());
  const [state, setState] = useState<PrinterState>({
    type: "none",
    isConnected: false,
    deviceName: null,
    isConnecting: false,
    error: null,
  });

  // Handle disconnect events
  useEffect(() => {
    bluetoothPrinter.setOnDisconnect(() => {
      setState((prev) => ({
        ...prev,
        isConnected: false,
        deviceName: null,
      }));
    });

    usbPrinter.setOnDisconnect(() => {
      setState((prev) => ({
        ...prev,
        isConnected: false,
        deviceName: null,
      }));
    });
  }, [bluetoothPrinter, usbPrinter]);

  // Connect to Bluetooth printer
  const connectBluetooth = useCallback(async () => {
    if (!BluetoothPrinter.isSupported()) {
      setState((prev) => ({
        ...prev,
        error: "Bluetooth is not supported in this browser",
      }));
      return false;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const success = await bluetoothPrinter.connect();
      if (success) {
        setState({
          type: "bluetooth",
          isConnected: true,
          deviceName: bluetoothPrinter.getDeviceName(),
          isConnecting: false,
          error: null,
        });
        return true;
      }
      setState((prev) => ({ ...prev, isConnecting: false }));
      return false;
    } catch (error) {
      setState({
        type: "none",
        isConnected: false,
        deviceName: null,
        isConnecting: false,
        error: (error as Error).message,
      });
      return false;
    }
  }, [bluetoothPrinter]);

  // Connect to USB printer
  const connectUSB = useCallback(async () => {
    if (!USBPrinter.isSupported()) {
      setState((prev) => ({
        ...prev,
        error: "USB is not supported in this browser",
      }));
      return false;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const success = await usbPrinter.connect();
      if (success) {
        setState({
          type: "usb",
          isConnected: true,
          deviceName: usbPrinter.getDeviceName(),
          isConnecting: false,
          error: null,
        });
        return true;
      }
      setState((prev) => ({ ...prev, isConnecting: false }));
      return false;
    } catch (error) {
      setState({
        type: "none",
        isConnected: false,
        deviceName: null,
        isConnecting: false,
        error: (error as Error).message,
      });
      return false;
    }
  }, [usbPrinter]);

  // Disconnect
  const disconnect = useCallback(async () => {
    if (state.type === "bluetooth") {
      await bluetoothPrinter.disconnect();
    } else if (state.type === "usb") {
      await usbPrinter.disconnect();
    }

    setState({
      type: "none",
      isConnected: false,
      deviceName: null,
      isConnecting: false,
      error: null,
    });
  }, [state.type, bluetoothPrinter, usbPrinter]);

  // Print receipt
  const printReceipt = useCallback(
    async (data: ReceiptData, currencySymbol = "₹"): Promise<boolean> => {
      const receiptBytes = ESCPOSBuilder.buildReceipt(data, currencySymbol);

      if (!state.isConnected) {
        // Queue for later printing
        if (restaurantId) {
          await supabase.from("printer_queue").insert([{
            restaurant_id: restaurantId,
            receipt_type: "billing",
            receipt_data: JSON.parse(JSON.stringify(data)),
            status: "pending",
          }]);
        }
        return false;
      }

      try {
        if (state.type === "bluetooth") {
          return await bluetoothPrinter.print(receiptBytes);
        } else if (state.type === "usb") {
          return await usbPrinter.print(receiptBytes);
        }
        return false;
      } catch (error) {
        // Queue on failure
        if (restaurantId) {
          await supabase.from("printer_queue").insert([{
            restaurant_id: restaurantId,
            receipt_type: "billing",
            receipt_data: JSON.parse(JSON.stringify(data)),
            status: "pending",
            error_message: (error as Error).message,
          }]);
        }
        throw error;
      }
    },
    [state, bluetoothPrinter, usbPrinter, restaurantId]
  );

  // Print kitchen order
  const printKitchenOrder = useCallback(
    async (
      orderNumber: string,
      tableNumber: string,
      items: { name: string; quantity: number; notes?: string }[],
      orderId?: string
    ): Promise<boolean> => {
      const orderBytes = ESCPOSBuilder.buildKitchenOrder(
        orderNumber,
        tableNumber,
        items,
        new Date()
      );

      if (!state.isConnected) {
        // Queue for later printing
        if (restaurantId) {
          await supabase.from("printer_queue").insert([{
            restaurant_id: restaurantId,
            order_id: orderId,
            receipt_type: "kitchen",
            receipt_data: JSON.parse(JSON.stringify({ orderNumber, tableNumber, items })),
            status: "pending",
          }]);
        }
        return false;
      }

      try {
        if (state.type === "bluetooth") {
          return await bluetoothPrinter.print(orderBytes);
        } else if (state.type === "usb") {
          return await usbPrinter.print(orderBytes);
        }
        return false;
      } catch (error) {
        // Queue on failure
        if (restaurantId) {
          await supabase.from("printer_queue").insert([{
            restaurant_id: restaurantId,
            order_id: orderId,
            receipt_type: "kitchen",
            receipt_data: JSON.parse(JSON.stringify({ orderNumber, tableNumber, items })),
            status: "pending",
            error_message: (error as Error).message,
          }]);
        }
        throw error;
      }
    },
    [state, bluetoothPrinter, usbPrinter, restaurantId]
  );

  return {
    ...state,
    connectBluetooth,
    connectUSB,
    disconnect,
    printReceipt,
    printKitchenOrder,
    isBluetoothSupported: BluetoothPrinter.isSupported(),
    isUSBSupported: USBPrinter.isSupported(),
  };
}

// Hook to manage printer queue
export function usePrinterQueue(restaurantId?: string) {
  const queryClient = useQueryClient();

  const { data: queue = [], isLoading } = useQuery({
    queryKey: ["printer-queue", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];

      const { data, error } = await supabase
        .from("printer_queue")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as PrinterQueue[];
    },
    enabled: !!restaurantId,
  });

  const markAsPrinted = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("printer_queue")
        .update({ status: "printed", updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["printer-queue", restaurantId] });
    },
  });

  const markAsFailed = useMutation({
    mutationFn: async ({ id, errorMessage }: { id: string; errorMessage: string }) => {
      const { error } = await supabase
        .from("printer_queue")
        .update({
          status: "failed",
          error_message: errorMessage,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["printer-queue", restaurantId] });
    },
  });

  const deleteFromQueue = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("printer_queue").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["printer-queue", restaurantId] });
    },
  });

  return {
    queue,
    isLoading,
    pendingCount: queue.length,
    markAsPrinted,
    markAsFailed,
    deleteFromQueue,
  };
}
