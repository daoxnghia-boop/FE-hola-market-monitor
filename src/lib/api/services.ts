import { apiRequest } from "./client";
import type {
  AddressDto,
  CartDto,
  CategoryDto,
  DeliveryZoneDto,
  NotificationDto,
  NotificationPageDto,
  OrderDetailDto,
  OrderSummaryDto,
  Paginated,
  ProductDto,
  ReviewDto,
  SearchDto,
  SessionDto,
  ShopDto,
  UserDto,
  VoucherDto,
} from "./types";

export const authApi = {
  session: () => apiRequest<SessionDto>("/auth/session"),
  logout: () => apiRequest<void>("/auth/logout", { method: "POST" }),
};

export const userApi = {
  me: () => apiRequest<UserDto>("/users/me"),
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
    apiRequest<ProductDto>(`/products/${productId}`, { query: { deliveryZoneId } }),
  popularProducts: (deliveryZoneId?: string, limit = 6) =>
    apiRequest<{ items: ProductDto[] }>("/products/popular", { query: { deliveryZoneId, limit } }),
  search: (query: Record<string, unknown>) => apiRequest<SearchDto>("/search", { query }),
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
