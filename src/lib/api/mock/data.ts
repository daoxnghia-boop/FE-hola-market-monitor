import type {
  AddressDto,
  CategoryDto,
  DeliveryZoneDto,
  NotificationDto,
  OrderDetailDto,
  ProductDto,
  ProductReviewDto,
  ReviewDto,
  ShopDto,
  UserDto,
  VoucherDto,
} from "../types";

const nowIso = () => new Date().toISOString();
const daysAgo = (d: number) => new Date(Date.now() - d * 86400e3).toISOString();

export const zones: DeliveryZoneDto[] = [
  { id: "z1", name: "Khu đại học FPT", shortName: "ĐH FPT", baseDeliveryFee: 10000, active: true },
  { id: "z2", name: "KTX FPT", shortName: "KTX FPT", baseDeliveryFee: 12000, active: true },
  {
    id: "z3",
    name: "Khu văn phòng Hòa Lạc",
    shortName: "VP Hòa Lạc",
    baseDeliveryFee: 15000,
    active: true,
  },
  {
    id: "z4",
    name: "Thạch Thất trung tâm",
    shortName: "TT Thạch Thất",
    baseDeliveryFee: 20000,
    active: true,
  },
];

export const categories: CategoryDto[] = [
  { id: "c1", name: "Cơm", iconText: "🍚", sortOrder: 1, active: true },
  { id: "c2", name: "Bún/Phở", iconText: "🍜", sortOrder: 2, active: true },
  { id: "c3", name: "Bánh mì", iconText: "🥖", sortOrder: 3, active: true },
  { id: "c4", name: "Trà sữa", iconText: "🧋", sortOrder: 4, active: true },
  { id: "c5", name: "Ăn vặt", iconText: "🍡", sortOrder: 5, active: true },
  { id: "c6", name: "Cà phê", iconText: "☕", sortOrder: 6, active: true },
];

const img = (seed: string) => `https://picsum.photos/seed/${seed}/600/400`;

// Curated stable food-photo URLs (Unsplash) per product id. If a product id
// is missing here, we fall back to the picsum seed so the page still renders.
const PRODUCT_IMAGES: Record<string, string> = {
  p1: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=70", // com suon
  p2: "https://images.unsplash.com/photo-1626082927389-6cd097cee6a6?auto=format&fit=crop&w=800&q=70", // com ga
  p3: "https://images.unsplash.com/photo-1512003867696-6d5ce6835040?auto=format&fit=crop&w=800&q=70", // com bo
  p4: "https://images.unsplash.com/photo-1583224964978-2359dc37e19e?auto=format&fit=crop&w=800&q=70", // bun cha
  p5: "https://images.unsplash.com/photo-1625944228737-91e69cc93a92?auto=format&fit=crop&w=800&q=70", // nem ran
  p6: "https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=70", // bun nem
  p7: "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=800&q=70", // banh mi
  p8: "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=70", // banh mi xiu mai
  p9: "https://images.unsplash.com/photo-1603046891744-76a5e7dfd4cf?auto=format&fit=crop&w=800&q=70", // banh mi trung
  p10: "https://images.unsplash.com/photo-1558857563-b371033873b5?auto=format&fit=crop&w=800&q=70", // tra sua
  p11: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=800&q=70", // matcha
  p12: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=70", // hong tra dao
  p13: "https://images.unsplash.com/photo-1626804475297-41608ea09aeb?auto=format&fit=crop&w=800&q=70", // oc xao
  p14: "https://images.unsplash.com/photo-1625944228742-30da8b40e30e?auto=format&fit=crop&w=800&q=70", // oc luoc
  p15: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=70", // ca phe sua da
  p16: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=70", // bac xiu
  p17: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=70", // latte
};

export const productImage = (productId: string): string =>
  PRODUCT_IMAGES[productId] ?? img(`food-${productId}`);

export const shops: ShopDto[] = [
  {
    id: "s1",
    slug: "com-nha-lan",
    name: "Cơm Nhà Lan",
    logoUrl: img("lan-logo"),
    coverUrl: img("lan-cover"),
    rating: 4.7,
    reviewCount: 128,
    address: "Ngõ 12, KĐT FPT",
    area: "ĐH FPT",
    distanceKm: 0.4,
    status: "open",
    isOpen: true,
    prepTimeMinutes: 15,
    estimatedDeliveryMinutes: 25,
    categoryIds: ["c1"],
    description: "Cơm nhà nấu, đầy đủ canh rau.",
    phone: "0912345678",
    openHoursText: "10:00 – 21:00",
    supportedZoneIds: ["z1", "z2", "z3"],
    deliveryFees: { z1: 8000, z2: 12000, z3: 18000 },

    isFavorite: false,
    approvalStatus: "approved",
    operationStatus: "active",
    ownerId: "u-owner",
    ownerName: "Nguyễn Văn Lâm",
    ownerPhone: "0908888888",
    createdAt: daysAgo(120),
    orderCount: 340,
  },
  {
    id: "s2",
    slug: "bun-cha-co-ba",
    name: "Bún Chả Cô Ba",
    logoUrl: img("coba-logo"),
    coverUrl: img("coba-cover"),
    rating: 4.5,
    reviewCount: 86,
    address: "Chợ Hòa Lạc",
    area: "TT Thạch Thất",
    distanceKm: 1.2,
    status: "open",
    isOpen: true,
    prepTimeMinutes: 20,
    estimatedDeliveryMinutes: 30,
    categoryIds: ["c2"],
    description: "Bún chả, nem rán truyền thống.",
    phone: "0987654321",
    openHoursText: "09:00 – 20:00",
    supportedZoneIds: ["z1", "z3", "z4"],
    deliveryFees: { z1: 15000, z3: 12000, z4: 15000 },

    isFavorite: true,
    approvalStatus: "approved",
    operationStatus: "active",
    ownerName: "Cô Ba",
    ownerPhone: "0987654321",
    createdAt: daysAgo(90),
    orderCount: 210,
  },
  {
    id: "s3",
    slug: "banh-mi-anh-tuan",
    name: "Bánh Mì Anh Tuấn",
    logoUrl: img("tuan-logo"),
    coverUrl: img("tuan-cover"),
    rating: 4.3,
    reviewCount: 42,
    address: "Đối diện KTX FPT",
    area: "KTX FPT",
    distanceKm: 0.2,
    status: "open",
    isOpen: true,
    prepTimeMinutes: 8,
    estimatedDeliveryMinutes: 18,
    categoryIds: ["c3"],
    description: "Bánh mì pate, xíu mại, chả cá.",
    phone: "0901112233",
    openHoursText: "06:00 – 22:00",
    supportedZoneIds: ["z1", "z2"],
    deliveryFees: { z1: 10000, z2: 8000 },

    isFavorite: false,
    approvalStatus: "approved",
    operationStatus: "active",
    ownerName: "Anh Tuấn",
    ownerPhone: "0901112233",
    createdAt: daysAgo(60),
    orderCount: 500,
  },
  {
    id: "s4",
    slug: "tra-sua-mimi",
    name: "Trà Sữa Mimi",
    logoUrl: img("mimi-logo"),
    coverUrl: img("mimi-cover"),
    rating: 4.6,
    reviewCount: 210,
    address: "Khu văn phòng CNC",
    area: "VP Hòa Lạc",
    distanceKm: 2.1,
    status: "open",
    isOpen: true,
    prepTimeMinutes: 12,
    estimatedDeliveryMinutes: 25,
    categoryIds: ["c4"],
    description: "Trà sữa trân châu, macchiato.",
    phone: "0977888999",
    openHoursText: "08:00 – 22:30",
    supportedZoneIds: ["z1", "z2", "z3"],
    deliveryFees: { z1: 12000, z2: 14000, z3: 10000 },

    isFavorite: false,
    approvalStatus: "approved",
    operationStatus: "active",
    ownerName: "Chị Mi",
    ownerPhone: "0977888999",
    createdAt: daysAgo(45),
    orderCount: 620,
  },
  {
    id: "s5",
    slug: "quan-oc-hoa-lac",
    name: "Quán Ốc Hòa Lạc",
    logoUrl: img("oc-logo"),
    coverUrl: img("oc-cover"),
    rating: 4.2,
    reviewCount: 65,
    address: "Đường 21, Hòa Lạc",
    area: "TT Thạch Thất",
    distanceKm: 3.4,
    status: "break",
    isOpen: false,
    prepTimeMinutes: 25,
    estimatedDeliveryMinutes: 40,
    categoryIds: ["c5"],
    description: "Ốc luộc, ốc xào me, nem chua rán.",
    phone: "0966555444",
    openHoursText: "16:00 – 23:00",
    supportedZoneIds: ["z3", "z4"],
    isFavorite: false,
    approvalStatus: "approved",
    operationStatus: "suspended",
    ownerName: "Chú Tư",
    ownerPhone: "0966555444",
    createdAt: daysAgo(30),
    orderCount: 80,
  },
  {
    id: "s6",
    slug: "cafe-highland-fpt",
    name: "Cafe Sáng FPT",
    logoUrl: img("cf-logo"),
    coverUrl: img("cf-cover"),
    rating: 4.4,
    reviewCount: 33,
    address: "Sảnh Alpha, ĐH FPT",
    area: "ĐH FPT",
    distanceKm: 0.1,
    status: "open",
    isOpen: true,
    prepTimeMinutes: 6,
    estimatedDeliveryMinutes: 15,
    categoryIds: ["c6"],
    description: "Cà phê take-away, bạc xỉu, latte.",
    phone: "0933222111",
    openHoursText: "07:00 – 21:00",
    supportedZoneIds: ["z1", "z2"],
    deliveryFees: { z1: 8000, z2: 10000 },

    isFavorite: false,
    approvalStatus: "approved",
    operationStatus: "active",
    ownerName: "Anh Hoàng",
    ownerPhone: "0933222111",
    createdAt: daysAgo(20),
    orderCount: 140,
  },
  {
    id: "s7",
    slug: "com-tam-sai-gon",
    name: "Cơm Tấm Sài Gòn",
    logoUrl: img("ct-logo"),
    coverUrl: img("ct-cover"),
    rating: 0,
    reviewCount: 0,
    address: "Ngã 3 Hòa Lạc",
    area: "TT Thạch Thất",
    distanceKm: 2.8,
    status: "closed",
    isOpen: false,
    prepTimeMinutes: 15,
    estimatedDeliveryMinutes: 30,
    categoryIds: ["c1"],
    description: "Cơm tấm sườn bì chả (đang chờ duyệt).",
    phone: "0944333222",
    openHoursText: "10:00 – 21:00",
    supportedZoneIds: ["z3", "z4"],
    isFavorite: false,
    approvalStatus: "pending",
    operationStatus: "active",
    ownerId: "u-owner",
    ownerName: "Nguyễn Văn Lâm",
    ownerPhone: "0908888888",
    createdAt: daysAgo(3),
    submittedAt: daysAgo(3),
    orderCount: 0,
  },
  {
    id: "s8",
    slug: "pho-bo-hn",
    name: "Phở Bò Hà Nội",
    logoUrl: img("pho-logo"),
    coverUrl: img("pho-cover"),
    rating: 0,
    reviewCount: 0,
    address: "Khu 3, Hòa Lạc",
    area: "VP Hòa Lạc",
    distanceKm: 2.5,
    status: "closed",
    isOpen: false,
    prepTimeMinutes: 12,
    estimatedDeliveryMinutes: 25,
    categoryIds: ["c2"],
    description: "Phở bò truyền thống HN.",
    phone: "0922111000",
    openHoursText: "06:00 – 14:00",
    supportedZoneIds: ["z1", "z3"],
    isFavorite: false,
    approvalStatus: "rejected",
    operationStatus: "active",
    ownerId: "u-owner",
    ownerName: "Nguyễn Văn Lâm",
    ownerPhone: "0908888888",
    createdAt: daysAgo(10),
    submittedAt: daysAgo(10),
    orderCount: 0,
    rejectionReason: "Ảnh cover không rõ, cần bổ sung giấy phép ATVSTP.",
  },
];

const P = (
  id: string,
  shopId: string,
  name: string,
  price: number,
  categoryId: string,
  soldCount: number,
  description = "",
  rating = 4.5,
): ProductDto => ({
  id,
  shopId,
  name,
  price,
  categoryId,
  description: description || name,
  imageUrl: productImage(id),
  available: true,
  prepTimeMinutes: 10,
  rating,
  reviewCount: Math.floor(soldCount / 3),
  soldCount,
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
    id: "v1",
    code: "HOLA10",
    title: "Giảm 10K cho đơn từ 50K",
    description: "Áp dụng cho tất cả quán quanh Hòa Lạc.",
    discountType: "fixed",
    discountValue: 10000,
    minOrderAmount: 50000,
    expiresAt: new Date(Date.now() + 7 * 86400e3).toISOString(),
    status: "usable",
    startsAt: daysAgo(2),
    usageLimit: 1000,
    perUserLimit: 5,
    usedCount: 42,
    enabled: true,
  },
  {
    id: "v2",
    code: "FREESHIP",
    title: "Miễn phí ship",
    description: "Giảm tối đa 15K phí vận chuyển.",
    discountType: "fixed",
    discountValue: 15000,
    maxDiscount: 15000,
    minOrderAmount: 30000,
    expiresAt: new Date(Date.now() + 3 * 86400e3).toISOString(),
    status: "soon_expire",
    startsAt: daysAgo(10),
    usageLimit: 500,
    perUserLimit: 3,
    usedCount: 210,
    enabled: true,
  },
  {
    id: "v3",
    code: "SINHVIEN20",
    title: "Sinh viên FPT giảm 20%",
    description: "Đơn tối đa 50K, chỉ cho khu ĐH FPT.",
    discountType: "percent",
    discountValue: 20,
    maxDiscount: 50000,
    minOrderAmount: 60000,
    expiresAt: new Date(Date.now() + 14 * 86400e3).toISOString(),
    status: "usable",
    applicableZoneIds: ["z1", "z2"],
    usedCount: 65,
    enabled: true,
  },
  {
    id: "v4",
    code: "TRASUA15",
    title: "Giảm 15K cho trà sữa",
    description: "Chỉ áp dụng cho quán trà sữa.",
    discountType: "fixed",
    discountValue: 15000,
    minOrderAmount: 40000,
    expiresAt: new Date(Date.now() + 10 * 86400e3).toISOString(),
    status: "not_eligible",
    ineligibleReason: "Chưa đủ điều kiện đơn tối thiểu.",
    applicableShopIds: ["s4"],
    usedCount: 12,
    enabled: true,
  },
  {
    id: "v5",
    code: "CHAOMUNG",
    title: "Chào mừng khách mới 20K",
    description: "Áp dụng đơn đầu tiên.",
    discountType: "fixed",
    discountValue: 20000,
    minOrderAmount: 40000,
    expiresAt: new Date(Date.now() + 30 * 86400e3).toISOString(),
    status: "usable",
    usedCount: 0,
    enabled: true,
  },
  {
    id: "v6",
    code: "HETHAN",
    title: "Voucher đã hết hạn",
    description: "Voucher demo trạng thái hết hạn.",
    discountType: "fixed",
    discountValue: 5000,
    minOrderAmount: 20000,
    expiresAt: daysAgo(1),
    status: "expired",
    enabled: true,
  },
];

// Seeded accounts
export const seedCustomerUser: UserDto = {
  id: "u1",
  fullName: "Nguyễn Hoàng Minh",
  phone: "0900000000",
  email: "minh@example.com",
  defaultDeliveryZoneId: "z1",
  role: "customer",
  status: "active",
  createdAt: daysAgo(60),
};

export const seedAdminUser: UserDto = {
  id: "u-admin",
  fullName: "HoLa Market Admin",
  phone: "0909999999",
  email: "admin@holamarket.vn",
  role: "admin",
  status: "active",
  createdAt: daysAgo(200),
};

export const seedBlockedUser: UserDto = {
  id: "u-blocked",
  fullName: "Tài khoản bị khóa",
  phone: "0901111111",
  role: "customer",
  status: "blocked",
  createdAt: daysAgo(40),
};

export const seedShopOwnerUser: UserDto = {
  id: "u-owner",
  fullName: "Nguyễn Văn Lâm",
  phone: "0908888888",
  email: "lam@holamarket.vn",
  role: "shop_owner",
  status: "active",
  createdAt: daysAgo(130),
};

// Additional mock customers
const extraCustomers: UserDto[] = [
  ["u2", "Trần Thu Hà", "0912000001"],
  ["u3", "Lê Quang Vinh", "0912000002"],
  ["u4", "Phạm Ngọc Anh", "0912000003"],
  ["u5", "Đỗ Minh Tuấn", "0912000004"],
  ["u6", "Vũ Thị Mai", "0912000005"],
  ["u7", "Hoàng Bảo Nam", "0912000006"],
  ["u8", "Ngô Phương Linh", "0912000007"],
  ["u9", "Bùi Đức Hùng", "0912000008"],
  ["u10", "Đặng Ngọc Trâm", "0912000009"],
  ["u11", "Lý Hoài Sơn", "0912000010"],
  ["u12", "Trịnh Thu Uyên", "0912000011"],
  ["u13", "Cao Xuân Trường", "0912000012"],
  ["u14", "Dương Ánh Nguyệt", "0912000013"],
  ["u15", "Chu Đình Khang", "0912000014"],
].map(([id, fullName, phone], i) => ({
  id: id as string,
  fullName: fullName as string,
  phone: phone as string,
  role: "customer" as const,
  status: "active" as const,
  createdAt: daysAgo(50 - i * 2),
}));

export const seedUsers: UserDto[] = [
  seedCustomerUser,
  seedAdminUser,
  seedBlockedUser,
  seedShopOwnerUser,
  ...extraCustomers,
];

export const defaultUser = seedCustomerUser;

export const defaultAddresses: AddressDto[] = [
  {
    id: "a1",
    label: "KTX",
    recipientName: "Nguyễn Hoàng Minh",
    phone: "0900000000",
    deliveryZoneId: "z2",
    addressLine: "Phòng 302, KTX FPT",
    isDefault: true,
  },
  {
    id: "a2",
    label: "Văn phòng",
    recipientName: "Nguyễn Hoàng Minh",
    phone: "0900000000",
    deliveryZoneId: "z3",
    addressLine: "Tòa CNC, Hòa Lạc",
    isDefault: false,
  },
];

export const seedNotifications: NotificationDto[] = [
  {
    id: "n1",
    type: "voucher",
    title: "Voucher mới HOLA10",
    body: "Nhập mã HOLA10 để giảm 10K cho đơn từ 50K.",
    createdAt: new Date(Date.now() - 3600e3).toISOString(),
    readAt: null,
    target: { type: "voucher", id: "v1" },
    userId: "u1",
  },
  {
    id: "n2",
    type: "shop",
    title: "Quán mới: Cafe Sáng FPT",
    body: "Cafe Sáng FPT vừa lên HoLa Market.",
    createdAt: new Date(Date.now() - 2 * 3600e3).toISOString(),
    readAt: null,
    target: { type: "shop", id: "s6" },
    userId: "u1",
  },
];

export const seedReviews: ReviewDto[] = [
  {
    id: "r1",
    orderId: "o-seed",
    shopId: "s1",
    user: { id: "u2", displayName: "Minh Anh" },
    rating: 5,
    comment: "Cơm ngon, giao nhanh.",
    createdAt: daysAgo(5),
  },
  {
    id: "r2",
    orderId: "o-seed2",
    shopId: "s2",
    user: { id: "u3", displayName: "Quang" },
    rating: 4,
    comment: "Bún chả ổn, nước chấm hơi ngọt.",
    createdAt: daysAgo(2),
  },
];

// Build many mock orders for admin
const buildOrder = (
  i: number,
  shopIdx: number,
  custIdx: number,
  status: OrderDetailDto["status"],
  daysAgoN: number,
  prodIds: string[],
  qtys: number[],
): OrderDetailDto => {
  const shop = shops[shopIdx];
  const customer = extraCustomers[custIdx % extraCustomers.length] ?? seedCustomerUser;
  const items = prodIds.map((pid, k) => {
    const p = products.find((x) => x.id === pid)!;
    const q = qtys[k];
    return {
      productId: p.id,
      productName: p.name,
      productImageUrl: p.imageUrl,
      quantity: q,
      unitPrice: p.price,
      lineTotal: p.price * q,
    };
  });
  const subtotal = items.reduce((n, it) => n + it.lineTotal, 0);
  const deliveryFee = 15000;
  const total = subtotal + deliveryFee;
  const placedAt = new Date(Date.now() - daysAgoN * 86400e3 - i * 3600e3).toISOString();
  const id = `o-seed-${i}`;
  return {
    id,
    displayCode: `HL${(1000 + i).toString()}`,
    shopId: shop.id,
    shopName: shop.name,
    shopLogoUrl: shop.logoUrl,
    status,
    itemSummary: items.map((it) => `${it.quantity}× ${it.productName}`).join(", "),
    itemCount: items.reduce((n, it) => n + it.quantity, 0),
    total,
    placedAt,
    canCancel: status === "cho_quan_xac_nhan" || status === "quan_da_xac_nhan",
    canReview: status === "hoan_thanh",
    canReorder: true,
    customerId: customer.id,
    customerName: customer.fullName,
    customerPhone: customer.phone,
    shopPhone: shop.phone,
    shopAddress: shop.address,
    items,
    pricing: { subtotal, discount: 0, deliveryFee, total },
    paymentMethod: "cash_on_delivery",
    paymentStatus: status === "hoan_thanh" ? "paid" : "unpaid",
    delivery: {
      zoneId: "z1",
      zoneName: "Khu đại học FPT",
      recipientName: customer.fullName,
      phone: customer.phone,
      addressLine: "Phòng 302, KTX FPT",
    },
    statusHistory: [
      { status: "cho_quan_xac_nhan", occurredAt: placedAt },
      { status, occurredAt: placedAt },
    ],
  };
};

export const seedOrders: OrderDetailDto[] = [
  buildOrder(1, 0, 0, "dang_giao", 0, ["p1"], [2]),
  buildOrder(2, 2, 1, "hoan_thanh", 0, ["p7"], [3]),
  buildOrder(3, 1, 2, "cho_quan_xac_nhan", 0, ["p4"], [1]),
  buildOrder(4, 3, 3, "hoan_thanh", 0, ["p10", "p11"], [2, 1]),
  buildOrder(5, 0, 4, "dang_chuan_bi", 0, ["p2"], [1]),
  buildOrder(6, 5, 5, "hoan_thanh", 1, ["p15"], [2]),
  buildOrder(7, 2, 6, "hoan_thanh", 1, ["p8"], [2]),
  buildOrder(8, 1, 7, "da_huy", 1, ["p4"], [1]),
  buildOrder(9, 3, 8, "hoan_thanh", 2, ["p10"], [3]),
  buildOrder(10, 0, 9, "hoan_thanh", 2, ["p1", "p3"], [1, 1]),
  buildOrder(11, 2, 10, "hoan_thanh", 3, ["p9"], [4]),
  buildOrder(12, 5, 11, "hoan_thanh", 3, ["p16"], [2]),
  buildOrder(13, 1, 12, "hoan_thanh", 4, ["p6"], [1]),
  buildOrder(14, 3, 0, "hoan_thanh", 4, ["p12"], [2]),
  buildOrder(15, 0, 1, "da_huy", 5, ["p2"], [1]),
  buildOrder(16, 2, 2, "hoan_thanh", 5, ["p7"], [2]),
  buildOrder(17, 3, 3, "hoan_thanh", 5, ["p10"], [1]),
  buildOrder(18, 5, 4, "hoan_thanh", 6, ["p15", "p17"], [1, 1]),
  buildOrder(19, 1, 5, "hoan_thanh", 6, ["p4", "p5"], [1, 1]),
  buildOrder(20, 0, 6, "hoan_thanh", 6, ["p3"], [2]),
  // Personal orders for u1 (default customer)
  {
    ...buildOrder(21, 0, 0, "dang_giao", 0, ["p1"], [2]),
    id: "o1",
    displayCode: "HL2607-001",
    customerId: "u1",
    customerName: seedCustomerUser.fullName,
    customerPhone: seedCustomerUser.phone,
  },
  {
    ...buildOrder(22, 2, 0, "hoan_thanh", 2, ["p7"], [3]),
    id: "o2",
    displayCode: "HL2506-018",
    canReview: true,
    customerId: "u1",
    customerName: seedCustomerUser.fullName,
    customerPhone: seedCustomerUser.phone,
  },
  // Two completed personal orders for u1 with p1 — supports "multiple
  // eligible completed purchases of the same product" test.
  {
    ...buildOrder(23, 0, 0, "hoan_thanh", 3, ["p1"], [1]),
    id: "o3",
    displayCode: "HL2606-001",
    canReview: true,
    customerId: "u1",
    customerName: seedCustomerUser.fullName,
    customerPhone: seedCustomerUser.phone,
  },
  {
    ...buildOrder(24, 0, 0, "hoan_thanh", 8, ["p1", "p2"], [2, 1]),
    id: "o4",
    displayCode: "HL2506-004",
    canReview: true,
    customerId: "u1",
    customerName: seedCustomerUser.fullName,
    customerPhone: seedCustomerUser.phone,
  },
];

// -------- Product-scoped reviews (independent from shop reviews) --------
const rev = (
  id: string,
  productId: string,
  shopId: string,
  orderId: string,
  displayName: string,
  rating: number,
  daysAgoN: number,
  comment?: string,
  reply?: string,
): ProductReviewDto => ({
  id,
  productId,
  shopId,
  orderId,
  orderItemId: `${orderId}:${productId}`,
  user: { id: `pu-${id}`, displayName },
  rating,
  comment,
  verifiedPurchase: true,
  createdAt: daysAgo(daysAgoN),
  shopReply: reply ? { content: reply, createdAt: daysAgo(Math.max(0, daysAgoN - 1)) } : undefined,
});

export const seedProductReviews: ProductReviewDto[] = [
  rev(
    "pr1",
    "p1",
    "s1",
    "o-seed-r1",
    "Minh Anh",
    5,
    6,
    "Cơm nóng, sườn thơm, ăn đã đời!",
    "Cảm ơn bạn nhiều nhé!",
  ),
  rev("pr2", "p1", "s1", "o-seed-r2", "Hà Trang", 4, 5, "Sườn ngon nhưng canh hơi nhạt."),
  rev("pr3", "p1", "s1", "o-seed-r3", "Đức Anh", 5, 3, "Ship nhanh, còn nóng hổi."),
  rev("pr4", "p2", "s1", "o-seed-r4", "Ngọc Lan", 5, 4, "Gà rán giòn tan, giá hợp lý."),
  rev("pr5", "p4", "s2", "o-seed-r5", "Quang Huy", 4, 2, "Nước chấm chuẩn Hà Nội."),
  rev("pr6", "p7", "s3", "o-seed-r6", "Thu Hiền", 5, 1, "Bánh mì pate béo ngậy, sẽ đặt lại."),
  rev("pr7", "p10", "s4", "o-seed-r7", "Trâm Anh", 5, 1, "Trân châu dai, trà thơm."),
  rev("pr8", "p10", "s4", "o-seed-r8", "Bảo Nam", 3, 4, "Hơi ngọt, lần sau xin 50% đường."),
  rev("pr9", "p15", "s6", "o-seed-r9", "Việt Anh", 5, 7, "Cà phê đậm, đúng gu."),
];

/** Order items that have already been reviewed. Format: `${orderId}:${productId}`. */
export const seedReviewedOrderItems: string[] = seedProductReviews
  .map((r) => r.orderItemId)
  .filter((v): v is string => Boolean(v));
