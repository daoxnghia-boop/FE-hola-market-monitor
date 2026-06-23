import { Link } from "@tanstack/react-router";
import { Clock, Heart, MapPin } from "lucide-react";
import { toast } from "sonner";
import { RatingStars } from "./rating-stars";
import type { Shop } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { favoritesStore, useIsFavorite } from "@/lib/favorites-store";

export function ShopCard({ shop, supported = true }: { shop: Shop; supported?: boolean }) {
  const fav = useIsFavorite(shop.id);

  const statusLabel =
    shop.status === "out_of_menu"
      ? "Hết món hôm nay"
      : shop.status === "break" || !shop.isOpen
        ? "Tạm nghỉ"
        : "Đang mở";
  const statusOk = shop.status === "open" && shop.isOpen;

  return (
    <Link
      to="/shops/$shopId"
      params={{ shopId: shop.id }}
      className="group relative block overflow-hidden rounded-2xl bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-pop"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        <img
          src={shop.cover}
          alt={shop.name}
          loading="lazy"
          className="size-full object-cover transition group-hover:scale-105"
        />
        <span
          className={cn(
            "absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur",
            statusOk
              ? "bg-success/90 text-success-foreground"
              : "bg-foreground/70 text-background",
          )}
        >
          <span className="size-1.5 rounded-full bg-current" />
          {statusLabel}
        </span>
        <button
          type="button"
          aria-label={fav ? "Bỏ yêu thích" : "Yêu thích"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            favoritesStore.toggle(shop.id);
            toast.success(fav ? "Đã bỏ lưu quán" : "Đã lưu quán yêu thích");
          }}
          className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-card/90 backdrop-blur transition hover:scale-105"
        >
          <Heart
            className={cn(
              "size-4 transition",
              fav ? "fill-destructive text-destructive" : "text-foreground",
            )}
          />
        </button>
        {!supported && (
          <span className="absolute bottom-2 left-3 rounded-full bg-foreground/70 px-2 py-0.5 text-[11px] font-semibold text-background">
            Chưa giao tới khu này
          </span>
        )}
      </div>
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold">{shop.name}</h3>
          <RatingStars value={shop.rating} />
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            {shop.prepTime} phút
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" />
            {shop.distanceKm} km · {shop.area}
          </span>
        </div>
      </div>
    </Link>
  );
}
