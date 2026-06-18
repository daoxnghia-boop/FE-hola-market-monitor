import { cn } from "@/lib/utils";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/mock-data";

const STYLES: Record<OrderStatus, string> = {
  da_dat: "bg-accent text-accent-foreground",
  cho_quan_xac_nhan: "bg-warning/20 text-warning-foreground",
  quan_da_xac_nhan: "bg-secondary text-secondary-foreground",
  dang_chuan_bi: "bg-primary/15 text-primary",
  dang_giao: "bg-primary text-primary-foreground",
  hoan_thanh: "bg-success/15 text-success",
  da_huy: "bg-destructive/15 text-destructive",
};

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        STYLES[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
