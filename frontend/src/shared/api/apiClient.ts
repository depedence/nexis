import { API_BASE_URL } from "./config";
import {
  clearAuthTokens,
  getAuthToken,
  getRefreshToken,
  setAuthTokens
} from "../auth/tokenStorage";

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

type RefreshResponse = {
  accessToken?: unknown;
  token?: unknown;
  access_token?: unknown;
  jwt?: unknown;
  refreshToken?: unknown;
};

let refreshRequest: Promise<string | null> | null = null;

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

  const responseText = await response.text();

  if (!responseText) {
    return undefined as T;
  }

  return JSON.parse(responseText) as T;
}

type ApiFetchOptions = RequestInit & {
  auth?: boolean;
  handleUnauthorized?: boolean;
};

export async function apiFetch(path: string, options: ApiFetchOptions = {}) {
  const { auth = true, handleUnauthorized = true, headers, ...fetchOptions } = options;
  const response = await sendApiRequest(path, { ...fetchOptions, headers }, auth);

  if (auth && handleUnauthorized && response.status === 401) {
    const nextAccessToken = await refreshAccessToken();

    if (nextAccessToken) {
      return sendApiRequest(path, { ...fetchOptions, headers }, auth);
    }

    window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
  }

  return response;
}

async function sendApiRequest(path: string, options: RequestInit, auth: boolean) {
  const { headers, ...fetchOptions } = options;
  const requestHeaders = new Headers(headers);
  const token = auth ? getAuthToken() : null;

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers: requestHeaders
  });

  return response;
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearAuthTokens();
    return null;
  }

  refreshRequest ??= requestTokenRefresh(refreshToken).finally(() => {
    refreshRequest = null;
  });

  return refreshRequest;
}

async function requestTokenRefresh(refreshToken: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) {
      clearAuthTokens();
      return null;
    }

    const payload = findTokenPayload((await response.json()) as unknown);
    if (!payload) {
      clearAuthTokens();
      return null;
    }

    const accessToken =
      getString(payload.accessToken) ??
      getString(payload.token) ??
      getString(payload.access_token) ??
      getString(payload.jwt);
    const nextRefreshToken = getString(payload.refreshToken) ?? refreshToken;

    if (!accessToken) {
      clearAuthTokens();
      return null;
    }

    setAuthTokens({ accessToken, refreshToken: nextRefreshToken });
    return accessToken;
  } catch {
    clearAuthTokens();
    return null;
  }
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

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function findTokenPayload(response: unknown): RefreshResponse | null {
  if (!response || typeof response !== "object") {
    return null;
  }

  const payload = response as Record<string, unknown>;

  if (hasTokenShape(payload)) {
    return payload;
  }

  const nestedCandidates = [payload.data, payload.result, payload.payload, payload.auth];
  for (const candidate of nestedCandidates) {
    if (candidate && typeof candidate === "object" && hasTokenShape(candidate as Record<string, unknown>)) {
      return candidate as RefreshResponse;
    }
  }

  return payload;
}

function hasTokenShape(payload: Record<string, unknown>) {
  return Boolean(
    getString(payload.refreshToken) &&
      (getString(payload.accessToken) ||
        getString(payload.token) ||
        getString(payload.access_token) ||
        getString(payload.jwt))
  );
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
