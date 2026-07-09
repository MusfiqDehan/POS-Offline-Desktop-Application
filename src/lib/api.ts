import { API_BASE_URL, PUBLIC_API_BASE_URL } from "./env";
import { platformFetch } from "./platform-fetch";
import { buildTenantRequestHeaders } from "./tenant-headers";

export function joinApiUrl(base: string, path: string): string {
  const normalizedBase = base.replace(/\/+$/, "");
  const [pathPart, queryPart] = path.split("?");
  const segments = pathPart
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);
  const url = `${normalizedBase}/${segments.join("/")}/`;
  return queryPart ? `${url}?${queryPart}` : url;
}

export type ApiEnvelope<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  error_code?: string;
  errors?: Record<string, string[]> | string[];
};

export type ApiResult<T> = {
  ok: boolean;
  status: number;
  body: ApiEnvelope<T>;
};

export type PaginationMeta = {
  has_next: boolean;
  has_previous: boolean;
  page_size: number;
  next_cursor?: string;
  previous_cursor?: string;
};

export type ListEnvelope<T> = {
  items: T[];
  pagination?: PaginationMeta;
  meta?: Record<string, unknown>;
};

export function extractListItems<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && "items" in data) {
    const envelope = data as ListEnvelope<T>;
    return Array.isArray(envelope.items) ? envelope.items : [];
  }
  return [];
}

export function extractPagination(data: unknown): PaginationMeta | undefined {
  if (data && typeof data === "object" && "pagination" in data) {
    return (data as ListEnvelope<unknown>).pagination;
  }
  return undefined;
}

export function collectErrorMessages(envelope: ApiEnvelope): string[] {
  const { errors, message } = envelope;
  const lines: string[] = [];

  if (errors) {
    if (Array.isArray(errors)) {
      lines.push(...errors);
    } else {
      for (const fieldErrors of Object.values(errors)) {
        if (Array.isArray(fieldErrors)) {
          lines.push(...fieldErrors);
        }
      }
    }
  }

  if (lines.length === 0 && message) {
    lines.push(message);
  }

  return lines;
}

export async function apiGet<T = unknown>(
  path: string,
  accessToken?: string,
): Promise<ApiResult<T>> {
  return rawGet(API_BASE_URL, path, accessToken, buildTenantRequestHeaders());
}

export async function publicApiGet<T = unknown>(
  path: string,
  accessToken?: string,
): Promise<ApiResult<T>> {
  return rawGet(PUBLIC_API_BASE_URL, path, accessToken);
}

export async function apiPost<T = unknown>(
  path: string,
  payload: unknown,
  accessToken?: string,
): Promise<ApiResult<T>> {
  return rawPost(API_BASE_URL, path, accessToken, {
    method: "POST",
    body: JSON.stringify(payload),
  }, buildTenantRequestHeaders());
}

export async function apiPatch<T = unknown>(
  path: string,
  payload: unknown,
  accessToken?: string,
): Promise<ApiResult<T>> {
  return rawPost(API_BASE_URL, path, accessToken, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, buildTenantRequestHeaders());
}

export async function apiDelete<T = unknown>(
  path: string,
  accessToken?: string,
): Promise<ApiResult<T>> {
  return rawPost(API_BASE_URL, path, accessToken, {
    method: "DELETE",
  }, buildTenantRequestHeaders());
}

export async function publicApiPost<T = unknown>(
  path: string,
  payload: unknown,
  accessToken?: string,
): Promise<ApiResult<T>> {
  return rawPost(PUBLIC_API_BASE_URL, path, accessToken, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function rawGet<T>(
  base: string,
  path: string,
  accessToken?: string,
  extraHeaders?: Record<string, string>,
): Promise<ApiResult<T>> {
  const url = joinApiUrl(base, path);
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...extraHeaders,
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let response: Response;
  try {
    response = await platformFetch(url, { method: "GET", headers });
  } catch {
    return {
      ok: false,
      status: 0,
      body: {
        success: false,
        message: "Unable to reach the server. Please check your connection and try again.",
      },
    };
  }

  let body: ApiEnvelope<T>;
  try {
    body = (await response.json()) as ApiEnvelope<T>;
  } catch {
    body = {
      success: response.ok,
      message: response.ok ? undefined : "Unexpected response from the server.",
    };
  }

  return { ok: response.ok, status: response.status, body };
}

async function rawPost<T>(
  base: string,
  path: string,
  accessToken?: string,
  init?: RequestInit,
  extraHeaders?: Record<string, string>,
): Promise<ApiResult<T>> {
  const url = joinApiUrl(base, path);
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...extraHeaders,
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let response: Response;
  try {
    response = await platformFetch(url, { ...init, headers });
  } catch {
    return {
      ok: false,
      status: 0,
      body: {
        success: false,
        message: "Unable to reach the server. Please check your connection and try again.",
      },
    };
  }

  let body: ApiEnvelope<T>;
  try {
    body = (await response.json()) as ApiEnvelope<T>;
  } catch {
    body = {
      success: response.ok,
      message: response.ok ? undefined : "Unexpected response from the server.",
    };
  }

  return { ok: response.ok, status: response.status, body };
}
