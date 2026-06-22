import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Archive, Trash2, Loader2 } from "lucide-react";
import type { TableDependencyCounts } from "@/utils/tableDependencies";

interface TableDeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tableNumber: string;
  loading: boolean;
  dependencyCounts: TableDependencyCounts | null;
}

export function TableDeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  tableNumber,
  loading,
  dependencyCounts
}: TableDeleteConfirmDialogProps) {
  if (!dependencyCounts) return null;

  const { reviews, orders, sessions, payments, analytics, total } = dependencyCounts;
  const hasDependencies = total > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-6 border-0 shadow-2xl rounded-3xl bg-zinc-950 text-white">
        <DialogHeader className="space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-center tracking-tight">
            {hasDependencies ? "Archive Table?" : "Delete Table?"}
          </DialogTitle>
          <DialogDescription className="text-sm text-zinc-400 text-center">
            {hasDependencies
              ? `Table ${tableNumber} has active history in the system. To prevent breaking reviews or active orders, it will be safely archived instead of deleted.`
              : `Are you sure you want to delete Table ${tableNumber}?`}
          </DialogDescription>
        </DialogHeader>

        {hasDependencies && (
          <div className="my-4 rounded-2xl bg-zinc-900 border border-zinc-800 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Dependency Report</h4>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                <span className="text-zinc-400">Reviews</span>
                <span className="font-semibold text-emerald-400">{reviews}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                <span className="text-zinc-400">Orders</span>
                <span className="font-semibold text-emerald-400">{orders}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                <span className="text-zinc-400">Sessions</span>
                <span className="font-semibold text-emerald-400">{sessions}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                <span className="text-zinc-400">Payments</span>
                <span className="font-semibold text-emerald-400">{payments}</span>
              </div>
              <div className="col-span-2 flex justify-between pt-1">
                <span className="text-zinc-400">Analytics Events</span>
                <span className="font-semibold text-emerald-400">{analytics}</span>
              </div>
            </div>

            <p className="text-xs font-medium text-amber-500/90 text-center pt-2">
              This table has {reviews} reviews and {orders} orders. Archive instead of delete?
            </p>
          </div>
        )}

        <DialogFooter className="flex sm:flex-row gap-2 mt-4">
          <Button
            type="button"
            variant="ghost"
            className="flex-1 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className={`flex-1 rounded-xl font-semibold gap-2 ${
              hasDependencies 
                ? "bg-amber-500 hover:bg-amber-600 text-zinc-950" 
                : "bg-destructive hover:bg-destructive/90 text-white"
            }`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : hasDependencies ? (
              <Archive className="h-4 w-4" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {hasDependencies ? "Archive Table" : "Delete Table"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
