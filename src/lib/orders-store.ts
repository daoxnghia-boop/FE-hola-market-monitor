import { useSyncExternalStore } from "react";
import type { OrderStatus } from "./mock-data";

export type StoredOrderItem = {
  productId: string;
  quantity: number;
  price: number;
  name: string;
  image: string;
  note?: string;
};

export type StoredOrder = {
  id: string;
  shopId: string;
  shopName: string;
  shopPhone: string;
  shopAddress: string;
  items: StoredOrderItem[];
  subtotal: number;
  discount: number;
  shipFee: number;
  total: number;
  voucherCode: string | null;
  zoneId: string;
  zoneName: string;
  address: string;
  phone: string;
  customerName: string;
  note: string;
  status: OrderStatus;
  createdAt: string;
  placedAt: string;
};

const STORAGE_KEY = "hoalac_orders_v1";

let state: StoredOrder[] = [];
const serverSnapshot: StoredOrder[] = [];
const listeners = new Set<() => void>();

function load() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = JSON.parse(raw);
  } catch {}
}
load();

function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

function nextOrderId() {
  const n = Math.floor(Math.random() * 9000) + 1000;
  const d = new Date();
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `DH${yy}${mm}${dd}${n}`;
}

function placedAtText() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${hh}:${mi}, ${dd}/${mm}/${yyyy}`;
}

export const ordersStore = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  getState: () => state,
  create(order: Omit<StoredOrder, "id" | "status" | "createdAt" | "placedAt">) {
    const id = nextOrderId();
    const full: StoredOrder = {
      ...order,
      id,
      status: "cho_quan_xac_nhan",
      createdAt: new Date().toISOString(),
      placedAt: placedAtText(),
    };
    state = [full, ...state];
    emit();
    return full;
  },
  cancel(id: string) {
    state = state.map((o) => (o.id === id ? { ...o, status: "da_huy" } : o));
    emit();
  },
  setStatus(id: string, status: OrderStatus) {
    state = state.map((o) => (o.id === id ? { ...o, status } : o));
    emit();
  },
  get(id: string) {
    return state.find((o) => o.id === id);
  },
};

export function useOrders() {
  return useSyncExternalStore(
    ordersStore.subscribe,
    ordersStore.getState,
    () => serverSnapshot,
  );
}

export function useOrder(id: string) {
  const list = useOrders();
  return list.find((o) => o.id === id);
}
