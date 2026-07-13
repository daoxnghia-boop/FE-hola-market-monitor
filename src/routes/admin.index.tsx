import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Store, ShoppingBag, Users, Clock, XCircle, TrendingUp } from "lucide-react";
import { useAdminStats } from "@/lib/api/hooks";
import { formatVND } from "@/lib/domain";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABEL } from "@/lib/domain";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const STATUS_VN: Record<string, string> = {
  cho_quan_xac_nhan: "Chờ xác nhận",
  quan_da_xac_nhan: "Đã xác nhận",
  dang_chuan_bi: "Đang chuẩn bị",
  dang_giao: "Đang giao",
  hoan_thanh: "Hoàn thành",
  da_huy: "Đã huỷ",
};

function AdminDashboard() {
  const stats = useAdminStats();

  if (stats.isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
    );
  }
  if (!stats.data) {
    return <div className="text-sm text-muted-foreground">Không tải được dữ liệu tổng quan.</div>;
  }

  const s = stats.data;
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={<Users className="size-4" />} label="Khách hàng" value={s.totalCustomers.toLocaleString("vi-VN")} />
        <StatCard icon={<Store className="size-4" />} label="Quán đang hoạt động" value={s.activeShops.toLocaleString("vi-VN")} />
        <StatCard icon={<Clock className="size-4" />} label="Quán chờ duyệt" value={s.pendingShops.toLocaleString("vi-VN")} accent />
        <StatCard icon={<ShoppingBag className="size-4" />} label="Đơn hôm nay" value={s.ordersToday.toLocaleString("vi-VN")} />
        <StatCard icon={<TrendingUp className="size-4" />} label="Doanh thu hôm nay" value={formatVND(s.revenueToday)} />
        <StatCard icon={<XCircle className="size-4" />} label="Đơn huỷ hôm nay" value={s.cancelledToday.toLocaleString("vi-VN")} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-bold">Đơn theo trạng thái</h2>
          {s.ordersByStatus.every((r) => r.count === 0) ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={s.ordersByStatus.map((r) => ({ name: STATUS_VN[r.status] ?? r.status, count: r.count }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" fontSize={11} interval={0} angle={-15} height={50} textAnchor="end" />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-bold">Đơn & doanh thu 7 ngày</h2>
          {s.trend7d.every((d) => d.orders === 0) ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={s.trend7d}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis yAxisId="left" fontSize={11} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number, name) => (name === "revenue" ? formatVND(v) : v)} />
                <Line yAxisId="left" type="monotone" dataKey="orders" stroke="hsl(var(--primary))" strokeWidth={2} name="Đơn" />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="hsl(var(--success))" strokeWidth={2} name="Doanh thu" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-bold">Quán chờ duyệt</h2>
          {s.pendingApprovalShops.length === 0 ? (
            <p className="text-sm text-muted-foreground">Không có quán chờ duyệt.</p>
          ) : (
            <div className="space-y-2">
              {s.pendingApprovalShops.map((shop) => (
                <Link
                  key={shop.id} to="/admin/shops"
                  className="flex items-center justify-between rounded-xl border border-border p-3 text-sm transition hover:bg-accent"
                >
                  <div>
                    <div className="font-semibold">{shop.name}</div>
                    <div className="text-xs text-muted-foreground">{shop.ownerName} · {shop.ownerPhone}</div>
                  </div>
                  <Badge variant="secondary">Chờ duyệt</Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-bold">Đơn hàng mới nhất</h2>
          {s.latestOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có đơn hàng.</p>
          ) : (
            <div className="space-y-2">
              {s.latestOrders.map((o) => (
                <Link
                  key={o.id} to="/admin/orders/$orderId" params={{ orderId: o.id }}
                  className="flex items-center justify-between rounded-xl border border-border p-3 text-sm transition hover:bg-accent"
                >
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{o.displayCode} · {o.shopName}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {o.customerName ?? "—"} · {orderStatusLabel(o.status)}
                    </div>
                  </div>
                  <div className="font-bold">{formatVND(o.total)}</div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <Card className={`p-3 ${accent ? "border-primary/40" : ""}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="grid size-6 place-items-center rounded-md bg-accent text-accent-foreground">{icon}</span>
        {label}
      </div>
      <div className="mt-1 text-lg font-extrabold">{value}</div>
    </Card>
  );
}

function EmptyChart() {
  return <div className="grid h-[220px] place-items-center text-sm text-muted-foreground">Chưa có dữ liệu.</div>;
}
