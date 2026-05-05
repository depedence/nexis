import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, Lock, Moon, Sun, UserRound } from "lucide-react";
import { ApiError } from "../../shared/api/apiClient";
import { useTheme } from "../../shared/ui/ThemeProvider";
import { useAuth } from "./AuthProvider";

type AuthMode = "login" | "register";

type AuthPageProps = {
  mode: AuthMode;
  onNavigate: (path: string, replace?: boolean) => void;
};

type FieldErrors = {
  username?: string;
  password?: string;
  confirmPassword?: string;
};

export function AuthPage({ mode, onNavigate }: AuthPageProps) {
  const auth = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRegister = mode === "register";
  const title = isRegister ? "Create account" : "Welcome back";
  const submitLabel = isRegister ? "Register" : "Login";
  const switchLabel = isRegister ? "Already have an account?" : "No account yet?";
  const switchPath = isRegister ? "/login" : "/register";
  const switchAction = isRegister ? "Login" : "Register";
  const usernameLabel = isRegister ? "Username" : "Username or email";

  const canSubmit = useMemo(
    () => username.trim().length > 0 && password.length > 0 && (!isRegister || confirmPassword.length > 0),
    [confirmPassword.length, isRegister, password.length, username]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextFieldErrors = validateForm({
      username,
      password,
      confirmPassword,
      mode
    });

    setFieldErrors(nextFieldErrors);
    setFormError(null);

    if (Object.keys(nextFieldErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        username: username.trim(),
        password
      };

      if (isRegister) {
        await auth.register(payload);
      } else {
        await auth.login(payload);
      }

      onNavigate("/pages", true);
    } catch (error) {
      setFormError(getAuthErrorMessage(error, isRegister));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-panel__top">
          <div className="auth-brand">
            <span className="sidebar__brand-mark">N</span>
            <div>
              <div className="sidebar__brand-title">Nexis</div>
              <div className="sidebar__brand-caption">Workspace</div>
            </div>
          </div>

          <button
            type="button"
            className="theme-switch"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>

        <form className="auth-form" noValidate onSubmit={handleSubmit}>
          <div className="auth-form__header">
            <h1 id="auth-title">{title}</h1>
            <p>{isRegister ? "Start writing in your workspace." : "Sign in to continue writing."}</p>
          </div>

          {formError ? <div className="auth-form__error">{formError}</div> : null}

          <label className="auth-field">
            <span>{usernameLabel}</span>
            <span className={`auth-input ${fieldErrors.username ? "is-invalid" : ""}`}>
              <UserRound size={15} />
              <input
                autoComplete={isRegister ? "username" : "username"}
                value={username}
                aria-invalid={Boolean(fieldErrors.username)}
                onChange={(event) => {
                  setUsername(event.target.value);
                  clearFieldError("username");
                }}
              />
            </span>
            {fieldErrors.username ? <span className="auth-field__error">{fieldErrors.username}</span> : null}
          </label>

          <label className="auth-field">
            <span>Password</span>
            <span className={`auth-input ${fieldErrors.password ? "is-invalid" : ""}`}>
              <Lock size={15} />
              <input
                type="password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                value={password}
                aria-invalid={Boolean(fieldErrors.password)}
                onChange={(event) => {
                  setPassword(event.target.value);
                  clearFieldError("password");
                }}
              />
            </span>
            {fieldErrors.password ? <span className="auth-field__error">{fieldErrors.password}</span> : null}
          </label>

          {isRegister ? (
            <label className="auth-field">
              <span>Confirm password</span>
              <span className={`auth-input ${fieldErrors.confirmPassword ? "is-invalid" : ""}`}>
                <Lock size={15} />
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  aria-invalid={Boolean(fieldErrors.confirmPassword)}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    clearFieldError("confirmPassword");
                  }}
                />
              </span>
              {fieldErrors.confirmPassword ? (
                <span className="auth-field__error">{fieldErrors.confirmPassword}</span>
              ) : null}
            </label>
          ) : null}

          <button
            type="submit"
            className="auth-submit"
            disabled={isSubmitting || !canSubmit}
            title={submitLabel}
          >
            <span>{isSubmitting ? "Please wait..." : submitLabel}</span>
            <ArrowRight size={15} />
          </button>

          <div className="auth-switch">
            <span>{switchLabel}</span>
            <button type="button" title={switchAction} onClick={() => onNavigate(switchPath)}>
              {switchAction}
            </button>
          </div>
        </form>
      </section>
    </main>
  );

  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const { [field]: _removed, ...rest } = current;
      return rest;
    });
  }
}

function validateForm({
  username,
  password,
  confirmPassword,
  mode
}: {
  username: string;
  password: string;
  confirmPassword: string;
  mode: AuthMode;
}) {
  const errors: FieldErrors = {};
  const trimmedUsername = username.trim();

  if (!trimmedUsername) {
    errors.username = "Enter a username.";
  } else if (trimmedUsername.length < 3) {
    errors.username = "Username must be at least 3 characters.";
  }

  if (!password) {
    errors.password = "Enter a password.";
  } else if (password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  if (mode === "register") {
    if (!confirmPassword) {
      errors.confirmPassword = "Confirm your password.";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
  }

  return errors;
}

function getAuthErrorMessage(error: unknown, isRegister: boolean) {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return error.message || "Check the entered data and try again.";
    }

    if (error.status === 401 || error.status === 403) {
      return isRegister
        ? "Registration is not available for this account."
        : "Invalid username or password.";
    }

    if (error.status >= 500) {
      return "Server error. Please try again later.";
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}
