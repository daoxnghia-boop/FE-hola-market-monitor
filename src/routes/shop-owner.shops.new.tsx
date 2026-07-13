import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories, useDeliveryZones, useCreateOwnerShop, useSession } from "@/lib/api/hooks";
import { useRequireAuth } from "@/lib/require-auth";
import { apiErrorMessage } from "@/lib/api/client";

export const Route = createFileRoute("/shop-owner/shops/new")({
  head: () => ({ meta: [{ title: "Đăng ký gian hàng — HoLa Market" }] }),
  component: NewShopPage,
});

const phoneRegex = /^0\d{9}$/;

const schema = z.object({
  name: z.string().trim().min(2, "Tối thiểu 2 ký tự").max(80, "Tối đa 80 ký tự"),
  ownerName: z.string().trim().min(2, "Vui lòng nhập họ tên chủ quán").max(80),
  ownerPhone: z.string().trim().regex(phoneRegex, "SĐT chủ quán chưa hợp lệ (10 số, bắt đầu 0)"),
  phone: z.string().trim().regex(phoneRegex, "SĐT liên hệ chưa hợp lệ"),
  address: z.string().trim().min(4, "Vui lòng nhập địa chỉ"),
  area: z.string().trim().min(1, "Vui lòng nhập khu vực"),
  description: z.string().trim().max(400, "Tối đa 400 ký tự"),
  logoUrl: z.string().trim().url("URL logo không hợp lệ").or(z.literal("")),
  coverUrl: z.string().trim().url("URL ảnh bìa không hợp lệ").or(z.literal("")),
  openHoursText: z.string().trim().min(1, "Vui lòng nhập giờ mở cửa"),
  prepTimeMinutes: z.coerce.number().int().min(1, "Phải > 0").max(180, "Tối đa 180 phút"),
  categoryIds: z.array(z.string()).min(1, "Chọn ít nhất 1 danh mục"),
  supportedZoneIds: z.array(z.string()).min(1, "Chọn ít nhất 1 khu vực giao"),
  acceptedTerms: z.boolean().refine((v) => v === true, "Bạn cần đồng ý điều khoản"),
});

type FormValues = z.infer<typeof schema>;

function NewShopPage() {
  useRequireAuth();
  const session = useSession();
  const user = session.data?.user;
  const categories = useCategories();
  const zones = useDeliveryZones();
  const create = useCreateOwnerShop();
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      ownerName: user?.fullName ?? "",
      ownerPhone: user?.phone ?? "",
      phone: user?.phone ?? "",
      address: "",
      area: "",
      description: "",
      logoUrl: "",
      coverUrl: "",
      openHoursText: "08:00 – 21:00",
      prepTimeMinutes: 15,
      categoryIds: [],
      supportedZoneIds: [],
      acceptedTerms: false,
    },
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = form;

  const categoryIds = watch("categoryIds");
  const supportedZoneIds = watch("supportedZoneIds");
  const acceptedTerms = watch("acceptedTerms");

  const onSubmit = async (values: FormValues) => {
    try {
      const shop = await create.mutateAsync({ ...values, acceptedTerms: true });
      toast.success("Đã gửi hồ sơ. Chúng tôi sẽ duyệt trong 1-2 ngày làm việc.");
      navigate({ to: "/shop-owner", search: {} as never, params: {} as never, replace: true });
      void shop;
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const toggle = (field: "categoryIds" | "supportedZoneIds", id: string) => {
    const cur = form.getValues(field) as string[];
    setValue(field, cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id], {
      shouldValidate: true,
    });
  };

  return (
    <div className="px-4 py-5">
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/shop-owner">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-extrabold">Đăng ký gian hàng</h1>
          <p className="text-xs text-muted-foreground">Điền thông tin để gửi hồ sơ duyệt</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Section title="Thông tin quán">
          <Field label="Tên quán" error={errors.name?.message}>
            <Input {...register("name")} placeholder="Ví dụ: Cơm Nhà Lan" />
          </Field>
          <Field label="Địa chỉ" error={errors.address?.message}>
            <Input {...register("address")} placeholder="Số nhà, đường, khu" />
          </Field>
          <Field label="Khu vực (ĐH FPT, VP Hòa Lạc, ...)" error={errors.area?.message}>
            <Input {...register("area")} placeholder="ĐH FPT" />
          </Field>
          <Field label="Mô tả ngắn" error={errors.description?.message}>
            <Textarea
              rows={3}
              {...register("description")}
              placeholder="Món chủ đạo, phong cách quán..."
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Giờ mở cửa" error={errors.openHoursText?.message}>
              <Input {...register("openHoursText")} placeholder="08:00 – 21:00" />
            </Field>
            <Field label="TG chuẩn bị (phút)" error={errors.prepTimeMinutes?.message}>
              <Input type="number" min={1} {...register("prepTimeMinutes")} />
            </Field>
          </div>
        </Section>

        <Section title="Chủ quán & liên hệ">
          <Field label="Họ tên chủ quán" error={errors.ownerName?.message}>
            <Input {...register("ownerName")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="SĐT chủ quán" error={errors.ownerPhone?.message}>
              <Input inputMode="tel" {...register("ownerPhone")} />
            </Field>
            <Field label="SĐT liên hệ" error={errors.phone?.message}>
              <Input inputMode="tel" {...register("phone")} />
            </Field>
          </div>
        </Section>

        <Section title="Ảnh (tuỳ chọn)">
          <Field label="URL logo" error={errors.logoUrl?.message}>
            <Input {...register("logoUrl")} placeholder="https://..." />
          </Field>
          <Field label="URL ảnh bìa" error={errors.coverUrl?.message}>
            <Input {...register("coverUrl")} placeholder="https://..." />
          </Field>
          <p className="text-xs text-muted-foreground">Để trống sẽ dùng ảnh mẫu.</p>
        </Section>

        <Section title="Danh mục món">
          {categories.isLoading ? (
            <Skeleton className="h-10" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.data?.map((c) => {
                const on = categoryIds.includes(c.id);
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => toggle("categoryIds", c.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}
                  >
                    {c.iconText} {c.name}
                  </button>
                );
              })}
            </div>
          )}
          {errors.categoryIds && (
            <p className="text-xs text-destructive">{errors.categoryIds.message}</p>
          )}
        </Section>

        <Section title="Khu vực giao hàng">
          {zones.isLoading ? (
            <Skeleton className="h-10" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {zones.data?.map((z) => {
                const on = supportedZoneIds.includes(z.id);
                return (
                  <button
                    type="button"
                    key={z.id}
                    onClick={() => toggle("supportedZoneIds", z.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}
                  >
                    {z.name}
                  </button>
                );
              })}
            </div>
          )}
          {errors.supportedZoneIds && (
            <p className="text-xs text-destructive">{errors.supportedZoneIds.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Bạn sẽ cấu hình phí giao riêng cho từng khu vực trong màn Phí giao hàng của quán (sắp
            có).
          </p>
        </Section>

        <label className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-card">
          <Checkbox
            checked={!!acceptedTerms}
            onCheckedChange={(v) => setValue("acceptedTerms", v === true, { shouldValidate: true })}
          />
          <span className="text-sm">
            Tôi đồng ý với{" "}
            <a href="#" className="text-primary underline">
              điều khoản đối tác
            </a>{" "}
            của HoLa Market và cam kết thông tin gian hàng chính xác.
          </span>
        </label>
        {errors.acceptedTerms && (
          <p className="text-xs text-destructive">{errors.acceptedTerms.message}</p>
        )}

        <Button
          type="submit"
          className="h-12 w-full rounded-full text-base font-bold"
          disabled={isSubmitting || create.isPending}
        >
          {isSubmitting || create.isPending ? "Đang gửi..." : "Gửi hồ sơ đăng ký"}
        </Button>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl bg-card p-4 shadow-card">
      <h2 className="text-sm font-extrabold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
