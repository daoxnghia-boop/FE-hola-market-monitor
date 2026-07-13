import { Link, useNavigate, useRouterState, Outlet } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard, Store, UtensilsCrossed, ShoppingBag,
  Menu, LogOut, ArrowLeft, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLogout, useSession } from "@/lib/api/hooks";
import { storeRedirectIntent } from "@/lib/redirect";
import { toast } from "sonner";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const NAV: NavItem[] = [
  { to: "/shop-owner", label: "Tổng quan", icon: LayoutDashboard, exact: true },
  { to: "/shop-owner/shops", label: "Gian hàng", icon: Store },
  { to: "/shop-owner/products", label: "Món ăn", icon: UtensilsCrossed },
  { to: "/shop-owner/orders", label: "Đơn hàng", icon: ShoppingBag },
];

function ShopOwnerGuard({ children }: { children: ReactNode }) {
  const session = useSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (session.isLoading) return;
    const user = session.data?.user;
    if (!session.data?.authenticated || !user) {
      storeRedirectIntent(pathname);
      navigate({ to: "/login", replace: true });
      return;
    }
    if (user.status === "blocked") {
      toast.error("Tài khoản của bạn đã bị khóa.");
      navigate({ to: "/forbidden", replace: true });
    }
  }, [session.isLoading, session.data, navigate, pathname]);

  if (session.isLoading || !session.data?.user) {
    return (
      <div className="grid min-h-screen place-items-center bg-muted/30">
        <div className="text-sm text-muted-foreground">Đang tải…</div>
      </div>
    );
  }
  return <>{children}</>;
}

export function ShopOwnerShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = NAV.find((n) => (n.exact ? pathname === n.to : pathname.startsWith(n.to)));
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ShopOwnerGuard>
      <div className="flex min-h-screen bg-muted/30">
        <aside className="hidden w-60 shrink-0 border-r border-border bg-card lg:block">
          <SidebarInner />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card px-4">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <div className="flex h-14 items-center justify-between border-b border-border px-4">
                  <span className="font-bold">HoLa Đối tác</span>
                  <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                    <X className="size-4" />
                  </Button>
                </div>
                <SidebarInner onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
            <h1 className="text-base font-bold sm:text-lg">{current?.label ?? "Đối tác HoLa"}</h1>
            <div className="ml-auto flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link to="/"><ArrowLeft className="size-4" /> Về app</Link>
              </Button>
              <OwnerMenu />
            </div>
          </header>

          <main className="min-w-0 flex-1 p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </ShopOwnerGuard>
  );
}

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex h-full flex-col">
      <div className="hidden h-14 items-center gap-2 border-b border-border px-4 lg:flex">
        <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">🍜</span>
        <span className="font-bold">HoLa Đối tác</span>
      </div>
      <nav className="flex-1 space-y-0.5 p-2">
        {NAV.map((n) => {
          const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
          const Icon = n.icon;
          return (
            <Link
              key={n.to} to={n.to as never} onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {n.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function OwnerMenu() {
  const session = useSession();
  const logout = useLogout();
  const navigate = useNavigate();
  const user = session.data?.user;
  const initials = user?.fullName?.split(" ").map((s) => s[0]).slice(-2).join("").toUpperCase() || "SO";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Avatar className="size-7"><AvatarFallback>{initials}</AvatarFallback></Avatar>
          <span className="hidden sm:inline">{user?.fullName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{user?.fullName}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate({ to: "/account" })}>Tài khoản</DropdownMenuItem>
        <DropdownMenuItem
          onSelect={async () => {
            await logout.mutateAsync();
            navigate({ to: "/login", replace: true });
          }}
        >
          <LogOut className="mr-2 size-4" /> Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
