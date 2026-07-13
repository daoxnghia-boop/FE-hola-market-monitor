import { Ticket } from "lucide-react";
import { formatVND, VOUCHER_STATUS_LABEL } from "@/lib/domain";
import type { VoucherDto, VoucherStatus } from "@/lib/api/types";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<VoucherStatus, string> = {
  usable: "bg-success/15 text-success",
  soon_expire: "bg-warning/15 text-warning",
  used: "bg-muted text-muted-foreground",
  expired: "bg-muted text-muted-foreground",
  locked: "bg-muted text-muted-foreground",
  not_eligible: "bg-muted text-muted-foreground",
  disabled: "bg-muted text-muted-foreground",
};

export function VoucherCard({
  voucher,
  onApply,
  compact = false,
  subtotal = 0,
  active = false,
}: {
  voucher: VoucherDto;
  onApply?: () => void;
  compact?: boolean;
  subtotal?: number;
  active?: boolean;
}) {
  const status = voucher.status;
  const applyable = status === "usable" || status === "soon_expire";

  return (
    <div
      className={cn(
        "relative flex overflow-hidden rounded-2xl bg-card shadow-card transition",
        active && "ring-2 ring-primary",
        !applyable && "opacity-80",
      )}
    >
      <div className="flex w-20 shrink-0 flex-col items-center justify-center gap-1 bg-gradient-to-br from-primary to-primary/80 p-3 text-primary-foreground">
        <Ticket className="size-5" />
        <span className="text-center text-xs font-bold leading-tight">
          {voucher.discountType === "fixed"
            ? `-${formatVND(voucher.discountValue)}`
            : `-${voucher.discountValue}%`}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-3 p-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="line-clamp-1 flex-1 font-semibold">{voucher.title}</h4>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                STATUS_TONE[status],
              )}
            >
              {VOUCHER_STATUS_LABEL[status]}
            </span>
          </div>
          {!compact && (
            <p className="line-clamp-1 text-xs text-muted-foreground">{voucher.description}</p>
          )}
          <p className="mt-1 text-[11px] text-muted-foreground">
            Đơn tối thiểu {formatVND(voucher.minOrderAmount)} · HSD{" "}
            {new Intl.DateTimeFormat("vi-VN").format(new Date(voucher.expiresAt))}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Mã <span className="font-mono font-semibold text-foreground">{voucher.code}</span>
          </p>
        </div>
        {onApply && (
          <Button
            size="sm"
            variant={active ? "default" : "outline"}
            disabled={!applyable}
            onClick={onApply}
          >
            {active ? "Đang dùng" : "Dùng"}
          </Button>
        )}
      </div>
    </div>
  );
}
