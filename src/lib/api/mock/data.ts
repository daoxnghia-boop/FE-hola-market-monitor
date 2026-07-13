import type {
  AddressDto,
  CategoryDto,
  DeliveryZoneDto,
  NotificationDto,
  OrderDetailDto,
  ProductDto,
  ReviewDto,
  ShopDto,
  UserDto,
  VoucherDto,
} from "../types";

export const zones: DeliveryZoneDto[] = [
  { id: "z1", name: "Khu đại học FPT", shortName: "ĐH FPT", baseDeliveryFee: 10000, active: true },
  { id: "z2", name: "KTX FPT", shortName: "KTX FPT", baseDeliveryFee: 12000, active: true },
  { id: "z3", name: "Khu văn phòng Hòa Lạc", shortName: "VP Hòa Lạc", baseDeliveryFee: 15000, active: true },
  { id: "z4", name: "Thạch Thất trung tâm", shortName: "TT Thạch Thất", baseDeliveryFee: 20000, active: true },
];

export const categories: CategoryDto[] = [
  { id: "c1", name: "Cơm", iconText: "🍚", sortOrder: 1 },
  { id: "c2", name: "Bún/Phở", iconText: "🍜", sortOrder: 2 },
  { id: "c3", name: "Bánh mì", iconText: "🥖", sortOrder: 3 },
  { id: "c4", name: "Trà sữa", iconText: "🧋", sortOrder: 4 },
  { id: "c5", name: "Ăn vặt", iconText: "🍡", sortOrder: 5 },
  { id: "c6", name: "Cà phê", iconText: "☕", sortOrder: 6 },
];

const img = (seed: string) => `https://picsum.photos/seed/${seed}/600/400`;

export const shops: ShopDto[] = [
  {
    id: "s1", slug: "com-nha-lan", name: "Cơm Nhà Lan",
    logoUrl: img("lan-logo"), coverUrl: img("lan-cover"),
    rating: 4.7, reviewCount: 128, address: "Ngõ 12, KĐT FPT",
    area: "ĐH FPT", distanceKm: 0.4, status: "open", isOpen: true,
    prepTimeMinutes: 15, estimatedDeliveryMinutes: 25,
    categoryIds: ["c1"], description: "Cơm nhà nấu, đầy đủ canh rau.",
    phone: "0912345678", openHoursText: "10:00 – 21:00",
    supportedZoneIds: ["z1", "z2", "z3"], isFavorite: false,
  },
  {
    id: "s2", slug: "bun-cha-co-ba", name: "Bún Chả Cô Ba",
    logoUrl: img("coba-logo"), coverUrl: img("coba-cover"),
    rating: 4.5, reviewCount: 86, address: "Chợ Hòa Lạc",
    area: "TT Thạch Thất", distanceKm: 1.2, status: "open", isOpen: true,
    prepTimeMinutes: 20, estimatedDeliveryMinutes: 30,
    categoryIds: ["c2"], description: "Bún chả, nem rán truyền thống.",
    phone: "0987654321", openHoursText: "09:00 – 20:00",
    supportedZoneIds: ["z1", "z3", "z4"], isFavorite: true,
  },
  {
    id: "s3", slug: "banh-mi-anh-tuan", name: "Bánh Mì Anh Tuấn",
    logoUrl: img("tuan-logo"), coverUrl: img("tuan-cover"),
    rating: 4.3, reviewCount: 42, address: "Đối diện KTX FPT",
    area: "KTX FPT", distanceKm: 0.2, status: "open", isOpen: true,
    prepTimeMinutes: 8, estimatedDeliveryMinutes: 18,
    categoryIds: ["c3"], description: "Bánh mì pate, xíu mại, chả cá.",
    phone: "0901112233", openHoursText: "06:00 – 22:00",
    supportedZoneIds: ["z1", "z2"], isFavorite: false,
  },
  {
    id: "s4", slug: "tra-sua-mimi", name: "Trà Sữa Mimi",
    logoUrl: img("mimi-logo"), coverUrl: img("mimi-cover"),
    rating: 4.6, reviewCount: 210, address: "Khu văn phòng CNC",
    area: "VP Hòa Lạc", distanceKm: 2.1, status: "open", isOpen: true,
    prepTimeMinutes: 12, estimatedDeliveryMinutes: 25,
    categoryIds: ["c4"], description: "Trà sữa trân châu, macchiato.",
    phone: "0977888999", openHoursText: "08:00 – 22:30",
    supportedZoneIds: ["z1", "z2", "z3"], isFavorite: false,
  },
  {
    id: "s5", slug: "quan-oc-hoa-lac", name: "Quán Ốc Hòa Lạc",
    logoUrl: img("oc-logo"), coverUrl: img("oc-cover"),
    rating: 4.2, reviewCount: 65, address: "Đường 21, Hòa Lạc",
    area: "TT Thạch Thất", distanceKm: 3.4, status: "break", isOpen: false,
    prepTimeMinutes: 25, estimatedDeliveryMinutes: 40,
    categoryIds: ["c5"], description: "Ốc luộc, ốc xào me, nem chua rán.",
    phone: "0966555444", openHoursText: "16:00 – 23:00",
    supportedZoneIds: ["z3", "z4"], isFavorite: false,
  },
  {
    id: "s6", slug: "cafe-highland-fpt", name: "Cafe Sáng FPT",
    logoUrl: img("cf-logo"), coverUrl: img("cf-cover"),
    rating: 4.4, reviewCount: 33, address: "Sảnh Alpha, ĐH FPT",
    area: "ĐH FPT", distanceKm: 0.1, status: "open", isOpen: true,
    prepTimeMinutes: 6, estimatedDeliveryMinutes: 15,
    categoryIds: ["c6"], description: "Cà phê take-away, bạc xỉu, latte.",
    phone: "0933222111", openHoursText: "07:00 – 21:00",
    supportedZoneIds: ["z1", "z2"], isFavorite: false,
  },
];

const P = (
  id: string, shopId: string, name: string, price: number, categoryId: string,
  soldCount: number, description = "", rating = 4.5,
): ProductDto => ({
  id, shopId, name, price, categoryId, description: description || name,
  imageUrl: img(`p-${id}`), available: true, prepTimeMinutes: 10,
  rating, reviewCount: Math.floor(soldCount / 3), soldCount,
});

export const products: ProductDto[] = [
  P("p1", "s1", "Cơm sườn nướng", 35000, "c1", 240, "Sườn nướng mật ong, canh rau"),
  P("p2", "s1", "Cơm gà rán", 40000, "c1", 180, "Gà rán giòn, salad"),
  P("p3", "s1", "Cơm bò xào", 42000, "c1", 120),
  P("p4", "s2", "Bún chả Hà Nội", 45000, "c2", 300, "Chả nướng than hoa"),
  P("p5", "s2", "Nem rán (5 cái)", 25000, "c5", 150),
  P("p6", "s2", "Bún nem", 40000, "c2", 90),
  P("p7", "s3", "Bánh mì pate", 20000, "c3", 500, "Pate, chả, dưa chuột"),
  P("p8", "s3", "Bánh mì xíu mại", 22000, "c3", 220),
  P("p9", "s3", "Bánh mì trứng", 18000, "c3", 340),
  P("p10", "s4", "Trà sữa trân châu", 30000, "c4", 420),
  P("p11", "s4", "Matcha latte", 35000, "c4", 180),
  P("p12", "s4", "Hồng trà đào", 32000, "c4", 210),
  P("p13", "s5", "Ốc hương xào bơ tỏi", 85000, "c5", 60),
  P("p14", "s5", "Ốc luộc sả ớt", 55000, "c5", 45),
  P("p15", "s6", "Cà phê sữa đá", 22000, "c6", 380),
  P("p16", "s6", "Bạc xỉu", 25000, "c6", 260),
  P("p17", "s6", "Latte nóng", 30000, "c6", 90),
];

export const vouchers: VoucherDto[] = [
  {
    id: "v1", code: "HOLA10", title: "Giảm 10K cho đơn từ 50K",
    description: "Áp dụng cho tất cả quán quanh Hòa Lạc.",
    discountType: "fixed", discountValue: 10000, minOrderAmount: 50000,
    expiresAt: new Date(Date.now() + 7 * 86400e3).toISOString(), status: "usable",
  },
  {
    id: "v2", code: "FREESHIP", title: "Miễn phí ship",
    description: "Giảm tối đa 15K phí vận chuyển.",
    discountType: "fixed", discountValue: 15000, maxDiscount: 15000, minOrderAmount: 30000,
    expiresAt: new Date(Date.now() + 3 * 86400e3).toISOString(), status: "soon_expire",
  },
  {
    id: "v3", code: "SINHVIEN20", title: "Sinh viên FPT giảm 20%",
    description: "Đơn tối đa 50K, chỉ cho khu ĐH FPT.",
    discountType: "percent", discountValue: 20, maxDiscount: 50000, minOrderAmount: 60000,
    expiresAt: new Date(Date.now() + 14 * 86400e3).toISOString(), status: "usable",
  },
  {
    id: "v4", code: "TRASUA15", title: "Giảm 15K cho trà sữa",
    description: "Chỉ áp dụng cho quán trà sữa.",
    discountType: "fixed", discountValue: 15000, minOrderAmount: 40000,
    expiresAt: new Date(Date.now() + 10 * 86400e3).toISOString(), status: "not_eligible",
    ineligibleReason: "Chưa đủ điều kiện đơn tối thiểu.",
  },
];

export const defaultUser: UserDto = {
  id: "u1", fullName: "Bạn HoLa", phone: "0900000000",
  email: "hola@example.com", defaultDeliveryZoneId: "z1",
};

export const defaultAddresses: AddressDto[] = [
  {
    id: "a1", label: "KTX", recipientName: "Bạn HoLa", phone: "0900000000",
    deliveryZoneId: "z2", addressLine: "Phòng 302, KTX FPT", isDefault: true,
  },
  {
    id: "a2", label: "Văn phòng", recipientName: "Bạn HoLa", phone: "0900000000",
    deliveryZoneId: "z3", addressLine: "Tòa CNC, Hòa Lạc", isDefault: false,
  },
];

export const seedNotifications: NotificationDto[] = [
  {
    id: "n1", type: "voucher", title: "Voucher mới HOLA10",
    body: "Nhập mã HOLA10 để giảm 10K cho đơn từ 50K.",
    createdAt: new Date(Date.now() - 3600e3).toISOString(), readAt: null,
    target: { type: "voucher", id: "v1" },
  },
  {
    id: "n2", type: "shop", title: "Quán mới: Cafe Sáng FPT",
    body: "Cafe Sáng FPT vừa lên HoLa Market.",
    createdAt: new Date(Date.now() - 2 * 3600e3).toISOString(), readAt: null,
    target: { type: "shop", id: "s6" },
  },
];

export const seedReviews: ReviewDto[] = [
  {
    id: "r1", orderId: "o-seed", shopId: "s1",
    user: { id: "u2", displayName: "Minh Anh" },
    rating: 5, comment: "Cơm ngon, giao nhanh.",
    createdAt: new Date(Date.now() - 5 * 86400e3).toISOString(),
  },
  {
    id: "r2", orderId: "o-seed2", shopId: "s2",
    user: { id: "u3", displayName: "Quang" },
    rating: 4, comment: "Bún chả ổn, nước chấm hơi ngọt.",
    createdAt: new Date(Date.now() - 2 * 86400e3).toISOString(),
  },
];

export const seedOrders: OrderDetailDto[] = [
  {
    id: "o1", displayCode: "HL2607-001", shopId: "s1", shopName: "Cơm Nhà Lan",
    shopLogoUrl: shops[0].logoUrl, status: "dang_giao",
    itemSummary: "2× Cơm sườn nướng", itemCount: 2, total: 80000,
    placedAt: new Date(Date.now() - 30 * 60e3).toISOString(),
    canCancel: false, canReview: false, canReorder: true,
    shopPhone: "0912345678", shopAddress: "Ngõ 12, KĐT FPT",
    items: [
      { productId: "p1", productName: "Cơm sườn nướng", productImageUrl: img("p-p1"),
        quantity: 2, unitPrice: 35000, lineTotal: 70000 },
    ],
    pricing: { subtotal: 70000, discount: 0, deliveryFee: 10000, total: 80000 },
    paymentMethod: "cash_on_delivery", paymentStatus: "unpaid",
    delivery: {
      zoneId: "z1", zoneName: "Khu đại học FPT", recipientName: "Bạn HoLa",
      phone: "0900000000", addressLine: "Phòng 302, KTX FPT", etaMinutes: 15,
    },
    statusHistory: [
      { status: "cho_quan_xac_nhan", occurredAt: new Date(Date.now() - 30 * 60e3).toISOString() },
      { status: "quan_da_xac_nhan", occurredAt: new Date(Date.now() - 25 * 60e3).toISOString() },
      { status: "dang_chuan_bi", occurredAt: new Date(Date.now() - 20 * 60e3).toISOString() },
      { status: "dang_giao", occurredAt: new Date(Date.now() - 10 * 60e3).toISOString() },
    ],
  },
  {
    id: "o2", displayCode: "HL2506-018", shopId: "s3", shopName: "Bánh Mì Anh Tuấn",
    shopLogoUrl: shops[2].logoUrl, status: "hoan_thanh",
    itemSummary: "3× Bánh mì pate", itemCount: 3, total: 70000,
    placedAt: new Date(Date.now() - 2 * 86400e3).toISOString(),
    canCancel: false, canReview: true, canReorder: true,
    shopPhone: "0901112233", shopAddress: "Đối diện KTX FPT",
    items: [
      { productId: "p7", productName: "Bánh mì pate", productImageUrl: img("p-p7"),
        quantity: 3, unitPrice: 20000, lineTotal: 60000 },
    ],
    pricing: { subtotal: 60000, discount: 0, deliveryFee: 10000, total: 70000 },
    paymentMethod: "cash_on_delivery", paymentStatus: "paid",
    delivery: {
      zoneId: "z2", zoneName: "KTX FPT", recipientName: "Bạn HoLa",
      phone: "0900000000", addressLine: "Phòng 302, KTX FPT",
    },
    statusHistory: [
      { status: "cho_quan_xac_nhan", occurredAt: new Date(Date.now() - 2 * 86400e3).toISOString() },
      { status: "hoan_thanh", occurredAt: new Date(Date.now() - 2 * 86400e3 + 40 * 60e3).toISOString() },
    ],
  },
];
