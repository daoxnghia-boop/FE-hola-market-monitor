import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useAdminOrder } from "@/lib/api/hooks";
import { Card } from "@/components/ui/card";
import { formatVND } from "@/lib/domain";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { OrderTimeline } from "@/components/order-timeline";
import { OrderDetailSkeleton, InlineFetchingBar } from "@/components/admin-skeletons";

export const Route = createFileRoute("/admin/orders/$orderId")({
  component: AdminOrderDetail,
});

function AdminOrderDetail() {
  const { orderId } = useParams({ from: "/admin/orders/$orderId" });
  const q = useAdminOrder(orderId);

  if (q.isLoading) return <OrderDetailSkeleton />;
  if (!q.data) return <div className="text-sm text-muted-foreground">Không tìm thấy đơn.</div>;
  const o = q.data;

  return (
    <div className="space-y-4">
      <InlineFetchingBar show={q.isFetching && !q.isLoading} />
      <Link
        to="/admin/orders"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Danh sách đơn
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-extrabold">{o.displayCode}</h1>
        <OrderStatusBadge status={o.status} />
        <span className="text-xs text-muted-foreground">
          {new Date(o.placedAt).toLocaleString("vi-VN")}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <h2 className="mb-2 text-sm font-bold">Món đã đặt</h2>
          <ul className="space-y-2 text-sm">
            {o.items.map((it) => (
              <li key={it.productId} className="flex justify-between">
                <span>
                  {it.quantity}× {it.productName}
                </span>
                <span className="font-semibold">{formatVND(it.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
            <Row label="Tạm tính" value={formatVND(o.pricing.subtotal)} />
            <Row label="Giảm giá" value={`- ${formatVND(o.pricing.discount)}`} />
            <Row label="Phí giao" value={formatVND(o.pricing.deliveryFee)} />
            <Row label="Tổng" value={formatVND(o.pricing.total)} bold />
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="mb-2 text-sm font-bold">Khách hàng</h2>
          <div className="text-sm">{o.customerName ?? "—"}</div>
          <div className="text-xs text-muted-foreground">{o.customerPhone ?? ""}</div>
          <h2 className="mt-4 mb-2 text-sm font-bold">Quán</h2>
          <div className="text-sm">{o.shopName}</div>
          <div className="text-xs text-muted-foreground">
            {o.shopPhone} · {o.shopAddress}
          </div>
          <h2 className="mt-4 mb-2 text-sm font-bold">Giao đến</h2>
          <div className="text-sm">{o.delivery.zoneName}</div>
          <div className="text-xs text-muted-foreground">{o.delivery.addressLine}</div>
          {o.cancellation && (
            <>
              <h2 className="mt-4 mb-2 text-sm font-bold text-destructive">Lý do huỷ</h2>
              <div className="text-sm">{o.cancellation.reason}</div>
              <div className="text-xs text-muted-foreground">Bởi: {o.cancellation.canceledBy}</div>
            </>
          )}
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-bold">Lịch sử trạng thái</h2>
        <OrderTimeline current={o.status} history={o.statusHistory} />
      </Card>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-base font-extrabold" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
