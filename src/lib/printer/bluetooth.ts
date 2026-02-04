/// <reference lib="dom" />

// Web Bluetooth API for thermal printer connection

declare global {
  interface Navigator {
    bluetooth: Bluetooth;
  }
  
  interface Bluetooth {
    requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
    getDevices(): Promise<BluetoothDevice[]>;
  }
  
  interface RequestDeviceOptions {
    acceptAllDevices?: boolean;
    optionalServices?: string[];
    filters?: BluetoothLEScanFilter[];
  }
  
  interface BluetoothLEScanFilter {
    name?: string;
    namePrefix?: string;
    services?: string[];
  }
  
  interface BluetoothDevice {
    id: string;
    name?: string;
    gatt?: BluetoothRemoteGATTServer;
    addEventListener(type: "gattserverdisconnected", listener: () => void): void;
  }
  
  interface BluetoothRemoteGATTServer {
    connected: boolean;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
    getPrimaryServices(): Promise<BluetoothRemoteGATTService[]>;
  }
  
  interface BluetoothRemoteGATTService {
    getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
    getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
  }
  
  interface BluetoothRemoteGATTCharacteristic {
    properties: BluetoothCharacteristicProperties;
    writeValue(value: BufferSource): Promise<void>;
    writeValueWithoutResponse(value: BufferSource): Promise<void>;
  }
  
  interface BluetoothCharacteristicProperties {
    write: boolean;
    writeWithoutResponse: boolean;
  }
}

export interface BluetoothPrinterDevice {
  device: BluetoothDevice;
  server: BluetoothRemoteGATTServer;
  characteristic: BluetoothRemoteGATTCharacteristic;
}

// Common Bluetooth printer service UUIDs
const PRINTER_SERVICE_UUIDS = [
  "000018f0-0000-1000-8000-00805f9b34fb", // Generic printer
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2", // ESC/POS
  "49535343-fe7d-4ae5-8fa9-9fafd205e455", // Bluetooth Serial
];

const PRINTER_CHARACTERISTIC_UUIDS = [
  "00002af1-0000-1000-8000-00805f9b34fb", // Write characteristic
  "bef8d6c9-9c21-4c9e-b632-bd58c1009f9f", // ESC/POS write
  "49535343-8841-43f4-a8d4-ecbe34729bb3", // Serial write
];

export class BluetoothPrinter {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private isConnected = false;
  private onDisconnect?: () => void;

  static isSupported(): boolean {
    return typeof navigator !== "undefined" && "bluetooth" in navigator;
  }

  async scan(): Promise<BluetoothDevice | null> {
    if (!BluetoothPrinter.isSupported()) {
      throw new Error("Web Bluetooth is not supported in this browser");
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: PRINTER_SERVICE_UUIDS,
      });

      return device;
    } catch (error) {
      if ((error as Error).name === "NotFoundError") {
        return null; // User cancelled
      }
      throw error;
    }
  }

  async connect(device?: BluetoothDevice): Promise<boolean> {
    try {
      if (!device) {
        device = await this.scan() ?? undefined;
        if (!device) return false;
      }

      this.device = device;

      // Handle disconnection
      device.addEventListener("gattserverdisconnected", () => {
        this.isConnected = false;
        this.onDisconnect?.();
      });

      // Connect to GATT server
      this.server = await device.gatt?.connect() ?? null;
      if (!this.server) {
        throw new Error("Failed to connect to GATT server");
      }

      // Find printer service and characteristic
      for (const serviceUuid of PRINTER_SERVICE_UUIDS) {
        try {
          const service = await this.server.getPrimaryService(serviceUuid);
          
          for (const charUuid of PRINTER_CHARACTERISTIC_UUIDS) {
            try {
              this.characteristic = await service.getCharacteristic(charUuid);
              this.isConnected = true;
              return true;
            } catch {
              continue;
            }
          }

          // Try to get all characteristics and find writable one
          const characteristics = await service.getCharacteristics();
          for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              this.characteristic = char;
              this.isConnected = true;
              return true;
            }
          }
        } catch {
          continue;
        }
      }

      // Try generic approach - get all services
      const services = await this.server.getPrimaryServices();
      for (const service of services) {
        try {
          const characteristics = await service.getCharacteristics();
          for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              this.characteristic = char;
              this.isConnected = true;
              return true;
            }
          }
        } catch {
          continue;
        }
      }

      throw new Error("No writable characteristic found");
    } catch (error) {
      this.disconnect();
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.server?.connected) {
      this.server.disconnect();
    }
    this.device = null;
    this.server = null;
    this.characteristic = null;
    this.isConnected = false;
  }

  async print(data: Uint8Array): Promise<boolean> {
    if (!this.characteristic || !this.isConnected) {
      throw new Error("Printer not connected");
    }

    try {
      // Split data into chunks (max 512 bytes per write for most Bluetooth printers)
      const chunkSize = 512;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        
        if (this.characteristic.properties.writeWithoutResponse) {
          await this.characteristic.writeValueWithoutResponse(chunk);
        } else {
          await this.characteristic.writeValue(chunk);
        }

        // Small delay between chunks
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      return true;
    } catch (error) {
      console.error("Print error:", error);
      throw error;
    }
  }

  getDeviceName(): string | null {
    return this.device?.name ?? null;
  }

  getConnectionStatus(): boolean {
    return this.isConnected && !!this.server?.connected;
  }

  setOnDisconnect(callback: () => void): void {
    this.onDisconnect = callback;
  }
}

export default BluetoothPrinter;
