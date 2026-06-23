import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cartStore } from "@/lib/cart-store";
import { formatVND, type Product } from "@/lib/mock-data";
import { toast } from "sonner";

export function ProductSheet({
  product,
  open,
  onOpenChange,
  canOrder = true,
}: {
  product: Product | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  canOrder?: boolean;
}) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  // reset whenever product changes
  if (product && open && qty < 1) setQty(1);

  const handleAdd = () => {
    if (!product) return;
    cartStore.add(product.id, qty, note.trim() || undefined);
    toast.success(`Đã thêm ${qty} × ${product.name}`);
    onOpenChange(false);
    setQty(1);
    setNote("");
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setQty(1);
          setNote("");
        }
      }}
    >
      <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-3xl p-0">
        {product && (
          <>
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
              <img
                src={product.image}
                alt={product.name}
                className="size-full object-cover"
              />
              {!product.available && (
                <div className="absolute inset-0 grid place-items-center bg-foreground/60 text-base font-semibold text-background">
                  Hết món
                </div>
              )}
            </div>
            <div className="space-y-4 px-4 pb-4 pt-4">
              <SheetHeader className="space-y-1 text-left">
                <SheetTitle className="text-lg">{product.name}</SheetTitle>
                <p className="text-sm text-muted-foreground">
                  {product.description}
                </p>
              </SheetHeader>
              <div className="flex items-center justify-between">
                <span className="text-xl font-extrabold text-primary">
                  {formatVND(product.price)}
                </span>
                <div className="flex items-center gap-1 rounded-full border border-border bg-background p-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 rounded-full"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                  >
                    <Minus />
                  </Button>
                  <span className="w-8 text-center font-bold">{qty}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 rounded-full"
                    onClick={() => setQty((q) => q + 1)}
                  >
                    <Plus />
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Ghi chú cho quán</label>
                <Textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: ít cay, không hành, thêm cơm..."
                />
              </div>
              <Button
                className="h-12 w-full rounded-full text-base font-bold"
                onClick={handleAdd}
                disabled={!product.available || !canOrder}
              >
                {!product.available
                  ? "Món đã hết"
                  : !canOrder
                    ? "Quán chưa nhận đặt"
                    : `Thêm vào giỏ · ${formatVND(product.price * qty)}`}
              </Button>
            </div>
            <div className="h-[env(safe-area-inset-bottom)]" />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
