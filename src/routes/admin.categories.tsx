import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useAdminCategories, useAdminCategoryMutations } from "@/lib/api/hooks";
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
import { apiErrorMessage } from "@/lib/api/client";

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategories,
});

function AdminCategories() {
  const cats = useAdminCategories();
  const { create, update } = useAdminCategoryMutations();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🍽️");
  const [sortOrder, setSortOrder] = useState(10);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{cats.data?.length ?? 0} danh mục</div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" /> Thêm danh mục
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm danh mục</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Tên</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Emoji</Label>
                <Input value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={4} />
              </div>
              <div className="space-y-1">
                <Label>Thứ tự</Label>
                <Input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={async () => {
                  if (!name.trim()) {
                    toast.error("Nhập tên danh mục.");
                    return;
                  }
                  try {
                    await create.mutateAsync({ name: name.trim(), iconText: icon, sortOrder });
                    toast.success("Đã tạo danh mục", { description: name.trim() });
                    setOpen(false);
                    setName("");
                    setSortOrder(10);
                  } catch (e) {
                    toast.error("Tạo danh mục thất bại", { description: apiErrorMessage(e) });
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
        <div className="px-4 pt-2"><InlineFetchingBar show={cats.isFetching && !cats.isLoading} /></div>
        {cats.isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : !cats.data?.length ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Chưa có danh mục.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Icon</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Thứ tự</TableHead>
                <TableHead>Hiển thị</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cats.data.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-xl">{c.iconText}</TableCell>
                  <TableCell className="font-semibold">{c.name}</TableCell>
                  <TableCell className="text-sm">{c.sortOrder}</TableCell>
                  <TableCell>
                    <Switch
                      checked={c.active !== false}
                      onCheckedChange={async (v) => {
                        try {
                          await update.mutateAsync({ id: c.id, body: { active: v } });
                          toast.success(v ? "Đã hiện danh mục" : "Đã ẩn danh mục", {
                            description: c.name,
                          });
                        } catch (e) {
                          toast.error("Cập nhật danh mục thất bại", {
                            description: apiErrorMessage(e),
                          });
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
