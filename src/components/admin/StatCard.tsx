import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: "orange" | "blue" | "green";
  index?: number;
}

const iconColorClasses = {
  orange: "bg-amber-100 text-amber-600",
  blue: "bg-blue-100 text-blue-600",
  green: "bg-emerald-100 text-emerald-600",
};

export function StatCard({ label, value, icon: Icon, iconColor = "orange", index = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="card-hover border-0 shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{label}</p>
              <p className="text-3xl font-bold text-foreground">{value}</p>
            </div>
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", iconColorClasses[iconColor])}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
