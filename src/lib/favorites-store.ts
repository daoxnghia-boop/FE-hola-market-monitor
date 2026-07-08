import { useFavoriteShops, useToggleFavorite } from "./api/hooks";

export function useFavorites() {
  const query = useFavoriteShops();
  return query.data?.map((shop) => shop.id) ?? [];
}

export function useIsFavorite(shopId: string) {
  const query = useFavoriteShops();
  return query.data?.some((shop) => shop.id === shopId) ?? false;
}

export function useFavoriteActions() {
  return useToggleFavorite();
}
