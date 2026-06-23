import { useSyncExternalStore } from "react";

const STORAGE_KEY = "hoalac_fav_shops_v1";

let state: string[] = [];
const serverSnapshot: string[] = [];
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

export const favoritesStore = {
  getState: () => state,
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  toggle(shopId: string) {
    state = state.includes(shopId)
      ? state.filter((id) => id !== shopId)
      : [...state, shopId];
    emit();
  },
  isFavorite(shopId: string) {
    return state.includes(shopId);
  },
};

export function useFavorites() {
  return useSyncExternalStore(
    favoritesStore.subscribe,
    favoritesStore.getState,
    () => serverSnapshot,
  );
}

export function useIsFavorite(shopId: string) {
  const list = useFavorites();
  return list.includes(shopId);
}
