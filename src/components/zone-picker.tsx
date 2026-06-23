import { Check, MapPin } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DELIVERY_ZONES, formatVND } from "@/lib/mock-data";
import { cartStore, useDeliveryZone } from "@/lib/cart-store";
import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

export function ZonePicker({ trigger }: { trigger: ReactNode }) {
  const zone = useDeliveryZone();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="text-left">
          <SheetTitle>Chọn khu giao hàng</SheetTitle>
          <SheetDescription>
            Phí ship tự động cập nhật theo khu bạn chọn.
          </SheetDescription>
        </SheetHeader>
        <ul className="mt-3 space-y-1.5 pb-4">
          {DELIVERY_ZONES.map((z) => {
            const active = zone.id === z.id;
            return (
              <li key={z.id}>
                <button
                  onClick={() => {
                    cartStore.setZone(z.id);
                    toast.success(`Đã đổi khu: ${z.name}`);
                    setOpen(false);
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
                      active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <MapPin className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{z.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Phí ship: {formatVND(z.fee)}
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
