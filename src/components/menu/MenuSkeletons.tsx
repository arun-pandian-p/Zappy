import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function FoodCardSkeleton() {
  return (
    <Card className="overflow-hidden border shadow-sm rounded-[20px] bg-white dark:bg-card h-full flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted m-2 rounded-[14px]">
        <Skeleton className="w-full h-full" />
      </div>
      <CardContent className="p-3 pt-1 flex flex-col flex-1 gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <div className="flex items-center justify-between mt-auto pt-1 min-h-[32px]">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-7 w-[60px] rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export function MenuItemRowSkeleton() {
  return (
    <div className="flex gap-4 p-3 bg-card rounded-2xl border shadow-sm">
      <Skeleton className="w-24 h-24 rounded-xl flex-shrink-0" />
      <div className="flex flex-col flex-1 gap-2 py-1">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <div className="flex items-center justify-between mt-auto">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function MenuGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <FoodCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function MenuListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <MenuItemRowSkeleton key={i} />
      ))}
    </div>
  );
}
