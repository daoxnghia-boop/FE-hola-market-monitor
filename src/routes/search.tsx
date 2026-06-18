import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { SearchBar } from "@/components/search-bar";
import { CategoryTabs } from "@/components/category-tabs";
import { ShopCard } from "@/components/shop-card";
import { ProductCard } from "@/components/product-card";
import { shops, products } from "@/lib/mock-data";
import { useState } from "react";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [{ title: "Tìm kiếm — Ăn Hòa Lạc" }],
  }),
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const ql = q.trim().toLowerCase();
  const matchedShops = shops.filter((s) => s.name.toLowerCase().includes(ql));
  const matchedProducts = products.filter((p) =>
    p.name.toLowerCase().includes(ql),
  );

  return (
    <AppShell>
      <div className="space-y-4 px-4 pt-4 pb-8">
        <h1 className="text-2xl font-extrabold">Tìm món, tìm quán</h1>
        <SearchBar value={q} onChange={(e) => setQ(e.target.value)} />
        <CategoryTabs variant="pills" />
        <section>
          <h2 className="mb-2 font-bold">Quán ăn ({matchedShops.length})</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {matchedShops.map((s) => (
              <ShopCard key={s.id} shop={s} />
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-2 font-bold">Món ăn ({matchedProducts.length})</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {matchedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
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
