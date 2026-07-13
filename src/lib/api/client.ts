type ErrorBody = {
  error?: {
    code?: string;
    message?: string;
    fieldErrors?: Record<string, string>;
    details?: Record<string, unknown>;
  };
};

export class ApiError extends Error {
  status: number;
  code: string;
  fieldErrors?: Record<string, string>;
  details?: Record<string, unknown>;

  constructor(status: number, body?: ErrorBody) {
    super(body?.error?.message || `API request failed (${status})`);
    this.name = "ApiError";
    this.status = status;
    this.code = body?.error?.code || "API_ERROR";
    this.fieldErrors = body?.error?.fieldErrors;
    this.details = body?.error?.details;
  }
}

const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim();
export const API_BASE_URL = (configuredBase || "/api/v1").replace(/\/$/, "");

function buildUrl(path: string, query?: Record<string, unknown>) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = /^https?:\/\//.test(API_BASE_URL)
    ? API_BASE_URL
    : typeof window !== "undefined"
      ? `${window.location.origin}${API_BASE_URL}`
      : `http://localhost${API_BASE_URL}`;
  const url = new URL(`${base}${normalizedPath}`);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "")
      url.searchParams.set(key, String(value));
  });
  return url.toString();
}

async function parseBody(response: Response) {
  if (response.status === 204) return undefined;
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json") ? response.json() : response.text();
}

export async function apiRequest<T>(
  path: string,
  options: Omit<RequestInit, "body"> & {
    query?: Record<string, unknown>;
    body?: unknown;
    idempotencyKey?: string;
  } = {},
): Promise<T> {
  const { query, body, idempotencyKey, headers, ...init } = options;
  const method = (init.method || "GET").toUpperCase();

  // Route through mock API when enabled (default true until real backend is live).
  const { isMockEnabled, handleMock } = await import("./mock");
  if (isMockEnabled()) {
    try {
      return await handleMock<T>(method, path.startsWith("/") ? path : `/${path}`, query ?? {}, body);
    } catch (err) {
      const e = err as Error & { __apiStatus?: number; __apiCode?: string };
      if (e.__apiStatus) {
        throw new ApiError(e.__apiStatus, { error: { code: e.__apiCode, message: e.message } });
      }
      throw new ApiError(500, { error: { code: "MOCK_ERROR", message: e.message } });
    }
  }

  try {
    const response = await fetch(buildUrl(path, query), {
      ...init,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const parsed = await parseBody(response);
    if (!response.ok) throw new ApiError(response.status, parsed as ErrorBody);
    return parsed as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, {
      error: { code: "NETWORK_ERROR", message: "Không thể kết nối máy chủ." },
    });
  }
}

export function apiErrorMessage(error: unknown, fallback = "Có lỗi xảy ra. Vui lòng thử lại.") {
  return error instanceof ApiError ? error.message : fallback;
}
