import { useRequireAuth } from "@/lib/require-auth";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Bike, MapPin, Phone, ShoppingBag, User, Wallet } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CartItem } from "@/components/cart-item";
import { EmptyState } from "@/components/empty-state";
import { ZonePicker } from "@/components/zone-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCart, useCartItems, useCartPricing } from "@/lib/cart-store";
import { formatVND } from "@/lib/domain";
import { useAddresses, useCartQuery, useCreateOrder, useSession } from "@/lib/api/hooks";
import { apiErrorMessage } from "@/lib/api/client";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Xác nhận đặt hàng — Ăn Hòa Lạc" },
      { name: "description", content: "Xác nhận thông tin và gửi đơn cho quán." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const cart = useCart();
  const items = useCartItems();
  const pricing = useCartPricing();
  const cartQuery = useCartQuery();
  const session = useSession();
  const addresses = useAddresses();
  const createOrder = useCreateOrder();
  const navigate = useNavigate();
  const shop = cart.shop;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    const saved = addresses.data?.find((item) => item.isDefault) ?? addresses.data?.[0];
    setName((current) => current || saved?.recipientName || session.data?.user?.fullName || "");
    setPhone((current) => current || saved?.phone || session.data?.user?.phone || "");
    setAddress((current) => current || saved?.addressLine || "");
  }, [addresses.data, session.data?.user]);

  if (cartQuery.isLoading)
    return (
      <AppShell>
        <Header title="Xác nhận đặt hàng" />
        <div className="px-4 text-sm text-muted-foreground">Đang tải thông tin đơn...</div>
      </AppShell>
    );

  if (items.length === 0 || !shop) {
    return (
      <AppShell>
        <Header title="Xác nhận đặt hàng" />
        <div className="px-4 pb-8">
          <EmptyState
            icon={<ShoppingBag className="size-6" />}
            title="Giỏ hàng trống"
            description="Hãy chọn món trước khi xác nhận đặt hàng."
            action={
              <Button asChild className="rounded-full">
                <Link to="/">Khám phá quán ăn</Link>
              </Button>
            }
          />
        </div>
      </AppShell>
    );
  }

  const supported = shop.delivery?.supported ?? !cart.blockingReasons.includes("ZONE_UNSUPPORTED");

  const handlePlace = () => {
    if (!supported) {
      toast.error("Quán chưa giao tới khu này.");
      return;
    }
    if (!name.trim() || !phone.trim() || !address.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin nhận hàng");
      return;
    }
    if (!pricing.zone) return toast.error("Vui lòng chọn khu giao hàng");
    createOrder.mutate(
      {
        body: {
          cartId: cart.id,
          delivery: {
            deliveryZoneId: pricing.zone.id,
            recipientName: name.trim(),
            phone: phone.trim(),
            addressLine: address.trim(),
          },
          note: note.trim() || undefined,
          paymentMethod: "cash_on_delivery",
        },
        idempotencyKey: crypto.randomUUID(),
      },
      {
        onSuccess: (order) => {
          toast.success("Đã gửi đơn đến quán");
          navigate({ to: "/orders/$orderId", params: { orderId: order.id } });
        },
        onError: (error) => toast.error(apiErrorMessage(error)),
      },
    );
  };

  return (
    <AppShell>
      <Header title="Xác nhận đặt hàng" backTo="/cart" />

      <div className="grid gap-4 px-4 pb-32 md:grid-cols-[1.4fr_1fr] md:pb-12">
        <div className="space-y-4">
          {/* Shop */}
          <div className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card">
            <img src={shop.logoUrl} alt="" className="size-12 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{shop.name}</div>
              <div className="text-xs text-muted-foreground">
                {shop.estimatedDeliveryMinutes
                  ? `Dự kiến giao sau ~${shop.estimatedDeliveryMinutes} phút`
                  : `Chuẩn bị khoảng ${shop.prepTimeMinutes} phút`}
              </div>
            </div>
          </div>

          {/* Items recap */}
          <section className="rounded-2xl bg-card p-3 shadow-card">
            <h3 className="mb-2 px-1 text-sm font-semibold">Món đã chọn</h3>
            <div className="space-y-2">
              {items.map((it) => (
                <CartItem key={it.productId} item={it} editable={false} />
              ))}
            </div>
          </section>

          {/* Delivery info */}
          <section className="space-y-3 rounded-2xl bg-card p-4 shadow-card">
            <h3 className="font-semibold">Thông tin nhận hàng</h3>
            <ZonePicker
              trigger={
                <button className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border p-3 text-left">
                  <MapPin className="size-4 text-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-muted-foreground">Điểm giao</div>
                    <div className="truncate font-semibold">
                      {pricing.zone?.name || "Chọn khu giao hàng"}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-primary">Đổi</span>
                </button>
              }
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Họ tên" icon={<User className="size-3.5" />}>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Số điện thoại" icon={<Phone className="size-3.5" />}>
                <Input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </Field>
              <Field label="Địa chỉ chi tiết tại điểm giao" className="sm:col-span-2">
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="VD: Sảnh tầng 1, cổng B, phòng 305..."
                />
              </Field>
              <Field label="Ghi chú cho quán/giao hàng" className="sm:col-span-2">
                <Textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: giao tại sảnh, gọi trước khi đến..."
                />
              </Field>
            </div>
          </section>

          <section className="space-y-2 rounded-2xl bg-accent p-4 text-sm text-accent-foreground">
            <div className="flex items-center gap-2 font-semibold">
              <Wallet className="size-4" /> Thanh toán trực tiếp cho quán
            </div>
            <div className="flex items-center gap-2 font-semibold">
              <Bike className="size-4" /> Quán tự giao hàng
            </div>
          </section>
        </div>

        {/* Summary */}
        <aside className="space-y-3 md:sticky md:top-20 md:self-start">
          <div className="space-y-2 rounded-2xl bg-card p-4 shadow-card">
            <h3 className="mb-1 font-semibold">Tóm tắt thanh toán</h3>
            <Row label="Tiền món" value={formatVND(pricing.subtotal)} />
            {pricing.voucher && (
              <Row
                label={`Voucher (${pricing.voucher.code})`}
                value={`-${formatVND(pricing.discount)}`}
                accent="success"
              />
            )}
            <Row label="Phí ship" value={formatVND(pricing.shipFee)} />
            <div className="my-2 border-t border-dashed" />
            <Row label="Tổng cần trả" value={formatVND(pricing.total)} bold />
          </div>
          <Button
            size="lg"
            className="hidden h-12 w-full rounded-full text-base font-bold md:flex"
            onClick={handlePlace}
            disabled={!supported || !cart.canCheckout || createOrder.isPending}
          >
            Gửi đơn cho quán
          </Button>
        </aside>
      </div>

      {/* Mobile sticky */}
      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-card/95 p-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Tổng cần trả
            </div>
            <div className="truncate text-lg font-extrabold text-primary">
              {formatVND(pricing.total)}
            </div>
          </div>
          <Button
            size="lg"
            onClick={handlePlace}
            disabled={!supported || !cart.canCheckout || createOrder.isPending}
            className="h-12 flex-[1.4] rounded-full text-base font-bold"
          >
            Gửi đơn cho quán
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function Header({ title, backTo = "/" }: { title: string; backTo?: "/" | "/cart" }) {
  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <Link
        to={backTo}
        className="grid size-9 place-items-center rounded-full bg-card shadow-card md:hidden"
        aria-label="Quay lại"
      >
        <ArrowLeft className="size-4" />
      </Link>
      <h1 className="text-xl font-extrabold md:text-2xl">{title}</h1>
    </div>
  );
}

function Field({
  label,
  children,
  className,
  icon,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}) {
  return (
    <label className={"block space-y-1 text-sm " + (className ?? "")}>
      <span className="inline-flex items-center gap-1 font-medium text-muted-foreground">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}

function Row({
  label,
  value,
  bold,
  accent,
}: {
  label: string;
  value: string;
  bold?: boolean;
  accent?: "success";
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={bold ? "font-semibold" : ""}>{label}</span>
      <span
        className={[
          bold ? "text-lg font-extrabold text-primary" : "font-semibold",
          accent === "success" ? "text-success" : "",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}
