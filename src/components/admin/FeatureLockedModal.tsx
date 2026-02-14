import { Lock, ArrowUpCircle, Settings, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { LockReason } from "@/hooks/useFeatureGate";

interface FeatureLockedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName: string;
  lockReason: LockReason;
  onGoToSettings?: () => void;
}

export function FeatureLockedModal({
  open,
  onOpenChange,
  featureName,
  lockReason,
  onGoToSettings,
}: FeatureLockedModalProps) {
  if (!lockReason) return null;

  const isPlanLock = lockReason.type === "plan";
  const isAdsToggle = lockReason.type === "ads_toggle";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            {isPlanLock ? (
              <Sparkles className="w-8 h-8 text-primary" />
            ) : (
              <Lock className="w-8 h-8 text-primary" />
            )}
          </div>
          <DialogTitle className="text-xl">
            {isPlanLock
              ? `Unlock ${featureName}`
              : `Enable ${featureName}`}
          </DialogTitle>
          <DialogDescription className="text-base">
            {isPlanLock
              ? `${featureName} requires the ${lockReason.requiredLabel} plan or higher. Upgrade your subscription to access this feature.`
              : `${featureName} is available on your plan but needs to be enabled in your restaurant settings.`}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {isPlanLock && (
            <Button
              className="w-full gap-2"
              onClick={() => {
                onOpenChange(false);
                onGoToSettings?.();
              }}
            >
              <ArrowUpCircle className="w-4 h-4" />
              Upgrade to {lockReason.requiredLabel}
            </Button>
          )}
          {isAdsToggle && (
            <Button
              className="w-full gap-2"
              onClick={() => {
                onOpenChange(false);
                onGoToSettings?.();
              }}
            >
              <Settings className="w-4 h-4" />
              Enable in Settings
            </Button>
          )}
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
