import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnerShop, useUpdateOwnerShop } from "@/lib/api/hooks";
import { useRequireAuth } from "@/lib/require-auth";
import { apiErrorMessage } from "@/lib/api/client";

export const Route = createFileRoute("/shop-owner/shops/$shopId/edit")({
  head: () => ({ meta: [{ title: "Sửa gian hàng — HoLa Market" }] }),
  component: EditShopPage,
});

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  address: z.string().trim().min(4),
  phone: z.string().trim().regex(/^0\d{9}$/, "SĐT không hợp lệ"),
  description: z.string().trim().max(400),
  openHoursText: z.string().trim().min(1),
  prepTimeMinutes: z.coerce.number().int().min(1).max(180),
  logoUrl: z.string().trim().url().or(z.literal("")),
  coverUrl: z.string().trim().url().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

function EditShopPage() {
  useRequireAuth();
  const { shopId } = Route.useParams();
  const shop = useOwnerShop(shopId);
  const update = useUpdateOwnerShop();
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", address: "", phone: "", description: "",
      openHoursText: "", prepTimeMinutes: 15, logoUrl: "", coverUrl: "",
    },
  });
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = form;

  useEffect(() => {
    if (shop.data) {
      reset({
        name: shop.data.name, address: shop.data.address, phone: shop.data.phone,
        description: shop.data.description, openHoursText: shop.data.openHoursText,
        prepTimeMinutes: shop.data.prepTimeMinutes,
        logoUrl: shop.data.logoUrl.startsWith("http") ? shop.data.logoUrl : "",
        coverUrl: shop.data.coverUrl.startsWith("http") ? shop.data.coverUrl : "",
      });
    }
  }, [shop.data, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      await update.mutateAsync({ id: shopId, body: values });
      toast.success("Đã lưu thay đổi.");
      navigate({ to: "/shop-owner", replace: true });
    } catch (e) { toast.error(apiErrorMessage(e)); }
  };

  return (
    <AppShell>
      <div className="px-4 py-5">
        <div className="mb-4 flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/shop-owner"><ArrowLeft className="size-5" /></Link>
          </Button>
          <h1 className="text-xl font-extrabold">Sửa gian hàng</h1>
        </div>

        {shop.isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : !shop.data ? (
          <p className="text-sm text-muted-foreground">Không tìm thấy quán hoặc bạn không có quyền.</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Tên quán" error={errors.name?.message}>
              <Input {...register("name")} />
            </Field>
            <Field label="Địa chỉ" error={errors.address?.message}>
              <Input {...register("address")} />
            </Field>
            <Field label="SĐT liên hệ" error={errors.phone?.message}>
              <Input inputMode="tel" {...register("phone")} />
            </Field>
            <Field label="Mô tả" error={errors.description?.message}>
              <Textarea rows={3} {...register("description")} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Giờ mở cửa" error={errors.openHoursText?.message}>
                <Input {...register("openHoursText")} />
              </Field>
              <Field label="TG chuẩn bị (phút)" error={errors.prepTimeMinutes?.message}>
                <Input type="number" min={1} {...register("prepTimeMinutes")} />
              </Field>
            </div>
            <Field label="URL logo" error={errors.logoUrl?.message}>
              <Input {...register("logoUrl")} />
            </Field>
            <Field label="URL ảnh bìa" error={errors.coverUrl?.message}>
              <Input {...register("coverUrl")} />
            </Field>

            <Button type="submit" className="h-12 w-full rounded-full font-bold"
              disabled={isSubmitting || update.isPending}>
              {update.isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Đổi danh mục/khu vực hoặc chủ quán sẽ yêu cầu duyệt lại (chức năng chi tiết ở đợt sau).
            </p>
          </form>
        )}
      </div>
    </AppShell>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
