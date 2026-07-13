import { useState } from "react";
import { Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/product-image";
import { CartConflictDialog } from "@/components/cart-conflict-dialog";
import { useAddCartItem } from "@/lib/api/hooks";
import type { ProductDto } from "@/lib/api/types";
import { ApiError, apiErrorMessage } from "@/lib/api/client";
import { formatVND } from "@/lib/domain";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  layout = "grid",
  disabled = false,
  disabledLabel,
}: {
  product: ProductDto;
  layout?: "grid" | "row";
  /** Force-disable adding (e.g. shop closed or zone not supported). */
  disabled?: boolean;
  disabledLabel?: string;
}) {
  const addItem = useAddCartItem();
  const [conflictOpen, setConflictOpen] = useState(false);
  const blocked = disabled || !product.available;
  const overlayLabel = !product.available ? "Hết món" : disabledLabel;

  const doAdd = (replaceExistingCart: boolean) => {
    addItem.mutate(
      { productId: product.id, quantity: 1, replaceExistingCart },
      {
        onSuccess: () => toast.success(`Đã thêm ${product.name} vào giỏ`),
        onError: (error) => {
          if (
            !replaceExistingCart &&
            error instanceof ApiError &&
            error.code === "CART_SHOP_CONFLICT"
          ) {
            setConflictOpen(true);
            return;
          }
          toast.error(apiErrorMessage(error));
        },
      },
    );
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (blocked) return;
    doAdd(false);
  };

  const linkProps = {
    to: "/products/$productId" as const,
    params: { productId: product.id },
    "aria-label": product.name,
  };

  if (layout === "row") {
    return (
      <div
        className={cn(
          "relative flex gap-3 rounded-2xl bg-card p-3 shadow-card transition",
          !blocked && "hover:shadow-pop",
          blocked && "opacity-70",
        )}
      >
        <Link
          {...linkProps}
          className="flex min-w-0 flex-1 gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-2xl"
        >
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            aspect="square"
            rounded="rounded-xl"
            overlayLabel={overlayLabel}
            className="size-24 shrink-0"
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <h4 className="line-clamp-1 font-semibold">{product.name}</h4>
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {product.description}
            </p>
            <div className="mt-auto pt-2">
              <span className="font-bold text-primary">{formatVND(product.price)}</span>
            </div>
          </div>
        </Link>
        <div className="absolute bottom-3 right-3">
          <Button
            size="icon"
            onClick={handleAdd}
            disabled={blocked || addItem.isPending}
            className="rounded-full"
            aria-label={`Thêm ${product.name} vào giỏ`}
          >
            <Plus />
          </Button>
        </div>
        <CartConflictDialog
          open={conflictOpen}
          onOpenChange={setConflictOpen}
          onConfirm={() => doAdd(true)}
          productName={product.name}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-pop",
        blocked && "opacity-70",
      )}
    >
      <Link
        {...linkProps}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-2xl"
      >
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          aspect="4/3"
          rounded="rounded-none"
          overlayLabel={overlayLabel}
          imageClassName="transition group-hover:scale-[1.03]"
        />
        <div className="space-y-1 p-3">
          <h4 className="line-clamp-2 text-sm font-semibold min-h-[2.5rem]">
            {product.name}
          </h4>
          <p className="line-clamp-1 text-xs text-muted-foreground">
            Đã bán {product.soldCount}
          </p>
          <div className="font-bold text-primary">{formatVND(product.price)}</div>
        </div>
      </Link>
      <Button
        size="icon"
        onClick={handleAdd}
        disabled={blocked || addItem.isPending}
        className="absolute right-2 top-[calc(75%-0.5rem)] size-9 -translate-y-1/2 rounded-full shadow-pop"
        aria-label={`Thêm ${product.name} vào giỏ`}
      >
        <Plus />
      </Button>
      <CartConflictDialog
        open={conflictOpen}
        onOpenChange={setConflictOpen}
        onConfirm={() => doAdd(true)}
        productName={product.name}
      />
    </div>
  );
}
