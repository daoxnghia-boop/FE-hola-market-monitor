// Safe internal-redirect helper for post-login navigation.
export function safeInternalPath(raw?: string | null): string {
  if (!raw) return "/";
  try {
    // reject absolute URLs, protocol-relative URLs and non-app paths
    if (raw.startsWith("//") || /^[a-z]+:/i.test(raw)) return "/";
    if (!raw.startsWith("/")) return "/";
    return raw;
  } catch {
    return "/";
  }
}

const KEY = "hola-post-login-redirect";

export function storeRedirectIntent(path: string) {
  if (typeof window === "undefined") return;
  try { window.sessionStorage.setItem(KEY, safeInternalPath(path)); } catch { /* ignore */ }
}

export function consumeRedirectIntent(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.sessionStorage.getItem(KEY);
    if (v) window.sessionStorage.removeItem(KEY);
    return v ? safeInternalPath(v) : null;
  } catch { return null; }
}
