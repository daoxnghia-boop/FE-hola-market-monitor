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
  prepTime: number; // minutes
  rating: number;
  soldCount: number;
};

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
  prepTime: number; // average minutes
  categories: string[];
  description: string;
  phone: string;
  openHours: string;
};

export type Voucher = {
  id: string;
  code: string;
  title: string;
  description: string;
  discountText: string;
  expiry: string;
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

const img = (q: string, seed: number) =>
  `https://images.unsplash.com/photo-${seed}?auto=format&fit=crop&w=800&q=70&sig=${encodeURIComponent(q)}`;

// Curated working Unsplash photo IDs
const PHOTOS = {
  com: "1546069901-ba9599a7e63c",
  bun: "1569718212165-3a8278d5f624",
  banhMi: "1558030006-450675393462",
  traSua: "1558857563-c0c6ee6ff8bd",
  anVat: "1604908176997-125f25cc6f3d",
  nem: "1625938145744-e380515399b7",
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
    prepTime: 15,
    categories: ["com", "do-uong"],
    description: "Cơm nhà nấu mỗi ngày, đậm vị quê hương.",
    phone: "0987 654 321",
    openHours: "10:00 - 21:00",
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
    prepTime: 18,
    categories: ["bun-pho"],
    description: "Bún bò Huế cay nồng chuẩn vị miền Trung.",
    phone: "0912 345 678",
    openHours: "06:30 - 14:00",
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
    prepTime: 12,
    categories: ["tra-sua", "do-uong"],
    description: "Trà sữa thơm béo, topping đa dạng.",
    phone: "0934 222 111",
    openHours: "08:00 - 22:30",
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
    prepTime: 8,
    categories: ["banh-mi"],
    description: "Bánh mì giòn rụm, pate nhà làm.",
    phone: "0978 111 222",
    openHours: "06:00 - 11:30",
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
    prepTime: 20,
    categories: ["an-vat"],
    description: "Nem chua rán, xúc xích, khoai lắc nóng hổi.",
    phone: "0967 333 444",
    openHours: "15:00 - 23:00",
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
    code: "HOALAC10",
    title: "Giảm 10K đơn đầu tiên",
    description: "Áp dụng cho khách hàng mới",
    discountText: "-10.000đ",
    expiry: "31/12/2025",
  },
  {
    id: "v2",
    code: "FREESHIP",
    title: "Miễn phí giao hàng",
    description: "Đơn từ 50.000đ tại quán quanh FPT",
    discountText: "Free ship",
    expiry: "30/06/2025",
  },
  {
    id: "v3",
    code: "TRASUA20",
    title: "Giảm 20% trà sữa",
    description: "Áp dụng tại Trà Sữa Sóc Nâu",
    discountText: "-20%",
    expiry: "15/05/2025",
  },
];

export const getShop = (id: string) => shops.find((s) => s.id === id);
export const getProduct = (id: string) => products.find((p) => p.id === id);
export const getProductsByShop = (shopId: string) =>
  products.filter((p) => p.shopId === shopId);

export const formatVND = (n: number) =>
  n.toLocaleString("vi-VN") + "đ";
