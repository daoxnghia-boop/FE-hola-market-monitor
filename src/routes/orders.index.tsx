import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { Button } from "@/components/ui/button";
import { formatVND, ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/mock-data";
import { useOrders } from "@/lib/orders-store";
import { cartStore } from "@/lib/cart-store";
import { toast } from "sonner";

export const Route = createFileRoute("/orders/")({
  head: () => ({ meta: [{ title: "Đơn của tôi — Ăn Hòa Lạc" }] }),
  component: OrdersListPage,
});

type MockOrder = {
  id: string;
  shopId: string;
  shop: string;
  status: OrderStatus;
  total: number;
  items: string;
  time: string;
  productIds: { id: string; qty: number }[];
};

const mockOrders: MockOrder[] = [
  {
    id: "DH240615",
    shopId: "tra-sua-soc-nau",
    shop: "Trà Sữa Sóc Nâu",
    status: "hoan_thanh",
    total: 60000,
    items: "Trà sữa trân châu x2",
    time: "20:10, 15/06",
    productIds: [{ id: "tra-sua-tran-chau", qty: 2 }],
  },
  {
    id: "DH240612",
    shopId: "banh-mi-minh-anh",
    shop: "Bánh Mì Minh Anh",
    status: "da_huy",
    total: 20000,
    items: "Bánh mì pate trứng x1",
    time: "07:42, 12/06",
    productIds: [{ id: "banh-mi-pate", qty: 1 }],
  },
];

function OrdersListPage() {
  const stored = useOrders();
  const navigate = useNavigate();

  const handleReorder = (shopId: string, items: { id: string; qty: number }[]) => {
    cartStore.reorder(
      shopId,
      items.map((i) => ({ productId: i.id, quantity: i.qty })),
    );
    toast.success("Đã thêm lại món vào giỏ");
    navigate({ to: "/cart" });
  };

  const all = [
    ...stored.map((o) => ({
      id: o.id,
      shopId: o.shopId,
      shop: o.shopName,
      status: o.status,
      total: o.total,
      items: o.items.map((i) => `${i.name} x${i.quantity}`).join(", "),
      time: o.placedAt,
      productIds: o.items.map((i) => ({ id: i.productId, qty: i.quantity })),
    })),
    ...mockOrders,
  ];

  return (
    <AppShell>
      <div className="px-4 py-4">
        <h1 className="text-2xl font-extrabold">Đơn của tôi</h1>
        <p className="text-sm text-muted-foreground">
          Theo dõi tất cả đơn hàng bạn đã đặt.
        </p>
      </div>
      <div className="space-y-3 px-4 pb-24">
        {all.length === 0 && (
          <div className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-card">
            Bạn chưa có đơn hàng nào.
          </div>
        )}
        {all.map((o) => (
          <div
            key={o.id}
            className="block rounded-2xl bg-card p-4 shadow-card transition hover:shadow-pop"
          >
            <Link
              to="/orders/$orderId"
              params={{ orderId: o.id }}
              className="block"
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
            {(o.status === "hoan_thanh" || o.status === "da_huy") && (
              <Button
                size="sm"
                variant="secondary"
                className="mt-3 w-full rounded-full"
                onClick={() => handleReorder(o.shopId, o.productIds)}
              >
                <RotateCcw className="size-4" /> Đặt lại
              </Button>
            )}
            <span className="sr-only">{ORDER_STATUS_LABEL[o.status]}</span>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
