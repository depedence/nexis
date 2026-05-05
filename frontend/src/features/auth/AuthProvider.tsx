import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AUTH_UNAUTHORIZED_EVENT } from "../../shared/api/apiClient";
import {
  clearAuthToken,
  getAuthToken,
  hasUsableAuthToken,
  setAuthToken
} from "../../shared/auth/tokenStorage";
import { login as loginRequest, register as registerRequest } from "./authApi";

type AuthContextValue = {
  token: string | null;
  isAuthenticated: boolean;
  login: (payload: { username: string; password: string }) => Promise<void>;
  register: (payload: { username: string; password: string }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    hasUsableAuthToken() ? getAuthToken() : null
  );

  const logout = useCallback(() => {
    clearAuthToken();
    setToken(null);
  }, []);

  useEffect(() => {
    if (token || !getAuthToken()) {
      return;
    }

    clearAuthToken();
  }, [token]);

  useEffect(() => {
    const handleUnauthorized = () => logout();

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [logout]);

  const login = useCallback(async (payload: { username: string; password: string }) => {
    const nextToken = await loginRequest(payload);

    setAuthToken(nextToken);
    setToken(nextToken);
  }, []);

  const register = useCallback(async (payload: { username: string; password: string }) => {
    const nextToken = await registerRequest(payload);

    setAuthToken(nextToken);
    setToken(nextToken);
  }, []);

  const value = useMemo(
    () => ({
      token,
      isAuthenticated: Boolean(token) && hasUsableAuthToken(),
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
