import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Receipt, Ticket, MapPin, LogIn } from "lucide-react";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Tài khoản — Ăn Hòa Lạc" }] }),
  component: AccountPage,
});

function AccountPage() {
  return (
    <AppShell>
      <div className="px-4 py-6">
        <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground shadow-card">
          <div className="grid size-14 place-items-center rounded-full bg-white/20 text-2xl">
            🙋
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-extrabold">Khách Hòa Lạc</div>
            <div className="text-xs opacity-90">Đăng nhập để lưu địa chỉ & đơn hàng</div>
          </div>
          <Button variant="secondary" size="sm" className="rounded-full">
            <LogIn className="size-4" /> Đăng nhập
          </Button>
        </div>

        <div className="mt-4 grid gap-2">
          <Tile to="/orders" icon={<Receipt className="size-5" />} label="Đơn của tôi" />
          <Tile to="/vouchers" icon={<Ticket className="size-5" />} label="Ưu đãi" />
          <Tile to="/" icon={<MapPin className="size-5" />} label="Địa chỉ giao hàng" />
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          v0.1 MVP · Ăn Hòa Lạc
        </p>
      </div>
    </AppShell>
  );
}

function Tile({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
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
