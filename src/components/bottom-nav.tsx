import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, ShoppingBag, Receipt, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartCount } from "@/lib/cart-store";

type NavItem = {
  to: string;
  label: string;
  icon: typeof Home;
  match: (p: string) => boolean;
  badge?: boolean;
};

const items: NavItem[] = [
  { to: "/", label: "Trang chủ", icon: Home, match: (p) => p === "/" },
  { to: "/search", label: "Tìm kiếm", icon: Search, match: (p) => p.startsWith("/search") },
  { to: "/cart", label: "Giỏ hàng", icon: ShoppingBag, match: (p) => p.startsWith("/cart"), badge: true },
  { to: "/orders", label: "Đơn hàng", icon: Receipt, match: (p) => p.startsWith("/orders") },
  { to: "/account", label: "Tài khoản", icon: User, match: (p) => p.startsWith("/account") },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const count = useCartCount();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {items.map((it) => {
          const active = it.match(pathname);
          const Icon = it.icon;
          return (
            <li key={it.to}>
              <Link
                to={it.to as never}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span className="relative">
                  <Icon className="size-5" />
                  {it.badge && count > 0 && (
                    <span className="absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                      {count}
                    </span>
                  )}
                </span>
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
