export type Paginated<T> = { items: T[]; nextCursor?: string | null };

export type UserRole = "customer" | "shop_owner" | "admin";
export type UserStatus = "active" | "blocked";

export type CategoryDto = {
  id: string;
  name: string;
  iconUrl?: string;
  iconText?: string;
  sortOrder: number;
  active?: boolean;
};

export type DeliveryZoneDto = {
  id: string;
  name: string;
  shortName: string;
  baseDeliveryFee: number;
  active: boolean;
};

export type ShopStatus = "open" | "break" | "out_of_menu" | "closed";
export type ShopApprovalStatus = "pending" | "approved" | "rejected" | "draft";
export type ShopOperationStatus = "active" | "suspended" | "paused";

export type ShopDto = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string;
  coverUrl: string;
  rating: number;
  reviewCount: number;
  address: string;
  area: string;
  distanceKm: number | null;
  status: ShopStatus;
  isOpen: boolean;
  prepTimeMinutes: number;
  estimatedDeliveryMinutes?: number;
  categoryIds: string[];
  description: string;
  phone: string;
  openHoursText: string;
  supportedZoneIds: string[];
  isFavorite: boolean;
  delivery?: { supported: boolean; fee: number | null };
  // admin / ownership fields
  ownerId?: string;
  approvalStatus?: ShopApprovalStatus;
  operationStatus?: ShopOperationStatus;
  ownerName?: string;
  ownerPhone?: string;
  createdAt?: string;
  orderCount?: number;
  rejectionReason?: string;
  submittedAt?: string;
};

export type ShopRegistrationInput = {
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
  acceptedTerms: boolean;
};


export type ProductDto = {
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

export type VoucherStatus =
  "usable" | "soon_expire" | "used" | "expired" | "locked" | "not_eligible" | "disabled";

export type VoucherDto = {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: "fixed" | "percent";
  discountValue: number;
  maxDiscount?: number;
  minOrderAmount: number;
  expiresAt: string;
  startsAt?: string;
  status: VoucherStatus;
  ineligibleReason?: string;
  usageLimit?: number;
  perUserLimit?: number;
  usedCount?: number;
  applicableShopIds?: string[];
  applicableZoneIds?: string[];
  enabled?: boolean;
};

export type UserDto = {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  defaultAddressId?: string;
  defaultDeliveryZoneId?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
};

export type AddressDto = {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  deliveryZoneId: string;
  addressLine: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
};

export type CartItemDto = {
  id: string;
  productId: string;
  quantity: number;
  note?: string;
  unitPrice: number;
  lineTotal: number;
  product: ProductDto;
};

export type CartDto = {
  id: string;
  shop: ShopDto | null;
  items: CartItemDto[];
  deliveryZone: DeliveryZoneDto | null;
  voucher: VoucherDto | null;
  pricing: { subtotal: number; discount: number; deliveryFee: number; total: number };
  canCheckout: boolean;
  blockingReasons: string[];
  updatedAt: string;
};

export type OrderStatus =
  | "da_dat"
  | "cho_quan_xac_nhan"
  | "quan_da_xac_nhan"
  | "dang_chuan_bi"
  | "dang_giao"
  | "hoan_thanh"
  | "da_huy";

export type OrderItemDto = {
  productId: string;
  productName: string;
  productImageUrl: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  note?: string;
};

export type OrderSummaryDto = {
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
  customerName?: string;
  customerPhone?: string;
};

export type ReviewDto = {
  id: string;
  orderId: string;
  shopId: string;
  user: { id: string; displayName: string; avatarUrl?: string };
  rating: number;
  comment?: string;
  createdAt: string;
};

export type OrderDetailDto = OrderSummaryDto & {
  shopPhone: string;
  shopAddress: string;
  items: OrderItemDto[];
  pricing: { subtotal: number; discount: number; deliveryFee: number; total: number };
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
  statusHistory: Array<{ status: OrderStatus; occurredAt: string; note?: string }>;
  cancellation?: { reason?: string; canceledAt: string; canceledBy: string };
  review?: ReviewDto;
  customerId?: string;
};

export type NotificationType = "order" | "voucher" | "shop" | "system";

export type NotificationDto = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  target?: { type: "order" | "voucher" | "shop" | "url"; id?: string; url?: string };
  userId?: string;
};

export type SessionDto = { authenticated: boolean; user: UserDto | null };
export type NotificationPageDto = Paginated<NotificationDto> & { unreadCount: number };
export type SearchDto = {
  shops: { items: ShopDto[]; total: number };
  products: { items: ProductDto[]; total: number };
  nextCursor?: string | null;
};

// Auth DTOs
export type OtpChallengeDto = {
  challengeId: string;
  expiresInSeconds: number;
  developmentOtp?: string;
  requiresRegistration?: boolean;
};

export type VerifyOtpResultDto = {
  status: "authenticated" | "requires_registration";
  session?: SessionDto;
  phone?: string;
};

export type RegisterInput = {
  fullName: string;
  phone: string;
  email?: string;
  acceptedTerms: boolean;
};

// Admin DTOs
export type AdminAuditDto = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  adminUserId: string;
  adminName: string;
  reason?: string;
  createdAt: string;
};

export type AdminStatsDto = {
  totalCustomers: number;
  activeShops: number;
  pendingShops: number;
  ordersToday: number;
  revenueToday: number;
  cancelledToday: number;
  ordersByStatus: Array<{ status: OrderStatus; count: number }>;
  trend7d: Array<{ date: string; orders: number; revenue: number }>;
  latestOrders: OrderSummaryDto[];
  pendingApprovalShops: ShopDto[];
};

export type AdminUserSummaryDto = UserDto & {
  orderCount: number;
  totalSpending: number;
};
