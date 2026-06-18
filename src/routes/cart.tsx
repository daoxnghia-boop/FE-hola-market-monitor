import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, MapPin, Ticket, Wallet, Bike, ShoppingBag } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CartItem } from "@/components/cart-item";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCart, useCartItems, useCartTotal, cartStore } from "@/lib/cart-store";
import { formatVND, getShop, vouchers } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Giỏ hàng — Ăn Hòa Lạc" },
      { name: "description", content: "Xem lại đơn hàng và đặt giao tới nơi của bạn." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const cart = useCart();
  const items = useCartItems();
  const subtotal = useCartTotal();
  const navigate = useNavigate();

  const shop = cart.shopId ? getShop(cart.shopId) : null;

  const [name, setName] = useState("Nguyễn Văn A");
  const [phone, setPhone] = useState("0987 654 321");
  const [address, setAddress] = useState("KTX FPT, Hòa Lạc, Thạch Thất, HN");
  const [note, setNote] = useState("");
  const [voucherCode, setVoucherCode] = useState("");

  const discount = voucherCode.toUpperCase() === "HOALAC10" ? 10000 : 0;
  const total = Math.max(0, subtotal - discount);

  if (items.length === 0 || !shop) {
    return (
      <AppShell>
        <PageHeader title="Giỏ hàng" />
        <div className="px-4 pb-8">
          <EmptyState
            icon={<ShoppingBag className="size-6" />}
            title="Giỏ hàng đang trống"
            description="Khám phá quán quanh bạn và thêm món yêu thích nhé!"
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

  const handlePlaceOrder = () => {
    if (!name.trim() || !phone.trim() || !address.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin giao hàng");
      return;
    }
    cartStore.clear();
    toast.success("Đặt đơn thành công!");
    navigate({ to: "/orders/$orderId", params: { orderId: "DH240618" } });
  };

  return (
    <AppShell>
      <PageHeader title="Giỏ hàng & Thanh toán" />

      <div className="grid gap-4 px-4 pb-32 md:grid-cols-[1.5fr_1fr] md:pb-12">
        {/* Left: items + info */}
        <div className="space-y-4">
          {/* Shop */}
          <Link
            to="/shops/$shopId"
            params={{ shopId: shop.id }}
            className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card"
          >
            <img src={shop.logo} alt="" className="size-12 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{shop.name}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" /> {shop.area} · {shop.distanceKm} km
              </div>
            </div>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
              Sửa
            </span>
          </Link>

          {/* Items */}
          <div className="space-y-3">
            {items.map((it) => (
              <CartItem key={it.productId} item={it} />
            ))}
          </div>

          {/* Delivery info */}
          <div className="space-y-3 rounded-2xl bg-card p-4 shadow-card">
            <h3 className="font-semibold">Thông tin giao hàng</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Họ tên">
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Số điện thoại">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </Field>
              <Field label="Địa chỉ nhận" className="sm:col-span-2">
                <Input value={address} onChange={(e) => setAddress(e.target.value)} />
              </Field>
              <Field label="Ghi chú cho quán" className="sm:col-span-2">
                <Textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="VD: Ít cay, thêm tương ớt..."
                />
              </Field>
            </div>
          </div>

          {/* Voucher */}
          <div className="rounded-2xl bg-card p-4 shadow-card">
            <h3 className="mb-2 flex items-center gap-2 font-semibold">
              <Ticket className="size-4 text-primary" /> Mã ưu đãi
            </h3>
            <div className="flex gap-2">
              <Input
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                placeholder="Nhập mã (vd: HOALAC10)"
                className="uppercase"
              />
              <Button
                variant={discount > 0 ? "secondary" : "outline"}
                onClick={() => {
                  if (discount > 0) toast.success("Đã áp dụng mã ưu đãi");
                  else toast.error("Mã không hợp lệ hoặc chưa nhập");
                }}
              >
                Áp dụng
              </Button>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {vouchers.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVoucherCode(v.code)}
                  className="shrink-0 rounded-full border border-dashed border-primary/50 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary"
                >
                  {v.discountText} · {v.code}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: summary */}
        <aside className="space-y-3 md:sticky md:top-20 md:self-start">
          <div className="space-y-3 rounded-2xl bg-card p-4 shadow-card">
            <h3 className="font-semibold">Tóm tắt đơn</h3>
            <Row label="Tạm tính" value={formatVND(subtotal)} />
            <Row label="Phí giao hàng" value="Quán tự giao" hint />
            {discount > 0 && (
              <Row
                label={`Ưu đãi (${voucherCode.toUpperCase()})`}
                value={`-${formatVND(discount)}`}
                accent="success"
              />
            )}
            <div className="my-2 border-t border-dashed" />
            <Row label="Tổng cộng" value={formatVND(total)} bold />

            <div className="space-y-2 rounded-xl bg-accent p-3 text-xs text-accent-foreground">
              <div className="flex items-center gap-2 font-semibold">
                <Wallet className="size-4" />
                Thanh toán trực tiếp cho quán
              </div>
              <div className="flex items-center gap-2 font-semibold">
                <Bike className="size-4" />
                Quán tự giao hàng — không phụ phí
              </div>
            </div>
          </div>

          <Button
            size="lg"
            className="hidden h-12 w-full rounded-full text-base font-bold md:flex"
            onClick={handlePlaceOrder}
          >
            Đặt đơn · {formatVND(total)}
          </Button>
        </aside>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-card/95 p-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Tổng
            </div>
            <div className="truncate text-lg font-extrabold text-primary">
              {formatVND(total)}
            </div>
          </div>
          <Button
            size="lg"
            onClick={handlePlaceOrder}
            className="h-12 flex-1 rounded-full text-base font-bold"
          >
            Đặt đơn ngay
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function PageHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <Link
        to="/"
        className="grid size-9 place-items-center rounded-full bg-card shadow-card md:hidden"
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
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={"block space-y-1 text-sm " + (className ?? "")}>
      <span className="font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Row({
  label,
  value,
  bold,
  hint,
  accent,
}: {
  label: string;
  value: string;
  bold?: boolean;
  hint?: boolean;
  accent?: "success";
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={hint ? "text-muted-foreground" : ""}>{label}</span>
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
