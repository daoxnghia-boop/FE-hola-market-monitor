import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bike,
  MapPin,
  Phone,
  Wallet,
  XCircle,
  CheckCircle2,
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

export const Route = createFileRoute("/orders/$orderId")({
  head: ({ params }) => ({
    meta: [
      { title: `Đơn ${params.orderId} — Ăn Hòa Lạc` },
      { name: "description", content: "Theo dõi trạng thái đơn hàng của bạn." },
    ],
  }),
  component: OrderDetailPage,
});

// Mock order — same regardless of orderId for demo
function buildMockOrder(orderId: string) {
  const shop = getShop("com-nha-hoa-lac")!;
  const items = [
    { product: products.find((p) => p.id === "com-ga-sot-mam")!, quantity: 2 },
    { product: products.find((p) => p.id === "com-suon-bi-cha")!, quantity: 1 },
  ];
  const subtotal = items.reduce(
    (s, i) => s + i.product.price * i.quantity,
    0,
  );
  return {
    id: orderId,
    code: orderId,
    shop,
    items,
    subtotal,
    discount: 10000,
    total: subtotal - 10000,
    address: "KTX FPT, Hòa Lạc, Thạch Thất, HN",
    phone: "0987 654 321",
    note: "Ít cay, thêm tương ớt",
    placedAt: "12:34, 18/06/2025",
  };
}

function OrderDetailPage() {
  const { orderId } = Route.useParams();
  const order = buildMockOrder(orderId);

  // Simulate live status progression for demo
  const [statusIdx, setStatusIdx] = useState(2);
  useEffect(() => {
    const t = setInterval(() => {
      setStatusIdx((i) =>
        i < ORDER_STATUS_FLOW.length - 1 ? i + 1 : i,
      );
    }, 8000);
    return () => clearInterval(t);
  }, []);
  const [canceled, setCanceled] = useState(false);
  const status: OrderStatus = canceled ? "da_huy" : ORDER_STATUS_FLOW[statusIdx];

  const canCancel =
    !canceled && ["da_dat", "cho_quan_xac_nhan"].includes(status);
  const isDone = status === "hoan_thanh";

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4">
        <Link
          to="/"
          className="grid size-9 place-items-center rounded-full bg-card shadow-card md:hidden"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-extrabold md:text-2xl">
            Đơn #{order.code}
          </h1>
          <p className="text-xs text-muted-foreground">Đặt lúc {order.placedAt}</p>
        </div>
        <OrderStatusBadge status={status} />
      </div>

      {/* Top notice banner */}
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
              "Quán đang chuẩn bị đơn của bạn. Bạn sẽ nhận thông báo khi shipper xuất phát."}
          </div>
          {isDone && (
            <Button size="sm" variant="secondary">
              Đánh giá
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 px-4 pb-12 pt-4 md:grid-cols-[1.3fr_1fr]">
        {/* Left: Timeline + Items */}
        <div className="space-y-4">
          <section className="rounded-2xl bg-card p-5 shadow-card">
            <h2 className="mb-4 font-bold">Trạng thái đơn</h2>
            <OrderTimeline current={status} />
          </section>

          <section className="rounded-2xl bg-card p-4 shadow-card">
            <h2 className="mb-3 font-bold">Món đã đặt</h2>
            <div className="space-y-3">
              {order.items.map((it) => (
                <div key={it.product.id} className="flex gap-3">
                  <img
                    src={it.product.image}
                    alt=""
                    className="size-14 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-1 font-semibold">
                      {it.product.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      x{it.quantity}
                    </div>
                  </div>
                  <div className="font-semibold">
                    {formatVND(it.product.price * it.quantity)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1.5 border-t border-dashed pt-3 text-sm">
              <Row label="Tạm tính" value={formatVND(order.subtotal)} />
              <Row
                label="Ưu đãi"
                value={`-${formatVND(order.discount)}`}
                accent="success"
              />
              <Row label="Phí giao" value="Quán tự giao" hint />
              <div className="flex items-center justify-between pt-2 text-base">
                <span className="font-semibold">Tổng</span>
                <span className="text-lg font-extrabold text-primary">
                  {formatVND(order.total)}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Right: Shop + Delivery + Actions */}
        <aside className="space-y-4">
          <section className="rounded-2xl bg-card p-4 shadow-card">
            <h2 className="mb-3 font-bold">Quán</h2>
            <Link
              to="/shops/$shopId"
              params={{ shopId: order.shop.id }}
              className="flex items-center gap-3"
            >
              <img
                src={order.shop.logo}
                alt=""
                className="size-12 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{order.shop.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {order.shop.address}
                </div>
              </div>
            </Link>
            <a
              href={`tel:${order.shop.phone.replace(/\s/g, "")}`}
              className="mt-3 flex items-center justify-center gap-2 rounded-full border border-border py-2 text-sm font-semibold"
            >
              <Phone className="size-4" /> Gọi quán · {order.shop.phone}
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
                <span>{order.phone}</span>
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

          {canCancel && (
            <Button
              variant="outline"
              className="w-full rounded-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setCanceled(true)}
            >
              Hủy đơn
            </Button>
          )}
        </aside>
      </div>
    </AppShell>
  );
}

function Row({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: boolean;
  accent?: "success";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={hint ? "text-muted-foreground" : ""}>{label}</span>
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
