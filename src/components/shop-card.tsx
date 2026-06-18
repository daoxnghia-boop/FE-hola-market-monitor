import { Link } from "@tanstack/react-router";
import { Clock, MapPin } from "lucide-react";
import { RatingStars } from "./rating-stars";
import type { Shop } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function ShopCard({ shop }: { shop: Shop }) {
  return (
    <Link
      to="/shops/$shopId"
      params={{ shopId: shop.id }}
      className="group block overflow-hidden rounded-2xl bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-pop"
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
            shop.isOpen
              ? "bg-success/90 text-success-foreground"
              : "bg-foreground/70 text-background",
          )}
        >
          <span className="size-1.5 rounded-full bg-current" />
          {shop.isOpen ? "Đang mở" : "Đã đóng"}
        </span>
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
