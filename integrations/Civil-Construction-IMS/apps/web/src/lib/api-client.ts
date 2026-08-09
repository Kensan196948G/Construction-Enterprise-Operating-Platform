/**
 * Common API client for the Civil Construction IMS frontend.
 *
 * - fetch ベースの薄いラッパー
 * - localStorage の JWT を Authorization: Bearer ヘッダーへ自動付与
 * - 非 2xx レスポンスは ApiError を throw
 */

import { MOCK_MODE } from './mock/flag';
import { handleMockRequest } from './mock/server';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

/** localStorage に保存する JWT のキー */
export const AUTH_TOKEN_KEY = 'civil_ims_token';

export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/** localStorage から JWT を取得する (SSR では null) */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

/** localStorage に JWT を保存する */
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

/** localStorage から JWT を削除する */
export function clearAuthToken(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions extends Omit<RequestInit, 'body' | 'method'> {
  /** クエリパラメータ (undefined / null は除外) */
  params?: Record<string, QueryValue>;
}

function buildUrl(path: string, params?: Record<string, QueryValue>): string {
  const base = path.startsWith('http')
    ? path
    : `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  if (!params) {
    return base;
  }

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      search.append(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  // モックモード: HTTP を発行せず、インメモリのモックサーバーで応答する。
  // ネットワーク遅延を擬似するため極小の遅延を挟む（UI のローディング表示を自然にする）。
  if (MOCK_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 120));
    // mock-server には API_BASE_URL を含まない相対パス (+ query) を渡す。
    const relative = path.startsWith('http')
      ? path
      : buildUrl(path, options.params).slice(API_BASE_URL.length);
    return handleMockRequest<T>(method, relative, body);
  }

  const { params, headers, ...rest } = options;
  const url = buildUrl(path, params);

  const finalHeaders = new Headers(headers);
  finalHeaders.set('Accept', 'application/json');

  const token = getAuthToken();
  if (token) {
    finalHeaders.set('Authorization', `Bearer ${token}`);
  }

  let serializedBody: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (body instanceof FormData) {
      serializedBody = body;
    } else {
      finalHeaders.set('Content-Type', 'application/json');
      serializedBody = JSON.stringify(body);
    }
  }

  const response = await fetch(url, {
    method,
    headers: finalHeaders,
    body: serializedBody,
    ...rest,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload: unknown = isJson
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);

  if (!response.ok) {
    let message = `API request failed: ${response.status} ${response.statusText}`;
    if (
      isJson &&
      payload &&
      typeof payload === 'object' &&
      'message' in payload &&
      typeof (payload as { message: unknown }).message === 'string'
    ) {
      message = (payload as { message: string }).message;
    }
    throw new ApiError(response.status, message, payload);
  }

  return payload as T;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions): Promise<T> =>
    request<T>('GET', path, undefined, options),

  post: <T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> => request<T>('POST', path, body, options),

  put: <T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> => request<T>('PUT', path, body, options),

  patch: <T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> => request<T>('PATCH', path, body, options),

  delete: <T>(path: string, options?: RequestOptions): Promise<T> =>
    request<T>('DELETE', path, undefined, options),
};

export type ApiClient = typeof apiClient;
