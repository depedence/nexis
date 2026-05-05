import React from "react";
import ReactDOM from "react-dom/client";
import { AppRouter } from "./app/AppRouter";
import { AuthProvider } from "./features/auth/AuthProvider";
import { ThemeProvider } from "./shared/ui/ThemeProvider";
import { ToastProvider } from "./shared/ui/ToastProvider";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>
);
