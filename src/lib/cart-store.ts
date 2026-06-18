import { useSyncExternalStore } from "react";
import { products, type Product } from "./mock-data";

export type CartItem = {
  productId: string;
  quantity: number;
  note?: string;
};

type CartState = {
  items: CartItem[];
  shopId: string | null;
};

const STORAGE_KEY = "hoalac_cart_v1";

let state: CartState = { items: [], shopId: null };
const serverSnapshot: CartState = { items: [], shopId: null };
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

export const cartStore = {
  getState: () => state,
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  add(productId: string, qty = 1) {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    if (state.shopId && state.shopId !== p.shopId) {
      state = { items: [{ productId, quantity: qty }], shopId: p.shopId };
    } else {
      const existing = state.items.find((i) => i.productId === productId);
      if (existing) existing.quantity += qty;
      else state.items.push({ productId, quantity: qty });
      state.shopId = p.shopId;
    }
    state = { ...state, items: [...state.items] };
    emit();
  },
  setQty(productId: string, qty: number) {
    if (qty <= 0) {
      state.items = state.items.filter((i) => i.productId !== productId);
    } else {
      const it = state.items.find((i) => i.productId === productId);
      if (it) it.quantity = qty;
    }
    if (state.items.length === 0) state.shopId = null;
    state = { ...state, items: [...state.items] };
    emit();
  },
  remove(productId: string) {
    this.setQty(productId, 0);
  },
  clear() {
    state = { items: [], shopId: null };
    emit();
  },
};

function getServerSnapshot(): CartState {
  return serverSnapshot;
}

export function useCart() {
  return useSyncExternalStore(cartStore.subscribe, cartStore.getState, getServerSnapshot);
}

export function useCartItems(): (CartItem & { product: Product })[] {
  const c = useCart();
  return c.items
    .map((i) => {
      const product = products.find((p) => p.id === i.productId)!;
      return product ? { ...i, product } : null;
    })
    .filter(Boolean) as (CartItem & { product: Product })[];
}

export function useCartCount() {
  const c = useCart();
  return c.items.reduce((s, i) => s + i.quantity, 0);
}

export function useCartTotal() {
  const items = useCartItems();
  return items.reduce((s, i) => s + i.product.price * i.quantity, 0);
}
