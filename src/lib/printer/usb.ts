/// <reference lib="dom" />

// Web USB API for thermal printer connection

declare global {
  interface Navigator {
    usb: USB;
  }
  
  interface USB {
    requestDevice(options: USBDeviceRequestOptions): Promise<USBDevice>;
    getDevices(): Promise<USBDevice[]>;
    addEventListener(type: "disconnect", listener: (event: USBConnectionEvent) => void): void;
  }
  
  interface USBDeviceRequestOptions {
    filters: USBDeviceFilter[];
  }
  
  interface USBDeviceFilter {
    vendorId?: number;
    productId?: number;
    classCode?: number;
  }
  
  interface USBDevice {
    vendorId: number;
    productId: number;
    productName?: string;
    configuration: USBConfiguration | null;
    opened: boolean;
    open(): Promise<void>;
    close(): Promise<void>;
    selectConfiguration(configurationValue: number): Promise<void>;
    claimInterface(interfaceNumber: number): Promise<void>;
    releaseInterface(interfaceNumber: number): Promise<void>;
    transferOut(endpointNumber: number, data: BufferSource): Promise<USBOutTransferResult>;
  }
  
  interface USBConfiguration {
    interfaces: USBInterface[];
  }
  
  interface USBInterface {
    interfaceNumber: number;
    alternates: USBAlternateInterface[];
  }
  
  interface USBAlternateInterface {
    endpoints: USBEndpoint[];
  }
  
  interface USBEndpoint {
    endpointNumber: number;
    direction: "in" | "out";
    type: "bulk" | "interrupt" | "isochronous";
  }
  
  interface USBOutTransferResult {
    bytesWritten: number;
    status: "ok" | "stall" | "babble";
  }
  
  interface USBConnectionEvent {
    device: USBDevice;
  }
}

export interface USBPrinterDevice {
  device: USBDevice;
  interface: USBInterface;
  endpoint: USBEndpoint;
}

// Common USB printer vendor/product IDs
const KNOWN_PRINTERS = [
  { vendorId: 0x0416, productId: 0x5011 }, // Wincore
  { vendorId: 0x0483, productId: 0x5720 }, // STMicroelectronics
  { vendorId: 0x0525, productId: 0xa4a7 }, // Netchip
  { vendorId: 0x04b8, productId: 0x0e02 }, // Epson
  { vendorId: 0x04b8, productId: 0x0e03 }, // Epson TM-T88
  { vendorId: 0x04b8, productId: 0x0e15 }, // Epson TM-T20
  { vendorId: 0x0dd4, productId: 0x0186 }, // Bixolon
  { vendorId: 0x0fe6, productId: 0x811e }, // Star Micronics
  { vendorId: 0x1504, productId: 0x0006 }, // Citizen
  { vendorId: 0x1fc9, productId: 0x2016 }, // Xprinter
];

export class USBPrinter {
  private device: USBDevice | null = null;
  private interfaceNumber = -1;
  private endpointNumber = -1;
  private isConnected = false;
  private onDisconnect?: () => void;

  static isSupported(): boolean {
    return typeof navigator !== "undefined" && "usb" in navigator;
  }

  async scan(): Promise<USBDevice | null> {
    if (!USBPrinter.isSupported()) {
      throw new Error("Web USB is not supported in this browser");
    }

    try {
      // Request any USB device (printer class = 7)
      const device = await navigator.usb.requestDevice({
        filters: [
          { classCode: 7 }, // Printer class
          ...KNOWN_PRINTERS,
        ],
      });

      return device;
    } catch (error) {
      if ((error as Error).name === "NotFoundError") {
        return null; // User cancelled
      }
      throw error;
    }
  }

  async connect(device?: USBDevice): Promise<boolean> {
    try {
      if (!device) {
        device = await this.scan() ?? undefined;
        if (!device) return false;
      }

      this.device = device;

      // Open device
      await device.open();

      // Find printer interface and endpoint
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }

      // Find interface with bulk OUT endpoint
      for (const iface of device.configuration!.interfaces) {
        for (const alternate of iface.alternates) {
          // Check if it's a printer class interface or has OUT endpoints
          const outEndpoint = alternate.endpoints.find(
            (ep) => ep.direction === "out" && ep.type === "bulk"
          );

          if (outEndpoint) {
            this.interfaceNumber = iface.interfaceNumber;
            this.endpointNumber = outEndpoint.endpointNumber;
            break;
          }
        }
        if (this.interfaceNumber !== -1) break;
      }

      if (this.interfaceNumber === -1) {
        throw new Error("No suitable interface found");
      }

      // Claim interface
      await device.claimInterface(this.interfaceNumber);

      // Set up disconnect handler
      navigator.usb.addEventListener("disconnect", (event) => {
        if (event.device === this.device) {
          this.isConnected = false;
          this.onDisconnect?.();
        }
      });

      this.isConnected = true;
      return true;
    } catch (error) {
      await this.disconnect();
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.device?.opened) {
      try {
        if (this.interfaceNumber !== -1) {
          await this.device.releaseInterface(this.interfaceNumber);
        }
        await this.device.close();
      } catch (error) {
        console.error("Disconnect error:", error);
      }
    }

    this.device = null;
    this.interfaceNumber = -1;
    this.endpointNumber = -1;
    this.isConnected = false;
  }

  async print(data: Uint8Array): Promise<boolean> {
    if (!this.device || !this.isConnected) {
      throw new Error("Printer not connected");
    }

    try {
      // Split data into chunks (max 64KB per transfer)
      const chunkSize = 64 * 1024;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        await this.device.transferOut(this.endpointNumber, chunk);
      }

      return true;
    } catch (error) {
      console.error("Print error:", error);
      throw error;
    }
  }

  getDeviceName(): string | null {
    if (!this.device) return null;
    return this.device.productName || `${this.device.vendorId}:${this.device.productId}`;
  }

  getConnectionStatus(): boolean {
    return this.isConnected && !!this.device?.opened;
  }

  setOnDisconnect(callback: () => void): void {
    this.onDisconnect = callback;
  }

  // Get list of already paired devices
  static async getPairedDevices(): Promise<USBDevice[]> {
    if (!USBPrinter.isSupported()) return [];
    return navigator.usb.getDevices();
  }
}

export default USBPrinter;
