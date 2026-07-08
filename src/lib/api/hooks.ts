import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  authApi,
  cartApi,
  catalogApi,
  notificationApi,
  orderApi,
  reviewApi,
  userApi,
  voucherApi,
} from "./services";
import type { CartDto, DeliveryZoneDto } from "./types";

export const queryKeys = {
  session: ["session"] as const,
  categories: ["categories"] as const,
  zones: ["delivery-zones"] as const,
  shops: (params: unknown) => ["shops", params] as const,
  shop: (id: string, zoneId?: string) => ["shop", id, zoneId] as const,
  shopProducts: (id: string, params: unknown) => ["shop-products", id, params] as const,
  products: (params: unknown) => ["products", params] as const,
  popular: (zoneId?: string) => ["popular-products", zoneId] as const,
  search: (params: unknown) => ["search", params] as const,
  cart: ["cart"] as const,
  vouchers: (params: unknown) => ["vouchers", params] as const,
  orders: (params: unknown) => ["orders", params] as const,
  order: (id: string) => ["order", id] as const,
  notifications: (params: unknown) => ["notifications", params] as const,
  unread: ["notification-unread"] as const,
  favorites: (zoneId?: string) => ["favorite-shops", zoneId] as const,
  frequent: (zoneId?: string) => ["frequent-products", zoneId] as const,
  addresses: ["addresses"] as const,
};

const EMPTY_CART: CartDto = {
  id: "",
  shop: null,
  items: [],
  deliveryZone: null,
  voucher: null,
  pricing: { subtotal: 0, discount: 0, deliveryFee: 0, total: 0 },
  canCheckout: false,
  blockingReasons: [],
  updatedAt: "",
};

export function useSession() {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: authApi.session,
    retry: false,
    staleTime: 60_000,
  });
}
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: catalogApi.categories,
    select: (d) => d.items,
    staleTime: 300_000,
  });
}
export function useDeliveryZones() {
  return useQuery({
    queryKey: queryKeys.zones,
    queryFn: catalogApi.deliveryZones,
    select: (d) => d.items,
    staleTime: 300_000,
  });
}
export function useShops(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.shops(params),
    queryFn: () => catalogApi.shops(params),
    select: (d) => d.items,
  });
}
export function useShop(id: string, zoneId?: string) {
  return useQuery({
    queryKey: queryKeys.shop(id, zoneId),
    queryFn: () => catalogApi.shop(id, zoneId),
    enabled: Boolean(id),
  });
}
export function useShopProducts(id: string, params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.shopProducts(id, params),
    queryFn: () => catalogApi.shopProducts(id, params),
    select: (d) => d.items,
    enabled: Boolean(id),
  });
}
export function useProducts(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.products(params),
    queryFn: () => catalogApi.products(params),
    select: (d) => d.items,
  });
}
export function usePopularProducts(zoneId?: string) {
  return useQuery({
    queryKey: queryKeys.popular(zoneId),
    queryFn: () => catalogApi.popularProducts(zoneId),
    select: (d) => d.items,
  });
}
export function useSearch(params: Record<string, unknown>, enabled = true) {
  return useQuery({
    queryKey: queryKeys.search(params),
    queryFn: () => catalogApi.search(params),
    enabled,
  });
}
export function useVouchers(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.vouchers(params),
    queryFn: () => voucherApi.mine(params),
    select: (d) => d.items,
    retry: false,
  });
}
export function useCartQuery() {
  return useQuery({
    queryKey: queryKeys.cart,
    queryFn: cartApi.get,
    retry: false,
    placeholderData: EMPTY_CART,
  });
}
export function useFavoriteShops(zoneId?: string) {
  return useQuery({
    queryKey: queryKeys.favorites(zoneId),
    queryFn: () => userApi.favoriteShops(zoneId),
    select: (d) => d.items,
    retry: false,
  });
}
export function useFrequentProducts(zoneId?: string) {
  return useQuery({
    queryKey: queryKeys.frequent(zoneId),
    queryFn: () => userApi.frequentProducts(zoneId),
    select: (d) => d.items,
    retry: false,
  });
}
export function useAddresses() {
  return useQuery({
    queryKey: queryKeys.addresses,
    queryFn: userApi.addresses,
    select: (d) => d.items,
    retry: false,
  });
}
export function useOrdersQuery(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.orders(params),
    queryFn: () => orderApi.list(params),
    select: (d) => d.items,
    retry: false,
  });
}
export function useOrderQuery(id: string) {
  // TODO: chuyển sang GET /orders/:id/events (SSE) khi backend bật streaming;
  // polling là fallback an toàn và tự dừng khi đơn đạt trạng thái cuối.
  return useQuery({
    queryKey: queryKeys.order(id),
    queryFn: () => orderApi.detail(id),
    enabled: Boolean(id),
    retry: false,
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      return status && status !== "hoan_thanh" && status !== "da_huy" ? 10_000 : false;
    },
  });
}
export function useNotificationsQuery() {
  return useQuery({
    queryKey: queryKeys.notifications({}),
    queryFn: () => notificationApi.list(),
    retry: false,
  });
}
export function useUnreadQuery() {
  // TODO: invalidation realtime qua GET /notifications/events khi backend hỗ trợ SSE.
  return useQuery({
    queryKey: queryKeys.unread,
    queryFn: notificationApi.unreadCount,
    retry: false,
    refetchInterval: 60_000,
  });
}

function useCartMutation<T>(mutationFn: (variables: T) => Promise<CartDto>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (cart) => client.setQueryData(queryKeys.cart, cart),
  });
}
export const useAddCartItem = () => useCartMutation(cartApi.addItem);
export const useUpdateCartItem = () =>
  useCartMutation(({ itemId, ...body }: { itemId: string; quantity?: number; note?: string }) =>
    cartApi.updateItem(itemId, body),
  );
export const useRemoveCartItem = () =>
  useCartMutation((itemId: string) => cartApi.removeItem(itemId));
export const useSetCartZone = () => useCartMutation((zoneId: string) => cartApi.setZone(zoneId));
export const useSetCartVoucher = () => useCartMutation((code: string) => cartApi.setVoucher(code));
export const useRemoveCartVoucher = () => useCartMutation(() => cartApi.removeVoucher());

export function useToggleFavorite() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ shopId, favorite }: { shopId: string; favorite: boolean }) => {
      if (favorite) await userApi.removeFavorite(shopId);
      else await userApi.addFavorite(shopId);
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["favorite-shops"] });
      client.invalidateQueries({ queryKey: ["shops"] });
      client.invalidateQueries({ queryKey: ["shop"] });
    },
  });
}
export function useCreateOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      body,
      idempotencyKey,
    }: {
      body: Parameters<typeof orderApi.create>[0];
      idempotencyKey: string;
    }) => orderApi.create(body, idempotencyKey),
    onSuccess: (order) => {
      client.invalidateQueries({ queryKey: ["orders"] });
      client.setQueryData(queryKeys.order(order.id), order);
      client.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });
}
export function useCancelOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => orderApi.cancel(orderId),
    onSuccess: (order) => {
      client.setQueryData(queryKeys.order(order.id), order);
      client.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
export function useReorder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => orderApi.reorder(orderId),
    onSuccess: (result) => client.setQueryData(queryKeys.cart, result.cart),
  });
}
export function useCreateReview() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      rating,
      comment,
    }: {
      orderId: string;
      rating: number;
      comment?: string;
    }) => reviewApi.create(orderId, { rating, comment }),
    onSuccess: (review) => {
      client.invalidateQueries({ queryKey: queryKeys.order(review.orderId) });
      client.invalidateQueries({ queryKey: ["shop", review.shopId] });
    },
  });
}
export function useMarkNotificationRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: notificationApi.markRead,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["notifications"] });
      client.invalidateQueries({ queryKey: queryKeys.unread });
    },
  });
}
export function useMarkAllNotificationsRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["notifications"] });
      client.setQueryData(queryKeys.unread, { unreadCount: 0 });
    },
  });
}

export function firstActiveZone(zones?: DeliveryZoneDto[]) {
  return zones?.find((zone) => zone.active) ?? null;
}
