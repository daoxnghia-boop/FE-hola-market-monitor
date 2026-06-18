import { Ticket } from "lucide-react";
import type { Voucher } from "@/lib/mock-data";
import { Button } from "./ui/button";

export function VoucherCard({
  voucher,
  onApply,
  compact = false,
}: {
  voucher: Voucher;
  onApply?: () => void;
  compact?: boolean;
}) {
  return (
    <div className="relative flex overflow-hidden rounded-2xl bg-card shadow-card">
      <div className="flex w-20 shrink-0 flex-col items-center justify-center gap-1 bg-gradient-to-br from-primary to-primary/80 p-3 text-primary-foreground">
        <Ticket className="size-5" />
        <span className="text-center text-xs font-bold leading-tight">
          {voucher.discountText}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-3 p-3">
        <div className="min-w-0 flex-1">
          <h4 className="line-clamp-1 font-semibold">{voucher.title}</h4>
          {!compact && (
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {voucher.description}
            </p>
          )}
          <p className="mt-1 text-[11px] text-muted-foreground">
            HSD: {voucher.expiry} · Mã{" "}
            <span className="font-mono font-semibold text-foreground">
              {voucher.code}
            </span>
          </p>
        </div>
        {onApply && (
          <Button size="sm" variant="outline" onClick={onApply}>
            Dùng
          </Button>
        )}
      </div>
    </div>
  );
}
