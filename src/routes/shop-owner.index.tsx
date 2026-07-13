import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Store,
  ShoppingBag,
  UtensilsCrossed,
  TrendingUp,
  Clock,
  Plus,
  CheckCircle2,
  XCircle,
  BellRing,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOwnerStats, useOwnerOrders, useOwnerOrderMutations } from "@/lib/api/hooks";
import { apiErrorMessage } from "@/lib/api/client";
import { formatVND } from "@/lib/domain";
import { OrderStatusBadge } from "@/components/order-status-badge";

export const Route = createFileRoute("/shop-owner/")({
  head: () => ({ meta: [{ title: "Tổng quan — HoLa Đối tác" }] }),
  component: Dashboard,
});

function Dashboard() {
  const stats = useOwnerStats();
  const pendingOrders = useOwnerOrders({ status: "cho_quan_xac_nhan" });
  const { confirm, reject } = useOwnerOrderMutations();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const doConfirm = async (id: string) => {
    try {
      await confirm.mutateAsync(id);
      toast.success("Đã xác nhận đơn.");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const doReject = async () => {
    if (!rejectId) return;
    if (!reason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối.");
      return;
    }
    try {
      await reject.mutateAsync({ id: rejectId, reason: reason.trim() });
      toast.success("Đã từ chối đơn.");
      setRejectId(null);
      setReason("");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  if (stats.isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }
  if (!stats.data) {
    return (
      <div className="rounded-2xl bg-card p-6 text-center shadow-card">
        <p className="text-sm text-muted-foreground">Bạn chưa có gian hàng nào.</p>
        <Button asChild className="mt-4 rounded-full">
          <Link to="/shop-owner/shops/new">
            <Plus className="size-4" /> Đăng ký gian hàng
          </Link>
        </Button>
      </div>
    );
  }

  const s = stats.data;
  const pending = pendingOrders.data ?? [];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          icon={<Store className="size-5" />}
          label="Gian hàng"
          value={s.totalShops}
          hint={`${s.approvedShops} đã duyệt · ${s.pendingShops} chờ duyệt`}
        />
        <StatCard
          icon={<UtensilsCrossed className="size-5" />}
          label="Món đang bán"
          value={s.activeProducts}
        />
        <StatCard
          icon={<ShoppingBag className="size-5" />}
          label="Đơn hôm nay"
          value={s.ordersToday}
          hint={`${s.pendingOrders} đơn cần xử lý`}
        />
        <StatCard
          icon={<TrendingUp className="size-5" />}
          label="Doanh thu hôm nay"
          value={formatVND(s.revenueToday)}
        />
      </div>

      <section className="rounded-2xl border border-warning/30 bg-warning/5 p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BellRing className="size-4 text-warning-foreground" />
            <h2 className="font-bold">Đơn mới chờ xác nhận</h2>
            {pending.length > 0 && (
              <Badge variant="secondary" className="rounded-full">
                {pending.length}
              </Badge>
            )}
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/shop-owner/orders">Xem tất cả</Link>
          </Button>
        </div>
        {pendingOrders.isLoading ? (
          <Skeleton className="h-20 rounded-xl" />
        ) : pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Không có đơn nào đang chờ xác nhận. Đơn mới sẽ hiện ở đây ngay khi khách đặt.
          </p>
        ) : (
          <ul className="space-y-2">
            {pending.map((o) => (
              <li
                key={o.id}
                className="rounded-xl border border-border bg-card p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/shop-owner/orders/$orderId"
                      params={{ orderId: o.id }}
                      className="truncate text-sm font-bold hover:underline"
                    >
                      #{o.displayCode} · {o.shopName}
                    </Link>
                    <div className="truncate text-xs text-muted-foreground">
                      {o.customerName ?? "Khách"} · {o.customerPhone ?? "—"}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{o.itemSummary}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">{formatVND(o.total)}</div>
                    <div className="text-xs text-muted-foreground">{o.itemCount} món</div>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => doConfirm(o.id)}
                    disabled={confirm.isPending}
                  >
                    <CheckCircle2 className="size-4" /> Xác nhận đơn
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setRejectId(o.id);
                      setReason("");
                    }}
                  >
                    <XCircle className="size-4" /> Từ chối
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl bg-card p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Trạng thái đơn</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/shop-owner/orders">Xem tất cả</Link>
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {s.ordersByStatus.map((x) => (
            <Badge key={x.status} variant="outline" className="rounded-full px-3 py-1">
              <OrderStatusBadge status={x.status} className="mr-1 !px-0 !py-0 !bg-transparent" />
              <span className="ml-1 font-bold">{x.count}</span>
            </Badge>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-card p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Đơn gần đây</h2>
          <Clock className="size-4 text-muted-foreground" />
        </div>
        {s.latestOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có đơn nào.</p>
        ) : (
          <ul className="divide-y divide-border">
            {s.latestOrders.map((o) => (
              <li key={o.id}>
                <Link
                  to="/shop-owner/orders/$orderId"
                  params={{ orderId: o.id }}
                  className="flex items-center justify-between gap-3 py-2.5 hover:bg-muted/30"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">
                      #{o.displayCode} · {o.shopName}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{o.itemSummary}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <OrderStatusBadge status={o.status} />
                    <span className="text-sm font-bold text-primary">{formatVND(o.total)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog
        open={!!rejectId}
        onOpenChange={(v) => {
          if (!v) {
            setRejectId(null);
            setReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối đơn hàng?</DialogTitle>
            <DialogDescription>
              Vui lòng cho biết lý do để khách hàng nắm thông tin. Đơn sẽ bị hủy.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: Hết nguyên liệu, quán đóng cửa đột xuất..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>
              Đóng
            </Button>
            <Button variant="destructive" onClick={doReject} disabled={reject.isPending}>
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-card">
      <div className="mb-2 grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-extrabold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
