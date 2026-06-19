import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Armchair, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SeatPickerOverlayProps {
  open: boolean;
  tableNumber: string;
  capacity: number;
  /** Tenant logo URL — shown if available */
  logoUrl?: string | null;
  /** Tenant display name */
  restaurantName?: string;
  /** Brand primary color */
  primaryColor?: string;
  /** Occupied seats to disable */
  occupiedSeats?: number[];
  /** Called when user confirms with table + seats — single atomic commit */
  onConfirm: (tableNumber: string, seatNumbers: number[]) => void;
}

export function SeatPickerDialog({
  open,
  tableNumber,
  capacity,
  logoUrl,
  restaurantName,
  primaryColor,
  onConfirm,
  occupiedSeats = [],
}: SeatPickerOverlayProps) {
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [logoFailed, setLogoFailed] = useState(false);

  const accentColor = primaryColor || "#10b981"; // emerald-500 default

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="seat-picker-overlay"
          className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-background px-6"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* ── Tenant Branding ── */}
          <div className="flex flex-col items-center gap-3 mb-8">
            {logoUrl && !logoFailed ? (
              <motion.img
                src={logoUrl}
                alt=""
                className="w-20 h-20 rounded-2xl object-cover shadow-lg border-2"
                style={{ borderColor: `${accentColor}33` }}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35, delay: 0.05 }}
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <motion.div
                className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg border-2 text-3xl font-bold"
                style={{
                  background: `${accentColor}18`,
                  borderColor: `${accentColor}33`,
                  color: accentColor,
                }}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35, delay: 0.05 }}
              >
                {restaurantName ? restaurantName.charAt(0) : "✦"}
              </motion.div>
            )}

            {restaurantName && (
              <motion.h1
                className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.12 }}
              >
                {restaurantName}
              </motion.h1>
            )}

            <motion.p
              className="text-sm text-muted-foreground text-center"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.18 }}
            >
              Welcome! You're at{" "}
              <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                Table {tableNumber}
              </span>
              .
            </motion.p>
          </div>

          {/* ── Seat Selection ── */}
          <motion.div
            className="w-full max-w-xs"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.22 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Armchair className="w-4 h-4" style={{ color: accentColor }} />
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                Select your seat
              </span>
            </div>

            <div
              className="grid gap-3 mb-6"
              style={{
                gridTemplateColumns: `repeat(${Math.min(capacity, 4)}, 1fr)`,
              }}
            >
              {Array.from({ length: capacity }, (_, i) => i + 1).map((seat) => {
                const isOccupied = occupiedSeats.includes(seat);
                const isSelected = selectedSeats.includes(seat);
                return (
                  <motion.button
                    key={seat}
                    whileTap={!isOccupied ? { scale: 0.92 } : undefined}
                    onClick={() => {
                      if (!isOccupied) {
                        setSelectedSeats(prev => 
                          prev.includes(seat) ? prev.filter(s => s !== seat) : [...prev, seat]
                        );
                      }
                    }}
                    disabled={isOccupied}
                    className={`h-16 rounded-2xl flex flex-col items-center justify-center gap-1 border-2 transition-all font-semibold text-sm ${
                      isOccupied
                        ? "bg-zinc-100 dark:bg-zinc-800 border-transparent text-zinc-400 dark:text-zinc-600 cursor-not-allowed opacity-60"
                        : isSelected
                        ? "shadow-md"
                        : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300"
                    }`}
                    style={
                      isSelected && !isOccupied
                        ? {
                            background: `${accentColor}18`,
                            borderColor: accentColor,
                            color: accentColor,
                          }
                        : undefined
                    }
                  >
                    {isSelected && !isOccupied ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Armchair className="w-4 h-4" />
                    )}
                    <span>{seat}</span>
                  </motion.button>
                );
              })}
            </div>

            <Button
              className="w-full h-14 rounded-2xl text-base font-bold transition-all"
              style={
                selectedSeats.length > 0
                  ? { backgroundColor: accentColor, color: "#fff", opacity: 1 }
                  : { opacity: 0.45 }
              }
              disabled={selectedSeats.length === 0}
              onClick={() => selectedSeats.length > 0 && onConfirm(tableNumber, selectedSeats)}
            >
              {selectedSeats.length > 0
                ? `Confirm Seats (${[...selectedSeats].sort((a,b)=>a-b).join(',')})`
                : "Pick a seat to continue"}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
