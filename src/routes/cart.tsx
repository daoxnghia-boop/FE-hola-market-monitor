import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, MapPin, Ticket, Wallet, Bike, ShoppingBag, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CartItem } from "@/components/cart-item";
import { EmptyState } from "@/components/empty-state";
import { VoucherCard } from "@/components/voucher-card";
import { ZonePicker } from "@/components/zone-picker";
import { Button } from "@/components/ui/button";
import {
  cartStore,
  useCart,
  useCartItems,
  useCartPricing,
} from "@/lib/cart-store";
import { formatVND, getShop, vouchers, voucherStatusFor } from "@/lib/mock-data";
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
  const pricing = useCartPricing();
  const navigate = useNavigate();

  const shop = cart.shopId ? getShop(cart.shopId) : null;
  const supported = shop ? shop.supportedZones.includes(pricing.zone.id) : true;

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

  const handleContinue = () => {
    if (!supported) {
      toast.error("Quán chưa giao tới khu này. Hãy đổi khu giao.");
      return;
    }
    navigate({ to: "/checkout" });
  };

  return (
    <AppShell>
      <PageHeader title="Giỏ hàng" />

      <div className="grid gap-4 px-4 pb-36 md:grid-cols-[1.5fr_1fr] md:pb-12">
        {/* Left */}
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
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span
                  className={
                    shop.status === "open" && shop.isOpen
                      ? "text-success"
                      : "text-muted-foreground"
                  }
                >
                  ● {shop.status === "open" && shop.isOpen ? "Đang mở" : "Tạm nghỉ"}
                </span>
                <span>• Dự kiến ~{shop.prepTime} phút</span>
              </div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>

          {/* Delivery zone */}
          <ZonePicker
            trigger={
              <button className="flex w-full items-center gap-3 rounded-2xl bg-card p-3 text-left shadow-card hover:shadow-pop">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <MapPin className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-muted-foreground">Giao đến</div>
                  <div className="truncate font-semibold">{pricing.zone.name}</div>
                </div>
                <span className="text-xs font-semibold text-primary">Đổi</span>
              </button>
            }
          />

          {!supported && (
            <div className="rounded-2xl bg-warning/10 p-3 text-sm text-warning">
              Quán chưa hỗ trợ giao tới <b>{pricing.zone.name}</b>. Vui lòng đổi khu giao
              hoặc chọn quán khác.
            </div>
          )}

          {/* Items */}
          <div className="space-y-3">
            {items.map((it) => (
              <CartItem key={it.productId} item={it} />
            ))}
          </div>

          {/* Voucher */}
          <div className="rounded-2xl bg-card p-4 shadow-card">
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <Ticket className="size-4 text-primary" /> Ưu đãi
            </h3>
            <div className="space-y-2">
              {vouchers.map((v) => {
                const status = voucherStatusFor(v, pricing.subtotal);
                const usable = status === "usable" || status === "soon_expire";
                const active = cart.voucherCode === v.code;
                return (
                  <VoucherCard
                    key={v.id}
                    voucher={v}
                    subtotal={pricing.subtotal}
                    active={active}
                    onApply={() => {
                      if (active) {
                        cartStore.setVoucher(null);
                        toast.success("Đã bỏ áp dụng voucher");
                        return;
                      }
                      if (!usable) {
                        toast.error(
                          status === "not_eligible"
                            ? "Đơn hàng chưa đủ điều kiện áp dụng voucher"
                            : "Voucher chưa thể dùng",
                        );
                        return;
                      }
                      cartStore.setVoucher(v.code);
                      toast.success("Đã áp dụng voucher");
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Right summary */}
        <aside className="space-y-3 md:sticky md:top-20 md:self-start">
          <div className="space-y-2 rounded-2xl bg-card p-4 shadow-card">
            <h3 className="mb-1 font-semibold">Tóm tắt đơn</h3>
            <Row label="Tiền món" value={formatVND(pricing.subtotal)} />
            {pricing.voucher && (
              <Row
                label={`Voucher (${pricing.voucher.code})`}
                value={`-${formatVND(pricing.discount)}`}
                accent="success"
              />
            )}
            <Row label="Phí giao hàng" value={formatVND(pricing.shipFee)} />
            <div className="my-2 border-t border-dashed" />
            <Row label="Tổng cần trả" value={formatVND(pricing.total)} bold />

            <div className="space-y-2 rounded-xl bg-accent p-3 text-xs text-accent-foreground">
              <div className="flex items-center gap-2 font-semibold">
                <Wallet className="size-4" />
                Thanh toán trực tiếp cho quán khi nhận hàng
              </div>
              <div className="flex items-center gap-2 font-semibold">
                <Bike className="size-4" />
                Quán tự giao hàng
              </div>
            </div>
          </div>

          <Button
            size="lg"
            className="hidden h-12 w-full rounded-full text-base font-bold md:flex"
            onClick={handleContinue}
            disabled={!supported}
          >
            Tiếp tục đặt hàng · {formatVND(pricing.total)}
          </Button>
        </aside>
      </div>

      {/* Mobile sticky CTA */}
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
            onClick={handleContinue}
            disabled={!supported}
            className="h-12 flex-[1.2] rounded-full text-base font-bold"
          >
            Tiếp tục
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
