import { motion } from "framer-motion";
import { Bluetooth, Usb, Printer, Unplug, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePrinter, usePrinterQueue } from "@/hooks/usePrinter";

interface PrinterStatusProps {
  restaurantId?: string;
}

export function PrinterStatus({ restaurantId }: PrinterStatusProps) {
  const printer = usePrinter(restaurantId);
  const { pendingCount } = usePrinterQueue(restaurantId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative gap-2"
        >
          {printer.isConnecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : printer.isConnected ? (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2"
            >
              {printer.type === "bluetooth" ? (
                <Bluetooth className="w-4 h-4 text-blue-500" />
              ) : (
                <Usb className="w-4 h-4 text-green-500" />
              )}
              <span className="hidden sm:inline text-xs truncate max-w-24">
                {printer.deviceName || "Connected"}
              </span>
            </motion.div>
          ) : (
            <>
              <Printer className="w-4 h-4 text-muted-foreground" />
              <span className="hidden sm:inline text-xs">Connect Printer</span>
            </>
          )}

          {/* Pending queue indicator */}
          {pendingCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-xs"
            >
              {pendingCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Printer Connection</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {printer.isConnected ? (
          <>
            <div className="px-2 py-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-muted-foreground">Connected via</span>
                <Badge variant="secondary" className="text-xs">
                  {printer.type === "bluetooth" ? "Bluetooth" : "USB"}
                </Badge>
              </div>
              {printer.deviceName && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {printer.deviceName}
                </p>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={printer.disconnect}
              className="text-destructive focus:text-destructive"
            >
              <Unplug className="w-4 h-4 mr-2" />
              Disconnect
            </DropdownMenuItem>
          </>
        ) : (
          <>
            {printer.error && (
              <div className="px-2 py-2 flex items-start gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="text-xs">{printer.error}</span>
              </div>
            )}

            <DropdownMenuItem
              onClick={printer.connectBluetooth}
              disabled={!printer.isBluetoothSupported || printer.isConnecting}
            >
              <Bluetooth className="w-4 h-4 mr-2 text-blue-500" />
              Connect Bluetooth
              {!printer.isBluetoothSupported && (
                <span className="ml-auto text-xs text-muted-foreground">
                  N/A
                </span>
              )}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={printer.connectUSB}
              disabled={!printer.isUSBSupported || printer.isConnecting}
            >
              <Usb className="w-4 h-4 mr-2 text-green-500" />
              Connect USB
              {!printer.isUSBSupported && (
                <span className="ml-auto text-xs text-muted-foreground">
                  N/A
                </span>
              )}
            </DropdownMenuItem>
          </>
        )}

        {pendingCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pending prints</span>
                <Badge variant="outline">{pendingCount}</Badge>
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default PrinterStatus;
