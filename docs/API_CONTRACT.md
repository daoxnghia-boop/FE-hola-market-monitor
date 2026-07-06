# HoLa Market — Backend API contract đề xuất

## 1. Phạm vi rà soát

Đã rà toàn bộ source nghiệp vụ trong `src/routes`, `src/components` và `src/lib`. Hiện frontend **không gọi API thật**; `@tanstack/react-query` mới chỉ được khởi tạo ở root nhưng chưa có query/mutation nào.

### Màn hình/chức năng đang dùng mock hoặc hard-code

| Màn hình/chức năng | Nguồn hiện tại | Dữ liệu/hành vi cần thay |
|---|---|---|
| Trang chủ `/` | `mock-data.ts`, các store local | Category, voucher, quán gần, món phổ biến, món hay đặt, quán yêu thích, quán mới, unread count |
| Tìm kiếm `/search` | Lọc mảng `shops`, `products` tại client | Search, filter category/type, phân trang, số kết quả |
| Chi tiết quán `/shops/:shopId` | `getShop`, `getProductsByShop` | Thông tin quán, trạng thái mở cửa, vùng giao, menu, rating, favorite |
| Chọn vùng giao | `DELIVERY_ZONES`, `localStorage` trong cart | Danh sách vùng, phí giao theo quán/vùng, vùng mặc định của user |
| Yêu thích quán | `favorites-store.ts` + `localStorage` | Danh sách/thêm/xóa favorite theo user |
| Giỏ hàng `/cart` | `cart-store.ts` + `localStorage` | Item, số lượng, ghi chú, voucher, phí giao và tổng tiền |
| Voucher `/vouchers` | `vouchers` trong `mock-data.ts` | Voucher sở hữu/đủ điều kiện/đã dùng/hết hạn |
| Checkout `/checkout` | Tự tính tiền và tạo order tại client | Profile/address hard-code, kiểm tra tồn món, quote cuối, tạo đơn |
| Danh sách đơn `/orders` | `orders-store.ts` + 2 đơn mock | Lịch sử đơn, trạng thái, phân trang, đặt lại |
| Chi tiết đơn `/orders/:id` | Order local hoặc fallback giả | Snapshot đơn, timeline thật, hủy đơn, ETA, liên hệ quán |
| Theo dõi trạng thái đơn | Tự tăng status mỗi 8 giây | Polling/SSE/WebSocket từ backend |
| Đánh giá | Chỉ hiện toast thành công | Form và API review/rating thật |
| Thông báo `/notifications` | Seed data + `localStorage` | Danh sách, unread count, mark read/all read, deep link |
| Tài khoản `/account` | Guest name/avatar/version hard-code | Auth, profile, địa chỉ; nút đăng nhập hiện chưa hoạt động |
| Chia sẻ quán | Chỉ hiện toast | Đây là logic client; cần gọi Web Share/Clipboard, không cần API |

Không phát hiện màn hình hoặc flow **Admin** trong source hiện tại.

## 2. Quy ước chung

- Base URL: `/api/v1`.
- Auth: `Authorization: Bearer <accessToken>`; refresh token nên dùng cookie `HttpOnly; Secure; SameSite=Lax`.
- Tiền: số nguyên VND, ví dụ `35000`; không trả chuỗi đã format.
- Thời gian: ISO-8601 UTC, ví dụ `2026-07-07T03:30:00Z`; frontend tự tạo relative text.
- ID: string ổn định; không dùng tên/slug làm khóa nghiệp vụ. Có thể trả thêm `slug` cho URL.
- List dùng cursor: `pageSize` (mặc định 20, tối đa 100), `cursor`; response có `nextCursor`.
- Thành công trả trực tiếp DTO hoặc `{ items, nextCursor }`. Lỗi thống nhất:

```ts
type ApiError = {
  error: {
    code: string;       // ví dụ PRODUCT_UNAVAILABLE
    message: string;    // thông báo có thể hiển thị
    fieldErrors?: Record<string, string>;
    details?: Record<string, unknown>;
  };
};
```

- Status chung: `400` request sai, `401` chưa đăng nhập/token hết hạn, `403` không có quyền, `404` không tồn tại, `409` xung đột trạng thái, `422` vi phạm nghiệp vụ, `429` rate limit, `500` lỗi hệ thống.

## 3. DTO frontend cần

```ts
type CategoryDto = {
  id: string;
  name: string;
  iconUrl?: string;       // ưu tiên asset; tạm thời có thể trả emoji
  iconText?: string;
  sortOrder: number;
};

type DeliveryZoneDto = {
  id: string;
  name: string;
  shortName: string;
  baseDeliveryFee: number;
  active: boolean;
};

type ShopStatus = "open" | "break" | "out_of_menu" | "closed";

type ShopDto = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string;
  coverUrl: string;
  rating: number;         // 0..5
  reviewCount: number;
  address: string;
  area: string;
  distanceKm: number | null;
  status: ShopStatus;
  isOpen: boolean;        // giá trị đã tính tại thời điểm response
  prepTimeMinutes: number;
  estimatedDeliveryMinutes?: number;
  categoryIds: string[];
  description: string;
  phone: string;
  openHoursText: string;
  supportedZoneIds: string[];
  isFavorite: boolean;
  delivery?: {
    supported: boolean;
    fee: number | null;
  };
};

type ProductDto = {
  id: string;
  shopId: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  categoryId: string;
  available: boolean;
  unavailableReason?: "sold_out" | "shop_closed" | "zone_unsupported";
  prepTimeMinutes: number;
  rating: number;
  reviewCount?: number;
  soldCount: number;
};

type VoucherStatus =
  | "usable" | "soon_expire" | "used" | "expired"
  | "locked" | "not_eligible";

type VoucherDto = {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: "fixed" | "percent";
  discountValue: number;
  maxDiscount?: number;
  minOrderAmount: number;
  expiresAt: string;
  status: VoucherStatus;
  ineligibleReason?: string;
};

type UserDto = {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  defaultAddressId?: string;
  defaultDeliveryZoneId?: string;
};

type AddressDto = {
  id: string;
  label: string;          // Nhà, Công ty, KTX...
  recipientName: string;
  phone: string;
  deliveryZoneId: string;
  addressLine: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
};

type CartItemDto = {
  id: string;             // cart item id
  productId: string;
  quantity: number;
  note?: string;
  unitPrice: number;
  lineTotal: number;
  product: ProductDto;
};

type CartDto = {
  id: string;
  shop: ShopDto | null;
  items: CartItemDto[];
  deliveryZone: DeliveryZoneDto;
  voucher: VoucherDto | null;
  pricing: {
    subtotal: number;
    discount: number;
    deliveryFee: number;
    total: number;
  };
  canCheckout: boolean;
  blockingReasons: string[];
  updatedAt: string;
};

type OrderStatus =
  | "da_dat" | "cho_quan_xac_nhan" | "quan_da_xac_nhan"
  | "dang_chuan_bi" | "dang_giao" | "hoan_thanh" | "da_huy";

type OrderItemDto = {
  productId: string;
  productName: string;    // snapshot tại lúc đặt
  productImageUrl: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  note?: string;
};

type OrderSummaryDto = {
  id: string;
  displayCode: string;
  shopId: string;
  shopName: string;
  shopLogoUrl?: string;
  status: OrderStatus;
  itemSummary: string;
  itemCount: number;
  total: number;
  placedAt: string;
  canCancel: boolean;
  canReview: boolean;
  canReorder: boolean;
};

type OrderDetailDto = OrderSummaryDto & {
  shopPhone: string;
  shopAddress: string;
  items: OrderItemDto[];
  pricing: {
    subtotal: number;
    discount: number;
    deliveryFee: number;
    total: number;
  };
  voucherCode?: string;
  paymentMethod: "cash_on_delivery";
  paymentStatus: "unpaid" | "paid" | "refunded";
  delivery: {
    zoneId: string;
    zoneName: string;
    recipientName: string;
    phone: string;
    addressLine: string;
    note?: string;
    etaMinutes?: number;
  };
  statusHistory: Array<{
    status: OrderStatus;
    occurredAt: string;
    note?: string;
  }>;
  cancellation?: { reason?: string; canceledAt: string; canceledBy: string };
  review?: ReviewDto;
};

type ReviewDto = {
  id: string;
  orderId: string;
  shopId: string;
  user: { id: string; displayName: string; avatarUrl?: string };
  rating: number;         // integer 1..5
  comment?: string;
  createdAt: string;
};

type NotificationDto = {
  id: string;
  type: "order" | "voucher" | "shop" | "system";
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  target?: {
    type: "order" | "voucher" | "shop" | "url";
    id?: string;
    url?: string;
  };
};
```

## 4. API theo module

### Auth

| Method + URL | Request | Response | Status chính |
|---|---|---|---|
| `POST /auth/otp/request` | Body `{ phone: string }` | `{ requestId, expiresInSeconds, retryAfterSeconds }` | `202`, `400`, `429` |
| `POST /auth/otp/verify` | Body `{ requestId, otp }` | `{ accessToken, expiresInSeconds, user: UserDto, isNewUser }` + refresh cookie | `200`, `400`, `401`, `429` |
| `POST /auth/refresh` | Refresh cookie | `{ accessToken, expiresInSeconds }` | `200`, `401` |
| `POST /auth/logout` | Không body | Không body | `204`, `401` |
| `GET /auth/session` | Không params | `{ authenticated: boolean, user: UserDto | null }` | `200` |

OTP theo số điện thoại phù hợp UI hiện tại hơn password. Nếu backend dùng OAuth/password thì giữ nguyên response session/token ở trên.

### Customer/User

| Method + URL | Request | Response | Status chính |
|---|---|---|---|
| `GET /users/me` | — | `UserDto` | `200`, `401` |
| `PATCH /users/me` | Body `{ fullName?, email?, avatarUrl?, defaultDeliveryZoneId? }` | `UserDto` | `200`, `400`, `401` |
| `GET /users/me/addresses` | — | `{ items: AddressDto[] }` | `200`, `401` |
| `POST /users/me/addresses` | Body bỏ `id`, gồm recipient/phone/zone/address/geo/isDefault | `AddressDto` | `201`, `400`, `401`, `422` |
| `PATCH /users/me/addresses/:addressId` | Body các field cần đổi | `AddressDto` | `200`, `400`, `401`, `404` |
| `DELETE /users/me/addresses/:addressId` | — | Không body | `204`, `401`, `404`, `409` nếu đang được dùng |
| `GET /users/me/favorite-shops` | Query `cursor?, pageSize?, deliveryZoneId?` | `{ items: ShopDto[], nextCursor }` | `200`, `401` |
| `PUT /users/me/favorite-shops/:shopId` | — | `{ shopId, isFavorite: true }` | `200`, `401`, `404` |
| `DELETE /users/me/favorite-shops/:shopId` | — | Không body | `204`, `401`, `404` |
| `GET /users/me/frequent-products` | Query `deliveryZoneId?, limit=4` | `{ items: ProductDto[] }` | `200`, `401` |

Khách chưa đăng nhập có thể giữ cart/zone local. Favorite, lịch sử đơn và địa chỉ nên yêu cầu đăng nhập; hoặc backend cấp `guestId` cookie nếu product muốn hỗ trợ guest order.

### Shop

| Method + URL | Request | Response | Status chính |
|---|---|---|---|
| `GET /shops` | Query `q?, categoryId?, deliveryZoneId?, sort=distance|rating|newest|popular, cursor?, pageSize?` | `{ items: ShopDto[], nextCursor }` | `200`, `400` |
| `GET /shops/:shopId` | Query `deliveryZoneId?` | `ShopDto` | `200`, `404` |
| `GET /shops/:shopId/products` | Query `categoryId?, available?, cursor?, pageSize?` | `{ items: ProductDto[], nextCursor }` | `200`, `404` |
| `GET /shops/:shopId/delivery-quote` | Query `deliveryZoneId` | `{ supported, deliveryFee, estimatedDeliveryMinutes, reason? }` | `200`, `400`, `404`, `422` |
| `GET /delivery-zones` | Query `active=true` | `{ items: DeliveryZoneDto[] }` | `200` |

`distanceKm` chỉ có ý nghĩa khi backend nhận vị trí/zone. Nếu chỉ có zone, nên trả `null` thay vì khoảng cách giả.

### Product

| Method + URL | Request | Response | Status chính |
|---|---|---|---|
| `GET /products` | Query `q?, shopId?, categoryId?, deliveryZoneId?, available?, sort=sold|rating|newest, cursor?, pageSize?` | `{ items: ProductDto[], nextCursor }` | `200`, `400` |
| `GET /products/:productId` | Query `deliveryZoneId?` | `ProductDto` | `200`, `404` |
| `GET /products/popular` | Query `deliveryZoneId?, limit=6` | `{ items: ProductDto[] }` | `200` |
| `GET /search` | Query `q` bắt buộc, `type=all|shops|products`, `categoryId?, deliveryZoneId?, cursor?, pageSize?` | `{ shops: { items: ShopDto[], total }, products: { items: ProductDto[], total }, nextCursor? }` | `200`, `400` |

`GET /search` giúp kết quả quán và món đồng nhất, hỗ trợ dấu tiếng Việt/full-text search và trả count thật; không nên tải hết dữ liệu về rồi lọc client.

### Category

| Method + URL | Request | Response | Status chính |
|---|---|---|---|
| `GET /categories` | Query `active=true` | `{ items: CategoryDto[] }` | `200` |

### Cart

Mọi mutation cart nên trả lại **toàn bộ `CartDto`**, để frontend luôn dùng giá, voucher, phí giao và điều kiện checkout do server tính.

| Method + URL | Request | Response | Status chính |
|---|---|---|---|
| `GET /cart` | Query `guestId?` nếu hỗ trợ guest | `CartDto` | `200`, `401` |
| `POST /cart/items` | Body `{ productId, quantity, note?, replaceExistingCart?: boolean }` | `CartDto` | `200`, `400`, `404`, `409 CART_SHOP_CONFLICT`, `422 PRODUCT_UNAVAILABLE` |
| `PATCH /cart/items/:itemId` | Body `{ quantity?, note? }` | `CartDto` | `200`, `400`, `404`, `422` |
| `DELETE /cart/items/:itemId` | — | `CartDto` | `200`, `404` |
| `DELETE /cart` | — | `CartDto` rỗng | `200` |
| `PUT /cart/delivery-zone` | Body `{ deliveryZoneId }` | `CartDto` | `200`, `404`, `422 ZONE_UNSUPPORTED` |
| `PUT /cart/voucher` | Body `{ code }` | `CartDto` | `200`, `404`, `422 VOUCHER_NOT_ELIGIBLE` |
| `DELETE /cart/voucher` | — | `CartDto` | `200` |
| `POST /cart/validate` | Body rỗng | `CartDto` đã refresh availability/price | `200`, `409 CART_CHANGED`, `422` |

### Voucher/Promotion

Module này có màn hình riêng dù không nằm trong danh sách module mẫu của yêu cầu.

| Method + URL | Request | Response | Status chính |
|---|---|---|---|
| `GET /users/me/vouchers` | Query `shopId?, cartSubtotal?, status?, cursor?, pageSize?` | `{ items: VoucherDto[], nextCursor }` | `200`, `401` |
| `GET /vouchers/:code/eligibility` | Query `shopId, subtotal` | `{ voucher: VoucherDto, eligible: boolean, discountAmount, reason? }` | `200`, `404`, `422` |

API apply voucher chính thức vẫn là `PUT /cart/voucher`; endpoint eligibility chỉ phục vụ xem trước.

### Order

| Method + URL | Request | Response | Status chính |
|---|---|---|---|
| `POST /orders` | Header `Idempotency-Key`; body `{ cartId, addressId? / delivery: { deliveryZoneId, recipientName, phone, addressLine }, note?, paymentMethod: "cash_on_delivery" }` | `OrderDetailDto` | `201`, `400`, `404`, `409 CART_CHANGED`, `422 SHOP_CLOSED/PRODUCT_UNAVAILABLE/ZONE_UNSUPPORTED` |
| `GET /orders` | Query `status?, cursor?, pageSize?` | `{ items: OrderSummaryDto[], nextCursor }` | `200`, `401` |
| `GET /orders/:orderId` | — | `OrderDetailDto` | `200`, `401`, `403`, `404` |
| `POST /orders/:orderId/cancel` | Body `{ reasonCode?, reasonText? }` | `OrderDetailDto` | `200`, `401`, `404`, `409 ORDER_CANNOT_CANCEL` |
| `POST /orders/:orderId/reorder` | Body `{ replaceExistingCart?: boolean }` | `{ cart: CartDto, skippedItems: Array<{ productId, reason }> }` | `200`, `401`, `404`, `409`, `422` |
| `GET /orders/:orderId/events` | SSE; header `Last-Event-ID` tùy chọn | Event `{ id, type: "order.status_changed", data: OrderDetailDto }` | `200`, `401`, `403`, `404` |

Backend phải sinh `displayCode`, snapshot tên/ảnh/giá món, tính tổng, kiểm tra trạng thái quán/món/voucher/zone trong transaction và xóa cart sau khi tạo đơn thành công. Frontend không gửi hoặc quyết định `subtotal`, `discount`, `deliveryFee`, `total`, `status`.

### Review/Rating

| Method + URL | Request | Response | Status chính |
|---|---|---|---|
| `POST /orders/:orderId/review` | Body `{ rating: 1|2|3|4|5, comment? }` | `ReviewDto` | `201`, `400`, `401`, `404`, `409 ALREADY_REVIEWED`, `422 ORDER_NOT_COMPLETED` |
| `PATCH /reviews/:reviewId` | Body `{ rating?, comment? }` | `ReviewDto` | `200`, `400`, `401`, `403`, `404` |
| `GET /shops/:shopId/reviews` | Query `rating?, cursor?, pageSize?` | `{ items: ReviewDto[], summary: { average, total, counts: Record<1|2|3|4|5, number> }, nextCursor }` | `200`, `404` |

Rating aggregate trong `ShopDto`/`ProductDto` phải do backend cập nhật từ review thật, không nhận rating/sold count từ client.

### Notification

| Method + URL | Request | Response | Status chính |
|---|---|---|---|
| `GET /notifications` | Query `read?, type?, cursor?, pageSize?` | `{ items: NotificationDto[], unreadCount, nextCursor }` | `200`, `401` |
| `GET /notifications/unread-count` | — | `{ unreadCount }` | `200`, `401` |
| `PATCH /notifications/:notificationId/read` | Body `{ read: true }` | `NotificationDto` | `200`, `401`, `404` |
| `POST /notifications/read-all` | Body `{ before?: ISODate }` | `{ updatedCount, unreadCount: 0 }` | `200`, `401` |
| `GET /notifications/events` | SSE | Event `{ type: "notification.created", data: NotificationDto }` | `200`, `401` |

Không trả `timeText`; frontend nên format `createdAt` bằng locale để text không bị cũ khi tab mở lâu.

### Admin

Không có route, component, role hay thao tác Admin trong frontend hiện tại, nên **không suy diễn Admin API** trong contract MVP này. Việc quán xác nhận/chuyển trạng thái đơn chắc chắn cần một merchant/admin surface riêng, nhưng phải contract theo source của surface đó thay vì frontend customer hiện tại.

## 5. Flow hiện tại và đề xuất chỉnh

1. **Khởi tạo app**: gọi song song session, categories, zones, cart và unread count; dùng React Query cache. Guest cart có thể hydrate từ local rồi merge một lần sau login.
2. **Trang chủ**: không sort/cắt từ toàn bộ mảng ở client. Gọi các list có `limit`; `frequent-products` chỉ hiển thị khi đã login/có lịch sử. Có thể thêm BFF `GET /home?deliveryZoneId=` sau này nếu số round-trip quá lớn.
3. **Category**: hiện click category trên trang chủ chỉ set state nhưng không lọc/navigate; category trên trang search không truyền `onChange`. Cần đưa `categoryId` vào URL query và refetch search/list.
4. **Search**: debounce 250–400 ms, query chỉ chạy khi keyword hợp lệ; giữ `q`, `type`, `categoryId` trên URL; phân trang/infinite query. Không search toàn bộ mảng client.
5. **Shop detail**: loader phải fetch `shop` và menu; 404 thật nếu không tồn tại. Favorite dùng optimistic mutation và rollback khi lỗi. Share dùng `navigator.share`/clipboard thật.
6. **Cart một quán**: hiện thêm món quán khác âm thầm xóa giỏ cũ. Phải nhận `409 CART_SHOP_CONFLICT`, hỏi user xác nhận, rồi retry với `replaceExistingCart=true`.
7. **Giá và voucher**: frontend hiện tự tính toàn bộ. Chỉ hiển thị `CartDto.pricing`; sau mỗi mutation lấy cart response mới. Validate lại trước checkout.
8. **Checkout**: không prefill tên/số điện thoại/địa chỉ giả; lấy từ `UserDto` và `AddressDto`. Gửi `Idempotency-Key`, disable nút khi pending, chỉ clear cart sau `201`.
9. **Order detail**: bỏ fallback order cho mọi ID và bỏ timer tự tăng trạng thái. Dùng detail API + SSE; nếu SSE không khả dụng, poll 5–10 giây khi đơn chưa terminal. Timeline dùng `statusHistory.occurredAt`, không dùng text thời gian hard-code.
10. **Cancel**: backend quyết định `canCancel`; yêu cầu xác nhận/lý do; xử lý `409` khi quán đã nhận đơn trước lúc request tới.
11. **Reorder**: không chép mù product ID vào cart. API reorder phải kiểm tra món đã xóa/hết hàng/đổi giá và trả `skippedItems` để UI thông báo.
12. **Review**: chỉ bật khi `canReview=true`; mở form rating/comment, submit mutation, cập nhật order và rating quán từ response/cache invalidation.
13. **Notification**: mark-read optimistic; deep link lấy từ `target` thay vì suy luận bằng type. Order status/notification do backend tạo, frontend không tự thêm notification sau checkout.
14. **Auth/route protection**: Account, Order, Voucher cá nhân, Favorite và Notification cần session. Khi `401`, refresh một lần; thất bại thì redirect login và giữ `returnUrl`.

## 6. Thứ tự backend nên implement

1. Category + delivery zone + Shop/Product/Search read APIs.
2. Auth + profile/address.
3. Cart server-side + pricing/voucher validation.
4. Create/list/detail/cancel/reorder Order, có idempotency và transaction.
5. Order status events + Notification.
6. Favorite, frequent products, Review/Rating.

Contract trên đủ thay thế mọi mock/hard-code mang tính dữ liệu hoặc nghiệp vụ đang xuất hiện trong customer frontend hiện tại; nội dung UI tĩnh như tiêu đề, nhãn, SEO text và phiên bản ứng dụng không cần backend API.
