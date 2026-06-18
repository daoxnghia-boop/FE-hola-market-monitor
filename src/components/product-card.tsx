import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cartStore } from "@/lib/cart-store";
import { formatVND, type Product } from "@/lib/mock-data";
import { toast } from "sonner";

export function ProductCard({
  product,
  layout = "grid",
}: {
  product: Product;
  layout?: "grid" | "row";
}) {
  const handleAdd = () => {
    if (!product.available) return;
    cartStore.add(product.id, 1);
    toast.success(`Đã thêm ${product.name}`);
  };

  if (layout === "row") {
    return (
      <div className="flex gap-3 rounded-2xl bg-card p-3 shadow-card">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-muted">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover"
          />
          {!product.available && (
            <div className="absolute inset-0 grid place-items-center bg-foreground/60 text-xs font-semibold text-background">
              Hết món
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
              disabled={!product.available}
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
    <div className="group overflow-hidden rounded-2xl bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-pop">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="size-full object-cover transition group-hover:scale-105"
        />
        {!product.available && (
          <div className="absolute inset-0 grid place-items-center bg-foreground/60 text-sm font-semibold text-background">
            Hết món
          </div>
        )}
        <Button
          size="icon"
          onClick={handleAdd}
          disabled={!product.available}
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
