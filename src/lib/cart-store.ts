import { useSyncExternalStore } from "react";
import {
  DEFAULT_ZONE_ID,
  getVoucher,
  getZone,
  products,
  voucherStatusFor,
  type Product,
} from "./mock-data";

export type CartItem = {
  productId: string;
  quantity: number;
  note?: string;
};

type CartState = {
  items: CartItem[];
  shopId: string | null;
  deliveryZoneId: string;
  voucherCode: string | null;
};

const STORAGE_KEY = "hoalac_cart_v2";

let state: CartState = {
  items: [],
  shopId: null,
  deliveryZoneId: DEFAULT_ZONE_ID,
  voucherCode: null,
};
const serverSnapshot: CartState = { ...state };
const listeners = new Set<() => void>();

function load() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CartState>;
      state = {
        items: parsed.items ?? [],
        shopId: parsed.shopId ?? null,
        deliveryZoneId: parsed.deliveryZoneId ?? DEFAULT_ZONE_ID,
        voucherCode: parsed.voucherCode ?? null,
      };
    }
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

function clone(next: Partial<CartState>) {
  state = { ...state, ...next, items: next.items ? [...next.items] : [...state.items] };
  emit();
}

export const cartStore = {
  getState: () => state,
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  add(productId: string, qty = 1, note?: string) {
    const p = products.find((x) => x.id === productId);
    if (!p || !p.available) return;
    let items = state.items;
    let shopId = state.shopId;
    let voucherCode = state.voucherCode;
    if (shopId && shopId !== p.shopId) {
      items = [{ productId, quantity: qty, note }];
      shopId = p.shopId;
      voucherCode = null;
    } else {
      const existing = items.find((i) => i.productId === productId);
      if (existing) {
        existing.quantity += qty;
        if (note !== undefined) existing.note = note;
      } else {
        items.push({ productId, quantity: qty, note });
      }
      shopId = p.shopId;
    }
    clone({ items, shopId, voucherCode });
  },
  setQty(productId: string, qty: number) {
    let items = state.items;
    let shopId = state.shopId;
    let voucherCode = state.voucherCode;
    if (qty <= 0) {
      items = items.filter((i) => i.productId !== productId);
    } else {
      const it = items.find((i) => i.productId === productId);
      if (it) it.quantity = qty;
    }
    if (items.length === 0) {
      shopId = null;
      voucherCode = null;
    }
    clone({ items, shopId, voucherCode });
  },
  setNote(productId: string, note: string) {
    const items = state.items.map((i) =>
      i.productId === productId ? { ...i, note } : i,
    );
    clone({ items });
  },
  remove(productId: string) {
    this.setQty(productId, 0);
  },
  clear() {
    state = {
      items: [],
      shopId: null,
      deliveryZoneId: state.deliveryZoneId,
      voucherCode: null,
    };
    emit();
  },
  setZone(zoneId: string) {
    clone({ deliveryZoneId: zoneId });
  },
  setVoucher(code: string | null) {
    clone({ voucherCode: code });
  },
  /** Adds many items at once (used by reorder). Replaces current cart for that shop. */
  reorder(shopId: string, items: { productId: string; quantity: number; note?: string }[]) {
    state = {
      items: items.map((i) => ({ ...i })),
      shopId,
      deliveryZoneId: state.deliveryZoneId,
      voucherCode: null,
    };
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

export function useCartSubtotal() {
  const items = useCartItems();
  return items.reduce((s, i) => s + i.product.price * i.quantity, 0);
}

// Backward-compat alias
export const useCartTotal = useCartSubtotal;

export function useDeliveryZone() {
  const c = useCart();
  return getZone(c.deliveryZoneId);
}

/** Returns full pricing including ship + voucher discount for current cart. */
export function useCartPricing() {
  const c = useCart();
  const subtotal = useCartSubtotal();
  const zone = getZone(c.deliveryZoneId);
  const shipFee = subtotal > 0 ? zone.fee : 0;
  let discount = 0;
  let voucher = null as ReturnType<typeof getVoucher> | null;
  if (c.voucherCode) {
    const v = getVoucher(c.voucherCode);
    if (v && voucherStatusFor(v, subtotal) === v.status) {
      voucher = v;
      discount = v.discountAmount;
    }
  }
  const total = Math.max(0, subtotal - discount) + shipFee;
  return { subtotal, shipFee, discount, total, zone, voucher };
}
