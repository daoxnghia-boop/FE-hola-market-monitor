import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Receipt, Ticket, MapPin, LogIn } from "lucide-react";
import { useAddresses, useSession } from "@/lib/api/hooks";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Tài khoản — Ăn Hòa Lạc" }] }),
  component: AccountPage,
});

function AccountPage() {
  const session = useSession();
  const addresses = useAddresses();
  const user = session.data?.user;

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
            <div className="font-extrabold">
              {session.isLoading ? "Đang tải..." : user?.fullName || "Khách Hòa Lạc"}
            </div>
            <div className="text-xs opacity-90">
              {user?.phone || "Đăng nhập để lưu địa chỉ & đơn hàng"}
            </div>
          </div>
          {!user && (
            <Button
              variant="secondary"
              size="sm"
              className="rounded-full"
              onClick={() => {
                // TODO: nối màn hình nhập OTP khi backend Auth được triển khai.
                toast.info("Tính năng đăng nhập đang được hoàn thiện");
              }}
            >
              <LogIn className="size-4" /> Đăng nhập
            </Button>
          )}
        </div>

        <div className="mt-4 grid gap-2">
          <Tile to="/orders" icon={<Receipt className="size-5" />} label="Đơn của tôi" />
          <Tile to="/vouchers" icon={<Ticket className="size-5" />} label="Ưu đãi" />
          <Tile
            to="/"
            icon={<MapPin className="size-5" />}
            label={`Địa chỉ giao hàng${addresses.data?.length ? ` (${addresses.data.length})` : ""}`}
          />
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">v0.1 MVP · Ăn Hòa Lạc</p>
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
