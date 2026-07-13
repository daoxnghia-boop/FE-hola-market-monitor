// Mock API router. Intercepts apiRequest when VITE_USE_MOCK_API is enabled.
import type {
  AddressDto,
  AdminAuditDto,
  AdminStatsDto,
  AdminUserSummaryDto,
  CartDto,
  CartItemDto,
  CategoryDto,
  DeliveryZoneDto,
  NotificationDto,
  OrderDetailDto,
  OrderSummaryDto,
  OrderStatus,
  ProductDto,
  ProductInput,
  ReviewDto,
  SessionDto,
  ShopDto,
  ShopOwnerStatsDto,
  UserDto,
  VoucherDto,
} from "../types";
import {
  categories as seedCategories,
  defaultAddresses,
  defaultUser,
  products as seedProducts,
  seedNotifications,
  seedOrders,
  seedReviews,
  seedUsers,
  shops as seedShops,
  vouchers as seedVouchers,
  zones as seedZones,
} from "./data";

type Ctx = { method: string; path: string; query: Record<string, string>; body: unknown };

const STORAGE_KEY = "hola-mock-state-v5";

type OtpChallenge = { id: string; phone: string; otp: string; expiresAt: number };

type State = {
  authenticated: boolean;
  currentUserId: string | null;
  users: UserDto[];
  addresses: AddressDto[];
  favoriteShopIds: string[];
  cart: CartDto;
  vouchers: VoucherDto[];
  orders: OrderDetailDto[];
  notifications: NotificationDto[];
  reviews: ReviewDto[];
  shops: ShopDto[];
  products: ProductDto[];
  categories: CategoryDto[];
  zones: DeliveryZoneDto[];
  audits: AdminAuditDto[];
  otpChallenges: OtpChallenge[];
  browsingZoneId: string;
};

const emptyCart = (): CartDto => ({
  id: "cart-1",
  shop: null,
  items: [],
  deliveryZone: null,
  voucher: null,
  pricing: { subtotal: 0, discount: 0, deliveryFee: 0, total: 0 },
  canCheckout: false,
  blockingReasons: [],
  updatedAt: new Date().toISOString(),
});

const initialState = (): State => ({
  authenticated: true,
  currentUserId: defaultUser.id,
  users: seedUsers.map((u) => ({ ...u })),
  addresses: [...defaultAddresses],
  favoriteShopIds: seedShops.filter((s) => s.isFavorite).map((s) => s.id),
  cart: emptyCart(),
  vouchers: seedVouchers.map((v) => ({ ...v })),
  orders: seedOrders.map((o) => ({ ...o })),
  notifications: [...seedNotifications],
  reviews: [...seedReviews],
  shops: seedShops.map((s) => ({ ...s })),
  products: seedProducts.map((p) => ({ ...p })),
  categories: seedCategories.map((c) => ({ ...c })),
  zones: seedZones.map((z) => ({ ...z })),
  audits: [],
  otpChallenges: [],
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
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function delay(ms = 220) {
  return new Promise<void>((r) => setTimeout(r, ms + Math.random() * 180));
}

// -------- errors --------
function apiError(status: number, code: string, message: string): never {
  const err = new Error(message) as Error & { __apiStatus: number; __apiCode: string };
  err.__apiStatus = status;
  err.__apiCode = code;
  throw err;
}
const notFound = (m = "Không tìm thấy tài nguyên.") => apiError(404, "NOT_FOUND", m);
const conflict = (code: string, m: string) => apiError(409, code, m);
const badRequest = (code: string, m: string) => apiError(400, code, m);
const unauthorized = (m = "Vui lòng đăng nhập.") => apiError(401, "UNAUTHORIZED", m);
const forbidden = (m = "Bạn không có quyền truy cập.") => apiError(403, "FORBIDDEN", m);
const locked = (m = "Tài khoản đang bị khóa.") => apiError(423, "ACCOUNT_BLOCKED", m);

// -------- auth guards --------
function currentUser(): UserDto | null {
  if (!state.authenticated || !state.currentUserId) return null;
  return state.users.find((u) => u.id === state.currentUserId) ?? null;
}
function requireAuthenticated(): UserDto {
  const u = currentUser();
  if (!u) unauthorized();
  return u!;
}
function requireActiveUser(): UserDto {
  const u = requireAuthenticated();
  if (u.status === "blocked") locked();
  return u;
}
function requireAdmin(): UserDto {
  const u = requireActiveUser();
  if (u.role !== "admin") forbidden("Chỉ dành cho quản trị viên.");
  return u;
}
function requireShopOwner(): UserDto {
  const u = requireActiveUser();
  const owns = state.shops.some((s) => s.ownerId === u.id);
  if (u.role !== "shop_owner" && u.role !== "admin" && !owns) {
    forbidden("Bạn chưa đăng ký gian hàng nào.");
  }
  return u;
}
function requireShopOwnership(shopId: string): { user: UserDto; shop: ShopDto } {
  const u = requireActiveUser();
  const shop = state.shops.find((s) => s.id === shopId);
  if (!shop) notFound("Không tìm thấy quán.");
  if (u.role !== "admin" && shop!.ownerId !== u.id) forbidden("Bạn không sở hữu quán này.");
  return { user: u, shop: shop! };
}

function audit(action: string, entityType: string, entityId: string, reason?: string) {
  const admin = currentUser();
  state.audits = [
    {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      action,
      entityType,
      entityId,
      adminUserId: admin?.id ?? "",
      adminName: admin?.fullName ?? "",
      reason,
      createdAt: new Date().toISOString(),
    },
    ...state.audits,
  ].slice(0, 200);
}

// -------- helpers --------
function normalizePhone(raw: string): string {
  const digits = String(raw ?? "").replace(/[\s.-]/g, "");
  return digits;
}
function isValidVNPhone(p: string): boolean {
  return /^0\d{9}$/.test(p);
}

function shopDeliveryFee(shop: ShopDto, zone: DeliveryZoneDto | null | undefined): number | null {
  if (!zone) return null;
  if (!shop.supportedZoneIds.includes(zone.id)) return null;
  const override = shop.deliveryFees?.[zone.id];
  return typeof override === "number" ? override : zone.baseDeliveryFee;
}

function decorateShop(s: ShopDto, zoneId?: string): ShopDto {
  const isFav = state.favoriteShopIds.includes(s.id);
  const zone = zoneId ? (state.zones.find((z) => z.id === zoneId) ?? null) : null;
  const fee = shopDeliveryFee(s, zone);
  return {
    ...s,
    isFavorite: isFav,
    delivery: zone ? { supported: fee !== null, fee } : s.delivery,
  };
}


function paginate<T>(list: T[], pageSize?: string) {
  const size = pageSize ? Number(pageSize) : list.length;
  return { items: list.slice(0, size), nextCursor: null as string | null };
}

function recomputeCart(cart: CartDto): CartDto {
  const subtotal = cart.items.reduce((n, it) => n + it.lineTotal, 0);
  const zone = cart.deliveryZone;
  const shop = cart.shop;
  // Delivery fee is per-shop-per-zone. Fallback to zone base when quán chưa khai riêng.
  const perShopFee = shop && zone ? shopDeliveryFee(shop, zone) : null;
  const deliveryFee = perShopFee ?? (zone && !shop ? zone.baseDeliveryFee : 0);
  let discount = 0;
  const reasons: string[] = [];

  if (cart.voucher) {
    const v = cart.voucher;
    if (subtotal < v.minOrderAmount) {
      reasons.push(
        `Voucher ${v.code} yêu cầu đơn tối thiểu ${v.minOrderAmount.toLocaleString("vi-VN")}đ.`,
      );
    } else {
      const raw =
        v.discountType === "fixed"
          ? v.discountValue
          : Math.floor((subtotal * v.discountValue) / 100);
      discount = Math.min(raw, v.maxDiscount ?? raw);
    }
  }
  if (!cart.items.length) reasons.push("Giỏ hàng trống.");
  if (!cart.deliveryZone) reasons.push("Chưa chọn khu giao hàng.");
  if (
    cart.shop &&
    cart.deliveryZone &&
    !cart.shop.supportedZoneIds.includes(cart.deliveryZone.id)
  ) {
    reasons.push("Quán không giao tới khu đã chọn.");
  }
  return {
    ...cart,
    pricing: {
      subtotal,
      discount,
      deliveryFee,
      total: Math.max(0, subtotal - discount + deliveryFee),
    },
    canCheckout: reasons.length === 0,
    blockingReasons: reasons,
    updatedAt: new Date().toISOString(),
  };
}

function makeCartItem(p: ProductDto, qty: number, note?: string): CartItemDto {
  return {
    id: `ci-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    productId: p.id,
    quantity: qty,
    note,
    unitPrice: p.price,
    lineTotal: p.price * qty,
    product: p,
  };
}

function summarize(o: OrderDetailDto): OrderSummaryDto {
  return {
    id: o.id,
    displayCode: o.displayCode,
    shopId: o.shopId,
    shopName: o.shopName,
    shopLogoUrl: o.shopLogoUrl,
    status: o.status,
    itemSummary: o.itemSummary,
    itemCount: o.itemCount,
    total: o.total,
    placedAt: o.placedAt,
    canCancel: o.canCancel,
    canReview: o.canReview,
    canReorder: o.canReorder,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
  };
}

const ok = <T>(d: T) => d;

// -------- route --------
async function route(ctx: Ctx): Promise<unknown> {
  const { method, path, query, body } = ctx;
  const M = `${method} ${path}`;

  // ============ AUTH ============
  if (M === "POST /auth/request-otp") {
    const b = body as { phone: string };
    const phone = normalizePhone(b?.phone ?? "");
    if (!isValidVNPhone(phone))
      badRequest("INVALID_PHONE", "Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0).");
    const user = state.users.find((u) => u.phone === phone);
    if (user?.status === "blocked") locked("Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.");
    const challenge: OtpChallenge = {
      id: `otp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      phone,
      otp: "123456",
      expiresAt: Date.now() + 120_000,
    };
    state.otpChallenges = [
      challenge,
      ...state.otpChallenges.filter((c) => c.expiresAt > Date.now()),
    ].slice(0, 20);
    save();
    return ok({
      challengeId: challenge.id,
      expiresInSeconds: 120,
      developmentOtp: "123456",
      requiresRegistration: !user,
    });
  }

  if (M === "POST /auth/verify-otp") {
    const b = body as { challengeId: string; phone: string; otp: string };
    const phone = normalizePhone(b?.phone ?? "");
    const c = state.otpChallenges.find((x) => x.id === b?.challengeId);
    if (!c) badRequest("OTP_INVALID", "Phiên OTP không tồn tại hoặc đã hết hạn.");
    if (c!.expiresAt < Date.now()) badRequest("OTP_EXPIRED", "OTP đã hết hạn, hãy gửi lại mã mới.");
    if (c!.phone !== phone) badRequest("OTP_INVALID", "Số điện thoại không khớp.");
    if (c!.otp !== String(b?.otp ?? "").trim()) badRequest("OTP_INVALID", "Mã OTP không đúng.");
    const user = state.users.find((u) => u.phone === phone);
    if (user?.status === "blocked") locked("Tài khoản đã bị khóa.");
    state.otpChallenges = state.otpChallenges.filter((x) => x.id !== c!.id);
    if (!user) {
      save();
      return ok({ status: "requires_registration", phone });
    }
    state.authenticated = true;
    state.currentUserId = user.id;
    save();
    return ok({ status: "authenticated", session: { authenticated: true, user } });
  }

  if (M === "POST /auth/register") {
    const b = body as { fullName: string; phone: string; email?: string; acceptedTerms: boolean };
    const phone = normalizePhone(b?.phone ?? "");
    const fullName = String(b?.fullName ?? "").trim();
    if (!fullName) badRequest("INVALID_NAME", "Vui lòng nhập họ tên.");
    if (!isValidVNPhone(phone)) badRequest("INVALID_PHONE", "Số điện thoại không hợp lệ.");
    if (!b?.acceptedTerms) badRequest("TERMS_REQUIRED", "Bạn cần đồng ý điều khoản sử dụng.");
    if (state.users.some((u) => u.phone === phone))
      conflict("PHONE_TAKEN", "Số điện thoại đã được đăng ký.");
    const user: UserDto = {
      id: `u-${Date.now()}`,
      fullName,
      phone,
      email: b.email?.trim() || undefined,
      role: "customer",
      status: "active",
      createdAt: new Date().toISOString(),
    };
    state.users = [user, ...state.users];
    state.authenticated = true;
    state.currentUserId = user.id;
    save();
    return ok({ authenticated: true, user } satisfies SessionDto);
  }

  if (M === "GET /auth/session") {
    const u = currentUser();
    return ok<SessionDto>({ authenticated: !!u, user: u });
  }

  if (M === "POST /auth/logout") {
    state.authenticated = false;
    state.currentUserId = null;
    save();
    return ok(undefined);
  }

  // ============ USER SELF ============
  if (M === "GET /users/me") {
    const u = requireAuthenticated();
    return ok(u);
  }
  if (M === "PATCH /users/me") {
    const u = requireActiveUser();
    const b = body as Partial<
      Pick<UserDto, "fullName" | "email" | "avatarUrl" | "defaultDeliveryZoneId">
    >;
    const idx = state.users.findIndex((x) => x.id === u.id);
    state.users[idx] = { ...u, ...b };
    save();
    return ok(state.users[idx]);
  }

  if (M === "GET /users/me/addresses") {
    requireAuthenticated();
    return ok({ items: state.addresses });
  }
  if (M === "GET /users/me/favorite-shops") {
    requireAuthenticated();
    const list = state.shops
      .filter((s) => state.favoriteShopIds.includes(s.id))
      .map((s) => decorateShop(s, query.deliveryZoneId));
    return ok({ items: list, nextCursor: null });
  }
  if (M === "GET /users/me/frequent-products") {
    requireAuthenticated();
    const limit = Number(query.limit ?? 4);
    return ok({ items: state.products.slice(0, limit) });
  }
  const favMatch = path.match(/^\/users\/me\/favorite-shops\/(.+)$/);
  if (favMatch) {
    requireAuthenticated();
    const shopId = favMatch[1];
    if (method === "PUT") {
      if (!state.favoriteShopIds.includes(shopId)) state.favoriteShopIds.push(shopId);
      save();
      return ok({ shopId, isFavorite: true });
    }
    if (method === "DELETE") {
      state.favoriteShopIds = state.favoriteShopIds.filter((id) => id !== shopId);
      save();
      return ok(undefined);
    }
  }

  // ============ CATALOG (public) ============
  if (M === "GET /categories")
    return ok({ items: state.categories.filter((c) => c.active !== false) });
  if (M === "GET /delivery-zones") return ok({ items: state.zones.filter((z) => z.active) });
  if (M === "GET /shops") {
    let list = state.shops.filter(
      (s) => s.approvalStatus === "approved" && s.operationStatus === "active",
    );
    if (query.categoryId) list = list.filter((s) => s.categoryIds.includes(query.categoryId));
    if (query.deliveryZoneId)
      list = list.filter((s) => s.supportedZoneIds.includes(query.deliveryZoneId));
    if (query.sort === "distance") list.sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99));
    if (query.sort === "newest") list = [...list].reverse();
    if (query.sort === "rating") list.sort((a, b) => b.rating - a.rating);
    return ok(
      paginate(
        list.map((s) => decorateShop(s, query.deliveryZoneId)),
        query.pageSize,
      ),
    );
  }
  const shopMatch = path.match(/^\/shops\/([^/]+)$/);
  if (shopMatch && method === "GET") {
    const s = state.shops.find((x) => x.id === shopMatch[1] || x.slug === shopMatch[1]);
    if (!s) notFound("Không tìm thấy quán.");
    return ok(decorateShop(s!, query.deliveryZoneId));
  }
  const shopProdMatch = path.match(/^\/shops\/([^/]+)\/products$/);
  if (shopProdMatch && method === "GET") {
    const shopId = shopProdMatch[1];
    let list = state.products.filter((p) => p.shopId === shopId);
    if (query.categoryId) list = list.filter((p) => p.categoryId === query.categoryId);
    return ok(paginate(list, query.pageSize));
  }
  if (M === "GET /products") {
    let list = [...state.products];
    if (query.categoryId) list = list.filter((p) => p.categoryId === query.categoryId);
    return ok(paginate(list, query.pageSize));
  }
  const prodMatch = path.match(/^\/products\/([^/]+)$/);
  if (prodMatch && method === "GET") {
    const p = state.products.find((x) => x.id === prodMatch[1]);
    if (!p) notFound("Không tìm thấy sản phẩm.");
    return ok(p);
  }
  if (M === "GET /products/popular") {
    const limit = Number(query.limit ?? 6);
    return ok({
      items: [...state.products].sort((a, b) => b.soldCount - a.soldCount).slice(0, limit),
    });
  }
  if (M === "GET /search") {
    const q = (query.q ?? "").toLowerCase().trim();
    const kind = query.type ?? "all";
    const matchShops = q
      ? state.shops.filter(
          (s) =>
            s.approvalStatus === "approved" &&
            (s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)),
        )
      : [];
    const matchProducts = q
      ? state.products.filter(
          (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
        )
      : [];
    return ok({
      shops: {
        items:
          kind === "products" ? [] : matchShops.map((s) => decorateShop(s, query.deliveryZoneId)),
        total: matchShops.length,
      },
      products: { items: kind === "shops" ? [] : matchProducts, total: matchProducts.length },
      nextCursor: null,
    });
  }

  // vouchers (user)
  if (M === "GET /users/me/vouchers") {
    requireAuthenticated();
    return ok(
      paginate(
        state.vouchers.filter((v) => v.enabled !== false),
        query.pageSize,
      ),
    );
  }

  // cart
  if (M === "GET /cart") return ok(state.cart);
  if (M === "POST /cart/items") {
    const b = body as {
      productId: string;
      quantity: number;
      note?: string;
      replaceExistingCart?: boolean;
    };
    const p = state.products.find((x) => x.id === b.productId);
    if (!p) notFound("Không tìm thấy món.");
    const shop = state.shops.find((s) => s.id === p!.shopId)!;
    if (state.cart.shop && state.cart.shop.id !== shop.id && !b.replaceExistingCart) {
      conflict("CART_SHOP_CONFLICT", "Giỏ hiện có món của quán khác.");
    }
    let cart = state.cart;
    if (!cart.shop || cart.shop.id !== shop.id || b.replaceExistingCart) {
      cart = {
        ...emptyCart(),
        shop: decorateShop(shop, state.browsingZoneId),
        deliveryZone: state.zones.find((z) => z.id === state.browsingZoneId) ?? null,
      };
    }
    const existing = cart.items.find((it) => it.productId === p!.id && it.note === b.note);
    if (existing) {
      existing.quantity += b.quantity;
      existing.lineTotal = existing.quantity * existing.unitPrice;
      cart = { ...cart, items: [...cart.items] };
    } else {
      cart = { ...cart, items: [...cart.items, makeCartItem(p!, b.quantity, b.note)] };
    }
    state.cart = recomputeCart(cart);
    save();
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
    if (!state.cart.items.length)
      state.cart = { ...emptyCart(), deliveryZone: state.cart.deliveryZone };
    state.cart = recomputeCart({ ...state.cart, items: [...state.cart.items] });
    save();
    return ok(state.cart);
  }
  if (M === "DELETE /cart") {
    state.cart = emptyCart();
    save();
    return ok(state.cart);
  }
  if (M === "PUT /cart/delivery-zone") {
    const b = body as { deliveryZoneId: string };
    const z = state.zones.find((x) => x.id === b.deliveryZoneId) ?? null;
    state.browsingZoneId = z?.id ?? state.browsingZoneId;
    state.cart = recomputeCart({ ...state.cart, deliveryZone: z });
    save();
    return ok(state.cart);
  }
  if (M === "PUT /cart/voucher") {
    const b = body as { code: string };
    const v = state.vouchers.find(
      (x) => x.code.toUpperCase() === b.code.toUpperCase() && x.enabled !== false,
    );
    if (!v) conflict("VOUCHER_INVALID", "Mã voucher không hợp lệ.");
    state.cart = recomputeCart({ ...state.cart, voucher: v! });
    save();
    return ok(state.cart);
  }
  if (M === "DELETE /cart/voucher") {
    state.cart = recomputeCart({ ...state.cart, voucher: null });
    save();
    return ok(state.cart);
  }
  if (M === "POST /cart/validate") {
    state.cart = recomputeCart(state.cart);
    save();
    return ok(state.cart);
  }

  // ============ ORDERS (customer) ============
  if (M === "GET /orders") {
    const u = requireAuthenticated();
    const mine = state.orders.filter((o) => o.customerId === u.id);
    return ok(paginate(mine.map(summarize), query.pageSize));
  }
  const orderMatch = path.match(/^\/orders\/([^/]+)$/);
  if (orderMatch && method === "GET") {
    const u = requireAuthenticated();
    const o = state.orders.find((x) => x.id === orderMatch[1]);
    if (!o) notFound("Không tìm thấy đơn hàng.");
    if (o!.customerId && o!.customerId !== u.id && u.role !== "admin") forbidden();
    return ok(o);
  }
  if (M === "POST /orders") {
    const u = requireActiveUser();
    const cart = state.cart;
    if (!cart.shop || !cart.items.length) conflict("CART_EMPTY", "Giỏ hàng trống.");
    const b = body as { delivery?: OrderDetailDto["delivery"]; note?: string };
    const now = new Date().toISOString();
    const id = `o-${Date.now()}`;
    const order: OrderDetailDto = {
      id,
      displayCode: `HL${id.slice(-6).toUpperCase()}`,
      shopId: cart.shop!.id,
      shopName: cart.shop!.name,
      shopLogoUrl: cart.shop!.logoUrl,
      status: "cho_quan_xac_nhan",
      itemSummary: cart.items.map((it) => `${it.quantity}× ${it.product.name}`).join(", "),
      itemCount: cart.items.reduce((n, it) => n + it.quantity, 0),
      total: cart.pricing.total,
      placedAt: now,
      canCancel: true,
      canReview: false,
      canReorder: true,
      customerId: u.id,
      customerName: u.fullName,
      customerPhone: u.phone,
      shopPhone: cart.shop!.phone,
      shopAddress: cart.shop!.address,
      items: cart.items.map((it) => ({
        productId: it.product.id,
        productName: it.product.name,
        productImageUrl: it.product.imageUrl,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        lineTotal: it.lineTotal,
        note: it.note,
      })),
      pricing: cart.pricing,
      voucherCode: cart.voucher?.code,
      paymentMethod: "cash_on_delivery",
      paymentStatus: "unpaid",
      delivery: b.delivery ?? {
        zoneId: cart.deliveryZone?.id ?? "z1",
        zoneName: cart.deliveryZone?.name ?? "",
        recipientName: u.fullName,
        phone: u.phone,
        addressLine: state.addresses.find((a) => a.isDefault)?.addressLine ?? "",
        note: b.note,
        etaMinutes: cart.shop!.estimatedDeliveryMinutes,
      },
      statusHistory: [{ status: "cho_quan_xac_nhan", occurredAt: now }],
    };
    state.orders = [order, ...state.orders];
    state.cart = emptyCart();
    state.notifications = [
      {
        id: `n-${id}`,
        type: "order",
        title: "Đã gửi đơn cho quán",
        body: `Đơn ${order.displayCode} đang chờ ${order.shopName} xác nhận.`,
        createdAt: now,
        readAt: null,
        target: { type: "order", id },
        userId: u.id,
      },
      ...state.notifications,
    ];
    save();
    return ok(order);
  }
  const cancelMatch = path.match(/^\/orders\/([^/]+)\/cancel$/);
  if (cancelMatch && method === "POST") {
    const u = requireAuthenticated();
    const o = state.orders.find((x) => x.id === cancelMatch[1]);
    if (!o) notFound();
    if (o!.customerId && o!.customerId !== u.id) forbidden();
    if (!o!.canCancel) conflict("ORDER_NOT_CANCELABLE", "Đơn không thể hủy ở trạng thái này.");
    const b = (body ?? {}) as { reasonCode?: string; reasonText?: string };
    const now = new Date().toISOString();
    o!.status = "da_huy";
    o!.canCancel = false;
    o!.canReview = false;
    o!.cancellation = {
      reason: b.reasonText || b.reasonCode || "Khách hủy",
      canceledAt: now,
      canceledBy: "customer",
    };
    o!.statusHistory = [
      ...o!.statusHistory,
      { status: "da_huy", occurredAt: now, note: o!.cancellation.reason },
    ];
    save();
    return ok(o!);
  }
  const reorderMatch = path.match(/^\/orders\/([^/]+)\/reorder$/);
  if (reorderMatch && method === "POST") {
    requireAuthenticated();
    const o = state.orders.find((x) => x.id === reorderMatch[1]);
    if (!o) notFound();
    const b = (body ?? {}) as { replaceExistingCart?: boolean };
    const shop = state.shops.find((s) => s.id === o!.shopId)!;
    if (state.cart.shop && state.cart.shop.id !== shop.id && !b.replaceExistingCart) {
      conflict("CART_SHOP_CONFLICT", "Giỏ hiện có món của quán khác.");
    }
    const cart: CartDto = {
      ...emptyCart(),
      shop: decorateShop(shop, state.browsingZoneId),
      deliveryZone: state.zones.find((z) => z.id === state.browsingZoneId) ?? null,
    };
    const skipped: Array<{ productId: string; reason: string }> = [];
    for (const it of o!.items) {
      const p = state.products.find((x) => x.id === it.productId);
      if (!p) {
        skipped.push({ productId: it.productId, reason: "Món không còn bán." });
        continue;
      }
      cart.items.push(makeCartItem(p, it.quantity, it.note));
    }
    state.cart = recomputeCart(cart);
    save();
    return ok({ cart: state.cart, skippedItems: skipped });
  }
  const reviewMatch = path.match(/^\/orders\/([^/]+)\/review$/);
  if (reviewMatch && method === "POST") {
    const u = requireAuthenticated();
    const o = state.orders.find((x) => x.id === reviewMatch[1]);
    if (!o) notFound();
    const b = body as { rating: number; comment?: string };
    const review: ReviewDto = {
      id: `r-${Date.now()}`,
      orderId: o!.id,
      shopId: o!.shopId,
      user: { id: u.id, displayName: u.fullName },
      rating: b.rating,
      comment: b.comment,
      createdAt: new Date().toISOString(),
    };
    o!.review = review;
    o!.canReview = false;
    state.reviews = [review, ...state.reviews];
    save();
    return ok(review);
  }

  // notifications (user)
  if (M === "GET /notifications") {
    const u = requireAuthenticated();
    const list = state.notifications.filter((n) => !n.userId || n.userId === u.id);
    const unread = list.filter((n) => !n.readAt).length;
    return ok({ items: list, nextCursor: null, unreadCount: unread });
  }
  if (M === "GET /notifications/unread-count") {
    const u = currentUser();
    if (!u) return ok({ unreadCount: 0 });
    const list = state.notifications.filter((n) => !n.userId || n.userId === u.id);
    return ok({ unreadCount: list.filter((n) => !n.readAt).length });
  }
  const notifReadMatch = path.match(/^\/notifications\/([^/]+)\/read$/);
  if (notifReadMatch && method === "PATCH") {
    requireAuthenticated();
    const n = state.notifications.find((x) => x.id === notifReadMatch[1]);
    if (!n) notFound();
    n!.readAt = new Date().toISOString();
    save();
    return ok(n!);
  }
  if (M === "POST /notifications/read-all") {
    const u = requireAuthenticated();
    let count = 0;
    for (const n of state.notifications) {
      if ((!n.userId || n.userId === u.id) && !n.readAt) {
        n.readAt = new Date().toISOString();
        count++;
      }
    }
    save();
    return ok({ updatedCount: count, unreadCount: 0 });
  }

  // ============ SHOP OWNER ============
  if (path === "/shop-owner/shops" || path.startsWith("/shop-owner/shops/")) {
    const u = requireActiveUser();

    if (M === "GET /shop-owner/shops") {
      const list = state.shops.filter((s) => s.ownerId === u.id);
      return ok({ items: list, nextCursor: null });
    }

    if (M === "POST /shop-owner/shops") {
      const b = body as {
        name: string;
        slug?: string;
        ownerName: string;
        ownerPhone: string;
        phone: string;
        address: string;
        area: string;
        description: string;
        logoUrl?: string;
        coverUrl?: string;
        openHoursText: string;
        prepTimeMinutes: number;
        categoryIds: string[];
        supportedZoneIds: string[];
        deliveryFees?: Record<string, number>;
        acceptedTerms: boolean;
      };
      if (!b?.acceptedTerms) badRequest("TERMS_REQUIRED", "Bạn cần đồng ý điều khoản.");
      if (!b?.name?.trim()) badRequest("INVALID_NAME", "Vui lòng nhập tên quán.");
      if (!isValidVNPhone(normalizePhone(b?.phone ?? "")))
        badRequest("INVALID_PHONE", "SĐT liên hệ không hợp lệ.");
      if (!b?.address?.trim()) badRequest("INVALID_ADDRESS", "Vui lòng nhập địa chỉ.");
      if (!b?.categoryIds?.length) badRequest("CATEGORY_REQUIRED", "Chọn ít nhất 1 danh mục.");
      if (!b?.supportedZoneIds?.length) badRequest("ZONE_REQUIRED", "Chọn ít nhất 1 khu vực giao.");
      if (!(b?.prepTimeMinutes > 0))
        badRequest("INVALID_PREP", "Thời gian chuẩn bị phải lớn hơn 0.");
      const slugBase = (b.slug || b.name)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      let slug = slugBase || `shop-${Date.now()}`;
      let i = 1;
      while (state.shops.some((s) => s.slug === slug)) {
        slug = `${slugBase}-${++i}`;
      }
      const now = new Date().toISOString();
      const shop: ShopDto = {
        id: `s-${Date.now()}`,
        slug,
        name: b.name.trim(),
        logoUrl: b.logoUrl || `https://picsum.photos/seed/${slug}-l/300/300`,
        coverUrl: b.coverUrl || `https://picsum.photos/seed/${slug}-c/600/400`,
        rating: 0,
        reviewCount: 0,
        address: b.address,
        area: b.area || "",
        distanceKm: null,
        status: "closed",
        isOpen: false,
        prepTimeMinutes: b.prepTimeMinutes,
        estimatedDeliveryMinutes: b.prepTimeMinutes + 15,
        categoryIds: b.categoryIds,
        description: b.description || "",
        phone: normalizePhone(b.phone),
        openHoursText: b.openHoursText || "08:00 – 20:00",
        supportedZoneIds: b.supportedZoneIds,
        isFavorite: false,
        ownerId: u.id,
        ownerName: b.ownerName || u.fullName,
        ownerPhone: normalizePhone(b.ownerPhone || u.phone),
        approvalStatus: "pending",
        operationStatus: "active",
        createdAt: now,
        submittedAt: now,
        orderCount: 0,
        deliveryFees: sanitizeDeliveryFees(b.deliveryFees, b.supportedZoneIds),
      };
      state.shops = [shop, ...state.shops];
      // Promote user to shop_owner on first registration
      if (u.role === "customer") {
        const idx = state.users.findIndex((x) => x.id === u.id);
        if (idx >= 0) state.users[idx] = { ...state.users[idx], role: "shop_owner" };
      }
      // Notify admin dashboard via audit
      audit("shop.register", "shop", shop.id);
      save();
      return ok(shop);
    }

    const ownerShopMatch = path.match(/^\/shop-owner\/shops\/([^/]+)$/);
    if (ownerShopMatch) {
      const { shop } = requireShopOwnership(ownerShopMatch[1]);
      if (method === "GET") return ok(shop);
      if (method === "PATCH") {
        const b = body as Partial<ShopDto>;
        // Prevent client from modifying protected admin fields
        delete (b as Record<string, unknown>).approvalStatus;
        delete (b as Record<string, unknown>).ownerId;
        delete (b as Record<string, unknown>).rating;
        delete (b as Record<string, unknown>).reviewCount;
        delete (b as Record<string, unknown>).orderCount;
        Object.assign(shop, b);
        save();
        return ok(shop);
      }
      if (method === "DELETE") {
        const hasOrders = state.orders.some((o) => o.shopId === shop.id);
        if (hasOrders)
          conflict(
            "SHOP_HAS_ORDERS",
            "Quán đã có đơn hàng, không thể xoá vĩnh viễn. Hãy tạm ngưng thay vì xoá.",
          );
        if (shop.approvalStatus === "approved")
          conflict("SHOP_APPROVED", "Quán đã duyệt không thể xoá; hãy tạm ngưng.");
        state.shops = state.shops.filter((s) => s.id !== shop.id);
        save();
        return ok(undefined);
      }
    }

    const ownerActionMatch = path.match(/^\/shop-owner\/shops\/([^/]+)\/(submit|pause|reopen)$/);
    if (ownerActionMatch && method === "POST") {
      const { shop } = requireShopOwnership(ownerActionMatch[1]);
      const action = ownerActionMatch[2];
      const now = new Date().toISOString();
      if (action === "submit") {
        if (shop.approvalStatus === "approved") conflict("ALREADY_APPROVED", "Quán đã được duyệt.");
        shop.approvalStatus = "pending";
        shop.submittedAt = now;
        shop.rejectionReason = undefined;
      } else if (action === "pause") {
        if (shop.approvalStatus !== "approved")
          conflict("NOT_APPROVED", "Chỉ quán đã duyệt mới tạm nghỉ được.");
        shop.operationStatus = "paused";
      } else if (action === "reopen") {
        if (shop.operationStatus === "suspended")
          forbidden("Quán đang bị đình chỉ bởi quản trị viên.");
        shop.operationStatus = "active";
      }
      save();
      return ok(shop);
    }
  }

  // ============ SHOP OWNER: STATS ============
  if (M === "GET /shop-owner/stats") {
    const u = requireShopOwner();
    const myShops = state.shops.filter((s) => s.ownerId === u.id);
    const shopIds = new Set(myShops.map((s) => s.id));
    const myOrders = state.orders.filter((o) => shopIds.has(o.shopId));
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const today = myOrders.filter((o) => new Date(o.placedAt).getTime() >= startOfToday.getTime());
    const stats: ShopOwnerStatsDto = {
      totalShops: myShops.length,
      approvedShops: myShops.filter((s) => s.approvalStatus === "approved").length,
      pendingShops: myShops.filter((s) => s.approvalStatus === "pending").length,
      activeProducts: state.products.filter((p) => shopIds.has(p.shopId) && p.available).length,
      ordersToday: today.length,
      revenueToday: today.filter((o) => o.status !== "da_huy").reduce((n, o) => n + o.total, 0),
      pendingOrders: myOrders.filter(
        (o) =>
          o.status === "cho_quan_xac_nhan" ||
          o.status === "quan_da_xac_nhan" ||
          o.status === "dang_chuan_bi",
      ).length,
      ordersByStatus: (
        [
          "cho_quan_xac_nhan",
          "quan_da_xac_nhan",
          "dang_chuan_bi",
          "dang_giao",
          "hoan_thanh",
          "da_huy",
        ] as OrderStatus[]
      ).map((s) => ({ status: s, count: myOrders.filter((o) => o.status === s).length })),
      latestOrders: [...myOrders]
        .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime())
        .slice(0, 6)
        .map(summarize),
    };
    return ok(stats);
  }

  // ============ SHOP OWNER: PRODUCTS ============
  if (M === "GET /shop-owner/products") {
    const u = requireShopOwner();
    const myShopIds = new Set(state.shops.filter((s) => s.ownerId === u.id).map((s) => s.id));
    let list = state.products.filter((p) => myShopIds.has(p.shopId));
    if (query.shopId) {
      if (!myShopIds.has(query.shopId) && u.role !== "admin")
        forbidden("Bạn không sở hữu quán này.");
      list = list.filter((p) => p.shopId === query.shopId);
    }
    const q = (query.q ?? "").toLowerCase();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q));
    if (query.categoryId) list = list.filter((p) => p.categoryId === query.categoryId);
    return ok({ items: list, nextCursor: null });
  }
  if (M === "POST /shop-owner/products") {
    const b = body as ProductInput;
    if (!b?.shopId) badRequest("SHOP_REQUIRED", "Thiếu quán.");
    const { shop } = requireShopOwnership(b.shopId);
    if (!b.name?.trim()) badRequest("INVALID_NAME", "Vui lòng nhập tên món.");
    if (!(b.price > 0)) badRequest("INVALID_PRICE", "Giá phải lớn hơn 0.");
    if (!b.categoryId) badRequest("CATEGORY_REQUIRED", "Chọn danh mục.");
    const slug = b.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const p: ProductDto = {
      id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      shopId: shop.id,
      name: b.name.trim(),
      price: Math.floor(b.price),
      description: b.description ?? "",
      imageUrl: b.imageUrl || `https://picsum.photos/seed/${slug || "food"}-${Date.now()}/400/400`,
      categoryId: b.categoryId,
      available: b.available !== false,
      prepTimeMinutes: b.prepTimeMinutes ?? shop.prepTimeMinutes ?? 10,
      rating: 0,
      reviewCount: 0,
      soldCount: 0,
    };
    state.products = [p, ...state.products];
    save();
    return ok(p);
  }
  const ownerProdMatch = path.match(/^\/shop-owner\/products\/([^/]+)$/);
  if (ownerProdMatch) {
    const p = state.products.find((x) => x.id === ownerProdMatch[1]);
    if (!p) notFound("Không tìm thấy món.");
    requireShopOwnership(p!.shopId);
    if (method === "GET") return ok(p);
    if (method === "PATCH") {
      const b = body as Partial<ProductInput & { available: boolean }>;
      if (b.price !== undefined && !(b.price > 0))
        badRequest("INVALID_PRICE", "Giá phải lớn hơn 0.");
      if (b.name !== undefined && !b.name.trim())
        badRequest("INVALID_NAME", "Tên món không được trống.");
      Object.assign(p!, {
        ...b,
        name: b.name?.trim() ?? p!.name,
        price: b.price !== undefined ? Math.floor(b.price) : p!.price,
      });
      // Ownership immutable
      p!.shopId = p!.shopId;
      save();
      return ok(p);
    }
    if (method === "DELETE") {
      const usedInOrder = state.orders.some((o) => o.items.some((it) => it.productId === p!.id));
      if (usedInOrder)
        conflict("PRODUCT_HAS_ORDERS", "Món đã có trong đơn hàng — hãy tắt bán thay vì xoá.");
      state.products = state.products.filter((x) => x.id !== p!.id);
      save();
      return ok(undefined);
    }
  }

  // ============ SHOP OWNER: ORDERS ============
  if (M === "GET /shop-owner/orders") {
    const u = requireShopOwner();
    const myShopIds = new Set(state.shops.filter((s) => s.ownerId === u.id).map((s) => s.id));
    let list = state.orders.filter((o) => myShopIds.has(o.shopId));
    if (query.shopId) list = list.filter((o) => o.shopId === query.shopId);
    if (query.status) list = list.filter((o) => o.status === query.status);
    const q = (query.q ?? "").toLowerCase();
    if (q)
      list = list.filter(
        (o) =>
          o.displayCode.toLowerCase().includes(q) ||
          (o.customerPhone ?? "").includes(q) ||
          (o.customerName ?? "").toLowerCase().includes(q),
      );
    list.sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
    return ok({ items: list.map(summarize), nextCursor: null });
  }
  const ownerOrderMatch = path.match(/^\/shop-owner\/orders\/([^/]+)$/);
  if (ownerOrderMatch && method === "GET") {
    const o = state.orders.find((x) => x.id === ownerOrderMatch[1]);
    if (!o) notFound();
    requireShopOwnership(o!.shopId);
    return ok(o);
  }
  const ownerAdvance = path.match(/^\/shop-owner\/orders\/([^/]+)\/advance$/);
  if (ownerAdvance && method === "POST") {
    const o = state.orders.find((x) => x.id === ownerAdvance[1]);
    if (!o) notFound();
    requireShopOwnership(o!.shopId);
    const flow: OrderStatus[] = [
      "cho_quan_xac_nhan",
      "quan_da_xac_nhan",
      "dang_chuan_bi",
      "dang_giao",
      "hoan_thanh",
    ];
    const idx = flow.indexOf(o!.status);
    if (o!.status === "hoan_thanh" || o!.status === "da_huy")
      conflict("ORDER_LOCKED", "Đơn đã kết thúc, không thể cập nhật.");
    const next =
      idx >= 0 && idx < flow.length - 1
        ? flow[idx + 1]
        : o!.status === "da_dat"
          ? "cho_quan_xac_nhan"
          : o!.status;
    const now = new Date().toISOString();
    o!.status = next;
    o!.canCancel = next === "cho_quan_xac_nhan" || next === "quan_da_xac_nhan";
    o!.canReview = next === "hoan_thanh";
    o!.statusHistory = [...o!.statusHistory, { status: next, occurredAt: now }];
    if (o!.customerId) {
      state.notifications = [
        {
          id: `n-so-${o!.id}-${next}`,
          type: "order",
          title: "Cập nhật đơn hàng",
          body: `Đơn ${o!.displayCode} đã chuyển sang ${next}.`,
          createdAt: now,
          readAt: null,
          target: { type: "order", id: o!.id },
          userId: o!.customerId,
        },
        ...state.notifications,
      ];
    }
    save();
    return ok(o);
  }
  const ownerCancel = path.match(/^\/shop-owner\/orders\/([^/]+)\/cancel$/);
  if (ownerCancel && method === "POST") {
    const o = state.orders.find((x) => x.id === ownerCancel[1]);
    if (!o) notFound();
    const { user } = requireShopOwnership(o!.shopId);
    const b = (body ?? {}) as { reason?: string };
    if (!b.reason?.trim()) badRequest("REASON_REQUIRED", "Vui lòng nhập lý do hủy.");
    if (o!.status === "dang_giao" || o!.status === "hoan_thanh" || o!.status === "da_huy") {
      conflict("ORDER_LOCKED", "Không thể hủy đơn ở trạng thái hiện tại.");
    }
    const now = new Date().toISOString();
    o!.status = "da_huy";
    o!.canCancel = false;
    o!.canReview = false;
    o!.cancellation = { reason: b.reason, canceledAt: now, canceledBy: `shop:${user.fullName}` };
    o!.statusHistory = [...o!.statusHistory, { status: "da_huy", occurredAt: now, note: b.reason }];
    if (o!.customerId) {
      state.notifications = [
        {
          id: `n-soc-${o!.id}`,
          type: "order",
          title: "Quán đã hủy đơn",
          body: `Đơn ${o!.displayCode} bị hủy. Lý do: ${b.reason}`,
          createdAt: now,
          readAt: null,
          target: { type: "order", id: o!.id },
          userId: o!.customerId,
        },
        ...state.notifications,
      ];
    }
    save();
    return ok(o);
  }

  if (path.startsWith("/admin/") || path === "/admin") {
    const admin = requireAdmin();

    if (M === "GET /admin/stats") {
      const now = Date.now();
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const todayOrders = state.orders.filter(
        (o) => new Date(o.placedAt).getTime() >= startOfToday.getTime(),
      );
      const stats: AdminStatsDto = {
        totalCustomers: state.users.filter((u) => u.role === "customer").length,
        activeShops: state.shops.filter(
          (s) => s.approvalStatus === "approved" && s.operationStatus === "active",
        ).length,
        pendingShops: state.shops.filter((s) => s.approvalStatus === "pending").length,
        ordersToday: todayOrders.length,
        revenueToday: todayOrders
          .filter((o) => o.status !== "da_huy")
          .reduce((n, o) => n + o.total, 0),
        cancelledToday: todayOrders.filter((o) => o.status === "da_huy").length,
        ordersByStatus: (
          [
            "cho_quan_xac_nhan",
            "quan_da_xac_nhan",
            "dang_chuan_bi",
            "dang_giao",
            "hoan_thanh",
            "da_huy",
          ] as OrderStatus[]
        ).map((s) => ({ status: s, count: state.orders.filter((o) => o.status === s).length })),
        trend7d: Array.from({ length: 7 }).map((_, i) => {
          const d = new Date(now - (6 - i) * 86400e3);
          const dayStart = new Date(d);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = dayStart.getTime() + 86400e3;
          const dayOrders = state.orders.filter((o) => {
            const t = new Date(o.placedAt).getTime();
            return t >= dayStart.getTime() && t < dayEnd && o.status !== "da_huy";
          });
          return {
            date: `${dayStart.getDate()}/${dayStart.getMonth() + 1}`,
            orders: dayOrders.length,
            revenue: dayOrders.reduce((n, o) => n + o.total, 0),
          };
        }),
        latestOrders: [...state.orders]
          .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime())
          .slice(0, 8)
          .map(summarize),
        pendingApprovalShops: state.shops.filter((s) => s.approvalStatus === "pending"),
      };
      return ok(stats);
    }

    if (M === "GET /admin/audits") return ok({ items: state.audits });

    // shops
    if (M === "GET /admin/shops") {
      let list = [...state.shops];
      const q = (query.q ?? "").toLowerCase();
      if (q)
        list = list.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            (s.ownerName ?? "").toLowerCase().includes(q) ||
            (s.ownerPhone ?? "").includes(q),
        );
      if (query.approvalStatus)
        list = list.filter((s) => s.approvalStatus === query.approvalStatus);
      if (query.operationStatus)
        list = list.filter((s) => s.operationStatus === query.operationStatus);
      if (query.deliveryZoneId)
        list = list.filter((s) => s.supportedZoneIds.includes(query.deliveryZoneId));
      if (query.sort === "rating") list.sort((a, b) => b.rating - a.rating);
      else if (query.sort === "orderCount")
        list.sort((a, b) => (b.orderCount ?? 0) - (a.orderCount ?? 0));
      else
        list.sort(
          (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
        );
      return ok({ items: list, nextCursor: null });
    }
    const adminShopMatch = path.match(/^\/admin\/shops\/([^/]+)$/);
    if (adminShopMatch) {
      const shop = state.shops.find((s) => s.id === adminShopMatch[1]);
      if (!shop) notFound("Không tìm thấy quán.");
      if (method === "GET") return ok(shop);
      if (method === "PATCH") {
        Object.assign(shop!, body as Partial<ShopDto>);
        audit("shop.update", "shop", shop!.id);
        save();
        return ok(shop);
      }
    }
    const adminShopAction = path.match(
      /^\/admin\/shops\/([^/]+)\/(approve|reject|suspend|activate)$/,
    );
    if (adminShopAction && method === "POST") {
      const shop = state.shops.find((s) => s.id === adminShopAction[1]);
      if (!shop) notFound();
      const action = adminShopAction[2];
      const b = (body ?? {}) as { reason?: string };
      if (action === "approve") {
        shop!.approvalStatus = "approved";
      }
      if (action === "reject") {
        shop!.approvalStatus = "rejected";
      }
      if (action === "suspend") {
        shop!.operationStatus = "suspended";
      }
      if (action === "activate") {
        shop!.operationStatus = "active";
      }
      audit(`shop.${action}`, "shop", shop!.id, b.reason);
      save();
      return ok(shop);
    }

    // orders
    if (M === "GET /admin/orders") {
      let list = [...state.orders];
      const q = (query.q ?? "").toLowerCase();
      if (q)
        list = list.filter(
          (o) =>
            o.displayCode.toLowerCase().includes(q) ||
            (o.customerPhone ?? "").includes(q) ||
            o.shopName.toLowerCase().includes(q),
        );
      if (query.status) list = list.filter((o) => o.status === query.status);
      if (query.shopId) list = list.filter((o) => o.shopId === query.shopId);
      list.sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
      if (query.sort === "total") list.sort((a, b) => b.total - a.total);
      return ok({ items: list.map(summarize), nextCursor: null });
    }
    const adminOrderMatch = path.match(/^\/admin\/orders\/([^/]+)$/);
    if (adminOrderMatch && method === "GET") {
      const o = state.orders.find((x) => x.id === adminOrderMatch[1]);
      if (!o) notFound();
      return ok(o);
    }
    const adminOrderCancel = path.match(/^\/admin\/orders\/([^/]+)\/cancel$/);
    if (adminOrderCancel && method === "POST") {
      const o = state.orders.find((x) => x.id === adminOrderCancel[1]);
      if (!o) notFound();
      const b = (body ?? {}) as { reason?: string };
      if (!b.reason) badRequest("REASON_REQUIRED", "Vui lòng nhập lý do hủy đơn.");
      const now = new Date().toISOString();
      o!.status = "da_huy";
      o!.canCancel = false;
      o!.canReview = false;
      o!.cancellation = {
        reason: b.reason,
        canceledAt: now,
        canceledBy: `admin:${admin.fullName}`,
      };
      o!.statusHistory = [
        ...o!.statusHistory,
        { status: "da_huy", occurredAt: now, note: b.reason },
      ];
      if (o!.customerId) {
        state.notifications = [
          {
            id: `n-adm-${o!.id}`,
            type: "order",
            title: "Đơn hàng bị hủy bởi quản trị viên",
            body: `Đơn ${o!.displayCode} đã bị hủy. Lý do: ${b.reason}`,
            createdAt: now,
            readAt: null,
            target: { type: "order", id: o!.id },
            userId: o!.customerId,
          },
          ...state.notifications,
        ];
      }
      audit("order.cancel", "order", o!.id, b.reason);
      save();
      return ok(o);
    }

    // users
    if (M === "GET /admin/users") {
      let list = state.users.map((u): AdminUserSummaryDto => {
        const orders = state.orders.filter((o) => o.customerId === u.id);
        return {
          ...u,
          orderCount: orders.length,
          totalSpending: orders
            .filter((o) => o.status !== "da_huy")
            .reduce((n, o) => n + o.total, 0),
        };
      });
      const q = (query.q ?? "").toLowerCase();
      if (q)
        list = list.filter(
          (u) =>
            u.fullName.toLowerCase().includes(q) ||
            u.phone.includes(q) ||
            (u.email ?? "").toLowerCase().includes(q),
        );
      if (query.role) list = list.filter((u) => u.role === query.role);
      if (query.status) list = list.filter((u) => u.status === query.status);
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return ok({ items: list, nextCursor: null });
    }
    const adminUserAction = path.match(/^\/admin\/users\/([^/]+)\/(block|unblock)$/);
    if (adminUserAction && method === "POST") {
      const user = state.users.find((u) => u.id === adminUserAction[1]);
      if (!user) notFound();
      const action = adminUserAction[2];
      const b = (body ?? {}) as { reason?: string };
      if (action === "block") {
        if (user!.id === admin.id)
          badRequest("CANNOT_BLOCK_SELF", "Không thể tự khóa tài khoản của bạn.");
        if (!b.reason) badRequest("REASON_REQUIRED", "Vui lòng nhập lý do khóa.");
        user!.status = "blocked";
        if (state.currentUserId === user!.id) {
          state.authenticated = false;
          state.currentUserId = null;
        }
      } else user!.status = "active";
      audit(`user.${action}`, "user", user!.id, b.reason);
      save();
      return ok(user);
    }

    // vouchers
    if (M === "GET /admin/vouchers") return ok({ items: state.vouchers });
    if (M === "POST /admin/vouchers") {
      const b = body as VoucherDto;
      const v: VoucherDto = {
        ...b,
        id: `v-${Date.now()}`,
        code: b.code.toUpperCase(),
        status: "usable",
        enabled: true,
        usedCount: 0,
      };
      state.vouchers = [v, ...state.vouchers];
      audit("voucher.create", "voucher", v.id);
      save();
      return ok(v);
    }
    const adminVoucherMatch = path.match(/^\/admin\/vouchers\/([^/]+)$/);
    if (adminVoucherMatch && method === "PATCH") {
      const v = state.vouchers.find((x) => x.id === adminVoucherMatch[1]);
      if (!v) notFound();
      Object.assign(v!, body as Partial<VoucherDto>);
      if (v!.code) v!.code = v!.code.toUpperCase();
      audit("voucher.update", "voucher", v!.id);
      save();
      return ok(v);
    }
    const adminVoucherAction = path.match(/^\/admin\/vouchers\/([^/]+)\/(enable|disable)$/);
    if (adminVoucherAction && method === "POST") {
      const v = state.vouchers.find((x) => x.id === adminVoucherAction[1]);
      if (!v) notFound();
      v!.enabled = adminVoucherAction[2] === "enable";
      v!.status = v!.enabled ? "usable" : "disabled";
      audit(`voucher.${adminVoucherAction[2]}`, "voucher", v!.id);
      save();
      return ok(v);
    }

    // categories
    if (M === "GET /admin/categories") return ok({ items: state.categories });
    if (M === "POST /admin/categories") {
      const b = body as CategoryDto;
      const c: CategoryDto = { ...b, id: `c-${Date.now()}`, active: true };
      state.categories = [...state.categories, c];
      save();
      return ok(c);
    }
    const adminCatMatch = path.match(/^\/admin\/categories\/([^/]+)$/);
    if (adminCatMatch && method === "PATCH") {
      const c = state.categories.find((x) => x.id === adminCatMatch[1]);
      if (!c) notFound();
      Object.assign(c!, body as Partial<CategoryDto>);
      save();
      return ok(c);
    }

    // delivery zones
    if (M === "GET /admin/delivery-zones") return ok({ items: state.zones });
    if (M === "POST /admin/delivery-zones") {
      const b = body as DeliveryZoneDto;
      if ((b.baseDeliveryFee ?? 0) < 0) badRequest("INVALID_FEE", "Phí giao không được âm.");
      const z: DeliveryZoneDto = { ...b, id: `z-${Date.now()}`, active: true };
      state.zones = [...state.zones, z];
      save();
      return ok(z);
    }
    const adminZoneMatch = path.match(/^\/admin\/delivery-zones\/([^/]+)$/);
    if (adminZoneMatch && method === "PATCH") {
      const z = state.zones.find((x) => x.id === adminZoneMatch[1]);
      if (!z) notFound();
      const b = body as Partial<DeliveryZoneDto>;
      if (typeof b.baseDeliveryFee === "number" && b.baseDeliveryFee < 0)
        badRequest("INVALID_FEE", "Phí giao không được âm.");
      Object.assign(z!, b);
      save();
      return ok(z);
    }
  }

  notFound(`Mock API chưa hỗ trợ ${M}`);
}

export async function handleMock<T>(
  method: string,
  path: string,
  query: Record<string, unknown>,
  body: unknown,
): Promise<T> {
  await delay();
  const cleanQuery: Record<string, string> = {};
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== "") cleanQuery[k] = String(v);
  }
  return (await route({ method: method.toUpperCase(), path, query: cleanQuery, body })) as T;
}

export function isMockEnabled(): boolean {
  const v = import.meta.env.VITE_USE_MOCK_API;
  if (v === "false" || v === "0") return false;
  return true;
}

export function _resetMockState() {
  state = initialState();
  save();
}
