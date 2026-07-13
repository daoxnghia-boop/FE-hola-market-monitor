import type { CartDto } from "./api/types";
import { useCartQuery } from "./api/hooks";

export type { CartItemDto as CartItem } from "./api/types";

const EMPTY_CART: CartDto = {
  id: "",
  shop: null,
  items: [],
  deliveryZone: null,
  voucher: null,
  pricing: { subtotal: 0, discount: 0, deliveryFee: 0, total: 0 },
  canCheckout: false,
  blockingReasons: [],
  updatedAt: "",
};

export function useCart(): CartDto {
  const query = useCartQuery();
  return query.data ?? EMPTY_CART;
}

export function useCartItems() {
  return useCart().items;
}

export function useCartCount() {
  return useCart().items.reduce((sum, item) => sum + item.quantity, 0);
}

export function useCartSubtotal() {
  return useCart().pricing.subtotal;
}

export const useCartTotal = useCartSubtotal;

export function useDeliveryZone() {
  return useCart().deliveryZone;
}

export function useCartPricing() {
  const cart = useCart();
  return {
    subtotal: cart.pricing.subtotal,
    discount: cart.pricing.discount,
    shipFee: cart.pricing.deliveryFee,
    total: cart.pricing.total,
    zone: cart.deliveryZone,
    voucher: cart.voucher,
  };
}
