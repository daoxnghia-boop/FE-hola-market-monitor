# Changelog

## feat(shop-owner-orders): explicit confirm/reject flow + shop status audit

### Added
- Explicit shop-owner order transition endpoints replacing the generic
  `/advance`:
  - `POST /shop-owner/orders/:id/confirm` — `cho_quan_xac_nhan → quan_da_xac_nhan`
  - `POST /shop-owner/orders/:id/reject` — `cho_quan_xac_nhan → da_huy`,
    requires `{ reason }` and writes `cancellation` metadata.
  - `POST /shop-owner/orders/:id/start-preparing` — `quan_da_xac_nhan → dang_chuan_bi`
  - `POST /shop-owner/orders/:id/start-delivery` — `dang_chuan_bi → dang_giao`
  - `POST /shop-owner/orders/:id/complete` — `dang_giao → hoan_thanh`
  - Each enforces valid current status via `INVALID_STATUS` conflict,
    appends to `statusHistory`, and emits a customer notification with a
    localized title/body.
- `shopOwnerApi.confirmOrder / rejectOrder / startPreparingOrder /
  startDeliveryOrder / completeOrder` service methods.
- `useOwnerOrderMutations()` now exposes `confirm`, `reject`,
  `startPreparing`, `startDelivery`, `complete`, `cancel` (existing
  `advance` removed). All invalidate `owner/orders`, `owner/order`,
  `owner/stats`, `orders`, `order`.
- Shop-owner dashboard: new "Đơn mới chờ xác nhận" section listing all
  `cho_quan_xac_nhan` orders with inline `Xác nhận đơn` / `Từ chối`
  actions. Reject uses a Radix Dialog with required reason (no
  `window.confirm`).

### Changed
- Shop-owner order-detail page: replaced the single "Chuyển sang: …"
  button with the correct action per status
  (`Xác nhận đơn`+`Từ chối` → `Bắt đầu chuẩn bị` → `Bắt đầu giao` →
  `Hoàn thành đơn`). "Hủy đơn" is only shown after confirmation.
- Reversed shop `operationStatus` labels/actions audited across surfaces.
  Canonical mapping now used everywhere:
  - `active` → badge "Đang hoạt động", action "Tạm dừng nhận đơn"
  - `paused` → badge "Tạm dừng nhận đơn", action "Hoạt động lại"
  - `suspended` → badge "Bị Admin tạm khóa"
  Updated `src/routes/shop-owner.shops.index.tsx`,
  `src/routes/admin.shops.tsx` (badge tone now distinguishes
  paused/suspended), and `src/routes/account.tsx` (raw enum strings
  replaced with labels).



## feat(product-reviews): add customer review submission and management

### Added
- Reusable `ProductReviewForm` component (star rating with hover preview,
  keyboard-accessible radiogroup, rating meaning labels, 10–1000 char
  comment with remaining count, up to 3 optional image URLs, submit +
  cancel buttons; works in create + edit mode).
- `ReviewInputPanel` on `/products/$productId` above the review list —
  shows the right UI per eligibility state: guest login CTA, "chưa mua
  hàng", "đơn chưa hoàn thành", eligible form, or an "Đánh giá của bạn"
  card with edit/delete actions.
- `DeleteReviewDialog` (Radix AlertDialog) — replaces `window.confirm`
  for deleting a review.
- Route search params on `/products/$productId?orderId=&orderItemId=` +
  `#write-review` hash — the order-detail "Đánh giá món" button now deep
  links here instead of opening a dialog inside the order page.
- Mock endpoints:
  - `GET /products/:id/review-eligibility` — returns `authenticated`,
    `eligible`, `reason` (`not_authenticated | not_purchased |
    order_not_completed | already_reviewed | eligible`),
    `eligibleOrderItems[]`, `existingReview?`, `pendingOrder?`.
  - `PATCH /product-reviews/:reviewId` — author-only edit (rating,
    comment, imageUrls); sets `updatedAt`, recomputes product aggregates.
  - `DELETE /product-reviews/:reviewId` — author-only; frees the
    order-item for a fresh review and recomputes aggregates.
- Types: `ProductReviewEligibilityDto`, `ProductReviewUpdateInput`,
  `ProductReviewDto.updatedAt`, `ProductReviewCreateInput.orderItemId`.
- Hooks: `useProductReviewEligibility`, `useUpdateProductReview`,
  `useDeleteProductReview`; `useCreateProductReview` now invalidates the
  focused surface (product detail, review list, summary, eligibility,
  relevant order + order list).
- Seed data: two extra completed orders for the default customer (`o3`,
  `o4`) so `p1 — Cơm sườn nướng` demonstrates "multiple eligible
  purchases of the same product".

### Changed
- `POST /orders/:orderId/items/:productId/review`: comment cap raised to
  1000, images capped at 3, and error codes normalised to
  `AUTH_REQUIRED / ORDER_NOT_OWNED / ORDER_NOT_COMPLETED /
  PRODUCT_NOT_IN_ORDER / REVIEW_ALREADY_EXISTS / INVALID_RATING /
  INVALID_COMMENT`.
- `src/routes/orders.$orderId.tsx`: per-item "Đánh giá món" is now a
  `Link` to the product page with `orderId`/`orderItemId` search params;
  the in-order dialog is removed.
- Query keys namespaced to `product-reviews`, `product-review-summary`,
  `product-review-eligibility` and invalidated surgically.

### Removed
- `src/components/write-product-review-dialog.tsx` — superseded by the
  standalone product-page review flow.

### Test account
- Customer `0900000000` / OTP `123456`.
- Eligible product: **p1 — Cơm sườn nướng** (orders `HL2606-001`,
  `HL2506-004` are completed and unreviewed → multi-order selector).

## feat(product-detail): add standalone product page and product reviews



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
