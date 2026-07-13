import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useState } from "react";
import { Plus, Store, Pause, Play, Send, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useOwnerShops, useOwnerShopAction, useDeleteOwnerShop,
} from "@/lib/api/hooks";
import { useRequireAuth } from "@/lib/require-auth";
import { apiErrorMessage } from "@/lib/api/client";
import type { ShopDto } from "@/lib/api/types";

export const Route = createFileRoute("/shop-owner/shops/")({
  head: () => ({ meta: [{ title: "Quản lý gian hàng — HoLa Market" }] }),
  component: ShopOwnerHome,
});

const APPROVAL: Record<string, { label: string; tone: "default" | "secondary" | "destructive" | "outline" }> = {
  approved: { label: "Đã duyệt", tone: "default" },
  pending: { label: "Chờ duyệt", tone: "secondary" },
  rejected: { label: "Từ chối", tone: "destructive" },
  draft: { label: "Nháp", tone: "outline" },
};
const OPERATION: Record<string, { label: string; tone: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Hoạt động", tone: "outline" },
  paused: { label: "Tạm nghỉ", tone: "secondary" },
  suspended: { label: "Bị đình chỉ", tone: "destructive" },
};

function ShopOwnerHome() {
  useRequireAuth();
  const shops = useOwnerShops();
  const action = useOwnerShopAction();
  const remove = useDeleteOwnerShop();
  const [confirmDelete, setConfirmDelete] = useState<ShopDto | null>(null);

  const doAction = async (id: string, act: "submit" | "pause" | "reopen") => {
    try {
      await action.mutateAsync({ id, action: act });
      toast.success("Đã cập nhật.");
    } catch (e) { toast.error(apiErrorMessage(e)); }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    try {
      await remove.mutateAsync(confirmDelete.id);
      toast.success("Đã xoá quán.");
    } catch (e) { toast.error(apiErrorMessage(e)); }
    setConfirmDelete(null);
  };

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-extrabold">Gian hàng của tôi</h1>
          <p className="text-xs text-muted-foreground">Quản lý các quán bạn đã đăng ký trên HoLa Market</p>
        </div>
        <Button asChild size="sm" className="rounded-full">
          <Link to="/shop-owner/shops/new"><Plus className="size-4" /> Thêm</Link>
        </Button>
      </div>


        {shops.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        ) : !shops.data?.length ? (
          <EmptyPromo />
        ) : (
          <div className="space-y-3">
            {shops.data.map((s) => {
              const ap = APPROVAL[s.approvalStatus ?? "pending"] ?? APPROVAL.pending;
              const op = OPERATION[s.operationStatus ?? "active"] ?? OPERATION.active;
              const canDelete = s.approvalStatus !== "approved";
              return (
                <div key={s.id} className="rounded-2xl bg-card p-4 shadow-card">
                  <div className="flex items-start gap-3">
                    <img src={s.logoUrl} alt={s.name} className="size-14 shrink-0 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-bold">{s.name}</span>
                        <Badge variant={ap.tone}>{ap.label}</Badge>
                        <Badge variant={op.tone}>{op.label}</Badge>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{s.address}</p>
                      {s.approvalStatus === "rejected" && s.rejectionReason && (
                        <p className="mt-1 text-xs text-destructive">Lý do từ chối: {s.rejectionReason}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link to="/shop-owner/shops/$shopId/edit" params={{ shopId: s.id }}>
                        <Pencil className="size-4" /> Sửa
                      </Link>
                    </Button>
                    {s.approvalStatus === "approved" && s.operationStatus === "active" && (
                      <Button variant="outline" size="sm" onClick={() => doAction(s.id, "pause")}>
                        <Pause className="size-4" /> Tạm nghỉ
                      </Button>
                    )}
                    {s.approvalStatus === "approved" && s.operationStatus === "paused" && (
                      <Button variant="outline" size="sm" onClick={() => doAction(s.id, "reopen")}>
                        <Play className="size-4" /> Mở lại
                      </Button>
                    )}
                    {(s.approvalStatus === "rejected" || s.approvalStatus === "draft") && (
                      <Button size="sm" onClick={() => doAction(s.id, "submit")}>
                        <Send className="size-4" /> Gửi duyệt lại
                      </Button>
                    )}
                    {canDelete && (
                      <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(s)}>
                        <Trash2 className="size-4" /> Xoá
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}


      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá gian hàng?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xoá <b>{confirmDelete?.name}</b>? Chỉ quán chưa được duyệt và chưa có đơn hàng
              mới có thể xoá vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} disabled={remove.isPending}>
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function EmptyPromo() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-6 text-center shadow-card">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Store className="size-7" />
      </div>
      <h2 className="mt-3 text-lg font-extrabold">Trở thành đối tác HoLa Market</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Đăng ký gian hàng để tiếp cận sinh viên, dân văn phòng quanh khu Hòa Lạc.
        Hồ sơ sẽ được duyệt trong 1-2 ngày làm việc.
      </p>
      <Button asChild className="mt-4 rounded-full px-6">
        <Link to="/shop-owner/shops/new"><Plus className="size-4" /> Đăng ký gian hàng</Link>
      </Button>
    </div>
  );
}
