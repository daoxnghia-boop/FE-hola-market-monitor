import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, EyeOff, Eye } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useOwnerShops, useOwnerProducts, useOwnerProductMutations, useCategories,
} from "@/lib/api/hooks";
import { apiErrorMessage } from "@/lib/api/client";
import { formatVND } from "@/lib/domain";
import type { ProductDto } from "@/lib/api/types";

export const Route = createFileRoute("/shop-owner/products")({
  head: () => ({ meta: [{ title: "Món ăn — HoLa Đối tác" }] }),
  component: ProductsPage,
});

const schema = z.object({
  shopId: z.string().min(1, "Chọn quán"),
  name: z.string().trim().min(2, "Tối thiểu 2 ký tự").max(120),
  price: z.coerce.number().int().min(1000, "Tối thiểu 1.000đ"),
  description: z.string().max(400).optional().default(""),
  imageUrl: z.string().trim().url("URL không hợp lệ").or(z.literal("")).optional().default(""),
  categoryId: z.string().min(1, "Chọn danh mục"),
  prepTimeMinutes: z.coerce.number().int().min(1).max(180).default(10),
  available: z.boolean().default(true),
});
type FormValues = z.infer<typeof schema>;

function ProductsPage() {
  const shops = useOwnerShops();
  const categories = useCategories();
  const [shopFilter, setShopFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const products = useOwnerProducts(
    shopFilter === "all" ? { q } : { shopId: shopFilter, q },
  );
  const mut = useOwnerProductMutations();
  const [editing, setEditing] = useState<ProductDto | "new" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ProductDto | null>(null);

  const approvedShops = useMemo(
    () => (shops.data ?? []).filter((s) => s.approvalStatus === "approved"),
    [shops.data],
  );

  const toggleAvailable = async (p: ProductDto) => {
    try {
      await mut.update.mutateAsync({ id: p.id, body: { available: !p.available } });
      toast.success(!p.available ? "Đã bật bán" : "Đã tạm ngưng bán");
    } catch (e) { toast.error(apiErrorMessage(e)); }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    try {
      await mut.remove.mutateAsync(confirmDelete.id);
      toast.success("Đã xoá món.");
    } catch (e) { toast.error(apiErrorMessage(e)); }
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-xl font-extrabold">Món ăn</h1>
        <Button size="sm" className="rounded-full" onClick={() => setEditing("new")}
          disabled={approvedShops.length === 0}>
          <Plus className="size-4" /> Thêm món
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-card p-3 shadow-card">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên món" className="pl-9" />
        </div>
        <Select value={shopFilter} onValueChange={setShopFilter}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Chọn quán" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả quán của tôi</SelectItem>
            {(shops.data ?? []).map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {approvedShops.length === 0 && (
        <p className="rounded-2xl bg-warning/10 p-3 text-sm text-warning-foreground">
          Bạn cần có ít nhất 1 quán đã được duyệt để thêm món.
        </p>
      )}

      {products.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : !products.data?.length ? (
        <div className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-card">
          Không có món nào phù hợp.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.data.map((p) => {
            const shop = (shops.data ?? []).find((s) => s.id === p.shopId);
            return (
              <div key={p.id} className="rounded-2xl bg-card p-3 shadow-card">
                <div className="flex gap-3">
                  <img src={p.imageUrl} alt={p.name}
                    className="size-20 shrink-0 rounded-xl object-cover" loading="lazy" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <span className="line-clamp-1 font-bold">{p.name}</span>
                      {!p.available && <Badge variant="secondary">Tạm ngưng</Badge>}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      {shop?.name} · Đã bán {p.soldCount}
                    </div>
                    <div className="mt-1 font-bold text-primary">{formatVND(p.price)}</div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(p)}>
                    <Pencil className="size-4" /> Sửa
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggleAvailable(p)}>
                    {p.available ? <><EyeOff className="size-4" /> Tạm ngưng</> : <><Eye className="size-4" /> Bật bán</>}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(p)}>
                    <Trash2 className="size-4" /> Xoá
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ProductDialog
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        product={editing === "new" ? null : editing}
        shops={approvedShops}
        categories={categories.data ?? []}
        onSubmit={async (values) => {
          try {
            if (editing && editing !== "new") {
              await mut.update.mutateAsync({ id: editing.id, body: values });
              toast.success("Đã cập nhật món.");
            } else {
              await mut.create.mutateAsync(values);
              toast.success("Đã thêm món mới.");
            }
            setEditing(null);
          } catch (e) { toast.error(apiErrorMessage(e)); }
        }}
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá món?</AlertDialogTitle>
            <AlertDialogDescription>
              Món <b>{confirmDelete?.name}</b> sẽ bị xoá. Nếu món đã có trong đơn hàng cũ, hệ thống sẽ chặn xoá — hãy tạm ngưng bán thay vì xoá.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete}>Xoá</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProductDialog({
  open, onOpenChange, product, shops, categories, onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  product: ProductDto | null;
  shops: Array<{ id: string; name: string; prepTimeMinutes: number }>;
  categories: Array<{ id: string; name: string }>;
  onSubmit: (values: FormValues) => Promise<void>;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      shopId: product?.shopId ?? shops[0]?.id ?? "",
      name: product?.name ?? "",
      price: product?.price ?? 0,
      description: product?.description ?? "",
      imageUrl: product?.imageUrl ?? "",
      categoryId: product?.categoryId ?? categories[0]?.id ?? "",
      prepTimeMinutes: product?.prepTimeMinutes ?? 10,
      available: product?.available ?? true,
    },
  });
  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue } = form;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{product ? "Sửa món" : "Thêm món mới"}</DialogTitle>
          <DialogDescription>
            Món mới sẽ hiển thị ngay trên gian hàng nếu quán đã được duyệt.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Quán</Label>
              <Select value={watch("shopId")}
                onValueChange={(v) => setValue("shopId", v, { shouldValidate: true })}
                disabled={!!product}>
                <SelectTrigger><SelectValue placeholder="Chọn quán" /></SelectTrigger>
                <SelectContent>
                  {shops.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.shopId && <p className="text-xs text-destructive">{errors.shopId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Danh mục</Label>
              <Select value={watch("categoryId")}
                onValueChange={(v) => setValue("categoryId", v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Tên món</Label>
            <Input {...register("name")} placeholder="Cơm gà xối mỡ" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Giá (đồng)</Label>
              <Input type="number" min={1000} step={1000} {...register("price")} />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>TG chuẩn bị (phút)</Label>
              <Input type="number" min={1} {...register("prepTimeMinutes")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Mô tả</Label>
            <Textarea rows={3} {...register("description")} placeholder="Nguyên liệu, khẩu phần..." />
          </div>

          <div className="space-y-1.5">
            <Label>URL ảnh</Label>
            <Input {...register("imageUrl")} placeholder="https://..." />
            {errors.imageUrl && <p className="text-xs text-destructive">{errors.imageUrl.message}</p>}
            <p className="text-xs text-muted-foreground">Để trống sẽ dùng ảnh mẫu.</p>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4"
              checked={watch("available")}
              onChange={(e) => setValue("available", e.target.checked)} />
            Đang bán
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Huỷ</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : (product ? "Lưu thay đổi" : "Thêm món")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
