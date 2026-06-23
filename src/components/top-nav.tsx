import { Link, useRouterState } from "@tanstack/react-router";
import { ShoppingBag, MapPin, Bell } from "lucide-react";
import { useCartCount } from "@/lib/cart-store";
import { useUnreadCount } from "@/lib/notifications-store";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Trang chủ", match: (p: string) => p === "/" },
  { to: "/search", label: "Tìm món", match: (p: string) => p.startsWith("/search") },
  { to: "/orders", label: "Đơn hàng", match: (p: string) => p.startsWith("/orders") },
  { to: "/vouchers", label: "Ưu đãi", match: (p: string) => p.startsWith("/vouchers") },
] as const;

export function TopNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const count = useCartCount();
  const unread = useUnreadCount();

  return (
    <header className="sticky top-0 z-30 hidden border-b border-border bg-card/90 backdrop-blur md:block">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-lg text-primary-foreground">
            🍜
          </span>
          <span className="text-lg font-bold">
            Ăn<span className="text-primary">Hòa Lạc</span>
          </span>
        </Link>
        <span className="hidden items-center gap-1 text-sm text-muted-foreground lg:flex">
          <MapPin className="size-4" /> Hòa Lạc, Thạch Thất
        </span>
        <nav className="ml-4 flex items-center gap-1">
          {links.map((l) => {
            const active = l.match(pathname);
            return (
              <Link
                key={l.to}
                to={l.to as never}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/notifications"
            aria-label="Thông báo"
            className="relative grid size-10 place-items-center rounded-full bg-accent text-accent-foreground"
          >
            <Bell className="size-4" />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
            to="/cart"
            className="relative inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold"
          >
            <ShoppingBag className="size-4" />
            Giỏ
            {count > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
          <Link
            to="/account"
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    </header>
  );
}
