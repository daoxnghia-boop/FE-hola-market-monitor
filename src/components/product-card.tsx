import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cartStore } from "@/lib/cart-store";
import { formatVND, type Product } from "@/lib/mock-data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  layout = "grid",
  onSelect,
  disabled = false,
  disabledLabel,
}: {
  product: Product;
  layout?: "grid" | "row";
  /** When provided, clicking the card or "+" calls this instead of adding directly. */
  onSelect?: (p: Product) => void;
  /** Force-disable adding (e.g. shop closed or zone not supported). */
  disabled?: boolean;
  disabledLabel?: string;
}) {
  const blocked = disabled || !product.available;

  const handleAdd = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (blocked) return;
    if (onSelect) return onSelect(product);
    cartStore.add(product.id, 1);
    toast.success(`Đã thêm ${product.name} vào giỏ`);
  };

  const handleCardClick = () => {
    if (blocked) return;
    if (onSelect) onSelect(product);
  };

  const overlayLabel = !product.available ? "Hết món" : disabledLabel;

  if (layout === "row") {
    return (
      <div
        onClick={handleCardClick}
        role={onSelect ? "button" : undefined}
        tabIndex={onSelect && !blocked ? 0 : -1}
        className={cn(
          "flex gap-3 rounded-2xl bg-card p-3 shadow-card transition",
          onSelect && !blocked && "cursor-pointer hover:shadow-pop",
          blocked && "opacity-70",
        )}
      >
        <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-muted">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover"
          />
          {overlayLabel && (
            <div className="absolute inset-0 grid place-items-center bg-foreground/60 px-1 text-center text-[11px] font-semibold leading-tight text-background">
              {overlayLabel}
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <h4 className="line-clamp-1 font-semibold">{product.name}</h4>
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {product.description}
          </p>
          <div className="mt-auto flex items-center justify-between gap-2 pt-2">
            <span className="font-bold text-primary">
              {formatVND(product.price)}
            </span>
            <Button
              size="icon"
              onClick={handleAdd}
              disabled={blocked}
              className="rounded-full"
              aria-label="Thêm vào giỏ"
            >
              <Plus />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleCardClick}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect && !blocked ? 0 : -1}
      className={cn(
        "group overflow-hidden rounded-2xl bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-pop",
        onSelect && !blocked && "cursor-pointer",
        blocked && "opacity-70",
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="size-full object-cover transition group-hover:scale-105"
        />
        {overlayLabel && (
          <div className="absolute inset-0 grid place-items-center bg-foreground/60 px-2 text-center text-sm font-semibold text-background">
            {overlayLabel}
          </div>
        )}
        <Button
          size="icon"
          onClick={handleAdd}
          disabled={blocked}
          className="absolute bottom-2 right-2 size-9 rounded-full shadow-pop"
          aria-label="Thêm vào giỏ"
        >
          <Plus />
        </Button>
      </div>
      <div className="space-y-1 p-3">
        <h4 className="line-clamp-1 text-sm font-semibold">{product.name}</h4>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          Đã bán {product.soldCount}
        </p>
        <div className="font-bold text-primary">{formatVND(product.price)}</div>
      </div>
    </div>
  );
}
