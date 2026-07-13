import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeliveryZones, useOwnerShop, useUpdateOwnerShop } from "@/lib/api/hooks";
import { useRequireAuth } from "@/lib/require-auth";
import { apiErrorMessage } from "@/lib/api/client";
import { formatVND } from "@/lib/domain";


export const Route = createFileRoute("/shop-owner/shops/$shopId/edit")({
  head: () => ({ meta: [{ title: "Sửa gian hàng — HoLa Market" }] }),
  component: EditShopPage,
});

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  address: z.string().trim().min(4),
  phone: z
    .string()
    .trim()
    .regex(/^0\d{9}$/, "SĐT không hợp lệ"),
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
  const zones = useDeliveryZones();
  const update = useUpdateOwnerShop();
  const navigate = useNavigate();

  // Managed separately from RHF because supportedZoneIds/deliveryFees are edited via checkbox UI.
  const [supportedZoneIds, setSupportedZoneIds] = useState<string[]>([]);
  const [deliveryFees, setDeliveryFees] = useState<Record<string, number>>({});



  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      description: "",
      openHoursText: "",
      prepTimeMinutes: 15,
      logoUrl: "",
      coverUrl: "",
    },
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = form;

  useEffect(() => {
    if (shop.data) {
      reset({
        name: shop.data.name,
        address: shop.data.address,
        phone: shop.data.phone,
        description: shop.data.description,
        openHoursText: shop.data.openHoursText,
        prepTimeMinutes: shop.data.prepTimeMinutes,
        logoUrl: shop.data.logoUrl.startsWith("http") ? shop.data.logoUrl : "",
        coverUrl: shop.data.coverUrl.startsWith("http") ? shop.data.coverUrl : "",
      });
      setSupportedZoneIds(shop.data.supportedZoneIds);
      setDeliveryFees({ ...(shop.data.deliveryFees ?? {}) });
    }
  }, [shop.data, reset]);

  const toggleZone = (zoneId: string, baseFee: number) => {
    setSupportedZoneIds((cur) => {
      const isOn = cur.includes(zoneId);
      const next = isOn ? cur.filter((x) => x !== zoneId) : [...cur, zoneId];
      setDeliveryFees((f) => {
        const nf = { ...f };
        if (isOn) delete nf[zoneId];
        else if (nf[zoneId] === undefined) nf[zoneId] = baseFee;
        return nf;
      });
      return next;
    });
  };

  const onSubmit = async (values: FormValues) => {
    if (supportedZoneIds.length === 0) {
      toast.error("Chọn ít nhất 1 khu vực giao.");
      return;
    }
    const fees: Record<string, number> = {};
    for (const id of supportedZoneIds) {
      const raw = deliveryFees[id];
      if (typeof raw === "number") fees[id] = Math.max(0, Math.floor(raw));
    }
    try {
      await update.mutateAsync({
        id: shopId,
        body: { ...values, supportedZoneIds, deliveryFees: fees },
      });
      toast.success("Đã lưu thay đổi.");
      navigate({ to: "/shop-owner", replace: true });
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };



  return (
    <div className="px-4 py-5">
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/shop-owner">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-extrabold">Sửa gian hàng</h1>
      </div>

      {shop.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : !shop.data ? (
        <p className="text-sm text-muted-foreground">
          Không tìm thấy quán hoặc bạn không có quyền.
        </p>
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

          <div className="space-y-3 rounded-2xl border border-border bg-background/40 p-4">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-muted-foreground">
                Khu vực giao & phí giao riêng
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Bật/tắt khu vực và đặt phí giao dành cho quán của bạn. Nếu để trống, hệ thống sẽ dùng phí chuẩn của khu.
              </p>
            </div>
            {zones.isLoading ? (
              <Skeleton className="h-16" />
            ) : (
              <div className="space-y-2">
                {zones.data?.map((z) => {
                  const on = supportedZoneIds.includes(z.id);
                  return (
                    <div
                      key={z.id}
                      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggleZone(z.id, z.baseDeliveryFee)}
                        className="size-4 accent-primary"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{z.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          Phí chuẩn khu: {formatVND(z.baseDeliveryFee)}
                        </div>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        step={1000}
                        disabled={!on}
                        className="h-9 w-28"
                        value={on ? (deliveryFees[z.id] ?? z.baseDeliveryFee) : ""}
                        onChange={(e) =>
                          setDeliveryFees((f) => ({
                            ...f,
                            [z.id]: Math.max(0, Number(e.target.value) || 0),
                          }))
                        }
                        placeholder={formatVND(z.baseDeliveryFee)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="h-12 w-full rounded-full font-bold"
            disabled={isSubmitting || update.isPending}
          >
            {update.isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Đổi danh mục hoặc chủ quán vẫn cần chờ đợt sau. Cập nhật phí giao có hiệu lực ngay khi lưu.
          </p>
        </form>
      )}
    </div>

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
