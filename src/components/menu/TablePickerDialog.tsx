import { useState } from "react";
import { Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Table } from "@/hooks/useTables";

interface TablePickerDialogProps {
  open: boolean;
  tables: Table[];
  restaurantName: string;
  onSelectTable: (tableNumber: string) => void;
}

export function TablePickerDialog({
  open,
  tables,
  restaurantName,
  onSelectTable,
}: TablePickerDialogProps) {
  const availableTables = tables.filter((t) => t.is_active);

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Grid3X3 className="w-5 h-5 text-primary" />
            Select Your Table
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Welcome to {restaurantName}! Please select your table to start ordering.
          </p>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3 py-2 max-h-[300px] overflow-y-auto">
          {availableTables.map((table) => (
            <Button
              key={table.id}
              variant="outline"
              className="h-16 flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5"
              onClick={() => onSelectTable(table.table_number)}
            >
              <span className="font-bold text-sm">{table.table_number}</span>
              <span className="text-[10px] text-muted-foreground">{table.capacity} seats</span>
            </Button>
          ))}
        </div>
        {availableTables.length === 0 && (
          <p className="text-center text-muted-foreground py-6 text-sm">
            No tables available at the moment.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
