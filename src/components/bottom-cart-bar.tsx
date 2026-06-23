import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { useCart, useCartSubtotal } from "@/lib/cart-store";
import { formatVND } from "@/lib/mock-data";

/**
 * Sticky bottom cart bar — sits above the bottom navigation on mobile.
 * Hidden when cart is empty.
 */
export function BottomCartBar({ to = "/cart" as const }: { to?: "/cart" | "/checkout" }) {
  const cart = useCart();
  const subtotal = useCartSubtotal();
  const count = cart.items.reduce((s, i) => s + i.quantity, 0);

  if (count === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-16 z-30 px-3 md:bottom-6">
      <Link
        to={to}
        className="pointer-events-auto mx-auto flex max-w-md items-center justify-between gap-3 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-pop transition hover:bg-primary/90"
      >
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          <span className="relative">
            <ShoppingBag className="size-5" />
            <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-warning px-1 text-[10px] font-bold text-warning-foreground">
              {count}
            </span>
          </span>
          {count} món · {formatVND(subtotal)}
        </span>
        <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-bold">
          Xem giỏ
        </span>
      </Link>
    </div>
  );
}
