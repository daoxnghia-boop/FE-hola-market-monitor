import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatVND, ORDER_STATUS_LABEL } from "@/lib/domain";
import { useOrders, useReorder } from "@/lib/orders-store";
import { apiErrorMessage } from "@/lib/api/client";
import { toast } from "sonner";

export const Route = createFileRoute("/orders/")({
  head: () => ({ meta: [{ title: "Đơn của tôi — Ăn Hòa Lạc" }] }),
  component: OrdersListPage,
});

function OrdersListPage() {
  const { data: orders = [], isLoading, isError } = useOrders();
  const reorder = useReorder();
  const navigate = useNavigate();

  const handleReorder = (orderId: string) => {
    reorder.mutate(orderId, {
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
      <div className="px-4 py-4">
        <h1 className="text-2xl font-extrabold">Đơn của tôi</h1>
        <p className="text-sm text-muted-foreground">Theo dõi tất cả đơn hàng bạn đã đặt.</p>
      </div>
      <div className="space-y-3 px-4 pb-24">
        {isLoading && (
          <div className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-card">
            Đang tải đơn hàng...
          </div>
        )}
        {isError && (
          <div className="rounded-2xl bg-card p-6 text-center text-sm text-destructive shadow-card">
            Chưa thể tải đơn hàng.
          </div>
        )}
        {!isLoading && !isError && orders.length === 0 && (
          <div className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-card">
            Bạn chưa có đơn hàng nào.
          </div>
        )}
        {orders.map((o) => (
          <div
            key={o.id}
            className="block rounded-2xl bg-card p-4 shadow-card transition hover:shadow-pop"
          >
            <Link to="/orders/$orderId" params={{ orderId: o.id }} className="block">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-muted-foreground">#{o.displayCode}</div>
                  <div className="truncate font-semibold">{o.shopName}</div>
                  <div className="line-clamp-1 text-sm text-muted-foreground">{o.itemSummary}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {formatDateTime(o.placedAt)}
                  </div>
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
                onClick={() => handleReorder(o.id)}
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
