import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import {
  ORDER_STATUS_FLOW,
  formatVND,
  getShop,
  products,
  type OrderStatus,
} from "@/lib/mock-data";
import {
  ordersStore,
  useOrder,
  type StoredOrder,
  type StoredOrderItem,
} from "@/lib/orders-store";
import { cartStore } from "@/lib/cart-store";
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

function buildFallbackOrder(orderId: string): StoredOrder {
  const shop = getShop("com-nha-hoa-lac")!;
  const items: StoredOrderItem[] = [
    {
      productId: "com-ga-sot-mam",
      quantity: 2,
      price: 35000,
      name: "Cơm gà sốt mắm",
      image: products.find((p) => p.id === "com-ga-sot-mam")!.image,
      note: "Ít cay",
    },
    {
      productId: "com-suon-bi-cha",
      quantity: 1,
      price: 45000,
      name: "Cơm sườn bì chả",
      image: products.find((p) => p.id === "com-suon-bi-cha")!.image,
    },
  ];
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = 10000;
  const shipFee = 10000;
  return {
    id: orderId,
    shopId: shop.id,
    shopName: shop.name,
    shopPhone: shop.phone,
    shopAddress: shop.address,
    items,
    subtotal,
    discount,
    shipFee,
    total: subtotal - discount + shipFee,
    voucherCode: "HOALAC10",
    zoneId: "fpt-uni",
    zoneName: "FPT University",
    address: "FPT University — Sảnh tầng 1, gần cửa chính",
    phone: "0987 654 321",
    customerName: "Nguyễn Văn A",
    note: "Ít cay, thêm tương ớt",
    status: "dang_chuan_bi",
    createdAt: new Date().toISOString(),
    placedAt: "12:34, hôm nay",
  };
}

function OrderDetailPage() {
  const { orderId } = Route.useParams();
  const stored = useOrder(orderId);
  const order = stored ?? buildFallbackOrder(orderId);
  const navigate = useNavigate();

  // Simulate progress for stored orders that aren't terminal
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!stored) return;
    if (stored.status === "hoan_thanh" || stored.status === "da_huy") return;
    const t = setInterval(() => setTick((x) => x + 1), 8000);
    return () => clearInterval(t);
  }, [stored]);

  useEffect(() => {
    if (!stored) return;
    if (stored.status === "hoan_thanh" || stored.status === "da_huy") return;
    const idx = ORDER_STATUS_FLOW.indexOf(stored.status);
    if (idx >= 0 && idx < ORDER_STATUS_FLOW.length - 1) {
      ordersStore.setStatus(stored.id, ORDER_STATUS_FLOW[idx + 1]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const status: OrderStatus = order.status;
  const canCancel = ["da_dat", "cho_quan_xac_nhan"].includes(status);
  const canceled = status === "da_huy";
  const isDone = status === "hoan_thanh";

  const handleCancel = () => {
    if (stored) ordersStore.cancel(stored.id);
    toast.success("Đơn hàng đã bị hủy");
  };

  const handleReorder = () => {
    cartStore.reorder(
      order.shopId,
      order.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        note: i.note,
      })),
    );
    toast.success("Đã thêm lại món vào giỏ");
    navigate({ to: "/cart" });
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
          <h1 className="truncate text-xl font-extrabold md:text-2xl">
            Đơn #{order.id}
          </h1>
          <p className="text-xs text-muted-foreground">Đặt lúc {order.placedAt}</p>
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
            {!isDone && !canceled && "Quán đang xử lý đơn. Dự kiến nhận sau ~25 phút."}
          </div>
        </div>
      </div>

      <div className="grid gap-4 px-4 pb-12 pt-4 md:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          <section className="rounded-2xl bg-card p-5 shadow-card">
            <h2 className="mb-4 font-bold">Trạng thái đơn</h2>
            <OrderTimeline current={status} />
          </section>

          <section className="rounded-2xl bg-card p-4 shadow-card">
            <h2 className="mb-3 font-bold">Món đã đặt</h2>
            <div className="space-y-3">
              {order.items.map((it) => (
                <div key={it.productId} className="flex gap-3">
                  <img
                    src={it.image}
                    alt=""
                    className="size-14 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-1 font-semibold">{it.name}</div>
                    <div className="text-xs text-muted-foreground">x{it.quantity}</div>
                    {it.note && (
                      <div className="mt-0.5 line-clamp-1 text-[11px] italic text-muted-foreground">
                        Ghi chú: {it.note}
                      </div>
                    )}
                  </div>
                  <div className="font-semibold">
                    {formatVND(it.price * it.quantity)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1.5 border-t border-dashed pt-3 text-sm">
              <Row label="Tiền món" value={formatVND(order.subtotal)} />
              {order.discount > 0 && (
                <Row
                  label={`Voucher${order.voucherCode ? ` (${order.voucherCode})` : ""}`}
                  value={`-${formatVND(order.discount)}`}
                  accent="success"
                />
              )}
              <Row label="Phí giao" value={formatVND(order.shipFee)} />
              <div className="flex items-center justify-between pt-2 text-base">
                <span className="font-semibold">Tổng cần trả</span>
                <span className="text-lg font-extrabold text-primary">
                  {formatVND(order.total)}
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
                <div className="truncate text-xs text-muted-foreground">
                  {order.shopAddress}
                </div>
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
                <span>{order.address}</span>
              </div>
              <div className="flex gap-2">
                <Phone className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  {order.customerName} · {order.phone}
                </span>
              </div>
              {order.note && (
                <p className="rounded-xl bg-muted p-2 text-xs text-muted-foreground">
                  Ghi chú: {order.note}
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
                  onClick={() => toast.success("Cảm ơn bạn đã đánh giá!")}
                >
                  <Star /> Đánh giá quán
                </Button>
                <Button
                  variant="secondary"
                  className="w-full rounded-full"
                  onClick={handleReorder}
                >
                  <RotateCcw /> Đặt lại
                </Button>
              </>
            )}
            {canceled && (
              <Button
                variant="secondary"
                className="w-full rounded-full"
                onClick={handleReorder}
              >
                <RotateCcw /> Đặt lại
              </Button>
            )}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "success";
}) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span
        className={
          "font-semibold " + (accent === "success" ? "text-success" : "")
        }
      >
        {value}
      </span>
    </div>
  );
}
