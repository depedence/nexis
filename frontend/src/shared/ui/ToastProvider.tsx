import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

type ToastVariant = "success" | "error";

type ToastInput = {
  title: string;
  description: string;
  variant: ToastVariant;
};

type ToastItem = ToastInput & {
  id: number;
  leaving: boolean;
};

type ToastContextValue = {
  showToast: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);
const TOAST_LIFETIME_MS = 2600;
const TOAST_LEAVE_MS = 220;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(1);
  const timeoutsRef = useRef<number[]>([]);

  const showToast = useCallback((toast: ToastInput) => {
    const id = nextIdRef.current++;

    setToasts((current) => [...current, { ...toast, id, leaving: false }]);

    const enterTimeout = window.setTimeout(() => {
      setToasts((current) =>
        current.map((item) => (item.id === id ? { ...item, leaving: true } : item))
      );

      const leaveTimeout = window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== id));
      }, TOAST_LEAVE_MS);
      timeoutsRef.current.push(leaveTimeout);
    }, TOAST_LIFETIME_MS);
    timeoutsRef.current.push(enterTimeout);
  }, []);

  useEffect(
    () => () => {
      timeoutsRef.current.forEach((timeout) => window.clearTimeout(timeout));
    },
    []
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <article
            key={toast.id}
            className={`toast toast--${toast.variant} ${toast.leaving ? "is-leaving" : ""}`}
          >
            <div className="toast__icon">
              {toast.variant === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            </div>
            <div className="toast__body">
              <strong>{toast.title}</strong>
              <p>{toast.description}</p>
            </div>
            <button
              type="button"
              className="toast__close"
              aria-label="Dismiss notification"
              title="Dismiss"
              onClick={() => {
                setToasts((current) => current.filter((item) => item.id !== toast.id));
              }}
            >
              <X size={14} />
            </button>
          </article>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);

  if (!value) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return value;
}
