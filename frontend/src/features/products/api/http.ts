import type { ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

function buildUrl(path: string, query?: Record<string, string>): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${normalizedPath}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value.length === 0) return;
      url.searchParams.set(key, value);
    });
  }

  return url.toString();
}

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Unexpected request error';
}

export class ApiClientError extends Error {
  statusCode: number;
  details: unknown;

  constructor(message: string, statusCode: number, details: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export async function requestJson<TData>(
  path: string,
  options?: RequestInit & { query?: Record<string, string> },
): Promise<TData> {
  try {
    const response = await fetch(buildUrl(path, options?.query), {
      method: options?.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers ?? {}),
      },
      body: options?.body,
    });

    let payload: ApiResponse<TData> | null = null;
    try {
      payload = (await response.json()) as ApiResponse<TData>;
    } catch {
      payload = null;
    }

    if (!response.ok || !payload?.success) {
      const message =
        payload?.msg ?? `Request failed with status ${response.status}`;
      throw new ApiClientError(message, response.status, payload?.data ?? null);
    }

    return payload.data;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    throw new ApiClientError(normalizeErrorMessage(error), 0, null);
  }
}
