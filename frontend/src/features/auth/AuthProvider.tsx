import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AUTH_UNAUTHORIZED_EVENT } from "../../shared/api/apiClient";
import {
  clearAuthTokens,
  getAuthToken,
  getRefreshToken,
  hasAuthSession,
  setAuthTokens
} from "../../shared/auth/tokenStorage";
import { login as loginRequest, logout as logoutRequest, register as registerRequest } from "./authApi";

type AuthContextValue = {
  token: string | null;
  isAuthenticated: boolean;
  login: (payload: { username: string; password: string }) => Promise<void>;
  register: (payload: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    hasAuthSession() ? getAuthToken() : null
  );

  const clearSession = useCallback(() => {
    clearAuthTokens();
    setToken(null);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();

    try {
      if (refreshToken) {
        await logoutRequest(refreshToken);
      }
    } catch {
      // Local logout must complete even if the server-side session is already gone.
    } finally {
      clearSession();
    }
  }, [clearSession]);

  useEffect(() => {
    if (token || hasAuthSession()) {
      return;
    }

    clearSession();
  }, [clearSession, token]);

  useEffect(() => {
    const handleUnauthorized = () => clearSession();

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [clearSession]);

  const login = useCallback(async (payload: { username: string; password: string }) => {
    const nextTokens = await loginRequest(payload);

    setAuthTokens(nextTokens);
    setToken(nextTokens.accessToken);
  }, []);

  const register = useCallback(async (payload: { username: string; password: string }) => {
    const nextTokens = await registerRequest(payload);

    setAuthTokens(nextTokens);
    setToken(nextTokens.accessToken);
  }, []);

  const value = useMemo(
    () => ({
      token,
      isAuthenticated: hasAuthSession(),
      login,
      register,
      logout
    }),
    [login, logout, register, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return value;
}
