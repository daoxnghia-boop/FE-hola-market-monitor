import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { useOwnerOrders, useOwnerShops } from "@/lib/api/hooks";
import { formatVND, formatDateTime, ORDER_STATUS_LABEL } from "@/lib/domain";
import type { OrderStatus } from "@/lib/api/types";

export const Route = createFileRoute("/shop-owner/orders")({
  head: () => ({ meta: [{ title: "Đơn hàng — HoLa Đối tác" }] }),
  component: OrdersPage,
});

const STATUSES: OrderStatus[] = [
  "cho_quan_xac_nhan", "quan_da_xac_nhan", "dang_chuan_bi",
  "dang_giao", "hoan_thanh", "da_huy",
];

function OrdersPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [shopId, setShopId] = useState<string>("all");
  const shops = useOwnerShops();
  const params: Record<string, unknown> = { q };
  if (status !== "all") params.status = status;
  if (shopId !== "all") params.shopId = shopId;
  const orders = useOwnerOrders(params);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">Đơn hàng</h1>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-card p-3 shadow-card">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Mã đơn, tên/SĐT khách" className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{ORDER_STATUS_LABEL[s]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={shopId} onValueChange={setShopId}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Chọn quán" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả quán của tôi</SelectItem>
            {(shops.data ?? []).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {orders.isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : !orders.data?.length ? (
        <div className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-card">
          Không có đơn nào phù hợp.
        </div>
      ) : (
        <ul className="space-y-2">
          {orders.data.map((o) => (
            <li key={o.id}>
              <Link to="/shop-owner/orders/$orderId" params={{ orderId: o.id }}
                className="block rounded-2xl bg-card p-3 shadow-card transition hover:shadow-pop">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold">#{o.displayCode}</span>
                      <OrderStatusBadge status={o.status} />
                    </div>
                    <div className="mt-0.5 truncate text-sm">{o.shopName}</div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      {o.customerName ?? "Khách"} · {o.customerPhone ?? "—"} · {o.itemSummary}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(o.placedAt)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">{formatVND(o.total)}</div>
                    <div className="text-xs text-muted-foreground">{o.itemCount} món</div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
