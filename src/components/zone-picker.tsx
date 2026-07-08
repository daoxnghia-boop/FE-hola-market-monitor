import { Check, MapPin } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useDeliveryZones, useSetCartZone } from "@/lib/api/hooks";
import { apiErrorMessage } from "@/lib/api/client";
import { formatVND } from "@/lib/domain";
import { useDeliveryZone } from "@/lib/cart-store";
import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

export function ZonePicker({ trigger }: { trigger: ReactNode }) {
  const zone = useDeliveryZone();
  const { data: zones = [], isLoading } = useDeliveryZones();
  const setZone = useSetCartZone();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="text-left">
          <SheetTitle>Chọn khu giao hàng</SheetTitle>
          <SheetDescription>Phí ship tự động cập nhật theo khu bạn chọn.</SheetDescription>
        </SheetHeader>
        <ul className="mt-3 space-y-1.5 pb-4">
          {isLoading && (
            <li className="p-3 text-sm text-muted-foreground">Đang tải khu giao hàng...</li>
          )}
          {!isLoading && zones.length === 0 && (
            <li className="p-3 text-sm text-muted-foreground">Chưa có khu giao hàng khả dụng.</li>
          )}
          {zones.map((z) => {
            const active = zone?.id === z.id;
            return (
              <li key={z.id}>
                <button
                  onClick={() => {
                    setZone.mutate(z.id, {
                      onSuccess: () => {
                        toast.success(`Đã đổi khu: ${z.name}`);
                        setOpen(false);
                      },
                      onError: (error) => toast.error(apiErrorMessage(error)),
                    });
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition",
                    active
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-full",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <MapPin className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{z.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Phí ship từ: {formatVND(z.baseDeliveryFee)}
                    </div>
                  </div>
                  {active && <Check className="size-5 text-primary" />}
                </button>
              </li>
            );
          })}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
