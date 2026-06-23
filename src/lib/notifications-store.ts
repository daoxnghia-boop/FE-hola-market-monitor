import { useSyncExternalStore } from "react";

export type NotificationType = "order" | "voucher" | "shop" | "system";

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** ISO timestamp for sorting */
  createdAt: string;
  /** Relative time text used for display (mock) */
  timeText: string;
  read: boolean;
  /** Optional deep-link targets */
  orderId?: string;
  shopId?: string;
};

const STORAGE_KEY = "an-hoa-lac-notifications-v1";

const seed: AppNotification[] = [
  {
    id: "n1",
    type: "order",
    title: "Quán đã nhận đơn của bạn",
    body: "Đơn #DH001 tại Cơm Nhà Hòa Lạc đang được chuẩn bị.",
    createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    timeText: "5 phút trước",
    read: false,
    orderId: "DH001",
  },
  {
    id: "n2",
    type: "order",
    title: "Đơn hàng đã hoàn thành",
    body: "Đơn #DH000 đã giao thành công. Đánh giá quán nhé!",
    createdAt: new Date(Date.now() - 60 * 60_000).toISOString(),
    timeText: "1 giờ trước",
    read: false,
    orderId: "DH000",
  },
  {
    id: "n3",
    type: "voucher",
    title: "Bạn vừa nhận voucher 5.000đ",
    body: "Áp dụng cho đơn từ 30.000đ. Hết hạn sau 7 ngày.",
    createdAt: new Date(Date.now() - 3 * 3600_000).toISOString(),
    timeText: "3 giờ trước",
    read: false,
  },
  {
    id: "n4",
    type: "voucher",
    title: "Voucher sắp hết hạn",
    body: "Mã HOALAC10 sẽ hết hạn vào ngày mai.",
    createdAt: new Date(Date.now() - 8 * 3600_000).toISOString(),
    timeText: "8 giờ trước",
    read: true,
  },
  {
    id: "n5",
    type: "shop",
    title: "Quán Cơm Cô Lan hôm nay tạm nghỉ",
    body: "Quán sẽ mở lại vào ngày mai từ 10:00.",
    createdAt: new Date(Date.now() - 12 * 3600_000).toISOString(),
    timeText: "12 giờ trước",
    read: false,
    shopId: "shop-2",
  },
  {
    id: "n6",
    type: "shop",
    title: "Món bạn yêu thích đã có lại",
    body: "Bún bò đặc biệt tại Bún Bò Cô Lan đã có lại hôm nay.",
    createdAt: new Date(Date.now() - 24 * 3600_000).toISOString(),
    timeText: "Hôm qua",
    read: true,
    shopId: "shop-2",
  },
  {
    id: "n7",
    type: "system",
    title: "Khu vực của bạn có thêm quán mới",
    body: "3 quán mới vừa mở gần FPT University Hòa Lạc.",
    createdAt: new Date(Date.now() - 2 * 86400_000).toISOString(),
    timeText: "2 ngày trước",
    read: true,
  },
  {
    id: "n8",
    type: "system",
    title: "Tính năng đặt nhóm đã sẵn sàng thử nghiệm",
    body: "Cùng bạn bè gom đơn để tiết kiệm phí giao hàng.",
    createdAt: new Date(Date.now() - 3 * 86400_000).toISOString(),
    timeText: "3 ngày trước",
    read: true,
  },
];

let state: AppNotification[] = seed;
const listeners = new Set<() => void>();

function load() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) state = JSON.parse(raw) as AppNotification[];
  } catch {
    /* ignore */
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

let loaded = false;
function ensureLoaded() {
  if (!loaded) {
    loaded = true;
    load();
  }
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

function subscribe(fn: () => void) {
  ensureLoaded();
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function getSnapshot() {
  ensureLoaded();
  return state;
}

function getServerSnapshot() {
  return seed;
}

export function useNotifications() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useUnreadCount() {
  const list = useNotifications();
  return list.filter((n) => !n.read).length;
}

export function markRead(id: string) {
  state = state.map((n) => (n.id === id ? { ...n, read: true } : n));
  emit();
}

export function markAllRead() {
  state = state.map((n) => ({ ...n, read: true }));
  emit();
}
