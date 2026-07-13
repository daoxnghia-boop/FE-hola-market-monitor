import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Search, MoreHorizontal } from "lucide-react";
import { useAdminShops, useAdminShopAction } from "@/lib/api/hooks";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiErrorMessage } from "@/lib/api/client";
import type { ShopDto } from "@/lib/api/types";

export const Route = createFileRoute("/admin/shops")({
  component: AdminShops,
});

const APPROVAL_LABEL: Record<string, string> = { pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Từ chối", draft: "Nháp" };
const OPERATION_LABEL: Record<string, string> = { active: "Hoạt động", suspended: "Tạm ngưng", paused: "Tạm nghỉ" };

function AdminShops() {
  const [q, setQ] = useState("");
  const [approval, setApproval] = useState<string>("all");
  const [operation, setOperation] = useState<string>("all");
  const [sort, setSort] = useState<string>("newest");
  const params = {
    q, sort,
    approvalStatus: approval === "all" ? undefined : approval,
    operationStatus: operation === "all" ? undefined : operation,
  };
  const shops = useAdminShops(params);
  const action = useAdminShopAction();
  const [confirm, setConfirm] = useState<{ shop: ShopDto; action: "approve" | "reject" | "suspend" | "activate" } | null>(null);

  const doAction = async () => {
    if (!confirm) return;
    try {
      await action.mutateAsync({ id: confirm.shop.id, action: confirm.action });
      toast.success("Đã cập nhật quán.");
    } catch (e) { toast.error(apiErrorMessage(e)); }
    setConfirm(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tên quán, chủ quán, SĐT..." className="pl-9" />
        </div>
        <Select value={approval} onValueChange={setApproval}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả duyệt</SelectItem>
            <SelectItem value="pending">Chờ duyệt</SelectItem>
            <SelectItem value="approved">Đã duyệt</SelectItem>
            <SelectItem value="rejected">Từ chối</SelectItem>
          </SelectContent>
        </Select>
        <Select value={operation} onValueChange={setOperation}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="active">Hoạt động</SelectItem>
            <SelectItem value="suspended">Tạm ngưng</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Mới nhất</SelectItem>
            <SelectItem value="rating">Đánh giá cao</SelectItem>
            <SelectItem value="orderCount">Nhiều đơn</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {shops.isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : !shops.data?.length ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Chưa có dữ liệu.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quán</TableHead>
                  <TableHead>Chủ</TableHead>
                  <TableHead>Khu vực</TableHead>
                  <TableHead>Duyệt</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Đánh giá</TableHead>
                  <TableHead>Đơn</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shops.data.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-semibold">
                      <Link to="/shops/$shopId" params={{ shopId: s.id }} className="hover:underline">{s.name}</Link>
                    </TableCell>
                    <TableCell className="text-sm">{s.ownerName}<div className="text-xs text-muted-foreground">{s.ownerPhone}</div></TableCell>
                    <TableCell className="text-sm">{s.area}</TableCell>
                    <TableCell><Badge variant={s.approvalStatus === "approved" ? "default" : s.approvalStatus === "pending" ? "secondary" : "destructive"}>
                      {APPROVAL_LABEL[s.approvalStatus ?? "pending"]}
                    </Badge></TableCell>
                    <TableCell><Badge variant={s.operationStatus === "active" ? "outline" : "destructive"}>
                      {OPERATION_LABEL[s.operationStatus ?? "active"]}
                    </Badge></TableCell>
                    <TableCell className="text-sm">⭐ {s.rating.toFixed(1)}</TableCell>
                    <TableCell className="text-sm">{s.orderCount ?? 0}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="size-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to="/shops/$shopId" params={{ shopId: s.id }}>Xem chi tiết</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {s.approvalStatus !== "approved" && (
                            <DropdownMenuItem onSelect={() => setConfirm({ shop: s, action: "approve" })}>Duyệt</DropdownMenuItem>
                          )}
                          {s.approvalStatus !== "rejected" && (
                            <DropdownMenuItem onSelect={() => setConfirm({ shop: s, action: "reject" })}>Từ chối</DropdownMenuItem>
                          )}
                          {s.operationStatus === "active" ? (
                            <DropdownMenuItem onSelect={() => setConfirm({ shop: s, action: "suspend" })}>Tạm ngưng</DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onSelect={() => setConfirm({ shop: s, action: "activate" })}>Kích hoạt</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
            <AlertDialogTitle>Xác nhận thao tác</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm && `Bạn có chắc muốn "${{
                approve: "duyệt",
                reject: "từ chối",
                suspend: "tạm ngưng",
                activate: "kích hoạt",
              }[confirm.action]}" quán ${confirm.shop.name}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={doAction} disabled={action.isPending}>Xác nhận</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
