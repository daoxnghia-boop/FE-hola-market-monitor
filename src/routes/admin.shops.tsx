import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Search, MoreHorizontal } from "lucide-react";
import { useAdminShops, useAdminShopAction, useAdminUpdateShop } from "@/lib/api/hooks";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineFetchingBar } from "@/components/admin-skeletons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import { deferOpen } from "@/lib/defer-open";
import type { ShopDto } from "@/lib/api/types";

export const Route = createFileRoute("/admin/shops")({
  component: AdminShops,
});

const APPROVAL_LABEL: Record<string, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  draft: "Nháp",
};
const OPERATION_LABEL: Record<string, string> = {
  active: "Hoạt động",
  suspended: "Tạm ngưng",
  paused: "Tạm nghỉ",
};

function AdminShops() {
  const [q, setQ] = useState("");
  const [approval, setApproval] = useState<string>("all");
  const [operation, setOperation] = useState<string>("all");
  const [sort, setSort] = useState<string>("newest");
  const params = {
    q,
    sort,
    approvalStatus: approval === "all" ? undefined : approval,
    operationStatus: operation === "all" ? undefined : operation,
  };
  const shops = useAdminShops(params);
  const action = useAdminShopAction();
  const updateShop = useAdminUpdateShop();
  const [confirm, setConfirm] = useState<{
    shop: ShopDto;
    action: "approve" | "reject" | "suspend" | "activate";
  } | null>(null);

  const [editing, setEditing] = useState<ShopDto | null>(null);
  const [form, setForm] = useState({ name: "", description: "", area: "", address: "" });

  const openEdit = (s: ShopDto) => {
    setEditing(s);
    setForm({
      name: s.name,
      description: s.description ?? "",
      area: s.area ?? "",
      address: s.address ?? "",
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!form.name.trim()) {
      toast.error("Tên quán bắt buộc.");
      return;
    }
    try {
      await updateShop.mutateAsync({
        id: editing.id,
        body: {
          name: form.name.trim(),
          description: form.description.trim(),
          area: form.area.trim(),
          address: form.address.trim(),
        },
      });
      toast.success("Đã cập nhật quán.");
      setEditing(null);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const doAction = async () => {
    if (!confirm) return;
    try {
      await action.mutateAsync({ id: confirm.shop.id, action: confirm.action });
      toast.success("Đã cập nhật quán.");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
    setConfirm(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm tên quán, chủ quán, SĐT..."
            className="pl-9"
          />
        </div>
        <Select value={approval} onValueChange={setApproval}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả duyệt</SelectItem>
            <SelectItem value="pending">Chờ duyệt</SelectItem>
            <SelectItem value="approved">Đã duyệt</SelectItem>
            <SelectItem value="rejected">Từ chối</SelectItem>
          </SelectContent>
        </Select>
        <Select value={operation} onValueChange={setOperation}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="active">Hoạt động</SelectItem>
            <SelectItem value="suspended">Tạm ngưng</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Mới nhất</SelectItem>
            <SelectItem value="rating">Đánh giá cao</SelectItem>
            <SelectItem value="orderCount">Nhiều đơn</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="px-4 pt-2"><InlineFetchingBar show={__FETCHING__} /></div>
        {shops.isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
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
                      <Link
                        to="/shops/$shopId"
                        params={{ shopId: s.id }}
                        className="hover:underline"
                      >
                        {s.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">
                      {s.ownerName}
                      <div className="text-xs text-muted-foreground">{s.ownerPhone}</div>
                    </TableCell>
                    <TableCell className="text-sm">{s.area}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          s.approvalStatus === "approved"
                            ? "default"
                            : s.approvalStatus === "pending"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {APPROVAL_LABEL[s.approvalStatus ?? "pending"]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.operationStatus === "active" ? "outline" : "destructive"}>
                        {OPERATION_LABEL[s.operationStatus ?? "active"]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">⭐ {s.rating.toFixed(1)}</TableCell>
                    <TableCell className="text-sm">{s.orderCount ?? 0}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to="/shops/$shopId" params={{ shopId: s.id }}>
                              Xem chi tiết
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => deferOpen(() => openEdit(s))}>
                            Sửa thông tin
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {s.approvalStatus !== "approved" && (
                            <DropdownMenuItem
                              onSelect={() =>
                                deferOpen(() => setConfirm({ shop: s, action: "approve" }))
                              }
                            >
                              Duyệt
                            </DropdownMenuItem>
                          )}
                          {s.approvalStatus !== "rejected" && (
                            <DropdownMenuItem
                              onSelect={() =>
                                deferOpen(() => setConfirm({ shop: s, action: "reject" }))
                              }
                            >
                              Từ chối
                            </DropdownMenuItem>
                          )}
                          {s.operationStatus === "active" ? (
                            <DropdownMenuItem
                              onSelect={() =>
                                deferOpen(() => setConfirm({ shop: s, action: "suspend" }))
                              }
                            >
                              Tạm ngưng
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onSelect={() =>
                                deferOpen(() => setConfirm({ shop: s, action: "activate" }))
                              }
                            >
                              Kích hoạt
                            </DropdownMenuItem>
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
              {confirm &&
                `Bạn có chắc muốn "${
                  {
                    approve: "duyệt",
                    reject: "từ chối",
                    suspend: "tạm ngưng",
                    activate: "kích hoạt",
                  }[confirm.action]
                }" quán ${confirm.shop.name}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={doAction} disabled={action.isPending}>
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa thông tin quán</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Tên quán</Label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Khu vực</Label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.area}
                onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Địa chỉ</Label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Mô tả</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              className="rounded-md border border-input bg-background px-4 py-2 text-sm"
              onClick={() => setEditing(null)}
            >
              Hủy
            </button>
            <button
              type="button"
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
              onClick={saveEdit}
              disabled={updateShop.isPending}
            >
              Lưu
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
