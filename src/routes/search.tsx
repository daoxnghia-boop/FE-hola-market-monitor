import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { SearchBar } from "@/components/search-bar";
import { CategoryTabs } from "@/components/category-tabs";
import { ShopCard } from "@/components/shop-card";
import { ProductCard } from "@/components/product-card";
import { EmptyState } from "@/components/empty-state";
import { useProducts, useSearch, useShops } from "@/lib/api/hooks";
import { useDeliveryZone } from "@/lib/cart-store";
import { useEffect, useState } from "react";
import { Search as SearchIcon } from "lucide-react";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
    categoryId: typeof search.categoryId === "string" ? search.categoryId : "all",
  }),
  head: () => ({
    meta: [{ title: "Tìm kiếm — Ăn Hòa Lạc" }],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q: initialQ, categoryId } = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const [q, setQ] = useState(initialQ ?? "");
  const [tab, setTab] = useState<"all" | "products" | "shops">("all");
  const zone = useDeliveryZone();

  useEffect(() => {
    setQ(initialQ ?? "");
  }, [initialQ]);

  const ql = q.trim().toLowerCase();
  const params = {
    q: ql,
    type: tab,
    categoryId: categoryId === "all" ? undefined : categoryId,
    deliveryZoneId: zone?.id,
    pageSize: 20,
  };
  const searchQuery = useSearch(params, Boolean(ql));
  const defaultShops = useShops({
    categoryId: categoryId === "all" ? undefined : categoryId,
    deliveryZoneId: zone?.id,
    pageSize: 20,
  });
  const defaultProducts = useProducts({
    categoryId: categoryId === "all" ? undefined : categoryId,
    deliveryZoneId: zone?.id,
    pageSize: 8,
  });
  const matchedShops = ql ? (searchQuery.data?.shops.items ?? []) : (defaultShops.data ?? []);
  const matchedProducts = ql
    ? (searchQuery.data?.products.items ?? [])
    : (defaultProducts.data ?? []);
  const isLoading = ql
    ? searchQuery.isLoading
    : defaultShops.isLoading || defaultProducts.isLoading;
  const isError = ql ? searchQuery.isError : defaultShops.isError || defaultProducts.isError;

  const showShops = tab === "all" || tab === "shops";
  const showProducts = tab === "all" || tab === "products";
  const isEmpty = ql && matchedShops.length === 0 && matchedProducts.length === 0;

  const submitSearch = () => {
    navigate({ search: { q: q.trim(), categoryId }, replace: true });
  };

  return (
    <AppShell>
      <div className="space-y-4 px-4 pt-4 pb-8">
        <h1 className="text-2xl font-extrabold">Tìm món, tìm quán</h1>
        <SearchBar
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitSearch();
          }}
          placeholder="Tìm món hoặc quán (vd: cơm gà, trà sữa)..."
        />

        {/* Tabs */}
        <div className="flex gap-2">
          {(
            [
              { id: "all", label: "Tất cả" },
              { id: "products", label: `Món ăn (${matchedProducts.length})` },
              { id: "shops", label: `Quán ăn (${matchedShops.length})` },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={
                "rounded-full px-4 py-1.5 text-sm font-semibold transition " +
                (tab === t.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground")
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        <CategoryTabs
          value={categoryId}
          variant="pills"
          onChange={(nextCategory) =>
            navigate({ search: { q: q.trim(), categoryId: nextCategory }, replace: true })
          }
        />

        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Đang tìm món và quán...</p>
        ) : isError ? (
          <p className="py-8 text-center text-sm text-destructive">
            Chưa thể tải kết quả tìm kiếm.
          </p>
        ) : isEmpty ? (
          <EmptyState
            icon={<SearchIcon className="size-6" />}
            title="Không tìm thấy kết quả"
            description={`Không có món/quán nào khớp với "${q}". Thử từ khoá khác nhé!`}
          />
        ) : (
          <>
            {showShops && matchedShops.length > 0 && (
              <section>
                <h2 className="mb-2 font-bold">Quán ăn ({matchedShops.length})</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {matchedShops.map((s) => (
                    <ShopCard key={s.id} shop={s} />
                  ))}
                </div>
              </section>
            )}
            {showProducts && matchedProducts.length > 0 && (
              <section>
                <h2 className="mb-2 font-bold">Món ăn ({matchedProducts.length})</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {matchedProducts.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Mẹo: bạn cũng có thể{" "}
          <Link to="/" className="text-primary underline">
            xem trang chủ
          </Link>
          .
        </p>
      </div>
    </AppShell>
  );
}
