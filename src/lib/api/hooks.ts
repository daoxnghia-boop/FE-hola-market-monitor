import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminApi, authApi, cartApi, catalogApi, notificationApi,
  orderApi, reviewApi, shopOwnerApi, userApi, voucherApi,
} from "./services";
import type { CartDto, DeliveryZoneDto, ShopDto, ShopRegistrationInput, UserDto } from "./types";

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
  admin: {
    stats: ["admin", "stats"] as const,
    shops: (params: unknown) => ["admin", "shops", params] as const,
    shop: (id: string) => ["admin", "shop", id] as const,
    orders: (params: unknown) => ["admin", "orders", params] as const,
    order: (id: string) => ["admin", "order", id] as const,
    users: (params: unknown) => ["admin", "users", params] as const,
    vouchers: ["admin", "vouchers"] as const,
    categories: ["admin", "categories"] as const,
    zones: ["admin", "zones"] as const,
    audits: ["admin", "audits"] as const,
  },
};

const EMPTY_CART: CartDto = {
  id: "", shop: null, items: [], deliveryZone: null, voucher: null,
  pricing: { subtotal: 0, discount: 0, deliveryFee: 0, total: 0 },
  canCheckout: false, blockingReasons: [], updatedAt: "",
};

export function useSession() {
  return useQuery({
    queryKey: queryKeys.session, queryFn: authApi.session,
    retry: false, staleTime: 60_000,
  });
}
export function useCurrentUser(): UserDto | null {
  const s = useSession();
  return s.data?.user ?? null;
}

export function useCategories() {
  return useQuery({ queryKey: queryKeys.categories, queryFn: catalogApi.categories, select: (d) => d.items, staleTime: 300_000 });
}
export function useDeliveryZones() {
  return useQuery({ queryKey: queryKeys.zones, queryFn: catalogApi.deliveryZones, select: (d) => d.items, staleTime: 300_000 });
}
export function useShops(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: queryKeys.shops(params), queryFn: () => catalogApi.shops(params), select: (d) => d.items });
}
export function useShop(id: string, zoneId?: string) {
  return useQuery({ queryKey: queryKeys.shop(id, zoneId), queryFn: () => catalogApi.shop(id, zoneId), enabled: Boolean(id) });
}
export function useShopProducts(id: string, params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: queryKeys.shopProducts(id, params), queryFn: () => catalogApi.shopProducts(id, params), select: (d) => d.items, enabled: Boolean(id) });
}
export function useProducts(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: queryKeys.products(params), queryFn: () => catalogApi.products(params), select: (d) => d.items });
}
export function usePopularProducts(zoneId?: string) {
  return useQuery({ queryKey: queryKeys.popular(zoneId), queryFn: () => catalogApi.popularProducts(zoneId), select: (d) => d.items });
}
export function useSearch(params: Record<string, unknown>, enabled = true) {
  return useQuery({ queryKey: queryKeys.search(params), queryFn: () => catalogApi.search(params), enabled });
}
export function useVouchers(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: queryKeys.vouchers(params), queryFn: () => voucherApi.mine(params), select: (d) => d.items, retry: false });
}
export function useCartQuery() {
  return useQuery({ queryKey: queryKeys.cart, queryFn: cartApi.get, retry: false, placeholderData: EMPTY_CART });
}
export function useFavoriteShops(zoneId?: string) {
  return useQuery({ queryKey: queryKeys.favorites(zoneId), queryFn: () => userApi.favoriteShops(zoneId), select: (d) => d.items, retry: false });
}
export function useFrequentProducts(zoneId?: string) {
  return useQuery({ queryKey: queryKeys.frequent(zoneId), queryFn: () => userApi.frequentProducts(zoneId), select: (d) => d.items, retry: false });
}
export function useAddresses() {
  return useQuery({ queryKey: queryKeys.addresses, queryFn: userApi.addresses, select: (d) => d.items, retry: false });
}
export function useOrdersQuery(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: queryKeys.orders(params), queryFn: () => orderApi.list(params), select: (d) => d.items, retry: false });
}
export function useOrderQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.order(id), queryFn: () => orderApi.detail(id),
    enabled: Boolean(id), retry: false,
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      return status && status !== "hoan_thanh" && status !== "da_huy" ? 10_000 : false;
    },
  });
}
export function useNotificationsQuery() {
  return useQuery({ queryKey: queryKeys.notifications({}), queryFn: () => notificationApi.list(), retry: false });
}
export function useUnreadQuery() {
  return useQuery({ queryKey: queryKeys.unread, queryFn: notificationApi.unreadCount, retry: false, refetchInterval: 60_000 });
}

function useCartMutation<T>(mutationFn: (variables: T) => Promise<CartDto>) {
  const client = useQueryClient();
  return useMutation({ mutationFn, onSuccess: (cart) => client.setQueryData(queryKeys.cart, cart) });
}
export const useAddCartItem = () => useCartMutation(cartApi.addItem);
export const useUpdateCartItem = () =>
  useCartMutation(({ itemId, ...body }: { itemId: string; quantity?: number; note?: string }) =>
    cartApi.updateItem(itemId, body));
export const useRemoveCartItem = () => useCartMutation((itemId: string) => cartApi.removeItem(itemId));
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
    mutationFn: ({ body, idempotencyKey }: { body: Parameters<typeof orderApi.create>[0]; idempotencyKey: string }) =>
      orderApi.create(body, idempotencyKey),
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
    mutationFn: ({ orderId, rating, comment }: { orderId: string; rating: number; comment?: string }) =>
      reviewApi.create(orderId, { rating, comment }),
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

// ==================== AUTH MUTATIONS ====================
export function useRequestOtp() {
  return useMutation({ mutationFn: (phone: string) => authApi.requestOtp(phone) });
}
export function useVerifyOtp() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: authApi.verifyOtp,
    onSuccess: (result) => {
      if (result.status === "authenticated" && result.session) {
        client.setQueryData(queryKeys.session, result.session);
        client.invalidateQueries({ queryKey: ["cart"] });
        client.invalidateQueries({ queryKey: ["orders"] });
        client.invalidateQueries({ queryKey: ["notifications"] });
        client.invalidateQueries({ queryKey: queryKeys.unread });
      }
    },
  });
}
export function useRegister() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (session) => {
      client.setQueryData(queryKeys.session, session);
      client.invalidateQueries();
    },
  });
}
export function useLogout() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      client.setQueryData(queryKeys.session, { authenticated: false, user: null });
      // Clear private caches; keep public catalog
      client.removeQueries({ queryKey: ["cart"] });
      client.removeQueries({ queryKey: ["orders"] });
      client.removeQueries({ queryKey: ["order"] });
      client.removeQueries({ queryKey: ["notifications"] });
      client.removeQueries({ queryKey: ["favorite-shops"] });
      client.removeQueries({ queryKey: ["addresses"] });
      client.removeQueries({ queryKey: ["vouchers"] });
      client.removeQueries({ queryKey: ["admin"] });
      client.setQueryData(queryKeys.unread, { unreadCount: 0 });
    },
  });
}
export function useUpdateProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: userApi.updateMe,
    onSuccess: (user) => {
      client.setQueryData(queryKeys.session, { authenticated: true, user });
    },
  });
}

// ==================== ADMIN HOOKS ====================
export function useAdminStats() {
  return useQuery({ queryKey: queryKeys.admin.stats, queryFn: adminApi.stats, retry: false });
}
export function useAdminShops(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: queryKeys.admin.shops(params), queryFn: () => adminApi.shops(params), select: (d) => d.items, retry: false });
}
export function useAdminShop(id: string) {
  return useQuery({ queryKey: queryKeys.admin.shop(id), queryFn: () => adminApi.shop(id), enabled: Boolean(id), retry: false });
}
export function useAdminShopAction() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; action: "approve" | "reject" | "suspend" | "activate"; reason?: string }) =>
      adminApi.shopAction(v.id, v.action, v.reason),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin", "shops"] });
      client.invalidateQueries({ queryKey: ["admin", "shop"] });
      client.invalidateQueries({ queryKey: ["admin", "stats"] });
      client.invalidateQueries({ queryKey: ["shops"] });
    },
  });
}
export function useAdminOrders(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: queryKeys.admin.orders(params), queryFn: () => adminApi.orders(params), select: (d) => d.items, retry: false });
}
export function useAdminOrder(id: string) {
  return useQuery({ queryKey: queryKeys.admin.order(id), queryFn: () => adminApi.order(id), enabled: Boolean(id), retry: false });
}
export function useAdminCancelOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; reason: string }) => adminApi.cancelOrder(v.id, v.reason),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin", "orders"] });
      client.invalidateQueries({ queryKey: ["admin", "order"] });
      client.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}
export function useAdminUsers(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: queryKeys.admin.users(params), queryFn: () => adminApi.users(params), select: (d) => d.items, retry: false });
}
export function useAdminUserAction() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; action: "block" | "unblock"; reason?: string }) =>
      adminApi.userAction(v.id, v.action, v.reason),
    onSuccess: () => client.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}
export function useAdminVouchers() {
  return useQuery({ queryKey: queryKeys.admin.vouchers, queryFn: adminApi.vouchers, select: (d) => d.items, retry: false });
}
export function useAdminVoucherMutations() {
  const client = useQueryClient();
  const invalidate = () => {
    client.invalidateQueries({ queryKey: ["admin", "vouchers"] });
    client.invalidateQueries({ queryKey: ["vouchers"] });
  };
  return {
    create: useMutation({ mutationFn: adminApi.createVoucher, onSuccess: invalidate }),
    update: useMutation({
      mutationFn: (v: { id: string; body: Partial<import("./types").VoucherDto> }) => adminApi.updateVoucher(v.id, v.body),
      onSuccess: invalidate,
    }),
    action: useMutation({
      mutationFn: (v: { id: string; action: "enable" | "disable" }) => adminApi.voucherAction(v.id, v.action),
      onSuccess: invalidate,
    }),
  };
}
export function useAdminCategories() {
  return useQuery({ queryKey: queryKeys.admin.categories, queryFn: adminApi.categories, select: (d) => d.items, retry: false });
}
export function useAdminCategoryMutations() {
  const client = useQueryClient();
  const invalidate = () => {
    client.invalidateQueries({ queryKey: ["admin", "categories"] });
    client.invalidateQueries({ queryKey: ["categories"] });
  };
  return {
    create: useMutation({ mutationFn: adminApi.createCategory, onSuccess: invalidate }),
    update: useMutation({
      mutationFn: (v: { id: string; body: Partial<import("./types").CategoryDto> }) => adminApi.updateCategory(v.id, v.body),
      onSuccess: invalidate,
    }),
  };
}
export function useAdminZones() {
  return useQuery({ queryKey: queryKeys.admin.zones, queryFn: adminApi.zones, select: (d) => d.items, retry: false });
}
export function useAdminZoneMutations() {
  const client = useQueryClient();
  const invalidate = () => {
    client.invalidateQueries({ queryKey: ["admin", "zones"] });
    client.invalidateQueries({ queryKey: ["delivery-zones"] });
  };
  return {
    create: useMutation({ mutationFn: adminApi.createZone, onSuccess: invalidate }),
    update: useMutation({
      mutationFn: (v: { id: string; body: Partial<import("./types").DeliveryZoneDto> }) => adminApi.updateZone(v.id, v.body),
      onSuccess: invalidate,
    }),
  };
}

export function firstActiveZone(zones?: DeliveryZoneDto[]) {
  return zones?.find((zone) => zone.active) ?? null;
}

// ==================== SHOP OWNER HOOKS ====================
export const ownerKeys = {
  stats: ["owner", "stats"] as const,
  shops: ["owner", "shops"] as const,
  shop: (id: string) => ["owner", "shop", id] as const,
  products: (params: unknown) => ["owner", "products", params] as const,
  product: (id: string) => ["owner", "product", id] as const,
  orders: (params: unknown) => ["owner", "orders", params] as const,
  order: (id: string) => ["owner", "order", id] as const,
};

export function useOwnerStats() {
  return useQuery({ queryKey: ownerKeys.stats, queryFn: shopOwnerApi.stats, retry: false });
}
export function useOwnerProducts(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ownerKeys.products(params), queryFn: () => shopOwnerApi.products(params), select: (d) => d.items, retry: false });
}
export function useOwnerProduct(id: string) {
  return useQuery({ queryKey: ownerKeys.product(id), queryFn: () => shopOwnerApi.product(id), enabled: Boolean(id), retry: false });
}
export function useOwnerProductMutations() {
  const client = useQueryClient();
  const invalidate = () => {
    client.invalidateQueries({ queryKey: ["owner", "products"] });
    client.invalidateQueries({ queryKey: ["owner", "product"] });
    client.invalidateQueries({ queryKey: ["owner", "stats"] });
    client.invalidateQueries({ queryKey: ["shop-products"] });
    client.invalidateQueries({ queryKey: ["products"] });
    client.invalidateQueries({ queryKey: ["popular-products"] });
  };
  return {
    create: useMutation({ mutationFn: shopOwnerApi.createProduct, onSuccess: invalidate }),
    update: useMutation({
      mutationFn: (v: { id: string; body: Partial<import("./types").ProductInput> & { available?: boolean } }) =>
        shopOwnerApi.updateProduct(v.id, v.body),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: (id: string) => shopOwnerApi.removeProduct(id), onSuccess: invalidate }),
  };
}

export function useOwnerOrders(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ownerKeys.orders(params), queryFn: () => shopOwnerApi.orders(params), select: (d) => d.items, retry: false });
}
export function useOwnerOrder(id: string) {
  return useQuery({
    queryKey: ownerKeys.order(id), queryFn: () => shopOwnerApi.order(id),
    enabled: Boolean(id), retry: false,
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      return status && status !== "hoan_thanh" && status !== "da_huy" ? 15_000 : false;
    },
  });
}
export function useOwnerOrderMutations() {
  const client = useQueryClient();
  const invalidate = () => {
    client.invalidateQueries({ queryKey: ["owner", "orders"] });
    client.invalidateQueries({ queryKey: ["owner", "order"] });
    client.invalidateQueries({ queryKey: ["owner", "stats"] });
    client.invalidateQueries({ queryKey: ["orders"] });
    client.invalidateQueries({ queryKey: ["order"] });
  };
  return {
    advance: useMutation({ mutationFn: (id: string) => shopOwnerApi.advanceOrder(id), onSuccess: invalidate }),
    cancel: useMutation({
      mutationFn: (v: { id: string; reason: string }) => shopOwnerApi.cancelOrder(v.id, v.reason),
      onSuccess: invalidate,
    }),
  };
}


export function useOwnerShops() {
  return useQuery({
    queryKey: ownerKeys.shops, queryFn: shopOwnerApi.shops,
    select: (d) => d.items, retry: false,
  });
}
export function useOwnerShop(id: string) {
  return useQuery({
    queryKey: ownerKeys.shop(id), queryFn: () => shopOwnerApi.shop(id),
    enabled: Boolean(id), retry: false,
  });
}
function invalidateOwnerAndCatalog(client: ReturnType<typeof useQueryClient>) {
  client.invalidateQueries({ queryKey: ["owner"] });
  client.invalidateQueries({ queryKey: ["shops"] });
  client.invalidateQueries({ queryKey: ["shop"] });
  client.invalidateQueries({ queryKey: ["admin", "shops"] });
  client.invalidateQueries({ queryKey: ["session"] });
}
export function useCreateOwnerShop() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: ShopRegistrationInput) => shopOwnerApi.create(body),
    onSuccess: () => invalidateOwnerAndCatalog(client),
  });
}
export function useUpdateOwnerShop() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; body: Partial<ShopDto> }) => shopOwnerApi.update(v.id, v.body),
    onSuccess: () => invalidateOwnerAndCatalog(client),
  });
}
export function useDeleteOwnerShop() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => shopOwnerApi.remove(id),
    onSuccess: () => invalidateOwnerAndCatalog(client),
  });
}
export function useOwnerShopAction() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; action: "submit" | "pause" | "reopen" }) =>
      shopOwnerApi.action(v.id, v.action),
    onSuccess: () => invalidateOwnerAndCatalog(client),
  });
}
