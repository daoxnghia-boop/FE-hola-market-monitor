import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useAdminZones, useAdminZoneMutations } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
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
import { apiErrorMessage } from "@/lib/api/client";
import { formatVND } from "@/lib/domain";

export const Route = createFileRoute("/admin/delivery-zones")({
  component: AdminZones,
});

function AdminZones() {
  const zones = useAdminZones();
  const { create, update } = useAdminZoneMutations();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [fee, setFee] = useState(15000);

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
                    toast.success("Đã tạo khu vực.");
                    setOpen(false);
                    setName("");
                    setShortName("");
                    setFee(15000);
                  } catch (e) {
                    toast.error(apiErrorMessage(e));
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
                          toast.success("Đã cập nhật.");
                        } catch (e) {
                          toast.error(apiErrorMessage(e));
                        }
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
