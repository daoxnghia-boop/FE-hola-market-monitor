import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, ChevronRight, TrendingUp, Sparkles, Bell } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SearchBar } from "@/components/search-bar";
import { CategoryTabs } from "@/components/category-tabs";
import { ShopCard } from "@/components/shop-card";
import { ProductCard } from "@/components/product-card";
import { VoucherCard } from "@/components/voucher-card";
import { shops, products, vouchers } from "@/lib/mock-data";
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
  const popular = [...products].sort((a, b) => b.soldCount - a.soldCount).slice(0, 6);
  const nearby = [...shops].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 4);

  return (
    <AppShell>
      {/* Mobile header / hero */}
      <section className="bg-gradient-to-br from-primary to-primary/80 px-4 pb-5 pt-4 text-primary-foreground md:rounded-b-3xl md:px-6 md:pb-8 md:pt-8">
        {/* Row 1: greeting + bell (mobile only) */}
        <div className="flex items-center gap-3 md:hidden">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 text-[11px] opacity-90">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">Giao đến</span>
            </div>
            <div className="truncate text-sm font-semibold">FPT University, Hòa Lạc</div>
          </div>
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

        {/* Row 2: search bar — inside hero, no negative margin */}
        <div className="relative z-10 mt-4">
          <SearchBar to="/search" className="mx-auto max-w-2xl shadow-pop" />
        </div>
      </section>

      {/* Categories */}
      <section className="mt-6 px-4">
        <CategoryTabs onChange={setCategory} />
      </section>

      {/* Vouchers */}
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

      {/* Nearby shops */}
      <section className="mt-8 px-4">
        <SectionHeader
          icon={<MapPin className="size-4" />}
          title="Quán gần bạn"
          to="/search"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {nearby.map((s) => (
            <ShopCard key={s.id} shop={s} />
          ))}
        </div>
      </section>

      {/* Popular dishes */}
      <section className="mt-8 px-4">
        <SectionHeader
          icon={<TrendingUp className="size-4" />}
          title="Món được đặt nhiều"
          to="/search"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {popular.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Recommended shops */}
      <section className="mt-8 px-4 pb-8">
        <SectionHeader title="Quán mới nổi" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shops.slice(1, 4).map((s) => (
            <ShopCard key={s.id} shop={s} />
          ))}
        </div>
      </section>
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
