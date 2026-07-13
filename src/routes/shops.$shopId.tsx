import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
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
import { BottomCartBar } from "@/components/bottom-cart-bar";
import { ZonePicker } from "@/components/zone-picker";
import { RatingStars } from "@/components/rating-stars";
import { formatVND } from "@/lib/domain";
import { useCategories, useShop, useShopProducts } from "@/lib/api/hooks";
import { apiErrorMessage } from "@/lib/api/client";
import { useDeliveryZone } from "@/lib/cart-store";
import { useFavoriteActions, useIsFavorite } from "@/lib/favorites-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/shops/$shopId")({
  head: () => ({
    meta: [
      { title: "Quán ăn — Ăn Hòa Lạc" },
      {
        name: "description",
        content: "Thực đơn quán ăn quanh Hòa Lạc.",
      },
    ],
  }),
  component: ShopDetailPage,
});

function ShopDetailPage() {
  const { shopId } = Route.useParams();
  const [activeCat, setActiveCat] = useState<string>("all");
  const zone = useDeliveryZone();
  const shopQuery = useShop(shopId, zone?.id);
  const productsQuery = useShopProducts(shopId, {
    categoryId: activeCat === "all" ? undefined : activeCat,
    pageSize: 100,
  });
  const categoriesQuery = useCategories();
  const fav = useIsFavorite(shopId);
  const favoriteAction = useFavoriteActions();
  const shop = shopQuery.data;
  const allProducts = productsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const productCats = categories.filter((category) => shop?.categoryIds.includes(category.id));

  const filtered = allProducts;

  const supported =
    shop?.delivery?.supported ?? (zone ? shop?.supportedZoneIds.includes(zone.id) : true);
  if (shopQuery.isLoading)
    return (
      <AppShell>
        <div className="px-4 py-10 text-center text-sm text-muted-foreground">
          Đang tải thông tin quán...
        </div>
      </AppShell>
    );
  if (shopQuery.isError || !shop)
    return (
      <AppShell>
        <div className="px-4 py-10 text-center text-sm text-muted-foreground">
          Hiện chưa có thông tin quán này.
        </div>
      </AppShell>
    );
  const shopOpen = shop.status === "open" && shop.isOpen;
  const canOrder = shopOpen && supported;

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
        <h2 className="min-w-0 flex-1 truncate text-center text-sm font-semibold">{shop.name}</h2>
        <button
          aria-label="Yêu thích"
          onClick={() => {
            favoriteAction.mutate(
              { shopId: shop.id, favorite: fav },
              {
                onSuccess: () => toast.success(fav ? "Đã bỏ lưu quán" : "Đã lưu quán yêu thích"),
                onError: (error) => toast.error(apiErrorMessage(error)),
              },
            );
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
        <img src={shop.coverUrl} alt={shop.name} className="size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />
      </div>

      {/* Shop info card */}
      <div className="px-4 pt-4">
        <div className="rounded-2xl bg-card p-4 shadow-card">
          <div className="flex items-start gap-3">
            <img
              src={shop.logoUrl}
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
                    shopOpen ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
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
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{shop.description}</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
            <InfoChip icon={<RatingStars value={shop.rating} />}>
              {shop.reviewCount} đánh giá
            </InfoChip>
            <InfoChip icon={<Clock className="size-3.5" />}>~{shop.prepTimeMinutes} phút</InfoChip>
            <InfoChip icon={<MapPin className="size-3.5" />}>
              {shop.distanceKm != null ? `${shop.distanceKm} km` : "Chưa xác định"}
            </InfoChip>
            <InfoChip icon={<Bike className="size-3.5" />}>
              {supported
                ? `Ship ${formatVND(shop.delivery?.fee ?? zone?.baseDeliveryFee ?? 0)}`
                : "Chưa hỗ trợ khu này"}
            </InfoChip>
          </div>

          <ZonePicker
            trigger={
              <button className="mt-3 flex w-full items-center justify-between gap-2 rounded-xl border border-dashed border-border bg-background px-3 py-2 text-left text-xs hover:border-primary/40">
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-3.5" /> Giao tới
                </span>
                <span className="truncate font-semibold text-foreground">
                  {zone?.shortName || "Chọn khu"} ·{" "}
                  {supported
                    ? formatVND(shop.delivery?.fee ?? zone?.baseDeliveryFee ?? 0)
                    : "Chưa giao"}
                </span>
              </button>
            }
          />

          <div className="mt-3 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
            <p>📍 {shop.address}</p>
            <p>
              🕒 {shop.openHoursText}
              {shop.estimatedDeliveryMinutes
                ? ` · Dự kiến ${shop.estimatedDeliveryMinutes} phút`
                : ""}
            </p>
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
            Quán chưa hỗ trợ giao tới {zone?.shortName || "khu này"}. Hãy đổi khu để đặt món.
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
                <span className="mr-1">{"icon" in c ? c.icon : c.iconText || "🍽️"}</span>
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu */}
      <section className="space-y-3 px-4 pb-36 pt-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0 md:pb-24">
        {productsQuery.isLoading ? (
          <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-card md:col-span-2">
            Đang tải thực đơn...
          </p>
        ) : filtered.length === 0 ? (
          <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-card md:col-span-2">
            Hiện chưa có món trong nhóm này.
          </p>
        ) : (
          filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              layout="row"
              disabled={!canOrder}
              disabledLabel={productDisabledLabel}
            />
          ))
        )}
      </section>

      <BottomCartBar />
    </AppShell>
  );
}

function InfoChip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-xl bg-muted px-2.5 py-1.5 text-muted-foreground">
      {icon}
      <span className="truncate text-foreground">{children}</span>
    </span>
  );
}
