import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Phone,
  MapPin,
  CheckCircle2,
  XCircle,
  ChefHat,
  Bike,
  PackageCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { OrderTimeline } from "@/components/order-timeline";
import { useOwnerOrder, useOwnerOrderMutations } from "@/lib/api/hooks";
import { apiErrorMessage } from "@/lib/api/client";
import { formatVND, formatDateTime } from "@/lib/domain";

export const Route = createFileRoute("/shop-owner/orders/$orderId")({
  head: () => ({ meta: [{ title: "Chi tiết đơn — HoLa Đối tác" }] }),
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { orderId } = Route.useParams();
  const navigate = useNavigate();
  const order = useOwnerOrder(orderId);
  const { confirm, reject, startPreparing, startDelivery, complete, cancel } =
    useOwnerOrderMutations();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");

  const o = order.data;

  const runAction = async (fn: () => Promise<unknown>, successMsg: string) => {
    try {
      await fn();
      toast.success(successMsg);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const doReject = async () => {
    if (!reason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối.");
      return;
    }
    try {
      await reject.mutateAsync({ id: orderId, reason: reason.trim() });
      toast.success("Đã từ chối đơn.");
      setRejectOpen(false);
      setReason("");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };
  const doCancel = async () => {
    if (!reason.trim()) {
      toast.error("Vui lòng nhập lý do.");
      return;
    }
    try {
      await cancel.mutateAsync({ id: orderId, reason: reason.trim() });
      toast.success("Đã hủy đơn.");
      setCancelOpen(false);
      setReason("");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const pendingAny =
    confirm.isPending ||
    reject.isPending ||
    startPreparing.isPending ||
    startDelivery.isPending ||
    complete.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/shop-owner/orders" })}>
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-xl font-extrabold">Chi tiết đơn</h1>
      </div>

      {order.isLoading || !o ? (
        <div className="space-y-3">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : (
        <>
          <section className="rounded-2xl bg-card p-4 shadow-card">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold">#{o.displayCode}</span>
              <OrderStatusBadge status={o.status} />
              <span className="ml-auto text-xs text-muted-foreground">
                {formatDateTime(o.placedAt)}
              </span>
            </div>
            <div className="mt-2 text-sm">
              Quán: <b>{o.shopName}</b>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {o.status === "cho_quan_xac_nhan" && (
                <>
                  <Button
                    onClick={() =>
                      runAction(() => confirm.mutateAsync(orderId), "Đã xác nhận đơn.")
                    }
                    disabled={pendingAny}
                  >
                    <CheckCircle2 className="size-4" /> Xác nhận đơn
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setRejectOpen(true)}
                    disabled={pendingAny}
                  >
                    <XCircle className="size-4" /> Từ chối
                  </Button>
                </>
              )}
              {o.status === "quan_da_xac_nhan" && (
                <Button
                  onClick={() =>
                    runAction(() => startPreparing.mutateAsync(orderId), "Đã bắt đầu chuẩn bị món.")
                  }
                  disabled={pendingAny}
                >
                  <ChefHat className="size-4" /> Bắt đầu chuẩn bị
                </Button>
              )}
              {o.status === "dang_chuan_bi" && (
                <Button
                  onClick={() =>
                    runAction(() => startDelivery.mutateAsync(orderId), "Đơn đã bắt đầu giao.")
                  }
                  disabled={pendingAny}
                >
                  <Bike className="size-4" /> Bắt đầu giao
                </Button>
              )}
              {o.status === "dang_giao" && (
                <Button
                  onClick={() =>
                    runAction(() => complete.mutateAsync(orderId), "Đã đánh dấu hoàn thành.")
                  }
                  disabled={pendingAny}
                >
                  <PackageCheck className="size-4" /> Hoàn thành đơn
                </Button>
              )}
              {o.status === "quan_da_xac_nhan" && (
                <Button variant="outline" onClick={() => setCancelOpen(true)}>
                  <XCircle className="size-4" /> Hủy đơn
                </Button>
              )}
            </div>
          </section>

          <section className="rounded-2xl bg-card p-4 shadow-card">
            <h2 className="mb-3 font-bold">Tiến độ</h2>
            <OrderTimeline current={o.status} history={o.statusHistory} />
            {o.cancellation && (
              <div className="mt-3 rounded-xl bg-destructive/10 p-3 text-sm">
                <b>Lý do:</b> {o.cancellation.reason ?? "—"}
                <br />
                <span className="text-muted-foreground">
                  Bởi {o.cancellation.canceledBy} · {formatDateTime(o.cancellation.canceledAt)}
                </span>
              </div>
            )}
          </section>

          <section className="rounded-2xl bg-card p-4 shadow-card">
            <h2 className="mb-2 font-bold">Khách hàng</h2>
            <div className="text-sm">{o.customerName ?? o.delivery.recipientName}</div>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="size-4" /> {o.customerPhone ?? o.delivery.phone}
            </div>
            <div className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-4" /> {o.delivery.addressLine} ({o.delivery.zoneName})
            </div>
            {o.delivery.note && (
              <div className="mt-1 text-xs text-muted-foreground">Ghi chú: {o.delivery.note}</div>
            )}
          </section>

          <section className="rounded-2xl bg-card p-4 shadow-card">
            <h2 className="mb-2 font-bold">Món ({o.itemCount})</h2>
            <ul className="divide-y divide-border">
              {o.items.map((it) => (
                <li key={it.productId} className="flex gap-3 py-2">
                  <img
                    src={it.productImageUrl}
                    alt={it.productName}
                    className="size-14 shrink-0 rounded-xl object-cover"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{it.productName}</div>
                    <div className="text-xs text-muted-foreground">
                      x{it.quantity} · {formatVND(it.unitPrice)}
                    </div>
                    {it.note && (
                      <div className="text-xs text-muted-foreground">Ghi chú: {it.note}</div>
                    )}
                  </div>
                  <div className="font-bold">{formatVND(it.lineTotal)}</div>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
              <Row label="Tạm tính" value={formatVND(o.pricing.subtotal)} />
              {o.pricing.discount > 0 && (
                <Row label="Giảm giá" value={`-${formatVND(o.pricing.discount)}`} />
              )}
              <Row label="Phí giao" value={formatVND(o.pricing.deliveryFee)} />
              <Row label="Tổng" value={formatVND(o.pricing.total)} bold />
            </dl>
          </section>

          <p className="text-xs text-muted-foreground">
            Xem đơn dưới góc nhìn khách:{" "}
            <Link to="/orders/$orderId" params={{ orderId }} className="text-primary underline">
              /orders/{o.displayCode}
            </Link>
          </p>
        </>
      )}

      <Dialog
        open={rejectOpen}
        onOpenChange={(v) => {
          setRejectOpen(v);
          if (!v) setReason("");
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
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Đóng
            </Button>
            <Button variant="destructive" onClick={doReject} disabled={reject.isPending}>
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={cancelOpen}
        onOpenChange={(v) => {
          setCancelOpen(v);
          if (!v) setReason("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hủy đơn hàng?</DialogTitle>
            <DialogDescription>Vui lòng cho biết lý do để khách nắm thông tin.</DialogDescription>
          </DialogHeader>
          <Textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: Không thể tiếp tục chuẩn bị..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Đóng
            </Button>
            <Button variant="destructive" onClick={doCancel} disabled={cancel.isPending}>
              Xác nhận hủy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-extrabold text-base" : ""}`}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
