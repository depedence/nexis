import { API_BASE_URL } from "./config";
import { getAuthToken } from "../auth/tokenStorage";

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  auth?: boolean;
  handleUnauthorized?: boolean;
};

type ApiErrorPayload = {
  message?: string;
  error?: string;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiClient<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await apiFetch(path, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json"
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
    auth: options.auth,
    handleUnauthorized: options.handleUnauthorized
  });

  if (!response.ok) {
    throw new ApiError(await readApiError(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

type ApiFetchOptions = RequestInit & {
  auth?: boolean;
  handleUnauthorized?: boolean;
};

export async function apiFetch(path: string, options: ApiFetchOptions = {}) {
  const { auth = true, handleUnauthorized = true, headers, ...fetchOptions } = options;
  const requestHeaders = new Headers(headers);
  const token = auth ? getAuthToken() : null;

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers: requestHeaders
  });

  if (handleUnauthorized && response.status === 401) {
    window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
  }

  return response;
}

export async function readApiError(response: Response, fallback?: string) {
  try {
    const payload = (await response.json()) as ApiErrorPayload | null;
    return (
      normalizeErrorMessage(payload?.message) ??
      normalizeErrorMessage(payload?.error) ??
      fallback ??
      getFallbackErrorMessage(response.status)
    );
  } catch {
    return fallback ?? getFallbackErrorMessage(response.status);
  }
}

export const AUTH_UNAUTHORIZED_EVENT = "nexis:unauthorized";

function normalizeErrorMessage(message: unknown) {
  if (typeof message !== "string") {
    return null;
  }

  const trimmedMessage = message.trim();
  return trimmedMessage || null;
}

function getFallbackErrorMessage(status: number) {
  if (status === 400) {
    return "Check the entered data and try again.";
  }

  if (status === 401) {
    return "Invalid login or password.";
  }

  if (status === 403) {
    return "You do not have access to this action.";
  }

  if (status >= 500) {
    return "Server error. Please try again later.";
  }

  return `Request failed with status ${status}`;
}
