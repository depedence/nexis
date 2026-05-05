import { apiClient } from "../../shared/api/apiClient";

type LoginPayload = {
  username: string;
  password: string;
};

type RegisterPayload = {
  username: string;
  password: string;
};

type AuthResponse = unknown;

export async function login(payload: LoginPayload) {
  return extractToken(
    await apiClient<AuthResponse>("/auth/login", {
      method: "POST",
      body: payload,
      auth: false,
      handleUnauthorized: false
    })
  );
}

export async function register(payload: RegisterPayload) {
  return extractToken(
    await apiClient<AuthResponse>("/auth/register", {
      method: "POST",
      body: payload,
      auth: false,
      handleUnauthorized: false
    })
  );
}

function extractToken(response: AuthResponse) {
  if (typeof response === "string") {
    return response;
  }

  if (!response || typeof response !== "object") {
    throw new Error("Auth response does not contain a token.");
  }

  const payload = response as Record<string, unknown>;
  const token =
    getString(payload.token) ??
    getString(payload.accessToken) ??
    getString(payload.jwt) ??
    getString(payload.access_token);

  if (!token) {
    throw new Error("Auth response does not contain a token.");
  }

  return token;
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}
