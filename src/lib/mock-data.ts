export type Category = {
  id: string;
  name: string;
  icon: string;
};

export type Product = {
  id: string;
  shopId: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  available: boolean;
  prepTime: number;
  rating: number;
  soldCount: number;
};

export type ShopStatus = "open" | "break" | "out_of_menu";

export type Shop = {
  id: string;
  name: string;
  logo: string;
  cover: string;
  rating: number;
  reviewCount: number;
  address: string;
  area: string;
  distanceKm: number;
  isOpen: boolean;
  status: ShopStatus;
  prepTime: number;
  categories: string[];
  description: string;
  phone: string;
  openHours: string;
  /** zone ids this shop delivers to */
  supportedZones: string[];
};

export type VoucherStatus =
  | "usable"
  | "soon_expire"
  | "used"
  | "expired"
  | "locked"
  | "not_eligible";

export type Voucher = {
  id: string;
  code: string;
  title: string;
  description: string;
  discountText: string;
  discountAmount: number;
  minOrder: number;
  expiry: string;
  /** base status; subtotal-based eligibility computed at runtime */
  status: Exclude<VoucherStatus, "not_eligible">;
};

export type OrderStatus =
  | "da_dat"
  | "cho_quan_xac_nhan"
  | "quan_da_xac_nhan"
  | "dang_chuan_bi"
  | "dang_giao"
  | "hoan_thanh"
  | "da_huy";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  da_dat: "Đã đặt",
  cho_quan_xac_nhan: "Chờ quán xác nhận",
  quan_da_xac_nhan: "Quán đã xác nhận",
  dang_chuan_bi: "Đang chuẩn bị",
  dang_giao: "Đang giao",
  hoan_thanh: "Hoàn thành",
  da_huy: "Đã hủy",
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "da_dat",
  "cho_quan_xac_nhan",
  "quan_da_xac_nhan",
  "dang_chuan_bi",
  "dang_giao",
  "hoan_thanh",
];

export type DeliveryZone = {
  id: string;
  name: string;
  shortName: string;
  fee: number;
};

export const DELIVERY_ZONES: DeliveryZone[] = [
  { id: "fpt-uni", name: "FPT University", shortName: "FPT University", fee: 10000 },
  { id: "ktx-fpt", name: "KTX FPT", shortName: "KTX FPT", fee: 12000 },
  { id: "fville-1", name: "F-Ville 1", shortName: "F-Ville 1", fee: 8000 },
  { id: "fville-2", name: "F-Ville 2", shortName: "F-Ville 2", fee: 8000 },
  { id: "cnc", name: "Khu CNC Hòa Lạc", shortName: "Khu CNC Hòa Lạc", fee: 15000 },
  { id: "vnu", name: "Đại học Quốc Gia", shortName: "ĐHQG Hòa Lạc", fee: 15000 },
];

export const DEFAULT_ZONE_ID = "fpt-uni";

export const getZone = (id: string | null | undefined) =>
  DELIVERY_ZONES.find((z) => z.id === id) ?? DELIVERY_ZONES[0];

export const categories: Category[] = [
  { id: "com", name: "Cơm", icon: "🍚" },
  { id: "bun-pho", name: "Bún - Phở", icon: "🍜" },
  { id: "banh-mi", name: "Bánh mì", icon: "🥖" },
  { id: "tra-sua", name: "Trà sữa", icon: "🧋" },
  { id: "an-vat", name: "Ăn vặt", icon: "🍢" },
  { id: "do-uong", name: "Đồ uống", icon: "🥤" },
  { id: "trang-mieng", name: "Tráng miệng", icon: "🍰" },
  { id: "chay", name: "Đồ chay", icon: "🥗" },
];

const PHOTOS = {
  com: "1546069901-ba9599a7e63c",
  bun: "1569718212165-3a8278d5f624",
  banhMi: "1558030006-450675393462",
  traSua: "1558857563-c0c6ee6ff8bd",
  anVat: "1604908176997-125f25cc6f3d",
  shop1: "1552566626-52f8b828add9",
  shop2: "1517248135467-4c7edcad34c4",
  shop3: "1559339352-11d035aa65de",
  shop4: "1504674900247-0877df9cc836",
  shop5: "1555396273-367ea4eb4db5",
};

const u = (id: string, w = 800) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

export const shops: Shop[] = [
  {
    id: "com-nha-hoa-lac",
    name: "Cơm Nhà Hòa Lạc",
    logo: u(PHOTOS.com, 200),
    cover: u(PHOTOS.shop1, 1200),
    rating: 4.8,
    reviewCount: 312,
    address: "Số 12, Đường FPT, Hòa Lạc",
    area: "FPT",
    distanceKm: 0.4,
    isOpen: true,
    status: "open",
    prepTime: 15,
    categories: ["com", "do-uong"],
    description: "Cơm nhà nấu mỗi ngày, đậm vị quê hương.",
    phone: "0987 654 321",
    openHours: "10:00 - 21:00",
    supportedZones: ["fpt-uni", "ktx-fpt", "fville-1", "fville-2"],
  },
  {
    id: "bun-bo-co-lan",
    name: "Bún Bò Cô Lan",
    logo: u(PHOTOS.bun, 200),
    cover: u(PHOTOS.shop2, 1200),
    rating: 4.7,
    reviewCount: 254,
    address: "Ngõ 5, Khu CNC Hòa Lạc",
    area: "Khu CNC Hòa Lạc",
    distanceKm: 1.1,
    isOpen: true,
    status: "open",
    prepTime: 18,
    categories: ["bun-pho"],
    description: "Bún bò Huế cay nồng chuẩn vị miền Trung.",
    phone: "0912 345 678",
    openHours: "06:30 - 14:00",
    supportedZones: ["cnc", "fville-1", "fville-2", "fpt-uni"],
  },
  {
    id: "tra-sua-soc-nau",
    name: "Trà Sữa Sóc Nâu",
    logo: u(PHOTOS.traSua, 200),
    cover: u(PHOTOS.shop3, 1200),
    rating: 4.6,
    reviewCount: 489,
    address: "Cổng ĐH Quốc Gia, Hòa Lạc",
    area: "Đại học Quốc Gia",
    distanceKm: 0.8,
    isOpen: true,
    status: "open",
    prepTime: 12,
    categories: ["tra-sua", "do-uong"],
    description: "Trà sữa thơm béo, topping đa dạng.",
    phone: "0934 222 111",
    openHours: "08:00 - 22:30",
    supportedZones: ["vnu", "cnc", "fpt-uni", "ktx-fpt"],
  },
  {
    id: "banh-mi-minh-anh",
    name: "Bánh Mì Minh Anh",
    logo: u(PHOTOS.banhMi, 200),
    cover: u(PHOTOS.shop4, 1200),
    rating: 4.9,
    reviewCount: 178,
    address: "Đối diện FPT Edu, Hòa Lạc",
    area: "FPT",
    distanceKm: 0.3,
    isOpen: false,
    status: "break",
    prepTime: 8,
    categories: ["banh-mi"],
    description: "Bánh mì giòn rụm, pate nhà làm.",
    phone: "0978 111 222",
    openHours: "06:00 - 11:30",
    supportedZones: ["fpt-uni", "ktx-fpt"],
  },
  {
    id: "an-vat-campus",
    name: "Ăn Vặt Campus",
    logo: u(PHOTOS.anVat, 200),
    cover: u(PHOTOS.shop5, 1200),
    rating: 4.5,
    reviewCount: 96,
    address: "KTX FPT, Hòa Lạc",
    area: "FPT",
    distanceKm: 0.6,
    isOpen: true,
    status: "open",
    prepTime: 20,
    categories: ["an-vat"],
    description: "Nem chua rán, xúc xích, khoai lắc nóng hổi.",
    phone: "0967 333 444",
    openHours: "15:00 - 23:00",
    supportedZones: ["fpt-uni", "ktx-fpt", "fville-1"],
  },
];

export const products: Product[] = [
  {
    id: "com-ga-sot-mam",
    shopId: "com-nha-hoa-lac",
    name: "Cơm gà sốt mắm",
    price: 35000,
    description: "Cơm gà rang giòn, sốt mắm tỏi đậm đà, kèm canh và rau.",
    image: u(PHOTOS.com),
    category: "com",
    available: true,
    prepTime: 12,
    rating: 4.8,
    soldCount: 420,
  },
  {
    id: "com-rang-dua-bo",
    shopId: "com-nha-hoa-lac",
    name: "Cơm rang dưa bò",
    price: 40000,
    description: "Cơm rang với dưa chua và thịt bò mềm, nóng hổi.",
    image: u(PHOTOS.com),
    category: "com",
    available: true,
    prepTime: 15,
    rating: 4.7,
    soldCount: 360,
  },
  {
    id: "com-suon-bi-cha",
    shopId: "com-nha-hoa-lac",
    name: "Cơm sườn bì chả",
    price: 45000,
    description: "Sườn nướng mật ong, bì heo, chả trứng hấp.",
    image: u(PHOTOS.com),
    category: "com",
    available: true,
    prepTime: 14,
    rating: 4.9,
    soldCount: 510,
  },
  {
    id: "canh-chua-ca",
    shopId: "com-nha-hoa-lac",
    name: "Canh chua cá",
    price: 25000,
    description: "Canh chua thơm dứa, cà chua, cá basa.",
    image: u(PHOTOS.com),
    category: "com",
    available: false,
    prepTime: 10,
    rating: 4.5,
    soldCount: 88,
  },
  {
    id: "bun-bo-hue",
    shopId: "bun-bo-co-lan",
    name: "Bún bò Huế",
    price: 40000,
    description: "Nước dùng cay nồng, chả cua, giò heo.",
    image: u(PHOTOS.bun),
    category: "bun-pho",
    available: true,
    prepTime: 10,
    rating: 4.8,
    soldCount: 720,
  },
  {
    id: "tra-sua-tran-chau",
    shopId: "tra-sua-soc-nau",
    name: "Trà sữa trân châu đường đen",
    price: 30000,
    description: "Trân châu đen dai, sữa tươi, đường đen nóng.",
    image: u(PHOTOS.traSua),
    category: "tra-sua",
    available: true,
    prepTime: 8,
    rating: 4.7,
    soldCount: 980,
  },
  {
    id: "banh-mi-pate",
    shopId: "banh-mi-minh-anh",
    name: "Bánh mì pate trứng",
    price: 20000,
    description: "Bánh mì giòn, pate nhà làm, trứng ốp la.",
    image: u(PHOTOS.banhMi),
    category: "banh-mi",
    available: true,
    prepTime: 5,
    rating: 4.9,
    soldCount: 1240,
  },
  {
    id: "nem-chua-ran",
    shopId: "an-vat-campus",
    name: "Nem chua rán (10 cái)",
    price: 25000,
    description: "Nem chua rán vàng, ăn kèm tương ớt.",
    image: u(PHOTOS.anVat),
    category: "an-vat",
    available: true,
    prepTime: 12,
    rating: 4.6,
    soldCount: 540,
  },
];

export const vouchers: Voucher[] = [
  {
    id: "v1",
    code: "HOALAC5",
    title: "Giảm 5.000đ đơn đầu tiên",
    description: "Áp dụng cho đơn từ 30.000đ",
    discountText: "-5.000đ",
    discountAmount: 5000,
    minOrder: 30000,
    expiry: "30/06/2026",
    status: "usable",
  },
  {
    id: "v2",
    code: "HOALAC10",
    title: "Giảm 10.000đ cho đơn từ 80.000đ",
    description: "Áp dụng cho mọi quán quanh Hòa Lạc",
    discountText: "-10.000đ",
    discountAmount: 10000,
    minOrder: 80000,
    expiry: "31/07/2026",
    status: "usable",
  },
  {
    id: "v3",
    code: "GIOITHIEU7",
    title: "Voucher giới thiệu bạn bè",
    description: "Giảm 7.000đ cho đơn từ 50.000đ",
    discountText: "-7.000đ",
    discountAmount: 7000,
    minOrder: 50000,
    expiry: "15/08/2026",
    status: "soon_expire",
  },
  {
    id: "v4",
    code: "THANTHIET15",
    title: "Khách thân thiết",
    description: "Đặt 5 đơn để mở khóa voucher giảm 15.000đ",
    discountText: "-15.000đ",
    discountAmount: 15000,
    minOrder: 0,
    expiry: "31/12/2026",
    status: "locked",
  },
];

export const getShop = (id: string) => shops.find((s) => s.id === id);
export const getProduct = (id: string) => products.find((p) => p.id === id);
export const getProductsByShop = (shopId: string) =>
  products.filter((p) => p.shopId === shopId);
export const getVoucher = (code: string) =>
  vouchers.find((v) => v.code.toUpperCase() === code.toUpperCase());

export function voucherStatusFor(v: Voucher, subtotal: number): VoucherStatus {
  if (v.status !== "usable" && v.status !== "soon_expire") return v.status;
  if (subtotal < v.minOrder) return "not_eligible";
  return v.status;
}

export const VOUCHER_STATUS_LABEL: Record<VoucherStatus, string> = {
  usable: "Có thể dùng",
  soon_expire: "Sắp hết hạn",
  used: "Đã dùng",
  expired: "Hết hạn",
  locked: "Chưa mở khóa",
  not_eligible: "Chưa đủ điều kiện",
};

export const formatVND = (n: number) =>
  n.toLocaleString("vi-VN") + "đ";
