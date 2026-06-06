import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePrinter, usePrinterQueue } from "./usePrinter";
import { supabase } from "@/integrations/supabase/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
  },
}));

// Mock Bluetooth and USB printers
vi.mock("@/lib/printer/bluetooth", () => {
  return {
    BluetoothPrinter: class {
      static isSupported = vi.fn().mockReturnValue(true);
      connect = vi.fn().mockResolvedValue(true);
      disconnect = vi.fn().mockResolvedValue(true);
      print = vi.fn().mockResolvedValue(true);
      getDeviceName = vi.fn().mockReturnValue("Test Bluetooth Printer");
      setOnDisconnect = vi.fn();
    },
  };
});

vi.mock("@/lib/printer/usb", () => {
  return {
    USBPrinter: class {
      static isSupported = vi.fn().mockReturnValue(true);
      connect = vi.fn().mockResolvedValue(true);
      disconnect = vi.fn().mockResolvedValue(true);
      print = vi.fn().mockResolvedValue(true);
      getDeviceName = vi.fn().mockReturnValue("Test USB Printer");
      setOnDisconnect = vi.fn();
    },
  };
});

// Mock ESCPOSBuilder
vi.mock("@/lib/printer/escpos", () => ({
  ESCPOSBuilder: {
    buildReceipt: vi.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
    buildKitchenOrder: vi.fn().mockReturnValue(new Uint8Array([4, 5, 6])),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("usePrinter hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
    
    // Mock standard browser print helper
    const mockPrint = vi.fn();
    const mockFocus = vi.fn();
    const mockOpen = vi.fn();
    const mockWrite = vi.fn();
    const mockClose = vi.fn();

    Object.defineProperty(HTMLIFrameElement.prototype, "contentWindow", {
      get: () => ({
        print: mockPrint,
        focus: mockFocus,
        document: {
          open: mockOpen,
          write: mockWrite,
          close: mockClose,
        },
      }),
      configurable: true,
    });
  });

  it("should initialize in disconnected state", () => {
    const { result } = renderHook(() => usePrinter());
    expect(result.current.isConnected).toBe(false);
    expect(result.current.type).toBe("none");
    expect(result.current.deviceName).toBeNull();
  });

  it("should connect to Bluetooth printer", async () => {
    const { result } = renderHook(() => usePrinter());
    let success = false;
    
    await act(async () => {
      success = await result.current.connectBluetooth();
    });

    expect(success).toBe(true);
    expect(result.current.isConnected).toBe(true);
    expect(result.current.type).toBe("bluetooth");
    expect(result.current.deviceName).toBe("Test Bluetooth Printer");
  });

  it("should connect to USB printer", async () => {
    const { result } = renderHook(() => usePrinter());
    let success = false;
    
    await act(async () => {
      success = await result.current.connectUSB();
    });

    expect(success).toBe(true);
    expect(result.current.isConnected).toBe(true);
    expect(result.current.type).toBe("usb");
    expect(result.current.deviceName).toBe("Test USB Printer");
  });

  it("should connect to WiFi printer", async () => {
    const { result } = renderHook(() => usePrinter());
    let success = false;
    
    await act(async () => {
      success = await result.current.connectWiFi("192.168.1.100");
    });

    expect(success).toBe(true);
    expect(result.current.isConnected).toBe(true);
    expect(result.current.type).toBe("wifi");
    expect(result.current.deviceName).toContain("WiFi Printer");
  });

  it("should connect to Browser Window Print", async () => {
    const { result } = renderHook(() => usePrinter());
    let success = false;
    
    await act(async () => {
      success = await result.current.connectWindowPrint();
    });

    expect(success).toBe(true);
    expect(result.current.isConnected).toBe(true);
    expect(result.current.type).toBe("window");
    expect(result.current.deviceName).toBe("Browser Print");
  });

  it("should disconnect and clean state", async () => {
    const { result } = renderHook(() => usePrinter());
    
    await act(async () => {
      await result.current.connectWindowPrint();
    });
    expect(result.current.isConnected).toBe(true);

    await act(async () => {
      await result.current.disconnect();
    });
    expect(result.current.isConnected).toBe(false);
    expect(result.current.type).toBe("none");
  });
});

describe("usePrinterQueue hook", () => {
  it("manages printer queue actions", async () => {
    const { result } = renderHook(() => usePrinterQueue("restaurant-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.pendingCount).toBe(0);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.markAsPrinted).toBeDefined();
    expect(result.current.markAsFailed).toBeDefined();
    expect(result.current.deleteFromQueue).toBeDefined();
  });
});
