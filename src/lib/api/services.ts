import { apiRequest } from "./client";
import type {
  AddressDto,
  AdminAuditDto,
  AdminStatsDto,
  AdminUserSummaryDto,
  CartDto,
  CategoryDto,
  DeliveryZoneDto,
  NotificationDto,
  NotificationPageDto,
  OrderDetailDto,
  OrderSummaryDto,
  OtpChallengeDto,
  Paginated,
  ProductDetailDto,
  ProductDto,
  ProductInput,
  ProductReviewCreateInput,
  ProductReviewDto,
  ProductReviewListDto,
  ProductReviewListParams,
  ProductReviewSummaryDto,
  ReviewDto,
  SearchDto,
  SessionDto,
  ShopDto,
  ShopOwnerStatsDto,
  ShopRegistrationInput,
  UserDto,
  VerifyOtpResultDto,
  VoucherDto,
} from "./types";

export const authApi = {
  session: () => apiRequest<SessionDto>("/auth/session"),
  logout: () => apiRequest<void>("/auth/logout", { method: "POST" }),
  requestOtp: (phone: string) =>
    apiRequest<OtpChallengeDto>("/auth/request-otp", { method: "POST", body: { phone } }),
  verifyOtp: (body: { challengeId: string; phone: string; otp: string }) =>
    apiRequest<VerifyOtpResultDto>("/auth/verify-otp", { method: "POST", body }),
  register: (body: { fullName: string; phone: string; email?: string; acceptedTerms: boolean }) =>
    apiRequest<SessionDto>("/auth/register", { method: "POST", body }),
};

export const userApi = {
  me: () => apiRequest<UserDto>("/users/me"),
  updateMe: (body: Partial<UserDto>) => apiRequest<UserDto>("/users/me", { method: "PATCH", body }),
  addresses: () => apiRequest<{ items: AddressDto[] }>("/users/me/addresses"),
  favoriteShops: (deliveryZoneId?: string) =>
    apiRequest<Paginated<ShopDto>>("/users/me/favorite-shops", { query: { deliveryZoneId } }),
  frequentProducts: (deliveryZoneId?: string, limit = 4) =>
    apiRequest<{ items: ProductDto[] }>("/users/me/frequent-products", {
      query: { deliveryZoneId, limit },
    }),
  addFavorite: (shopId: string) =>
    apiRequest<{ shopId: string; isFavorite: true }>(`/users/me/favorite-shops/${shopId}`, {
      method: "PUT",
    }),
  removeFavorite: (shopId: string) =>
    apiRequest<void>(`/users/me/favorite-shops/${shopId}`, { method: "DELETE" }),
};

export const catalogApi = {
  categories: () =>
    apiRequest<{ items: CategoryDto[] }>("/categories", { query: { active: true } }),
  deliveryZones: () =>
    apiRequest<{ items: DeliveryZoneDto[] }>("/delivery-zones", { query: { active: true } }),
  shops: (query: Record<string, unknown> = {}) =>
    apiRequest<Paginated<ShopDto>>("/shops", { query }),
  shop: (shopId: string, deliveryZoneId?: string) =>
    apiRequest<ShopDto>(`/shops/${shopId}`, { query: { deliveryZoneId } }),
  shopProducts: (shopId: string, query: Record<string, unknown> = {}) =>
    apiRequest<Paginated<ProductDto>>(`/shops/${shopId}/products`, { query }),
  products: (query: Record<string, unknown> = {}) =>
    apiRequest<Paginated<ProductDto>>("/products", { query }),
  product: (productId: string, deliveryZoneId?: string) =>
    apiRequest<ProductDetailDto>(`/products/${productId}`, { query: { deliveryZoneId } }),
  popularProducts: (deliveryZoneId?: string, limit = 6) =>
    apiRequest<{ items: ProductDto[] }>("/products/popular", { query: { deliveryZoneId, limit } }),
  search: (query: Record<string, unknown>) => apiRequest<SearchDto>("/search", { query }),
  productReviews: (productId: string, params: ProductReviewListParams = {}) =>
    apiRequest<ProductReviewListDto>(`/products/${productId}/reviews`, {
      query: {
        rating: params.rating,
        sort: params.sort,
        pageSize: params.pageSize,
        cursor: params.cursor,
      },
    }),
  productReviewSummary: (productId: string) =>
    apiRequest<ProductReviewSummaryDto>(`/products/${productId}/review-summary`),
  relatedProducts: (
    productId: string,
    opts: { deliveryZoneId?: string; limit?: number } = {},
  ) =>
    apiRequest<{ items: ProductDto[] }>(`/products/${productId}/related`, {
      query: { deliveryZoneId: opts.deliveryZoneId, limit: opts.limit },
    }),
  productsFromSameShop: (
    productId: string,
    opts: { deliveryZoneId?: string; limit?: number } = {},
  ) =>
    apiRequest<{ items: ProductDto[] }>(`/products/${productId}/same-shop`, {
      query: { deliveryZoneId: opts.deliveryZoneId, limit: opts.limit },
    }),
};

export const voucherApi = {
  mine: (query: Record<string, unknown> = {}) =>
    apiRequest<Paginated<VoucherDto>>("/users/me/vouchers", { query }),
};

export const cartApi = {
  get: () => apiRequest<CartDto>("/cart"),
  addItem: (body: {
    productId: string;
    quantity: number;
    note?: string;
    replaceExistingCart?: boolean;
  }) => apiRequest<CartDto>("/cart/items", { method: "POST", body }),
  updateItem: (itemId: string, body: { quantity?: number; note?: string }) =>
    apiRequest<CartDto>(`/cart/items/${itemId}`, { method: "PATCH", body }),
  removeItem: (itemId: string) =>
    apiRequest<CartDto>(`/cart/items/${itemId}`, { method: "DELETE" }),
  clear: () => apiRequest<CartDto>("/cart", { method: "DELETE" }),
  setZone: (deliveryZoneId: string) =>
    apiRequest<CartDto>("/cart/delivery-zone", { method: "PUT", body: { deliveryZoneId } }),
  setVoucher: (code: string) =>
    apiRequest<CartDto>("/cart/voucher", { method: "PUT", body: { code } }),
  removeVoucher: () => apiRequest<CartDto>("/cart/voucher", { method: "DELETE" }),
  validate: () => apiRequest<CartDto>("/cart/validate", { method: "POST" }),
};

export const orderApi = {
  list: (query: Record<string, unknown> = {}) =>
    apiRequest<Paginated<OrderSummaryDto>>("/orders", { query }),
  detail: (orderId: string) => apiRequest<OrderDetailDto>(`/orders/${orderId}`),
  create: (
    body: {
      cartId: string;
      addressId?: string;
      delivery?: {
        deliveryZoneId: string;
        recipientName: string;
        phone: string;
        addressLine: string;
      };
      note?: string;
      paymentMethod: "cash_on_delivery";
    },
    idempotencyKey: string,
  ) => apiRequest<OrderDetailDto>("/orders", { method: "POST", body, idempotencyKey }),
  cancel: (orderId: string, body: { reasonCode?: string; reasonText?: string } = {}) =>
    apiRequest<OrderDetailDto>(`/orders/${orderId}/cancel`, { method: "POST", body }),
  reorder: (orderId: string, replaceExistingCart = false) =>
    apiRequest<{ cart: CartDto; skippedItems: Array<{ productId: string; reason: string }> }>(
      `/orders/${orderId}/reorder`,
      { method: "POST", body: { replaceExistingCart } },
    ),
};

export const reviewApi = {
  create: (orderId: string, body: { rating: number; comment?: string }) =>
    apiRequest<ReviewDto>(`/orders/${orderId}/review`, { method: "POST", body }),
  createProductReview: (
    orderId: string,
    productId: string,
    body: ProductReviewCreateInput,
  ) =>
    apiRequest<ProductReviewDto>(
      `/orders/${orderId}/items/${productId}/review`,
      { method: "POST", body },
    ),
};

export const notificationApi = {
  list: (query: Record<string, unknown> = {}) =>
    apiRequest<NotificationPageDto>("/notifications", { query }),
  unreadCount: () => apiRequest<{ unreadCount: number }>("/notifications/unread-count"),
  markRead: (notificationId: string) =>
    apiRequest<NotificationDto>(`/notifications/${notificationId}/read`, {
      method: "PATCH",
      body: { read: true },
    }),
  markAllRead: () =>
    apiRequest<{ updatedCount: number; unreadCount: number }>("/notifications/read-all", {
      method: "POST",
      body: {},
    }),
};

// ==================== ADMIN ====================
export const adminApi = {
  stats: () => apiRequest<AdminStatsDto>("/admin/stats"),
  audits: () => apiRequest<{ items: AdminAuditDto[] }>("/admin/audits"),

  shops: (query: Record<string, unknown> = {}) =>
    apiRequest<Paginated<ShopDto>>("/admin/shops", { query }),
  shop: (id: string) => apiRequest<ShopDto>(`/admin/shops/${id}`),
  updateShop: (id: string, body: Partial<ShopDto>) =>
    apiRequest<ShopDto>(`/admin/shops/${id}`, { method: "PATCH", body }),
  shopAction: (
    id: string,
    action: "approve" | "reject" | "suspend" | "activate",
    reason?: string,
  ) => apiRequest<ShopDto>(`/admin/shops/${id}/${action}`, { method: "POST", body: { reason } }),

  orders: (query: Record<string, unknown> = {}) =>
    apiRequest<Paginated<OrderSummaryDto>>("/admin/orders", { query }),
  order: (id: string) => apiRequest<OrderDetailDto>(`/admin/orders/${id}`),
  cancelOrder: (id: string, reason: string) =>
    apiRequest<OrderDetailDto>(`/admin/orders/${id}/cancel`, { method: "POST", body: { reason } }),

  users: (query: Record<string, unknown> = {}) =>
    apiRequest<Paginated<AdminUserSummaryDto>>("/admin/users", { query }),
  userAction: (id: string, action: "block" | "unblock", reason?: string) =>
    apiRequest<UserDto>(`/admin/users/${id}/${action}`, { method: "POST", body: { reason } }),

  vouchers: () => apiRequest<{ items: VoucherDto[] }>("/admin/vouchers"),
  createVoucher: (body: Partial<VoucherDto>) =>
    apiRequest<VoucherDto>("/admin/vouchers", { method: "POST", body }),
  updateVoucher: (id: string, body: Partial<VoucherDto>) =>
    apiRequest<VoucherDto>(`/admin/vouchers/${id}`, { method: "PATCH", body }),
  voucherAction: (id: string, action: "enable" | "disable") =>
    apiRequest<VoucherDto>(`/admin/vouchers/${id}/${action}`, { method: "POST", body: {} }),

  categories: () => apiRequest<{ items: CategoryDto[] }>("/admin/categories"),
  createCategory: (body: Partial<CategoryDto>) =>
    apiRequest<CategoryDto>("/admin/categories", { method: "POST", body }),
  updateCategory: (id: string, body: Partial<CategoryDto>) =>
    apiRequest<CategoryDto>(`/admin/categories/${id}`, { method: "PATCH", body }),

  zones: () => apiRequest<{ items: DeliveryZoneDto[] }>("/admin/delivery-zones"),
  createZone: (body: Partial<DeliveryZoneDto>) =>
    apiRequest<DeliveryZoneDto>("/admin/delivery-zones", { method: "POST", body }),
  updateZone: (id: string, body: Partial<DeliveryZoneDto>) =>
    apiRequest<DeliveryZoneDto>(`/admin/delivery-zones/${id}`, { method: "PATCH", body }),
  deleteZone: (id: string) =>
    apiRequest<void>(`/admin/delivery-zones/${id}`, { method: "DELETE" }),
};

// ==================== SHOP OWNER ====================
export const shopOwnerApi = {
  stats: () => apiRequest<ShopOwnerStatsDto>("/shop-owner/stats"),
  shops: () => apiRequest<Paginated<ShopDto>>("/shop-owner/shops"),
  shop: (id: string) => apiRequest<ShopDto>(`/shop-owner/shops/${id}`),
  create: (body: ShopRegistrationInput) =>
    apiRequest<ShopDto>("/shop-owner/shops", { method: "POST", body }),
  update: (id: string, body: Partial<ShopDto>) =>
    apiRequest<ShopDto>(`/shop-owner/shops/${id}`, { method: "PATCH", body }),
  remove: (id: string) => apiRequest<void>(`/shop-owner/shops/${id}`, { method: "DELETE" }),
  action: (id: string, action: "submit" | "pause" | "reopen") =>
    apiRequest<ShopDto>(`/shop-owner/shops/${id}/${action}`, { method: "POST", body: {} }),

  products: (query: Record<string, unknown> = {}) =>
    apiRequest<Paginated<ProductDto>>("/shop-owner/products", { query }),
  product: (id: string) => apiRequest<ProductDto>(`/shop-owner/products/${id}`),
  createProduct: (body: ProductInput) =>
    apiRequest<ProductDto>("/shop-owner/products", { method: "POST", body }),
  updateProduct: (id: string, body: Partial<ProductInput> & { available?: boolean }) =>
    apiRequest<ProductDto>(`/shop-owner/products/${id}`, { method: "PATCH", body }),
  removeProduct: (id: string) =>
    apiRequest<void>(`/shop-owner/products/${id}`, { method: "DELETE" }),

  orders: (query: Record<string, unknown> = {}) =>
    apiRequest<Paginated<OrderSummaryDto>>("/shop-owner/orders", { query }),
  order: (id: string) => apiRequest<OrderDetailDto>(`/shop-owner/orders/${id}`),
  advanceOrder: (id: string) =>
    apiRequest<OrderDetailDto>(`/shop-owner/orders/${id}/advance`, { method: "POST", body: {} }),
  cancelOrder: (id: string, reason: string) =>
    apiRequest<OrderDetailDto>(`/shop-owner/orders/${id}/cancel`, {
      method: "POST",
      body: { reason },
    }),
};
