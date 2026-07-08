import { useCartQuery } from "./api/hooks";

export type { CartItemDto as CartItem } from "./api/types";

export function useCart() {
  const query = useCartQuery();
  return query.data!;
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
