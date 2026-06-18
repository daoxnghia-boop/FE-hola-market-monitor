import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { cartStore, type CartItem as CartItemT } from "@/lib/cart-store";
import { formatVND, type Product } from "@/lib/mock-data";

export function CartItem({
  item,
}: {
  item: CartItemT & { product: Product };
}) {
  return (
    <div className="flex gap-3 rounded-2xl bg-card p-3 shadow-card">
      <img
        src={item.product.image}
        alt={item.product.name}
        className="size-20 shrink-0 rounded-xl object-cover"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h4 className="line-clamp-1 font-semibold">{item.product.name}</h4>
          <button
            onClick={() => cartStore.remove(item.productId)}
            className="text-muted-foreground hover:text-destructive"
            aria-label="Xóa"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {item.product.description}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="font-bold text-primary">
            {formatVND(item.product.price)}
          </span>
          <div className="flex items-center gap-1 rounded-full border border-border bg-background p-0.5">
            <Button
              size="icon"
              variant="ghost"
              className="size-7 rounded-full"
              onClick={() => cartStore.setQty(item.productId, item.quantity - 1)}
            >
              <Minus />
            </Button>
            <span className="w-6 text-center text-sm font-semibold">
              {item.quantity}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="size-7 rounded-full"
              onClick={() => cartStore.setQty(item.productId, item.quantity + 1)}
            >
              <Plus />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
