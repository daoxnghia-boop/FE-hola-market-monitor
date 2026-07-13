# Changelog

## feat(product-detail): add standalone product page and product reviews

### Added
- Route `/products/$productId` — standalone product detail page (SSR-safe, sharable, refreshable, browser back/forward supported).
- Product-scoped review model separate from shop/order reviews:
  `ProductReviewDto`, `ProductReviewSummaryDto`, `ProductReviewCreateInput`,
  `ProductReviewListParams`, `ProductReviewSort`.
- Mock endpoints:
  - `GET /products/:id/reviews` (rating, sort, pageSize, cursor)
  - `GET /products/:id/review-summary`
  - `GET /products/:id/related`
  - `GET /products/:id/same-shop`
  - `POST /orders/:orderId/items/:productId/review` (auth, ownership,
    completed order, one review per order-item, rating 1–5, comment ≤ 500).
- `ProductDetailDto` — extends `ProductDto` with pre-joined shop info,
  category, and zone-scoped `delivery` block.
- Hooks: `useProduct`, `useProductReviews`, `useProductReviewSummary`,
  `useRelatedProducts`, `useProductsFromSameShop`, `useCreateProductReview`.
- Components: `ProductImage` (aspect-ratio, fallback, unavailable overlay),
  `CartConflictDialog` (Radix alert dialog replacing `window.confirm`),
  `WriteProductReviewDialog`.
- Order detail page: per-item "Đánh giá món" button when order status is
  `hoan_thanh`; hidden after the item has been reviewed. Uses shared
  `WriteProductReviewDialog`. Reviewed order-items are tracked in mock via
  `OrderDetailDto.reviewedProductIds`.

### Changed
- `ProductCard` refactored to Link-first structure: whole card area (image,
  name, description) is a `<Link to="/products/$productId">`; the "+" quick
  add is a separate button with `stopPropagation`, cart-shop conflict now
  handled with the shared `CartConflictDialog`. No more nested-button
  markup. Grid layout uses 4/3 image ratio and two-line names.
- Mock product images swapped from random `picsum.photos` seeds to a
  curated stable Unsplash food-photo pool with placeholder fallback via
  `ProductImage`.
- Home page, search page, shop-detail menu, and shop-owner recommendations
  now navigate to `/products/$productId` instead of opening the sheet.
- Order-review mock endpoint `POST /orders/:id/review` untouched; new
  product-review endpoint is separate.

### Removed
- `src/components/product-sheet.tsx` and all local `openProduct` / sheet
  state on home + shop-detail pages.

### Migration notes for real backend
- `catalogApi.product(id, zoneId)` now expects `ProductDetailDto` shape.
  The zone-scoped shop and delivery fields must be pre-joined by the API
  so the detail page can render without additional round-trips.
- Product review endpoints listed above must exist and enforce the same
  rules as the mock (ownership, completed order, dedupe).
- `OrderDetailDto.reviewedProductIds` must be populated per request so the
  order detail UI knows which items still need reviewing.
