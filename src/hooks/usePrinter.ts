import { useState, useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BluetoothPrinter } from "@/lib/printer/bluetooth";
import { USBPrinter } from "@/lib/printer/usb";
import { ESCPOSBuilder, ReceiptData } from "@/lib/printer/escpos";
import type { Tables, Json } from "@/integrations/supabase/types";

export type PrinterQueue = Tables<"printer_queue">;

type PrinterType = "bluetooth" | "usb" | "wifi" | "window" | "none";

interface PrinterState {
  type: PrinterType;
  isConnected: boolean;
  deviceName: string | null;
  isConnecting: boolean;
  error: string | null;
  wifiIp?: string | null;
}

// HTML print helpers for browser window print
function printHTMLViaIframe(htmlContent: string) {
  let iframe = document.getElementById("print-iframe") as HTMLIFrameElement;
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.id = "print-iframe";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
  }

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 500);
  }
}

function generateReceiptHTML(data: ReceiptData, currencySymbol: string): string {
  const itemsHTML = data.items.map(item => `
    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
      <span>${item.quantity}x ${item.name}</span>
      <span>${currencySymbol}${(item.price * item.quantity).toFixed(2)}</span>
    </div>
  `).join('');

  return `
    <html>
      <head>
        <style>
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            color: #000;
            margin: 0;
            padding: 10px;
            width: 80mm;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .border-dashed { border-top: 1px dashed #000; margin: 8px 0; }
          .border-double { border-top: 3px double #000; margin: 8px 0; }
          .flex-between { display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="bold" style="font-size: 16px;">${data.restaurantName}</div>
          ${data.address ? `<div style="font-size: 10px;">${data.address}</div>` : ''}
          ${data.phone ? `<div style="font-size: 10px;">Tel: ${data.phone}</div>` : ''}
        </div>
        <div class="border-dashed"></div>
        <div class="flex-between">
          <span>Date: ${new Date(data.date).toLocaleDateString()}</span>
          <span>Time: ${new Date(data.date).toLocaleTimeString()}</span>
        </div>
        <div class="flex-between">
          <span>Table: ${data.tableNumber}</span>
          <span>Order: #${data.invoiceNumber}</span>
        </div>
        <div class="border-dashed"></div>
        <div class="flex-between bold">
          <span>Qty & Item</span>
          <span>Amount</span>
        </div>
        <div class="border-dashed" style="border-top-style: solid;"></div>
        ${itemsHTML}
        <div class="border-dashed" style="border-top-style: solid;"></div>
        <div class="flex-between">
          <span>Subtotal:</span>
          <span>${currencySymbol}${data.subtotal.toFixed(2)}</span>
        </div>
        <div class="flex-between">
          <span>Tax (${data.taxRate}%):</span>
          <span>${currencySymbol}${data.taxAmount.toFixed(2)}</span>
        </div>
        ${data.serviceCharge > 0 ? `
          <div class="flex-between">
            <span>Service Charge:</span>
            <span>${currencySymbol}${data.serviceCharge.toFixed(2)}</span>
          </div>
        ` : ''}
        ${data.discount && data.discount > 0 ? `
          <div class="flex-between" style="color: green;">
            <span>Discount:</span>
            <span>-${currencySymbol}${data.discount.toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="border-double"></div>
        <div class="flex-between bold" style="font-size: 14px;">
          <span>TOTAL:</span>
          <span>${currencySymbol}${data.total.toFixed(2)}</span>
        </div>
        <div class="border-double"></div>
        <div class="center">
          <span>Payment: ${data.paymentMethod.toUpperCase()}</span>
        </div>
        <div class="border-dashed"></div>
        <div class="center" style="font-size: 10px; margin-top: 10px;">
          <div>${data.footerText || "Thank you for dining with us!"}</div>
          <div>Please visit again</div>
        </div>
      </body>
    </html>
  `;
}

function generateKitchenHTML(
  orderNumber: string,
  tableNumber: string,
  items: { name: string; quantity: number; notes?: string }[],
  timestamp: Date
): string {
  const itemsHTML = items.map(item => `
    <div style="margin-bottom: 6px;">
      <div style="font-weight: bold; font-size: 14px;">${item.quantity}x ${item.name}</div>
      ${item.notes ? `<div style="margin-left: 15px; font-size: 11px;">→ ${item.notes}</div>` : ''}
    </div>
  `).join('');

  return `
    <html>
      <head>
        <style>
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            color: #000;
            margin: 0;
            padding: 10px;
            width: 80mm;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .border-double { border-top: 3px double #000; margin: 8px 0; }
          .flex-between { display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="center bold" style="font-size: 16px;">** KITCHEN ORDER **</div>
        <div class="border-double"></div>
        <div class="flex-between">
          <span class="bold">Order: #${orderNumber}</span>
          <span class="bold">Table: ${tableNumber}</span>
        </div>
        <div class="flex-between">
          <span>Time: ${timestamp.toLocaleTimeString()}</span>
        </div>
        <div class="border-double"></div>
        ${itemsHTML}
        <div class="border-double"></div>
      </body>
    </html>
  `;
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
    wifiIp: null,
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
          wifiIp: null,
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
        wifiIp: null,
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
          wifiIp: null,
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
        wifiIp: null,
      });
      return false;
    }
  }, [usbPrinter]);

  // Connect to WiFi printer
  const connectWiFi = useCallback(async (ip: string) => {
    if (!ip) {
      setState((prev) => ({ ...prev, error: "IP address is required for WiFi printer" }));
      return false;
    }
    setState({
      type: "wifi",
      isConnected: true,
      deviceName: `WiFi Printer (${ip})`,
      isConnecting: false,
      error: null,
      wifiIp: ip,
    });
    return true;
  }, []);

  // Connect to Window Print
  const connectWindowPrint = useCallback(async () => {
    setState({
      type: "window",
      isConnected: true,
      deviceName: "Browser Print",
      isConnecting: false,
      error: null,
      wifiIp: null,
    });
    return true;
  }, []);

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
      wifiIp: null,
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
        } else if (state.type === "wifi") {
          const ip = state.wifiIp || "localhost";
          await fetch(`http://${ip}/print`, {
            method: "POST",
            headers: { "Content-Type": "application/octet-stream" },
            body: receiptBytes,
            mode: "no-cors"
          });
          return true;
        } else if (state.type === "window") {
          const html = generateReceiptHTML(data, currencySymbol);
          printHTMLViaIframe(html);
          return true;
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
        } else if (state.type === "wifi") {
          const ip = state.wifiIp || "localhost";
          await fetch(`http://${ip}/print`, {
            method: "POST",
            headers: { "Content-Type": "application/octet-stream" },
            body: orderBytes,
            mode: "no-cors"
          });
          return true;
        } else if (state.type === "window") {
          const html = generateKitchenHTML(orderNumber, tableNumber, items, new Date());
          printHTMLViaIframe(html);
          return true;
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
    connectWiFi,
    connectWindowPrint,
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
