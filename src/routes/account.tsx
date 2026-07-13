import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Receipt,
  Ticket,
  MapPin,
  LogIn,
  LogOut,
  ShieldCheck,
  Bell,
  Heart,
  User,
  Store,
  Plus,
  ChevronRight,
} from "lucide-react";
import { useAddresses, useLogout, useOwnerShops, useSession } from "@/lib/api/hooks";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Tài khoản — HoLa Market" }] }),
  component: AccountPage,
});

function AccountPage() {
  const session = useSession();
  const addresses = useAddresses();
  const logout = useLogout();
  const navigate = useNavigate();
  const user = session.data?.user;
  const authed = !!user;
  const isAdmin = user?.role === "admin";
  const ownerShops = useOwnerShops();
  const shops = authed ? (ownerShops.data ?? []) : [];

  const doLogout = async () => {
    await logout.mutateAsync();
    navigate({ to: "/", replace: true });
  };

  return (
    <AppShell>
      <div className="px-4 py-6">
        <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground shadow-card">
          <div className="grid size-14 place-items-center overflow-hidden rounded-full bg-white/20 text-2xl">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              "🙋"
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-extrabold">
                {session.isLoading ? "Đang tải..." : user?.fullName || "Khách Hòa Lạc"}
              </span>
              {isAdmin && (
                <Badge variant="secondary" className="gap-1">
                  <ShieldCheck className="size-3" /> Admin
                </Badge>
              )}
            </div>
            <div className="text-xs opacity-90">
              {user?.phone || "Đăng nhập để lưu địa chỉ, đơn hàng và ưu đãi"}
            </div>
            {user?.email && <div className="text-xs opacity-90">{user.email}</div>}
          </div>
          {!authed && (
            <Button asChild variant="secondary" size="sm" className="rounded-full">
              <Link to="/login">
                <LogIn className="size-4" /> Đăng nhập
              </Link>
            </Button>
          )}
        </div>

        {!authed && (
          <div className="mt-4 flex gap-2">
            <Button asChild className="flex-1">
              <Link to="/login">Đăng nhập</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to="/register">Tạo tài khoản</Link>
            </Button>
          </div>
        )}

        {isAdmin && (
          <Link
            to="/admin"
            className="mt-4 flex items-center justify-between rounded-2xl bg-primary/10 p-4 shadow-card"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <div className="font-semibold">Trang quản trị</div>
                <div className="text-xs text-muted-foreground">
                  Quản lý cửa hàng, đơn hàng, người dùng
                </div>
              </div>
            </div>
            <span className="text-sm font-semibold text-primary">Mở →</span>
          </Link>
        )}

        {authed && (
          <section className="mt-4 space-y-2 rounded-2xl bg-card p-4 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Store className="size-5" />
                </span>
                <div>
                  <div className="font-bold">Đăng ký gian hàng</div>
                  <div className="text-xs text-muted-foreground">
                    Bán món ăn của bạn trên HoLa Market
                  </div>
                </div>
              </div>
              <Button asChild size="sm" variant="outline" className="rounded-full">
                <Link to="/shop-owner">Quản lý</Link>
              </Button>
            </div>

            {ownerShops.isLoading ? (
              <Skeleton className="mt-2 h-16" />
            ) : shops.length === 0 ? (
              <div className="mt-2 rounded-xl bg-primary/5 p-3">
                <p className="text-sm">
                  Bạn chưa có gian hàng nào. Đăng ký ngay để tiếp cận sinh viên & dân văn phòng khu
                  Hòa Lạc.
                </p>
                <Button asChild className="mt-2 rounded-full" size="sm">
                  <Link to="/shop-owner/shops/new">
                    <Plus className="size-4" /> Đăng ký gian hàng
                  </Link>
                </Button>
              </div>
            ) : (
              <ul className="mt-2 divide-y divide-border overflow-hidden rounded-xl border border-border">
                {shops.map((s) => (
                  <li key={s.id}>
                    <Link
                      to="/shop-owner/shops/$shopId/edit"
                      params={{ shopId: s.id }}
                      className="flex items-center gap-3 p-3 hover:bg-accent/40"
                    >
                      <img
                        src={s.logoUrl}
                        alt={s.name}
                        className="size-10 shrink-0 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{s.name}</div>
                        <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                          <span className="capitalize">{s.approvalStatus}</span>
                          <span>·</span>
                          <span>{s.operationStatus}</span>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <div className="mt-4 grid gap-2">
          <Tile to="/orders" icon={<Receipt className="size-5" />} label="Đơn của tôi" />
          <Tile to="/vouchers" icon={<Ticket className="size-5" />} label="Ưu đãi" />
          <Tile to="/notifications" icon={<Bell className="size-5" />} label="Thông báo" />
          <Tile to="/" icon={<Heart className="size-5" />} label="Quán yêu thích" />
          <Tile
            to="/"
            icon={<MapPin className="size-5" />}
            label={`Địa chỉ giao hàng${addresses.data?.length ? ` (${addresses.data.length})` : ""}`}
          />
          <Tile to="/account" icon={<User className="size-5" />} label="Cập nhật hồ sơ" />
        </div>

        {authed && (
          <Button
            variant="outline"
            className="mt-6 w-full"
            onClick={doLogout}
            disabled={logout.isPending}
          >
            <LogOut className="size-4" /> Đăng xuất
          </Button>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground">v0.1 MVP · HoLa Market</p>
      </div>
    </AppShell>
  );
}

function Tile({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to as never}
      className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card transition hover:bg-accent"
    >
      <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
        {icon}
      </span>
      <span className="font-semibold">{label}</span>
    </Link>
  );
}
