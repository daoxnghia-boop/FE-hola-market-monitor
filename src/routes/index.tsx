import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, ChevronRight, TrendingUp, Sparkles, Bell, Heart, Repeat } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SearchBar } from "@/components/search-bar";
import { CategoryTabs } from "@/components/category-tabs";
import { ShopCard } from "@/components/shop-card";
import { ProductCard } from "@/components/product-card";
import { ProductSheet } from "@/components/product-sheet";
import { VoucherCard } from "@/components/voucher-card";
import { BottomCartBar } from "@/components/bottom-cart-bar";
import { ZonePicker } from "@/components/zone-picker";
import { shops, products, vouchers, type Product } from "@/lib/mock-data";
import { useDeliveryZone } from "@/lib/cart-store";
import { useFavorites } from "@/lib/favorites-store";
import { useUnreadCount } from "@/lib/notifications-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ăn Hòa Lạc — Đặt món local quanh bạn" },
      {
        name: "description",
        content:
          "Khám phá quán ăn quanh Hòa Lạc: cơm, bún, bánh mì, trà sữa, ăn vặt. Đặt nhanh, theo dõi đơn dễ dàng.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [, setCategory] = useState<string>("all");
  const unread = useUnreadCount();
  const zone = useDeliveryZone();
  const favShops = useFavorites();

  const popular = [...products].sort((a, b) => b.soldCount - a.soldCount).slice(0, 6);
  const nearby = [...shops]
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 4);
  const favoriteShops = shops.filter((s) => favShops.includes(s.id)).slice(0, 4);
  const frequentProducts = [...products]
    .filter((p) => p.available)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4);

  const [selected, setSelected] = useState<Product | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const openProduct = (p: Product) => {
    setSelected(p);
    setSheetOpen(true);
  };

  return (
    <AppShell>
      <section className="bg-gradient-to-br from-primary to-primary/80 px-4 pb-5 pt-4 text-primary-foreground md:rounded-b-3xl md:px-6 md:pb-8 md:pt-8">
        <div className="flex items-center gap-3 md:hidden">
          <ZonePicker
            trigger={
              <button className="min-w-0 flex-1 text-left">
                <div className="flex items-center gap-1 text-[11px] opacity-90">
                  <MapPin className="size-3.5 shrink-0" />
                  <span className="truncate">Giao đến</span>
                  <ChevronRight className="size-3" />
                </div>
                <div className="truncate text-sm font-semibold underline-offset-2 hover:underline">
                  {zone.name}, Hòa Lạc
                </div>
              </button>
            }
          />
          <Link
            to="/notifications"
            aria-label="Thông báo"
            className="relative grid size-10 shrink-0 place-items-center rounded-full bg-white/15 backdrop-blur transition active:scale-95"
          >
            <Bell className="size-5" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-warning px-1 text-[10px] font-bold text-warning-foreground ring-2 ring-primary">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
        </div>
        <div className="mt-3 max-w-xl md:mt-0">
          <h1 className="text-xl font-extrabold leading-tight md:text-4xl">
            Đói rồi? Đặt ngay quán quanh bạn 🍜
          </h1>
          <p className="mt-1 text-xs opacity-90 md:text-base">
            Nhanh hơn nhắn Zalo, không sót đơn, theo dõi trạng thái rõ ràng.
          </p>
        </div>

        <div className="relative z-10 mt-4">
          <SearchBar to="/search" className="mx-auto max-w-2xl shadow-pop" />
        </div>
      </section>

      <section className="mt-6 px-4">
        <CategoryTabs onChange={setCategory} />
      </section>

      <section className="mt-6 px-4">
        <SectionHeader
          icon={<Sparkles className="size-4" />}
          title="Ưu đãi cho bạn"
          to="/vouchers"
        />
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {vouchers.map((v) => (
            <div key={v.id} className="w-[280px] shrink-0">
              <VoucherCard voucher={v} compact />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 px-4">
        <SectionHeader
          icon={<MapPin className="size-4" />}
          title="Quán gần bạn"
          to="/search"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {nearby.map((s) => (
            <ShopCard
              key={s.id}
              shop={s}
              supported={s.supportedZones.includes(zone.id)}
            />
          ))}
        </div>
      </section>

      <section className="mt-8 px-4">
        <SectionHeader
          icon={<Repeat className="size-4" />}
          title="Món bạn hay đặt"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {frequentProducts.map((p) => (
            <ProductCard key={p.id} product={p} onSelect={openProduct} />
          ))}
        </div>
      </section>

      {favoriteShops.length > 0 && (
        <section className="mt-8 px-4">
          <SectionHeader
            icon={<Heart className="size-4" />}
            title="Quán bạn yêu thích"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteShops.map((s) => (
              <ShopCard
                key={s.id}
                shop={s}
                supported={s.supportedZones.includes(zone.id)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="mt-8 px-4">
        <SectionHeader
          icon={<TrendingUp className="size-4" />}
          title="Món được đặt nhiều"
          to="/search"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {popular.map((p) => (
            <ProductCard key={p.id} product={p} onSelect={openProduct} />
          ))}
        </div>
      </section>

      <section className="mt-8 px-4 pb-32 md:pb-12">
        <SectionHeader title="Quán mới nổi" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shops.slice(1, 4).map((s) => (
            <ShopCard
              key={s.id}
              shop={s}
              supported={s.supportedZones.includes(zone.id)}
            />
          ))}
        </div>
      </section>

      <ProductSheet
        product={selected}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
      <BottomCartBar />
    </AppShell>
  );
}

function SectionHeader({
  title,
  icon,
  to,
}: {
  title: string;
  icon?: React.ReactNode;
  to?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-base font-bold md:text-lg">
        {icon}
        {title}
      </h2>
      {to && (
        <Link
          to={to as never}
          className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary"
        >
          Xem tất cả <ChevronRight className="size-3.5" />
        </Link>
      )}
    </div>
  );
}
