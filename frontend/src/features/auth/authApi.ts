import { apiClient } from "../../shared/api/apiClient";

type LoginPayload = {
  username: string;
  password: string;
};

type RegisterPayload = {
  username: string;
  password: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type AuthResponse = unknown;

export async function login(payload: LoginPayload) {
  return extractTokens(
    await apiClient<AuthResponse>("/auth/login", {
      method: "POST",
      body: payload,
      auth: false,
      handleUnauthorized: false
    })
  );
}

export async function register(payload: RegisterPayload) {
  return extractTokens(
    await apiClient<AuthResponse>("/auth/register", {
      method: "POST",
      body: payload,
      auth: false,
      handleUnauthorized: false
    })
  );
}

export async function logout(refreshToken: string) {
  await apiClient<void>("/auth/logout", {
    method: "POST",
    body: { refreshToken },
    auth: false,
    handleUnauthorized: false
  });
}

function extractTokens(response: AuthResponse): AuthTokens {
  const payload = findTokenPayload(response);

  if (!payload) {
    throw new Error("Auth response does not contain tokens.");
  }

  const accessToken =
    getString(payload.accessToken) ??
    getString(payload.token) ??
    getString(payload.access_token) ??
    getString(payload.jwt);
  const refreshToken = getString(payload.refreshToken);

  if (!accessToken || !refreshToken) {
    throw new Error("Auth response does not contain tokens.");
  }

  return { accessToken, refreshToken };
}

function findTokenPayload(response: unknown): Record<string, unknown> | null {
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
      return candidate as Record<string, unknown>;
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

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}
