import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({
  value,
  size = 14,
  showValue = true,
  className,
}: {
  value: number;
  size?: number;
  showValue?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm", className)}>
      <Star className="fill-warning text-warning" style={{ width: size, height: size }} />
      {showValue && <span className="font-semibold">{Number(value || 0).toFixed(1)}</span>}
    </span>
  );
}
