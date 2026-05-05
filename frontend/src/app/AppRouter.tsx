import { useEffect, useMemo, useState } from "react";
import { AuthPage } from "../features/auth/AuthPage";
import { useAuth } from "../features/auth/AuthProvider";
import { App } from "./App";

export function AppRouter() {
  const auth = useAuth();
  const [locationKey, setLocationKey] = useState(0);

  useEffect(() => {
    const handlePopState = () => setLocationKey((current) => current + 1);

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const path = useMemo(() => getCurrentPath(), [locationKey]);

  useEffect(() => {
    if (!isKnownPath(path)) {
      navigate(auth.isAuthenticated ? "/pages" : "/login", true);
      return;
    }

    if (!auth.isAuthenticated && path === "/pages") {
      navigate("/login", true);
      return;
    }

    if (auth.isAuthenticated && (path === "/" || path === "/login" || path === "/register")) {
      navigate("/pages", true);
      return;
    }

    if (!auth.isAuthenticated && path === "/") {
      navigate("/login", true);
    }
  }, [auth.isAuthenticated, path]);

  function navigate(pathname: string, replace = false) {
    if (getCurrentPath() === pathname) {
      return;
    }

    if (replace) {
      window.history.replaceState(null, "", pathname);
    } else {
      window.history.pushState(null, "", pathname);
    }

    setLocationKey((current) => current + 1);
  }

  if (auth.isAuthenticated && path === "/pages") {
    return <App />;
  }

  if (!auth.isAuthenticated && path === "/register") {
    return <AuthPage mode="register" onNavigate={navigate} />;
  }

  return <AuthPage mode="login" onNavigate={navigate} />;
}

function getCurrentPath() {
  return window.location.pathname || "/";
}

function isKnownPath(path: string) {
  return path === "/" || path === "/login" || path === "/register" || path === "/pages";
}
