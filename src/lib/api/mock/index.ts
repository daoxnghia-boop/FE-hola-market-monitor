// Mock API router. Intercepts apiRequest calls when VITE_USE_MOCK_API is enabled
// (default in dev when no real backend is configured).
import type {
  AddressDto, CartDto, CartItemDto, DeliveryZoneDto, NotificationDto,
  OrderDetailDto, OrderSummaryDto, ProductDto, ReviewDto, SessionDto,
  ShopDto, VoucherDto,
} from "../types";
import {
  categories, defaultAddresses, defaultUser, products, seedNotifications,
  seedOrders, seedReviews, shops, vouchers, zones,
} from "./data";

type Ctx = {
  method: string;
  path: string;
  query: Record<string, string>;
  body: unknown;
};

const STORAGE_KEY = "hola-mock-state-v1";

type State = {
  authenticated: boolean;
  user: typeof defaultUser | null;
  addresses: AddressDto[];
  favoriteShopIds: string[];
  cart: CartDto;
  vouchers: VoucherDto[];
  orders: OrderDetailDto[];
  notifications: NotificationDto[];
  reviews: ReviewDto[];
  browsingZoneId: string;
};

const emptyCart = (): CartDto => ({
  id: "cart-1", shop: null, items: [], deliveryZone: null, voucher: null,
  pricing: { subtotal: 0, discount: 0, deliveryFee: 0, total: 0 },
  canCheckout: false, blockingReasons: [], updatedAt: new Date().toISOString(),
});

const initialState = (): State => ({
  authenticated: true,
  user: defaultUser,
  addresses: [...defaultAddresses],
  favoriteShopIds: shops.filter((s) => s.isFavorite).map((s) => s.id),
  cart: emptyCart(),
  vouchers: [...vouchers],
  orders: seedOrders.map((o) => ({ ...o })),
  notifications: [...seedNotifications],
  reviews: [...seedReviews],
  browsingZoneId: "z1",
});

let state: State = load();

function load(): State {
  if (typeof window === "undefined") return initialState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw) as Partial<State>;
    return { ...initialState(), ...parsed };
  } catch {
    return initialState();
  }
}

function save() {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

function delay(ms = 220) {
  return new Promise<void>((r) => setTimeout(r, ms + Math.random() * 180));
}

function decorateShop(s: ShopDto, zoneId?: string): ShopDto {
  const isFav = state.favoriteShopIds.includes(s.id);
  const zone = zoneId ? zones.find((z) => z.id === zoneId) : null;
  const supported = zone ? s.supportedZoneIds.includes(zone.id) : true;
  return {
    ...s,
    isFavorite: isFav,
    delivery: zone
      ? { supported, fee: supported ? zone.baseDeliveryFee : null }
      : s.delivery,
  };
}

function paginate<T>(list: T[], pageSize?: string, _cursor?: string) {
  const size = pageSize ? Number(pageSize) : list.length;
  return { items: list.slice(0, size), nextCursor: null as string | null };
}

function recomputeCart(cart: CartDto): CartDto {
  const subtotal = cart.items.reduce((n, it) => n + it.lineTotal, 0);
  const zone = cart.deliveryZone;
  const deliveryFee = zone ? zone.baseDeliveryFee : 0;
  let discount = 0;
  const reasons: string[] = [];
  if (cart.voucher) {
    const v = cart.voucher;
    if (subtotal < v.minOrderAmount) {
      reasons.push(`Voucher ${v.code} yêu cầu đơn tối thiểu ${v.minOrderAmount.toLocaleString("vi-VN")}đ.`);
    } else {
      const raw = v.discountType === "fixed"
        ? v.discountValue
        : Math.floor((subtotal * v.discountValue) / 100);
      discount = Math.min(raw, v.maxDiscount ?? raw);
    }
  }
  if (!cart.items.length) reasons.push("Giỏ hàng trống.");
  if (!cart.deliveryZone) reasons.push("Chưa chọn khu giao hàng.");
  if (cart.shop && cart.deliveryZone && !cart.shop.supportedZoneIds.includes(cart.deliveryZone.id)) {
    reasons.push("Quán không giao tới khu đã chọn.");
  }
  return {
    ...cart,
    pricing: { subtotal, discount, deliveryFee, total: Math.max(0, subtotal - discount + deliveryFee) },
    canCheckout: reasons.length === 0,
    blockingReasons: reasons,
    updatedAt: new Date().toISOString(),
  };
}

function makeCartItem(p: ProductDto, qty: number, note?: string): CartItemDto {
  return {
    id: `ci-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    productId: p.id, quantity: qty, note, unitPrice: p.price,
    lineTotal: p.price * qty, product: p,
  };
}

function ok<T>(data: T) { return data; }

function notFound(msg = "Không tìm thấy tài nguyên."): never {
  const err = new Error(msg) as Error & { __apiStatus: number; __apiCode: string };
  err.__apiStatus = 404;
  err.__apiCode = "NOT_FOUND";
  throw err;
}

function conflict(code: string, msg: string): never {
  const err = new Error(msg) as Error & { __apiStatus: number; __apiCode: string };
  err.__apiStatus = 409;
  err.__apiCode = code;
  throw err;
}

function summarize(o: OrderDetailDto): OrderSummaryDto {
  return {
    id: o.id, displayCode: o.displayCode, shopId: o.shopId, shopName: o.shopName,
    shopLogoUrl: o.shopLogoUrl, status: o.status, itemSummary: o.itemSummary,
    itemCount: o.itemCount, total: o.total, placedAt: o.placedAt,
    canCancel: o.canCancel, canReview: o.canReview, canReorder: o.canReorder,
  };
}

// ---- route handlers ----
async function route(ctx: Ctx): Promise<unknown> {
  const { method, path, query, body } = ctx;
  const M = `${method} ${path}`;

  // auth
  if (M === "GET /auth/session") {
    const s: SessionDto = { authenticated: state.authenticated, user: state.user };
    return ok(s);
  }
  if (M === "POST /auth/logout") {
    state.authenticated = false; state.user = null; save();
    return ok(undefined);
  }

  // users
  if (M === "GET /users/me") {
    if (!state.user) notFound();
    return ok(state.user);
  }
  if (M === "GET /users/me/addresses") return ok({ items: state.addresses });
  if (M === "GET /users/me/favorite-shops") {
    const list = shops.filter((s) => state.favoriteShopIds.includes(s.id))
      .map((s) => decorateShop(s, query.deliveryZoneId));
    return ok({ items: list, nextCursor: null });
  }
  if (M === "GET /users/me/frequent-products") {
    const limit = Number(query.limit ?? 4);
    return ok({ items: products.slice(0, limit) });
  }
  const favMatch = path.match(/^\/users\/me\/favorite-shops\/(.+)$/);
  if (favMatch) {
    const shopId = favMatch[1];
    if (method === "PUT") {
      if (!state.favoriteShopIds.includes(shopId)) state.favoriteShopIds.push(shopId);
      save();
      return ok({ shopId, isFavorite: true });
    }
    if (method === "DELETE") {
      state.favoriteShopIds = state.favoriteShopIds.filter((id) => id !== shopId);
      save(); return ok(undefined);
    }
  }

  // catalog
  if (M === "GET /categories") return ok({ items: categories });
  if (M === "GET /delivery-zones") return ok({ items: zones });
  if (M === "GET /shops") {
    let list = [...shops];
    if (query.categoryId) list = list.filter((s) => s.categoryIds.includes(query.categoryId));
    if (query.deliveryZoneId) list = list.filter((s) => s.supportedZoneIds.includes(query.deliveryZoneId));
    if (query.sort === "distance") list.sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99));
    if (query.sort === "newest") list = [...list].reverse();
    if (query.sort === "rating") list.sort((a, b) => b.rating - a.rating);
    const paged = paginate(list.map((s) => decorateShop(s, query.deliveryZoneId)), query.pageSize);
    return ok(paged);
  }
  const shopMatch = path.match(/^\/shops\/([^/]+)$/);
  if (shopMatch && method === "GET") {
    const s = shops.find((x) => x.id === shopMatch[1] || x.slug === shopMatch[1]);
    if (!s) notFound("Không tìm thấy quán.");
    return ok(decorateShop(s!, query.deliveryZoneId));
  }
  const shopProdMatch = path.match(/^\/shops\/([^/]+)\/products$/);
  if (shopProdMatch && method === "GET") {
    const shopId = shopProdMatch[1];
    let list = products.filter((p) => p.shopId === shopId);
    if (query.categoryId) list = list.filter((p) => p.categoryId === query.categoryId);
    return ok(paginate(list, query.pageSize));
  }
  if (M === "GET /products") {
    let list = [...products];
    if (query.categoryId) list = list.filter((p) => p.categoryId === query.categoryId);
    return ok(paginate(list, query.pageSize));
  }
  const prodMatch = path.match(/^\/products\/([^/]+)$/);
  if (prodMatch && method === "GET") {
    const p = products.find((x) => x.id === prodMatch[1]);
    if (!p) notFound("Không tìm thấy sản phẩm.");
    return ok(p);
  }
  if (M === "GET /products/popular") {
    const limit = Number(query.limit ?? 6);
    return ok({ items: [...products].sort((a, b) => b.soldCount - a.soldCount).slice(0, limit) });
  }
  if (M === "GET /search") {
    const q = (query.q ?? "").toLowerCase().trim();
    const kind = query.type ?? "all";
    const matchShops = q
      ? shops.filter((s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
      : [];
    const matchProducts = q
      ? products.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
      : [];
    return ok({
      shops: { items: kind === "products" ? [] : matchShops.map((s) => decorateShop(s, query.deliveryZoneId)),
        total: kind === "products" ? 0 : matchShops.length },
      products: { items: kind === "shops" ? [] : matchProducts, total: kind === "shops" ? 0 : matchProducts.length },
      nextCursor: null,
    });
  }

  // vouchers
  if (M === "GET /users/me/vouchers") return ok(paginate(state.vouchers, query.pageSize));

  // cart
  if (M === "GET /cart") return ok(state.cart);
  if (M === "POST /cart/items") {
    const b = body as { productId: string; quantity: number; note?: string; replaceExistingCart?: boolean };
    const p = products.find((x) => x.id === b.productId);
    if (!p) notFound("Không tìm thấy món.");
    const shop = shops.find((s) => s.id === p!.shopId)!;
    if (state.cart.shop && state.cart.shop.id !== shop.id && !b.replaceExistingCart) {
      conflict("CART_SHOP_CONFLICT", "Giỏ hiện có món của quán khác.");
    }
    let cart = state.cart;
    if (!cart.shop || cart.shop.id !== shop.id || b.replaceExistingCart) {
      cart = { ...emptyCart(), shop: decorateShop(shop, state.browsingZoneId),
        deliveryZone: zones.find((z) => z.id === state.browsingZoneId) ?? null };
    }
    // merge same-product item
    const existing = cart.items.find((it) => it.productId === p!.id && it.note === b.note);
    if (existing) {
      existing.quantity += b.quantity;
      existing.lineTotal = existing.quantity * existing.unitPrice;
      cart = { ...cart, items: [...cart.items] };
    } else {
      cart = { ...cart, items: [...cart.items, makeCartItem(p!, b.quantity, b.note)] };
    }
    state.cart = recomputeCart(cart); save();
    return ok(state.cart);
  }
  const cartItemMatch = path.match(/^\/cart\/items\/([^/]+)$/);
  if (cartItemMatch) {
    const id = cartItemMatch[1];
    const idx = state.cart.items.findIndex((it) => it.id === id);
    if (idx < 0) notFound();
    if (method === "PATCH") {
      const b = body as { quantity?: number; note?: string };
      const it = state.cart.items[idx];
      if (typeof b.quantity === "number") it.quantity = b.quantity;
      if (typeof b.note === "string") it.note = b.note;
      it.lineTotal = it.unitPrice * it.quantity;
      if (it.quantity <= 0) state.cart.items.splice(idx, 1);
    } else if (method === "DELETE") {
      state.cart.items.splice(idx, 1);
    }
    if (!state.cart.items.length) state.cart = { ...emptyCart(), deliveryZone: state.cart.deliveryZone };
    state.cart = recomputeCart({ ...state.cart, items: [...state.cart.items] });
    save(); return ok(state.cart);
  }
  if (M === "DELETE /cart") { state.cart = emptyCart(); save(); return ok(state.cart); }
  if (M === "PUT /cart/delivery-zone") {
    const b = body as { deliveryZoneId: string };
    const z = zones.find((x) => x.id === b.deliveryZoneId) ?? null;
    state.browsingZoneId = z?.id ?? state.browsingZoneId;
    state.cart = recomputeCart({ ...state.cart, deliveryZone: z });
    save(); return ok(state.cart);
  }
  if (M === "PUT /cart/voucher") {
    const b = body as { code: string };
    const v = state.vouchers.find((x) => x.code.toUpperCase() === b.code.toUpperCase());
    if (!v) conflict("VOUCHER_INVALID", "Mã voucher không hợp lệ.");
    state.cart = recomputeCart({ ...state.cart, voucher: v! });
    save(); return ok(state.cart);
  }
  if (M === "DELETE /cart/voucher") {
    state.cart = recomputeCart({ ...state.cart, voucher: null });
    save(); return ok(state.cart);
  }
  if (M === "POST /cart/validate") { state.cart = recomputeCart(state.cart); save(); return ok(state.cart); }

  // orders
  if (M === "GET /orders") return ok(paginate(state.orders.map(summarize), query.pageSize));
  const orderMatch = path.match(/^\/orders\/([^/]+)$/);
  if (orderMatch && method === "GET") {
    const o = state.orders.find((x) => x.id === orderMatch[1]);
    if (!o) notFound("Không tìm thấy đơn hàng.");
    return ok(o);
  }
  if (M === "POST /orders") {
    const cart = state.cart;
    if (!cart.shop || !cart.items.length) conflict("CART_EMPTY", "Giỏ hàng trống.");
    const b = body as { delivery?: OrderDetailDto["delivery"]; note?: string };
    const now = new Date().toISOString();
    const id = `o-${Date.now()}`;
    const order: OrderDetailDto = {
      id, displayCode: `HL${id.slice(-6).toUpperCase()}`,
      shopId: cart.shop!.id, shopName: cart.shop!.name, shopLogoUrl: cart.shop!.logoUrl,
      status: "cho_quan_xac_nhan",
      itemSummary: cart.items.map((it) => `${it.quantity}× ${it.product.name}`).join(", "),
      itemCount: cart.items.reduce((n, it) => n + it.quantity, 0),
      total: cart.pricing.total, placedAt: now,
      canCancel: true, canReview: false, canReorder: true,
      shopPhone: cart.shop!.phone, shopAddress: cart.shop!.address,
      items: cart.items.map((it) => ({
        productId: it.product.id, productName: it.product.name,
        productImageUrl: it.product.imageUrl, quantity: it.quantity,
        unitPrice: it.unitPrice, lineTotal: it.lineTotal, note: it.note,
      })),
      pricing: cart.pricing, voucherCode: cart.voucher?.code,
      paymentMethod: "cash_on_delivery", paymentStatus: "unpaid",
      delivery: b.delivery ?? {
        zoneId: cart.deliveryZone?.id ?? "z1", zoneName: cart.deliveryZone?.name ?? "",
        recipientName: state.user?.fullName ?? "Bạn HoLa", phone: state.user?.phone ?? "",
        addressLine: state.addresses.find((a) => a.isDefault)?.addressLine ?? "",
        note: b.note, etaMinutes: cart.shop!.estimatedDeliveryMinutes,
      },
      statusHistory: [{ status: "cho_quan_xac_nhan", occurredAt: now }],
    };
    state.orders = [order, ...state.orders];
    state.cart = emptyCart();
    state.notifications = [
      {
        id: `n-${id}`, type: "order", title: "Đã gửi đơn cho quán",
        body: `Đơn ${order.displayCode} đang chờ ${order.shopName} xác nhận.`,
        createdAt: now, readAt: null, target: { type: "order", id },
      },
      ...state.notifications,
    ];
    save();
    return ok(order);
  }
  const cancelMatch = path.match(/^\/orders\/([^/]+)\/cancel$/);
  if (cancelMatch && method === "POST") {
    const o = state.orders.find((x) => x.id === cancelMatch[1]);
    if (!o) notFound();
    if (!o!.canCancel) conflict("ORDER_NOT_CANCELABLE", "Đơn không thể hủy ở trạng thái này.");
    const b = (body ?? {}) as { reasonCode?: string; reasonText?: string };
    const now = new Date().toISOString();
    o!.status = "da_huy"; o!.canCancel = false; o!.canReview = false;
    o!.cancellation = { reason: b.reasonText || b.reasonCode || "Khách hủy", canceledAt: now, canceledBy: "customer" };
    o!.statusHistory = [...o!.statusHistory, { status: "da_huy", occurredAt: now, note: o!.cancellation.reason }];
    save(); return ok(o!);
  }
  const reorderMatch = path.match(/^\/orders\/([^/]+)\/reorder$/);
  if (reorderMatch && method === "POST") {
    const o = state.orders.find((x) => x.id === reorderMatch[1]);
    if (!o) notFound();
    const b = (body ?? {}) as { replaceExistingCart?: boolean };
    const shop = shops.find((s) => s.id === o!.shopId)!;
    if (state.cart.shop && state.cart.shop.id !== shop.id && !b.replaceExistingCart) {
      conflict("CART_SHOP_CONFLICT", "Giỏ hiện có món của quán khác.");
    }
    let cart: CartDto = { ...emptyCart(), shop: decorateShop(shop, state.browsingZoneId),
      deliveryZone: zones.find((z) => z.id === state.browsingZoneId) ?? null };
    const skipped: Array<{ productId: string; reason: string }> = [];
    for (const it of o!.items) {
      const p = products.find((x) => x.id === it.productId);
      if (!p) { skipped.push({ productId: it.productId, reason: "Món không còn bán." }); continue; }
      cart.items.push(makeCartItem(p, it.quantity, it.note));
    }
    state.cart = recomputeCart(cart); save();
    return ok({ cart: state.cart, skippedItems: skipped });
  }
  const reviewMatch = path.match(/^\/orders\/([^/]+)\/review$/);
  if (reviewMatch && method === "POST") {
    const o = state.orders.find((x) => x.id === reviewMatch[1]);
    if (!o) notFound();
    const b = body as { rating: number; comment?: string };
    const review: ReviewDto = {
      id: `r-${Date.now()}`, orderId: o!.id, shopId: o!.shopId,
      user: { id: state.user?.id ?? "u1", displayName: state.user?.fullName ?? "Khách" },
      rating: b.rating, comment: b.comment, createdAt: new Date().toISOString(),
    };
    o!.review = review; o!.canReview = false;
    state.reviews = [review, ...state.reviews];
    save(); return ok(review);
  }

  // notifications
  if (M === "GET /notifications") {
    const unread = state.notifications.filter((n) => !n.readAt).length;
    return ok({ items: state.notifications, nextCursor: null, unreadCount: unread });
  }
  if (M === "GET /notifications/unread-count") {
    return ok({ unreadCount: state.notifications.filter((n) => !n.readAt).length });
  }
  const notifReadMatch = path.match(/^\/notifications\/([^/]+)\/read$/);
  if (notifReadMatch && method === "PATCH") {
    const n = state.notifications.find((x) => x.id === notifReadMatch[1]);
    if (!n) notFound();
    n!.readAt = new Date().toISOString(); save();
    return ok(n!);
  }
  if (M === "POST /notifications/read-all") {
    let count = 0;
    for (const n of state.notifications) if (!n.readAt) { n.readAt = new Date().toISOString(); count++; }
    save();
    return ok({ updatedCount: count, unreadCount: 0 });
  }

  notFound(`Mock API chưa hỗ trợ ${M}`);
}

export async function handleMock<T>(
  method: string, path: string, query: Record<string, unknown>, body: unknown,
): Promise<T> {
  await delay();
  const cleanQuery: Record<string, string> = {};
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== "") cleanQuery[k] = String(v);
  }
  return (await route({ method: method.toUpperCase(), path, query: cleanQuery, body })) as T;
}

// used by services/hooks to check availability
export function isMockEnabled(): boolean {
  const v = import.meta.env.VITE_USE_MOCK_API;
  if (v === "false" || v === "0") return false;
  return true; // default on until real backend is ready
}

// dev helper: reset state
export function _resetMockState() {
  state = initialState(); save();
}
