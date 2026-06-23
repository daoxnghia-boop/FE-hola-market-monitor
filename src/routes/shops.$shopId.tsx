import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Phone,
  Heart,
  Share2,
  Bike,
  Coffee,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ProductCard } from "@/components/product-card";
import { ProductSheet } from "@/components/product-sheet";
import { BottomCartBar } from "@/components/bottom-cart-bar";
import { ZonePicker } from "@/components/zone-picker";
import { RatingStars } from "@/components/rating-stars";
import {
  categories,
  formatVND,
  getProductsByShop,
  getShop,
  type Product,
} from "@/lib/mock-data";
import { useDeliveryZone } from "@/lib/cart-store";
import { favoritesStore, useIsFavorite } from "@/lib/favorites-store";
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

  const zone = useDeliveryZone();
  const supported = shop.supportedZones.includes(zone.id);
  const shopOpen = shop.status === "open" && shop.isOpen;
  const canOrder = shopOpen && supported;
  const fav = useIsFavorite(shop.id);

  const [selected, setSelected] = useState<Product | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const openProduct = (p: Product) => {
    setSelected(p);
    setSheetOpen(true);
  };

  const productDisabledLabel = !shopOpen
    ? shop.status === "out_of_menu"
      ? "Hết món hôm nay"
      : "Quán tạm nghỉ"
    : !supported
      ? "Chưa giao khu này"
      : undefined;

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
          onClick={() => {
            favoritesStore.toggle(shop.id);
            toast.success(fav ? "Đã bỏ lưu quán" : "Đã lưu quán yêu thích");
          }}
          className="grid size-10 place-items-center rounded-full bg-card shadow-card"
        >
          <Heart className={cn("size-5", fav && "fill-destructive text-destructive")} />
        </button>
        <button
          aria-label="Chia sẻ"
          onClick={() => toast("Đã sao chép liên kết quán")}
          className="grid size-10 place-items-center rounded-full bg-card shadow-card"
        >
          <Share2 className="size-5" />
        </button>
      </header>

      {/* Cover */}
      <div className="relative h-44 w-full overflow-hidden sm:h-56 md:h-72 md:rounded-b-3xl">
        <img src={shop.cover} alt={shop.name} className="size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />
      </div>

      {/* Shop info card */}
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
                    shopOpen
                      ? "bg-success/15 text-success"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <span className="size-1.5 rounded-full bg-current" />
                  {shop.status === "out_of_menu"
                    ? "Hết món hôm nay"
                    : shopOpen
                      ? "Đang mở cửa"
                      : "Tạm nghỉ"}
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
              {supported ? `Ship ${formatVND(zone.fee)}` : "Chưa hỗ trợ khu này"}
            </InfoChip>
          </div>

          <ZonePicker
            trigger={
              <button className="mt-3 flex w-full items-center justify-between gap-2 rounded-xl border border-dashed border-border bg-background px-3 py-2 text-left text-xs hover:border-primary/40">
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-3.5" /> Giao tới
                </span>
                <span className="truncate font-semibold text-foreground">
                  {zone.shortName} · {supported ? formatVND(zone.fee) : "Chưa giao"}
                </span>
              </button>
            }
          />

          <div className="mt-3 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
            <p>📍 {shop.address}</p>
            <p>🕒 {shop.openHours} · Dự kiến 15–25 phút</p>
            <p className="inline-flex items-center gap-1">
              <Phone className="size-3.5" /> {shop.phone}
            </p>
          </div>
        </div>

        {/* Warnings */}
        {!shopOpen && (
          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-muted p-3 text-sm text-muted-foreground">
            <Coffee className="size-4 shrink-0" />
            {shop.status === "out_of_menu"
              ? "Quán đã hết món hôm nay. Mời bạn quay lại vào ngày mai."
              : "Quán đang tạm nghỉ. Bạn vẫn có thể xem thực đơn."}
          </div>
        )}
        {shopOpen && !supported && (
          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-warning/10 p-3 text-sm text-warning">
            <AlertCircle className="size-4 shrink-0" />
            Quán chưa hỗ trợ giao tới {zone.shortName}. Hãy đổi khu để đặt món.
          </div>
        )}
      </div>

      {/* Category pills */}
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
      <section className="space-y-3 px-4 pb-36 pt-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0 md:pb-24">
        {filtered.length === 0 ? (
          <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-card md:col-span-2">
            Chưa có món trong nhóm này.
          </p>
        ) : (
          filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              layout="row"
              onSelect={openProduct}
              disabled={!canOrder}
              disabledLabel={productDisabledLabel}
            />
          ))
        )}
      </section>

      <ProductSheet
        product={selected}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        canOrder={canOrder}
      />
      <BottomCartBar />
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
