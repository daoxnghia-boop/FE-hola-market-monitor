import { useState } from "react";
import {
  createFileRoute,
  Link,
  notFound,
  useRouter,
} from "@tanstack/react-router";
import {
  ArrowLeft,
  Bike,
  ChevronRight,
  Clock,
  MapPin,
  Minus,
  Plus,
  Star,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ProductCard } from "@/components/product-card";
import { ProductImage } from "@/components/product-image";
import { CartConflictDialog } from "@/components/cart-conflict-dialog";
import { RatingStars } from "@/components/rating-stars";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { catalogApi } from "@/lib/api/services";
import {
  queryKeys,
  useAddCartItem,
  useProduct,
  useProductReviews,
  useProductReviewSummary,
  useProductsFromSameShop,
  useRelatedProducts,
} from "@/lib/api/hooks";
import { ApiError, apiErrorMessage } from "@/lib/api/client";
import { formatRelativeTime, formatVND } from "@/lib/domain";
import type {
  ProductDetailDto,
  ProductRatingDistribution,
  ProductReviewSort,
} from "@/lib/api/types";
import { useDeliveryZone } from "@/lib/cart-store";
import { cn } from "@/lib/utils";

const SITE = "https://hola-market.lovable.app";

export const Route = createFileRoute("/products/$productId")({
  loader: async ({ params, context }) => {
    try {
      const data = await context.queryClient.ensureQueryData({
        queryKey: queryKeys.product(params.productId),
        queryFn: () => catalogApi.product(params.productId),
      });
      return { product: data };
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        throw notFound({ data: { productId: params.productId } });
      }
      throw err;
    }
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Món ăn — HoLa Market" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { product } = loaderData;
    const title = `${product.name} — ${product.shop.name} | HoLa Market`;
    const desc =
      product.description?.slice(0, 155) ||
      `${product.name} từ ${product.shop.name}. Giá ${formatVND(product.price)}.`;
    const url = `${SITE}/products/${params.productId}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        ...(product.imageUrl?.startsWith("http")
          ? [
              { property: "og:image", content: product.imageUrl },
              { name: "twitter:image", content: product.imageUrl },
            ]
          : []),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  errorComponent: ProductErrorComponent,
  notFoundComponent: ProductNotFoundComponent,
  component: ProductDetailPage,
});

function ProductErrorComponent({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const router = useRouter();
  return (
    <AppShell>
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Không tải được món ăn</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {apiErrorMessage(error)}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Thử lại
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">Về trang chủ</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function ProductNotFoundComponent() {
  return (
    <AppShell>
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-extrabold">Không tìm thấy món ăn</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Món này có thể đã bị gỡ hoặc quán không còn phục vụ.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild>
            <Link to="/">Về trang chủ</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/search" search={{ q: "", categoryId: "all" }}>
              Tìm món khác
            </Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function ProductDetailPage() {
  const { productId } = Route.useParams();
  const { product: loaderProduct } = Route.useLoaderData();
  const router = useRouter();
  const zone = useDeliveryZone();
  const zoneId = zone?.id;
  const productQuery = useProduct(productId, zoneId);
  // Fall back to loader-primed product (no-zone variant) so SSR + hydration
  // paint the full page without a skeleton flash.
  const product = productQuery.data ?? loaderProduct;

  if (!product) {
    return (
      <AppShell>
        <ProductDetailSkeleton />
      </AppShell>
    );
  }

  const shop = product.shop;
  const shopOperational =
    shop.approvalStatus !== "rejected" &&
    shop.approvalStatus !== "pending" &&
    shop.operationStatus !== "suspended";
  const shopOpen = shop.isOpen && shop.status !== "closed";
  const zoneSupported = product.delivery?.supported ?? true;
  const zoneFee = product.delivery?.fee ?? null;

  const unavailableReason = !shopOperational
    ? "Gian hàng đang tạm ngừng hoạt động"
    : !shopOpen
      ? shop.status === "out_of_menu"
        ? "Quán đã hết món hôm nay"
        : "Quán đang tạm nghỉ"
      : !product.available
        ? "Món hiện đã hết"
        : !zoneSupported && zoneId
          ? "Quán chưa giao tới khu vực này"
          : null;
  const canOrder = !unavailableReason;

  return (
    <AppShell>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 bg-card/95 px-3 backdrop-blur md:hidden">
        <button
          type="button"
          aria-label="Quay lại"
          onClick={() => router.history.back()}
          className="grid size-10 place-items-center rounded-full bg-card shadow-card"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h2 className="min-w-0 flex-1 truncate text-center text-sm font-semibold">
          {product.name}
        </h2>
        <span className="w-10" aria-hidden />
      </header>

      {/* Desktop breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mx-auto hidden max-w-[1200px] px-6 pt-4 text-sm text-muted-foreground md:block"
      >
        <ol className="flex items-center gap-1">
          <li>
            <Link to="/" className="hover:text-foreground">
              Trang chủ
            </Link>
          </li>
          <ChevronRight className="size-3.5 shrink-0" />
          <li>
            <Link
              to="/shops/$shopId"
              params={{ shopId: shop.id }}
              className="hover:text-foreground"
            >
              {shop.name}
            </Link>
          </li>
          <ChevronRight className="size-3.5 shrink-0" />
          <li className="truncate text-foreground">{product.name}</li>
        </ol>
      </nav>

      <div className="mx-auto max-w-[1200px] px-4 pt-4 md:px-6">
        <section className="grid gap-6 md:grid-cols-[minmax(0,45fr)_minmax(0,55fr)] md:gap-8">
          <div>
            <ProductImage
              src={product.imageUrl}
              alt={product.name}
              aspect="4/3"
              rounded="rounded-2xl"
              className="max-h-[480px] border border-border/50 shadow-sm"
              overlayLabel={!product.available ? "Hết món" : undefined}
              loading="eager"
            />
          </div>

          <MainInfo
            product={product}
            unavailableReason={unavailableReason}
            canOrder={canOrder}
            zoneFee={zoneFee}
            zoneSupported={zoneSupported}
            zoneName={zone?.name}
          />
        </section>

        {/* Shop card */}
        <section className="mt-8">
          <ShopMiniCard
            shop={shop}
            zoneFee={zoneFee}
            zoneSupported={zoneSupported}
            zoneName={zone?.name}
          />
        </section>

        <SameShopProducts productId={productId} zoneId={zoneId} shopId={shop.id} />

        <RelatedProducts productId={productId} zoneId={zoneId} />

        <ReviewsSection productId={productId} />

        <div className="h-32 md:h-8" />
      </div>
    </AppShell>
  );
}

// -----------------------------
// Main info (right column) + sticky mobile CTA
// -----------------------------
function MainInfo({
  product,
  unavailableReason,
  canOrder,
  zoneFee,
  zoneSupported,
  zoneName,
}: {
  product: ProductDetailDto;
  unavailableReason: string | null;
  canOrder: boolean;
  zoneFee: number | null;
  zoneSupported: boolean;
  zoneName: string | undefined;
}) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [conflictOpen, setConflictOpen] = useState(false);
  const addItem = useAddCartItem();

  const total = product.price * qty;

  const doAdd = (replace: boolean) => {
    addItem.mutate(
      {
        productId: product.id,
        quantity: qty,
        note: note.trim() || undefined,
        replaceExistingCart: replace,
      },
      {
        onSuccess: () => {
          toast.success(`Đã thêm ${qty} × ${product.name} vào giỏ`);
          setQty(1);
          setNote("");
        },
        onError: (error) => {
          if (
            !replace &&
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

  const cta = canOrder
    ? `Thêm vào giỏ · ${formatVND(total)}`
    : unavailableReason;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold leading-tight md:text-3xl">
        {product.name}
      </h1>
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-3xl font-extrabold text-primary">
          {formatVND(product.price)}
        </span>
        {product.category && (
          <Badge variant="secondary" className="rounded-full">
            {product.category.name}
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <RatingStars value={product.rating} />
          <span className="font-medium text-foreground">
            {product.rating.toFixed(1)}
          </span>
          <span>({product.reviewCount ?? 0} đánh giá)</span>
        </span>
        <span>· Đã bán {product.soldCount}</span>
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" />
          {product.prepTimeMinutes} phút
        </span>
      </div>

      {product.description && (
        <p className="text-sm leading-relaxed text-foreground/90">
          {product.description}
        </p>
      )}

      {/* Delivery info */}
      <div className="rounded-2xl bg-muted/60 p-3 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 font-semibold">
            <Bike className="size-4 text-primary" />
            Giao tới {zoneName || "khu vực đã chọn"}
          </span>
          <span
            className={cn(
              "font-semibold",
              zoneSupported ? "text-foreground" : "text-warning",
            )}
          >
            {zoneSupported
              ? zoneFee != null
                ? `Phí giao ${formatVND(zoneFee)}`
                : "Chưa xác định"
              : "Chưa giao khu này"}
          </span>
        </div>
        {product.shop.estimatedDeliveryMinutes && zoneSupported && (
          <div className="mt-1 text-xs text-muted-foreground">
            Dự kiến giao trong ~{product.shop.estimatedDeliveryMinutes} phút
          </div>
        )}
      </div>

      {/* Quantity + Note */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">Số lượng</span>
        <div className="flex items-center gap-1 rounded-full border border-border bg-background p-1">
          <Button
            size="icon"
            variant="ghost"
            className="size-8 rounded-full"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label="Giảm số lượng"
          >
            <Minus />
          </Button>
          <span className="w-8 text-center font-bold" aria-live="polite">
            {qty}
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="size-8 rounded-full"
            onClick={() => setQty((q) => q + 1)}
            aria-label="Tăng số lượng"
          >
            <Plus />
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="product-note" className="text-sm font-medium">
          Ghi chú cho quán
        </label>
        <Textarea
          id="product-note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ví dụ: ít cay, không hành, thêm cơm..."
        />
      </div>

      {/* Desktop CTA */}
      <Button
        className="hidden h-12 w-full rounded-full text-base font-bold md:inline-flex"
        onClick={() => doAdd(false)}
        disabled={!canOrder || addItem.isPending}
      >
        {cta}
      </Button>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border/40 bg-card/95 px-4 py-3 shadow-lg backdrop-blur pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:hidden">
        <div className="mx-auto flex max-w-[1200px] items-center gap-3">
          <div className="min-w-0">
            <div className="text-[11px] text-muted-foreground">Tổng tạm tính</div>
            <div className="truncate text-lg font-extrabold text-primary">
              {formatVND(total)}
            </div>
          </div>
          <Button
            className="ml-auto h-11 flex-1 rounded-full text-sm font-bold"
            onClick={() => doAdd(false)}
            disabled={!canOrder || addItem.isPending}
          >
            {canOrder ? "Thêm vào giỏ" : unavailableReason}
          </Button>
        </div>
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

// -----------------------------
// Shop mini card
// -----------------------------
function ShopMiniCard({
  shop,
  zoneFee,
  zoneSupported,
  zoneName,
}: {
  shop: ProductDetailDto["shop"];
  zoneFee: number | null;
  zoneSupported: boolean;
  zoneName: string | undefined;
}) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-card">
      <div className="flex items-start gap-3">
        {shop.logoUrl ? (
          <img
            src={shop.logoUrl}
            alt=""
            className="size-14 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-muted">
            <Store className="size-6 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <Link
            to="/shops/$shopId"
            params={{ shopId: shop.id }}
            className="line-clamp-1 text-lg font-bold hover:underline"
          >
            {shop.name}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <RatingStars value={shop.rating} />
              <span className="font-medium text-foreground">
                {shop.rating.toFixed(1)}
              </span>
              <span>({shop.reviewCount})</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />~{shop.prepTimeMinutes} phút
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold",
                shop.isOpen
                  ? "bg-success/15 text-success"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <span className="size-1.5 rounded-full bg-current" />
              {shop.isOpen ? "Đang mở cửa" : "Tạm nghỉ"}
            </span>
          </div>
          {shop.address && (
            <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
              <MapPin className="mt-0.5 size-3.5 shrink-0" />
              <span className="line-clamp-1">{shop.address}</span>
            </p>
          )}
          <p className="mt-1 text-xs">
            <span className="text-muted-foreground">
              Giao tới {zoneName || "khu vực đã chọn"}:{" "}
            </span>
            <span
              className={cn(
                "font-semibold",
                zoneSupported ? "text-foreground" : "text-warning",
              )}
            >
              {zoneSupported
                ? zoneFee != null
                  ? formatVND(zoneFee)
                  : "Chưa xác định"
                : "Chưa hỗ trợ"}
            </span>
            {shop.estimatedDeliveryMinutes && zoneSupported && (
              <span className="text-muted-foreground">
                {" "}
                · ~{shop.estimatedDeliveryMinutes} phút
              </span>
            )}
          </p>
        </div>
        <Button size="sm" variant="outline" asChild className="shrink-0 rounded-full">
          <Link to="/shops/$shopId" params={{ shopId: shop.id }}>
            Xem gian hàng
          </Link>
        </Button>
      </div>
    </div>
  );
}

// -----------------------------
// Same-shop / related
// -----------------------------
function SameShopProducts({
  productId,
  zoneId,
  shopId,
}: {
  productId: string;
  zoneId?: string;
  shopId: string;
}) {
  const { data, isLoading } = useProductsFromSameShop(productId, zoneId);
  const items = data ?? [];
  if (!isLoading && items.length === 0) return null;
  return (
    <section className="mt-10">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">Món khác của quán</h2>
        <Link
          to="/shops/$shopId"
          params={{ shopId }}
          className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary"
        >
          Xem toàn bộ thực đơn <ChevronRight className="size-3.5" />
        </Link>
      </div>
      {isLoading ? (
        <ProductGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}

function RelatedProducts({
  productId,
  zoneId,
}: {
  productId: string;
  zoneId?: string;
}) {
  const { data, isLoading } = useRelatedProducts(productId, zoneId);
  const items = data ?? [];
  if (!isLoading && items.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-lg font-bold">Có thể bạn cũng thích</h2>
      {isLoading ? (
        <ProductGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}

// -----------------------------
// Reviews section
// -----------------------------
function ReviewsSection({ productId }: { productId: string }) {
  const [filterRating, setFilterRating] = useState<string>("all");
  const [sort, setSort] = useState<ProductReviewSort>("latest");
  const summaryQuery = useProductReviewSummary(productId);
  const reviewsQuery = useProductReviews(productId, {
    rating: filterRating === "all" ? undefined : Number(filterRating),
    sort,
  });
  const summary = summaryQuery.data;
  const reviews = reviewsQuery.data?.items ?? [];

  const distribution: ProductRatingDistribution = summary?.ratingDistribution ?? {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  const totalReviews = summary?.totalReviews ?? 0;

  return (
    <section className="mt-12">
      <h2 className="mb-4 text-lg font-bold">Đánh giá món ăn</h2>

      {/* Summary */}
      <div className="grid gap-4 rounded-2xl bg-card p-5 shadow-card md:grid-cols-[220px_1fr] md:gap-8">
        <div className="flex flex-col items-center justify-center border-b border-border/40 pb-4 md:border-b-0 md:border-r md:pb-0 md:pr-6">
          <div className="text-5xl font-extrabold text-primary">
            {(summary?.averageRating ?? 0).toFixed(1)}
          </div>
          <RatingStars value={summary?.averageRating ?? 0} />
          <div className="mt-1 text-xs text-muted-foreground">
            {totalReviews} đánh giá
          </div>
        </div>
        <div className="space-y-1.5">
          {[5, 4, 3, 2, 1].map((n) => {
            const count = distribution[n as 1 | 2 | 3 | 4 | 5];
            const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return (
              <div key={n} className="flex items-center gap-2 text-xs">
                <span className="inline-flex w-8 items-center gap-0.5 font-semibold">
                  {n}
                  <Star className="size-3 fill-warning text-warning" />
                </span>
                <Progress value={pct} className="h-2 flex-1" />
                <span className="w-8 text-right text-muted-foreground">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters (min-height keeps layout stable) */}
      <div className="mt-4 flex flex-wrap items-center gap-2 min-h-11">
        <Select value={filterRating} onValueChange={setFilterRating}>
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue placeholder="Số sao" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả số sao</SelectItem>
            {[5, 4, 3, 2, 1].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} sao
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as ProductReviewSort)}>
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue placeholder="Sắp xếp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Mới nhất</SelectItem>
            <SelectItem value="highest">Sao cao nhất</SelectItem>
            <SelectItem value="lowest">Sao thấp nhất</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <div className="mt-4 space-y-3">
        {reviewsQuery.isLoading ? (
          <>
            <ReviewCardSkeleton />
            <ReviewCardSkeleton />
          </>
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {totalReviews === 0 ? (
              <>
                Chưa có đánh giá cho món này.
                <br />
                Hãy là người đầu tiên chia sẻ trải nghiệm sau khi hoàn thành đơn hàng.
              </>
            ) : (
              "Không có đánh giá phù hợp với bộ lọc."
            )}
          </div>
        ) : (
          reviews.map((r) => (
            <article
              key={r.id}
              className="rounded-2xl bg-card p-4 shadow-card"
            >
              <header className="flex items-center gap-3">
                <Avatar className="size-9">
                  <AvatarFallback>
                    {r.user.displayName.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{r.user.displayName}</span>
                    {r.verifiedPurchase && (
                      <Badge className="rounded-full bg-success/15 text-success hover:bg-success/20">
                        Đã mua hàng
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <RatingStars value={r.rating} />
                    <span>{formatRelativeTime(r.createdAt)}</span>
                  </div>
                </div>
              </header>
              {r.comment && (
                <p className="mt-2 text-sm leading-relaxed">{r.comment}</p>
              )}
              {r.imageUrls && r.imageUrls.length > 0 && (
                <div className="mt-2 flex gap-2 overflow-x-auto">
                  {r.imageUrls.map((u) => (
                    <img
                      key={u}
                      src={u}
                      alt=""
                      loading="lazy"
                      className="size-20 shrink-0 rounded-lg object-cover"
                    />
                  ))}
                </div>
              )}
              {r.shopReply && (
                <div className="mt-3 rounded-xl bg-muted p-3 text-sm">
                  <div className="mb-1 text-xs font-semibold text-primary">
                    Phản hồi từ quán
                  </div>
                  <p className="text-foreground/90">{r.shopReply.content}</p>
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}

// -----------------------------
// Skeletons
// -----------------------------
function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-4 md:px-6">
      <div className="grid gap-6 md:grid-cols-[minmax(0,45fr)_minmax(0,55fr)] md:gap-8">
        <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}

function ProductGridSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-[4/3] w-full rounded-2xl" />
      ))}
    </div>
  );
}

function ReviewCardSkeleton() {
  return <Skeleton className="h-24 w-full rounded-2xl" />;
}
