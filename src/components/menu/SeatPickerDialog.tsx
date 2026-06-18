import { useState } from "react";
import { Armchair } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SeatPickerDialogProps {
  open: boolean;
  tableNumber: string;
  capacity: number;
  onSelectSeat: (seatNumber: number) => void;
}

export function SeatPickerDialog({
  open,
  tableNumber,
  capacity,
  onSelectSeat,
}: SeatPickerDialogProps) {
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Armchair className="w-5 h-5 text-primary" />
            Select Your Seat
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Table {tableNumber} has {capacity} seats. Pick yours.
          </p>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-2 py-2">
          {Array.from({ length: capacity }, (_, i) => i + 1).map((seat) => (
            <Button
              key={seat}
              variant={selectedSeat === seat ? "default" : "outline"}
              className="h-14 flex flex-col items-center justify-center gap-0.5"
              onClick={() => setSelectedSeat(seat)}
            >
              <Armchair className="w-4 h-4" />
              <span className="font-bold text-sm">{seat}</span>
            </Button>
          ))}
        </div>
        <Button
          className="w-full mt-2"
          disabled={!selectedSeat}
          onClick={() => selectedSeat && onSelectSeat(selectedSeat)}
        >
          {selectedSeat ? `Confirm Seat ${selectedSeat}` : "Pick a seat"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
