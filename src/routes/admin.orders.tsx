import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { useAdminOrders, useAdminCancelOrder } from "@/lib/api/hooks";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiErrorMessage } from "@/lib/api/client";
import { formatVND, ORDER_STATUS_LABEL } from "@/lib/domain";
import { OrderStatusBadge } from "@/components/order-status-badge";
import type { OrderSummaryDto } from "@/lib/api/types";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

function AdminOrders() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const params = { q, status: status === "all" ? undefined : status, sort };
  const orders = useAdminOrders(params);
  const cancel = useAdminCancelOrder();
  const [confirm, setConfirm] = useState<OrderSummaryDto | null>(null);
  const [reason, setReason] = useState("");

  const doCancel = async () => {
    if (!confirm || !reason.trim()) return;
    try {
      await cancel.mutateAsync({ id: confirm.id, reason: reason.trim() });
      toast.success("Đã hủy đơn.");
      setConfirm(null);
      setReason("");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Mã đơn, SĐT khách, tên quán..."
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            {Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Mới nhất</SelectItem>
            <SelectItem value="total">Giá trị cao</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {orders.isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : !orders.data?.length ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Không có đơn phù hợp.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đơn</TableHead>
                  <TableHead>Khách</TableHead>
                  <TableHead>Quán</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Tổng</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.data.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-semibold">
                      <Link
                        to="/admin/orders/$orderId"
                        params={{ orderId: o.id }}
                        className="hover:underline"
                      >
                        {o.displayCode}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">
                      {o.customerName}
                      <div className="text-xs text-muted-foreground">{o.customerPhone}</div>
                    </TableCell>
                    <TableCell className="text-sm">{o.shopName}</TableCell>
                    <TableCell>
                      <OrderStatusBadge status={o.status} />
                    </TableCell>
                    <TableCell className="font-bold">{formatVND(o.total)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(o.placedAt).toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell>
                      {o.status !== "hoan_thanh" && o.status !== "da_huy" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setConfirm(o);
                            setReason("");
                          }}
                        >
                          Hủy
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hủy đơn {confirm?.displayCode}?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Vui lòng nhập lý do rõ ràng để khách hàng nhận thông
              báo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: Quán đóng cửa đột xuất, không thể hoàn thành đơn."
            rows={3}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Không</AlertDialogCancel>
            <AlertDialogAction onClick={doCancel} disabled={!reason.trim() || cancel.isPending}>
              Hủy đơn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
