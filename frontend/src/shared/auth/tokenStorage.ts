const AUTH_TOKEN_STORAGE_KEY = "nexis-auth-token";

export function getAuthToken() {
  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function setAuthToken(token: string) {
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function clearAuthToken() {
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

export function hasUsableAuthToken() {
  const token = getAuthToken();

  if (!token) {
    return false;
  }

  return !isJwtExpired(token);
}

function isJwtExpired(token: string) {
  const [, payload] = token.split(".");

  if (!payload) {
    return false;
  }

  try {
    const decodedPayload = JSON.parse(decodeBase64Url(payload)) as { exp?: unknown };
    const expiresAt = typeof decodedPayload.exp === "number" ? decodedPayload.exp : null;

    if (expiresAt === null) {
      return false;
    }

    return expiresAt * 1000 <= Date.now();
  } catch {
    return false;
  }
}

function decodeBase64Url(value: string) {
  const normalizedValue = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalizedValue.length % 4)) % 4);

  return window.atob(`${normalizedValue}${padding}`);
}
