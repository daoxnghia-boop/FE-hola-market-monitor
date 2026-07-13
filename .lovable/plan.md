## Mục tiêu

Thay `ProductSheet` (overlay) bằng trang chi tiết sản phẩm độc lập tại `/products/$productId`, kèm hệ đánh giá riêng cho sản phẩm, gợi ý cùng quán và sản phẩm liên quan. Toàn bộ dùng mock API hiện có, không đổi backend thật.

## Phạm vi

### 1. Route & điều hướng
- Tạo `src/routes/products.$productId.tsx`.
- `head()` sinh title `<Product> — <Shop> | HoLa Market`, description, og:title/description/type=product, og:url, canonical (leaf).
- `loader`: `ensureQueryData(productDetail)` + `prefetchQuery` cho reviews/summary/same-shop/related (non-blocking).
- `errorComponent` (retry: `router.invalidate() + reset()`), `notFoundComponent` (Không tìm thấy món ăn + link Home/Search).
- Trong `catalog / mock` khi product không tồn tại → `throw notFound()`.

### 2. Thay ProductSheet trong toàn bộ luồng khách
- `src/components/product-card.tsx`: refactor thành `<Link to="/products/$productId">` bọc phần nội dung, nút `+` là `<button>` tách riêng với `stopPropagation` và `preventDefault`. Bỏ prop `onSelect` (cardOnClick), giữ `disabled/disabledLabel`. Loại cấu trúc button-trong-button.
- Xoá state `openProduct/ProductSheet` khỏi: `routes/index.tsx`, `routes/search.tsx`, `routes/shops.$shopId.tsx`.
- Xoá file `src/components/product-sheet.tsx` (không giữ quick-add sheet — nút `+` đã đủ cho quick-add).
- Cart-shop conflict: chuyển từ `window.confirm` sang `AlertDialog` dùng chung — tạo `src/components/cart-conflict-dialog.tsx` (controlled) và dùng ở product-card + product-detail. Ép `window.confirm` thành pattern setState mở dialog.

### 3. Layout trang chi tiết
- Dùng `AppShell`. Container `max-w-[1200px]`.
- Desktop grid `md:grid-cols-[minmax(0,45fr)_minmax(0,55fr)]`, gap 8; mobile single column.
- Left: `ProductImage` (aspect 4/3, max-h ~460px, rounded-2xl, border/shadow subtle, overlay "Hết món").
- Right (thứ tự nhấn mạnh): tên → giá (primary) → rating + soldCount → mô tả → prep time / category → delivery info theo zone → quantity + note → CTA.
- Breadcrumb desktop: Trang chủ → Shop → Product. Mobile: nút back (dùng `router.history.back()` fallback `/`).
- Sticky bottom mobile: total + Thêm vào giỏ, kèm `pb-[env(safe-area-inset-bottom)]`, thêm padding-bottom cho main container để không che nội dung.

### 4. Section "Thông tin quán"
- Card gọn: logo, tên (link `/shops/$shopId`), rating, reviewCount, address, isOpen, prep time, shipping fee theo zone, ETA, button "Xem gian hàng".

### 5. Section "Món khác của quán"
- Hook `useProductsFromSameShop(productId, zoneId)`: lọc theo shopId, loại product hiện tại, ưu tiên cùng category rồi theo soldCount, limit 8. Trả `ProductDto[]` từ mock.
- Link "Xem toàn bộ thực đơn" → `/shops/$shopId`.

### 6. Section "Có thể bạn cũng thích"
- Hook `useRelatedProducts(productId, zoneId)`: cùng category, khác shopId, khác productId, shop approved & operation active & delivery-supported cho zone. Ưu tiên khoảng giá ±40%, sort theo rating*sold. Limit 8. Re-fetch khi zone đổi.

### 7. Product reviews (model mới, tách khỏi shop review)
- Bổ sung DTO: `ProductReviewDto`, `ProductReviewSummaryDto`, `ProductReviewListParams`, `ProductReviewCreateInput` — tất cả typed (không `any`).
- Mock endpoints (in-memory):
  - `GET /products/:id/reviews` — filter rating, sort latest|highest|lowest, pageSize+cursor.
  - `GET /products/:id/review-summary` — average, total, distribution 1..5.
  - `POST /orders/:orderId/items/:productId/review` — yêu cầu auth, order thuộc user, order completed, item tồn tại, chưa review, rating 1..5, comment ≤ 500. Verified purchase = true. Sau khi tạo: cập nhật `rating` và `reviewCount` của product trong mock store.
- Seed một số review mock (Vietnamese content, ảnh optional).
- Trả `shopReply?` cho ~1 vài review.

### 8. Services & hooks
- `catalogApi`: thêm `productReviews`, `productReviewSummary`, `relatedProducts`, `productsFromSameShop`. `catalogApi.product` đã có, nâng cấp mock response trả thêm `shop` (compact), `category`, `delivery` (zone-aware).
- `types.ts`: `ProductDetailDto = ProductDto & { shop: {...}, category?, delivery? }` — mock trả về `ProductDetailDto` khi zone/shop truy cập được, nhưng vẫn assignable với `ProductDto`.
- Hooks trong `src/lib/api/hooks.ts`: `useProduct`, `useProductReviews`, `useProductReviewSummary`, `useRelatedProducts`, `useProductsFromSameShop`, `useCreateProductReview`. Query keys namespaced.

### 9. UI review section
- Summary: average rating hero + phân phối 5→1 với progress bar.
- Filter rating (Select radix) + sort (Select). Bọc trong div `min-h-...` để chống layout shift.
- Empty state theo yêu cầu.
- Review card: avatar/fallback (initials), name, stars, "Đã mua hàng" badge nếu verified, date (relative), comment, ảnh (grid), shop reply block.

### 10. Order-detail action
- Ở `routes/orders.$orderId.tsx`: khi order status = completed, mỗi item có nút "Đánh giá món" → mở dialog nhập rating + comment → gọi `useCreateProductReview`. Ẩn nếu đã review (mock ghi nhớ per orderItem).

### 11. ProductImage component
- Tạo `src/components/product-image.tsx`: aspect prop mặc định `4/3`, skeleton loading, fallback trên onError (SVG placeholder), overlay `Hết món` khi unavailable.
- Product-card và product-detail dùng chung.

### 12. Mock image quality
- Rà `src/lib/api/mock/data.ts`, thay image không hợp lý bằng URL Unsplash food ổn định hoặc placeholder SVG (giữ ít nhất 1 ảnh phù hợp mỗi món). Không dùng random URL.

### 13. Product-card visuals
- Grid: aspect `4/3` cho ảnh (không phải square), `line-clamp-2` tên, height cân bằng.
- Row: image w-24, layout balance, disable large hover scale.

### 14. Loading/error/edge
- Skeletons cho image, info, shop card, same-shop grid, related grid, review section.
- Not-found page với link Trang chủ + Tìm kiếm.
- Trạng thái sản phẩm không public (shop suspended/rejected): thông báo "Món hiện không còn phục vụ".

### 15. Metadata
- `head()` chỉ set khi `loaderData` có; fallback title `Món ăn` + `robots noindex` khi loaderData undefined.
- `og:image = product.imageUrl` (absolute URL nếu có, else omit).

### 16. Không đụng
- `routeTree.gen.ts` (regenerate tự động).
- Backend/shop-owner/admin flow.
- Cart pricing / shop-specific shipping rule (đã có ở Đợt 3).

## Chi tiết kỹ thuật

- Query keys mới:
  - `["product", id, zoneId]`
  - `["product", id, "reviews", params]`
  - `["product", id, "review-summary"]`
  - `["product", id, "related", zoneId]`
  - `["product", id, "same-shop", zoneId]`
- Invalidate sau tạo review: chỉ 3 key trên + `["product", id, zoneId]` (để refresh rating).
- Không invalidate toàn bộ cache.
- Product-card structure:
  ```tsx
  <div className="relative group">
    <Link to="/products/$productId" params={{productId}} className="block ...">
      <ProductImage .../>
      <div className="p-3">...</div>
    </Link>
    <button aria-label="Thêm ... vào giỏ" onClick={handleAdd} className="absolute bottom-2 right-2 ...">+</button>
    <CartConflictDialog ... />
  </div>
  ```
- Verify plan bàn phím: Link focusable, nút + focusable riêng, ESC đóng dialog.
- Responsive check: 360/390/768/1024/1440 qua Playwright screenshot chốt.

## Deliverables

**Created**
- `src/routes/products.$productId.tsx`
- `src/components/product-image.tsx`
- `src/components/cart-conflict-dialog.tsx`
- `src/components/product-detail/breadcrumb.tsx`
- `src/components/product-detail/shop-mini-card.tsx`
- `src/components/product-detail/reviews-section.tsx`
- `src/components/product-detail/related-products.tsx`
- `src/components/product-detail/same-shop-products.tsx`
- `src/components/product-detail/write-review-dialog.tsx`

**Modified**
- `src/lib/api/types.ts` (ProductDetailDto, ProductReview*Dto)
- `src/lib/api/services.ts` (catalogApi thêm 4 method)
- `src/lib/api/hooks.ts` (6 hook mới)
- `src/lib/api/mock/index.ts` (route handlers + review store)
- `src/lib/api/mock/data.ts` (thay ảnh không phù hợp + seed reviews)
- `src/components/product-card.tsx` (Link-based, bỏ onSelect)
- `src/routes/index.tsx`, `src/routes/search.tsx`, `src/routes/shops.$shopId.tsx` (bỏ ProductSheet)
- `src/routes/orders.$orderId.tsx` (nút Đánh giá món)
- `docs/CHANGELOG.md`

**Deleted**
- `src/components/product-sheet.tsx`

**Route added**: `/products/$productId`
**Mock endpoints**: 3 endpoint reviews mới + nâng cấp `GET /products/:id`

## Ngoài phạm vi
- Không đổi cart pricing logic.
- Không đổi admin/shop-owner.
- Không tối ưu SSR (đã dùng TanStack Start defaults).
- Không viết unit tests mới (repo hiện chưa có test suite cho luồng này).

## Xác nhận
Xin phê duyệt trước khi triển khai — đây là task lớn (khoảng 12-15 file), sẽ chạy typecheck + lint cuối cùng và kiểm tra bằng Playwright.