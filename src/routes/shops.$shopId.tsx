import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Clock, MapPin, Phone, ShoppingBag, Heart, Share2, Bike } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ProductCard } from "@/components/product-card";
import { RatingStars } from "@/components/rating-stars";
import { Button } from "@/components/ui/button";
import {
  categories,
  formatVND,
  getProductsByShop,
  getShop,
} from "@/lib/mock-data";
import { useCart, useCartTotal } from "@/lib/cart-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/shops/$shopId")({
  loader: ({ params }) => {
    const shop = getShop(params.shopId);
    if (!shop) throw notFound();
    return { shop };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.shop.name ?? "Quán ăn"} — Ăn Hòa Lạc` },
      {
        name: "description",
        content: loaderData?.shop.description ?? "Thực đơn quán ăn quanh Hòa Lạc.",
      },
    ],
  }),
  component: ShopDetailPage,
});

function ShopDetailPage() {
  const { shop } = Route.useLoaderData();
  const allProducts = useMemo(() => getProductsByShop(shop.id), [shop.id]);
  const productCats = useMemo(() => {
    const ids = Array.from(new Set(allProducts.map((p) => p.category)));
    return categories.filter((c) => ids.includes(c.id));
  }, [allProducts]);

  const [activeCat, setActiveCat] = useState<string>("all");
  const filtered =
    activeCat === "all"
      ? allProducts
      : allProducts.filter((p) => p.category === activeCat);

  const cart = useCart();
  const total = useCartTotal();
  const cartCount = cart.items.reduce((s, i) => s + i.quantity, 0);
  const cartBelongsToShop = cart.shopId === shop.id && cartCount > 0;

  return (
    <AppShell>
      {/* Mobile sticky header */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 bg-card/95 px-3 backdrop-blur md:hidden">
        <Link
          to="/"
          aria-label="Quay lại"
          className="grid size-10 place-items-center rounded-full bg-card shadow-card"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h2 className="min-w-0 flex-1 truncate text-center text-sm font-semibold">
          {shop.name}
        </h2>
        <button
          aria-label="Yêu thích"
          onClick={() => toast.success("Đã thêm vào yêu thích")}
          className="grid size-10 place-items-center rounded-full bg-card shadow-card"
        >
          <Heart className="size-5" />
        </button>
        <button
          aria-label="Chia sẻ"
          onClick={() => toast("Đã sao chép liên kết quán")}
          className="grid size-10 place-items-center rounded-full bg-card shadow-card"
        >
          <Share2 className="size-5" />
        </button>
      </header>

      {/* Cover image — fixed reasonable height, no overlap */}
      <div className="relative h-44 w-full overflow-hidden sm:h-56 md:h-72 md:rounded-b-3xl">
        <img
          src={shop.cover}
          alt={shop.name}
          className="size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />
      </div>

      {/* Shop info card — sits BELOW cover with margin */}
      <div className="px-4 pt-4">
        <div className="rounded-2xl bg-card p-4 shadow-card">
          <div className="flex items-start gap-3">
            <img
              src={shop.logo}
              alt=""
              className="size-14 shrink-0 rounded-xl border-2 border-card object-cover shadow-card"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="min-w-0 flex-1 truncate text-lg font-extrabold md:text-xl">
                  {shop.name}
                </h1>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    shop.isOpen
                      ? "bg-success/15 text-success"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <span className="size-1.5 rounded-full bg-current" />
                  {shop.isOpen ? "Đang mở cửa" : "Tạm nghỉ"}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {shop.description}
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
            <InfoChip icon={<RatingStars value={shop.rating} />}>
              {shop.reviewCount} đánh giá
            </InfoChip>
            <InfoChip icon={<Clock className="size-3.5" />}>
              ~{shop.prepTime} phút
            </InfoChip>
            <InfoChip icon={<MapPin className="size-3.5" />}>
              {shop.distanceKm} km
            </InfoChip>
            <InfoChip icon={<Bike className="size-3.5" />}>
              Phí ship 10.000đ
            </InfoChip>
          </div>

          <div className="mt-3 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
            <p>📍 {shop.address}</p>
            <p>🕒 Giờ mở cửa: {shop.openHours}</p>
            <p className="inline-flex items-center gap-1">
              <Phone className="size-3.5" /> {shop.phone}
            </p>
          </div>
        </div>
      </div>

      {/* Category filter pills */}
      <div className="sticky top-14 z-20 mt-4 bg-background/95 px-4 py-2 backdrop-blur md:top-16">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[{ id: "all", name: "Tất cả", icon: "🍽️" }, ...productCats].map((c) => {
            const active = activeCat === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:border-primary/40",
                )}
              >
                <span className="mr-1">{c.icon}</span>
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu */}
      <section className="space-y-3 px-4 pb-32 pt-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0 md:pb-12">
        {filtered.length === 0 ? (
          <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-card md:col-span-2">
            Chưa có món trong nhóm này.
          </p>
        ) : (
          filtered.map((p) => (
            <ProductCard key={p.id} product={p} layout="row" />
          ))
        )}
      </section>

      {/* Sticky cart bar */}
      {cartBelongsToShop && (
        <div className="fixed inset-x-0 bottom-16 z-30 px-4 md:bottom-6">
          <Link
            to="/cart"
            className="mx-auto flex max-w-md items-center justify-between gap-3 rounded-full bg-primary px-5 py-3 text-primary-foreground shadow-pop transition hover:bg-primary/90"
          >
            <span className="inline-flex items-center gap-2 font-semibold">
              <span className="relative">
                <ShoppingBag className="size-5" />
                <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-warning px-1 text-[10px] font-bold text-warning-foreground">
                  {cartCount}
                </span>
              </span>
              Xem giỏ hàng
            </span>
            <span className="font-bold">{formatVND(total)}</span>
          </Link>
        </div>
      )}
    </AppShell>
  );
}

function InfoChip({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-xl bg-muted px-2.5 py-1.5 text-muted-foreground">
      {icon}
      <span className="truncate text-foreground">{children}</span>
    </span>
  );
}
