import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useAdminZones, useAdminZoneMutations } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { formatVND } from "@/lib/domain";
import type { DeliveryZoneDto } from "@/lib/api/types";

export const Route = createFileRoute("/admin/delivery-zones")({
  component: AdminZones,
});

function AdminZones() {
  const zones = useAdminZones();
  const { create, update, remove } = useAdminZoneMutations();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [fee, setFee] = useState(15000);

  const [editing, setEditing] = useState<DeliveryZoneDto | null>(null);
  const [editName, setEditName] = useState("");
  const [editShort, setEditShort] = useState("");
  const [editFee, setEditFee] = useState(0);
  const [deleting, setDeleting] = useState<DeliveryZoneDto | null>(null);

  const openEdit = (z: DeliveryZoneDto) => {
    setEditing(z);
    setEditName(z.name);
    setEditShort(z.shortName);
    setEditFee(z.baseDeliveryFee);
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!editName.trim() || !editShort.trim()) {
      toast.error("Nhập đủ tên.");
      return;
    }
    if (editFee < 0) {
      toast.error("Phí không được âm.");
      return;
    }
    try {
      await update.mutateAsync({
        id: editing.id,
        body: {
          name: editName.trim(),
          shortName: editShort.trim(),
          baseDeliveryFee: editFee,
        },
      });
      toast.success("Đã cập nhật khu vực", { description: editName.trim() });
      setEditing(null);
    } catch (e) {
      toast.error("Cập nhật khu vực thất bại", { description: apiErrorMessage(e) });
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      toast.success("Đã xóa khu vực", { description: deleting.name });
      setDeleting(null);
    } catch (e) {
      toast.error("Xóa khu vực thất bại", { description: apiErrorMessage(e) });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{zones.data?.length ?? 0} khu vực giao</div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" /> Thêm khu vực
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm khu vực giao hàng</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Tên đầy đủ</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Tên rút gọn</Label>
                <Input value={shortName} onChange={(e) => setShortName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Phí giao (VND)</Label>
                <Input
                  type="number"
                  min={0}
                  value={fee}
                  onChange={(e) => setFee(Math.max(0, Number(e.target.value)))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={async () => {
                  if (!name.trim() || !shortName.trim()) {
                    toast.error("Nhập đủ tên.");
                    return;
                  }
                  if (fee < 0) {
                    toast.error("Phí không được âm.");
                    return;
                  }
                  try {
                    await create.mutateAsync({
                      name: name.trim(),
                      shortName: shortName.trim(),
                      baseDeliveryFee: fee,
                    });
                    toast.success("Đã tạo khu vực", { description: name.trim() });
                    setOpen(false);
                    setName("");
                    setShortName("");
                    setFee(15000);
                  } catch (e) {
                    toast.error("Tạo khu vực thất bại", { description: apiErrorMessage(e) });
                  }
                }}
                disabled={create.isPending}
              >
                Tạo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="px-4 pt-2">
          <InlineFetchingBar show={zones.isFetching && !zones.isLoading} />
        </div>
        {zones.isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : !zones.data?.length ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Chưa có khu vực.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Rút gọn</TableHead>
                <TableHead>Phí giao</TableHead>
                <TableHead>Đang bật</TableHead>
                <TableHead className="w-24 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {zones.data.map((z) => (
                <TableRow key={z.id}>
                  <TableCell className="font-semibold">{z.name}</TableCell>
                  <TableCell className="text-sm">{z.shortName}</TableCell>
                  <TableCell className="text-sm">{formatVND(z.baseDeliveryFee)}</TableCell>
                  <TableCell>
                    <Switch
                      checked={z.active}
                      onCheckedChange={async (v) => {
                        try {
                          await update.mutateAsync({ id: z.id, body: { active: v } });
                          toast.success(v ? "Đã bật khu vực" : "Đã tắt khu vực", {
                            description: z.name,
                          });
                        } catch (e) {
                          toast.error("Cập nhật khu vực thất bại", {
                            description: apiErrorMessage(e),
                          });
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(z)}
                        aria-label="Sửa"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleting(z)}
                        aria-label="Xóa"
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa khu vực</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Tên đầy đủ</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Tên rút gọn</Label>
              <Input value={editShort} onChange={(e) => setEditShort(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Phí giao (VND)</Label>
              <Input
                type="number"
                min={0}
                value={editFee}
                onChange={(e) => setEditFee(Math.max(0, Number(e.target.value)))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Hủy
            </Button>
            <Button onClick={saveEdit} disabled={update.isPending}>
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa khu vực {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Không thể hoàn tác. Nếu có quán đang hỗ trợ khu vực này, thao tác sẽ bị từ chối.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={remove.isPending}>
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
