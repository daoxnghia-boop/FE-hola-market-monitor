import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bike,
  MapPin,
  Phone,
  Wallet,
  XCircle,
  CheckCircle2,
  RotateCcw,
  Star,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { OrderTimeline } from "@/components/order-timeline";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatVND } from "@/lib/domain";
import { useCancelOrder, useOrder, useReorder } from "@/lib/orders-store";
import { apiErrorMessage } from "@/lib/api/client";
import { toast } from "sonner";

export const Route = createFileRoute("/orders/$orderId")({
  head: ({ params }) => ({
    meta: [
      { title: `Đơn ${params.orderId} — Ăn Hòa Lạc` },
      { name: "description", content: "Theo dõi trạng thái đơn hàng của bạn." },
    ],
  }),
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { orderId } = Route.useParams();
  const { data: order, isLoading, isError } = useOrder(orderId);
  const cancelOrder = useCancelOrder();
  const reorder = useReorder();
  const navigate = useNavigate();

  if (isLoading)
    return (
      <AppShell>
        <div className="px-4 py-10 text-center text-sm text-muted-foreground">
          Đang tải chi tiết đơn...
        </div>
      </AppShell>
    );
  if (isError || !order)
    return (
      <AppShell>
        <div className="px-4 py-10 text-center text-sm text-muted-foreground">
          Hiện chưa có thông tin đơn hàng này.
        </div>
      </AppShell>
    );

  const status = order.status;
  const canCancel = order.canCancel;
  const canceled = status === "da_huy";
  const isDone = status === "hoan_thanh";

  const handleCancel = () => {
    cancelOrder.mutate(order.id, {
      onSuccess: () => toast.success("Đơn hàng đã bị hủy"),
      onError: (error) => toast.error(apiErrorMessage(error)),
    });
  };

  const handleReorder = () => {
    reorder.mutate(order.id, {
      onSuccess: ({ skippedItems }) => {
        toast.success(
          skippedItems.length ? "Đã thêm các món còn bán vào giỏ" : "Đã thêm lại món vào giỏ",
        );
        navigate({ to: "/cart" });
      },
      onError: (error) => toast.error(apiErrorMessage(error)),
    });
  };

  return (
    <AppShell>
      <div className="flex items-center gap-3 px-4 py-4">
        <Link
          to="/orders"
          className="grid size-9 place-items-center rounded-full bg-card shadow-card md:hidden"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-extrabold md:text-2xl">Đơn #{order.displayCode}</h1>
          <p className="text-xs text-muted-foreground">Đặt lúc {formatDateTime(order.placedAt)}</p>
        </div>
        <OrderStatusBadge status={status} />
      </div>

      <div className="px-4">
        <div
          className={
            "flex items-center gap-3 rounded-2xl p-3 text-sm " +
            (isDone
              ? "bg-success/10 text-success"
              : canceled
                ? "bg-destructive/10 text-destructive"
                : "bg-accent text-accent-foreground")
          }
        >
          {isDone ? (
            <CheckCircle2 className="size-5 shrink-0" />
          ) : canceled ? (
            <XCircle className="size-5 shrink-0" />
          ) : (
            <Bike className="size-5 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            {isDone && "Đơn đã hoàn thành. Cảm ơn bạn đã ủng hộ quán!"}
            {canceled && "Đơn đã hủy theo yêu cầu của bạn."}
            {!isDone &&
              !canceled &&
              `Quán đang xử lý đơn${order.delivery.etaMinutes ? `. Dự kiến nhận sau ~${order.delivery.etaMinutes} phút.` : "."}`}
          </div>
        </div>
      </div>

      <div className="grid gap-4 px-4 pb-12 pt-4 md:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          <section className="rounded-2xl bg-card p-5 shadow-card">
            <h2 className="mb-4 font-bold">Trạng thái đơn</h2>
            <OrderTimeline current={status} history={order.statusHistory} />
          </section>

          <section className="rounded-2xl bg-card p-4 shadow-card">
            <h2 className="mb-3 font-bold">Món đã đặt</h2>
            <div className="space-y-3">
              {order.items.map((it) => (
                <div key={it.productId} className="flex gap-3">
                  <img
                    src={it.productImageUrl}
                    alt=""
                    className="size-14 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-1 font-semibold">{it.productName}</div>
                    <div className="text-xs text-muted-foreground">x{it.quantity}</div>
                    {it.note && (
                      <div className="mt-0.5 line-clamp-1 text-[11px] italic text-muted-foreground">
                        Ghi chú: {it.note}
                      </div>
                    )}
                  </div>
                  <div className="font-semibold">{formatVND(it.lineTotal)}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1.5 border-t border-dashed pt-3 text-sm">
              <Row label="Tiền món" value={formatVND(order.pricing.subtotal)} />
              {order.pricing.discount > 0 && (
                <Row
                  label={`Voucher${order.voucherCode ? ` (${order.voucherCode})` : ""}`}
                  value={`-${formatVND(order.pricing.discount)}`}
                  accent="success"
                />
              )}
              <Row label="Phí giao" value={formatVND(order.pricing.deliveryFee)} />
              <div className="flex items-center justify-between pt-2 text-base">
                <span className="font-semibold">Tổng cần trả</span>
                <span className="text-lg font-extrabold text-primary">
                  {formatVND(order.pricing.total)}
                </span>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl bg-card p-4 shadow-card">
            <h2 className="mb-3 font-bold">Quán</h2>
            <Link
              to="/shops/$shopId"
              params={{ shopId: order.shopId }}
              className="flex items-center gap-3"
            >
              <div className="grid size-12 place-items-center rounded-xl bg-muted text-lg">🍽️</div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{order.shopName}</div>
                <div className="truncate text-xs text-muted-foreground">{order.shopAddress}</div>
              </div>
            </Link>
            <a
              href={`tel:${order.shopPhone.replace(/\s/g, "")}`}
              className="mt-3 flex items-center justify-center gap-2 rounded-full border border-border py-2 text-sm font-semibold"
            >
              <Phone className="size-4" /> Gọi quán · {order.shopPhone}
            </a>
          </section>

          <section className="rounded-2xl bg-card p-4 shadow-card">
            <h2 className="mb-3 font-bold">Giao tới</h2>
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  {order.delivery.zoneName} — {order.delivery.addressLine}
                </span>
              </div>
              <div className="flex gap-2">
                <Phone className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  {order.delivery.recipientName} · {order.delivery.phone}
                </span>
              </div>
              {order.delivery.note && (
                <p className="rounded-xl bg-muted p-2 text-xs text-muted-foreground">
                  Ghi chú: {order.delivery.note}
                </p>
              )}
            </div>
          </section>

          <section className="space-y-2 rounded-2xl bg-accent p-4 text-sm text-accent-foreground">
            <div className="flex items-center gap-2 font-semibold">
              <Wallet className="size-4" /> Thanh toán trực tiếp cho quán
            </div>
            <div className="flex items-center gap-2 font-semibold">
              <Bike className="size-4" /> Quán tự giao hàng
            </div>
          </section>

          <div className="space-y-2 pb-20 md:pb-0">
            {canCancel && (
              <Button
                variant="outline"
                className="w-full rounded-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleCancel}
              >
                <XCircle /> Hủy đơn
              </Button>
            )}
            {isDone && (
              <>
                <Button
                  className="w-full rounded-full"
                  onClick={() => {
                    // TODO: cần modal chọn 1-5 sao/comment trước khi gọi POST /orders/:id/review.
                    toast.info("Biểu mẫu đánh giá đang được hoàn thiện");
                  }}
                >
                  <Star /> Đánh giá quán
                </Button>
                <Button variant="secondary" className="w-full rounded-full" onClick={handleReorder}>
                  <RotateCcw /> Đặt lại
                </Button>
              </>
            )}
            {canceled && (
              <Button variant="secondary" className="w-full rounded-full" onClick={handleReorder}>
                <RotateCcw /> Đặt lại
              </Button>
            )}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: "success" }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className={"font-semibold " + (accent === "success" ? "text-success" : "")}>
        {value}
      </span>
    </div>
  );
}
