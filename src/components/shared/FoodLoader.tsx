import React from "react";
import foodLoaderGif from "@/assets/food-loader.gif";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StopCircle } from "lucide-react";

export interface FoodLoaderProps {
  message?: string;
  subMessage?: string;
  progress?: number;
  onCancel?: () => void;
  cancelLabel?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function FoodLoader({
  message = "Loading delicious menu...",
  subMessage,
  progress,
  onCancel,
  cancelLabel = "Stop Processing",
  size = "md",
  className = "",
}: FoodLoaderProps) {
  const sizeStyles = {
    sm: "w-20 h-16",
    md: "w-32 h-24",
    lg: "w-44 h-32",
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center text-center p-4 space-y-3 ${className}`}>
      <div className="relative group">
        <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-yellow-500/20 rounded-full blur-md opacity-70 group-hover:opacity-100 transition-opacity" />
        <img
          src={foodLoaderGif}
          alt="Loading..."
          className={`${sizeStyles} object-contain relative z-10 drop-shadow-sm select-none pointer-events-none`}
        />
      </div>

      <div className="space-y-1 max-w-sm">
        {message && (
          <p className="font-semibold text-base text-zinc-900 dark:text-zinc-100 tracking-tight">
            {message}
          </p>
        )}
        {subMessage && (
          <p className="text-xs text-muted-foreground font-medium">
            {subMessage}
          </p>
        )}
      </div>

      {typeof progress === "number" && (
        <div className="w-56 mx-auto pt-1">
          <Progress value={progress} className="h-1.5" />
          <span className="text-[10px] text-muted-foreground mt-1 inline-block font-mono">
            {Math.round(progress)}%
          </span>
        </div>
      )}

      {onCancel && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          className="mt-2 text-xs h-7 px-3 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/40 gap-1.5"
        >
          <StopCircle className="w-3.5 h-3.5" />
          {cancelLabel}
        </Button>
      )}
    </div>
  );
}
