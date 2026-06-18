import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { formatVND } from "@/lib/mock-data";

export const Route = createFileRoute("/orders/")({
  head: () => ({ meta: [{ title: "Đơn của tôi — Ăn Hòa Lạc" }] }),
  component: OrdersListPage,
});

const mockOrders = [
  {
    id: "DH240618",
    shop: "Cơm Nhà Hòa Lạc",
    status: "dang_chuan_bi" as const,
    total: 105000,
    items: "Cơm gà sốt mắm x2, Cơm sườn x1",
    time: "12:34 hôm nay",
  },
  {
    id: "DH240615",
    shop: "Trà Sữa Sóc Nâu",
    status: "hoan_thanh" as const,
    total: 60000,
    items: "Trà sữa trân châu x2",
    time: "20:10, 15/06",
  },
  {
    id: "DH240612",
    shop: "Bánh Mì Minh Anh",
    status: "da_huy" as const,
    total: 20000,
    items: "Bánh mì pate trứng x1",
    time: "07:42, 12/06",
  },
];

function OrdersListPage() {
  return (
    <AppShell>
      <div className="px-4 py-4">
        <h1 className="text-2xl font-extrabold">Đơn của tôi</h1>
        <p className="text-sm text-muted-foreground">
          Theo dõi tất cả đơn hàng bạn đã đặt.
        </p>
      </div>
      <div className="space-y-3 px-4 pb-8">
        {mockOrders.map((o) => (
          <Link
            key={o.id}
            to="/orders/$orderId"
            params={{ orderId: o.id }}
            className="block rounded-2xl bg-card p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-pop"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-xs text-muted-foreground">#{o.id}</div>
                <div className="truncate font-semibold">{o.shop}</div>
                <div className="line-clamp-1 text-sm text-muted-foreground">
                  {o.items}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{o.time}</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <OrderStatusBadge status={o.status} />
                <div className="font-bold text-primary">{formatVND(o.total)}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
