"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, CheckCircle2, Info, Siren, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastTone = "info" | "success" | "warning" | "critical";

export type ToastAction = {
  label: string;
  onClick: () => void;
};

export type Toast = {
  id: number;
  title: string;
  body?: string;
  tone: ToastTone;
  /** Auto-dismiss after ms. 0/undefined = sticky. */
  ttl?: number;
  actions?: ToastAction[];
};

type ToastApi = { notify: (toast: Omit<Toast, "id" | "tone"> & { tone?: ToastTone }) => number; dismiss: (id: number) => void };

const ToastContext = createContext<ToastApi | null>(null);

const TONE_ICON = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  critical: Siren,
} as const;

const TONE_STYLE: Record<ToastTone, string> = {
  info: "border-brand-100 text-brand-800",
  success: "border-emerald-200 text-emerald-800",
  warning: "border-amber-200 text-amber-800",
  critical: "border-red-300 text-red-700",
};

/** Max simultaneously visible toasts; oldest beyond this drop immediately. */
const MAX_VISIBLE = 3;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const notify = useCallback<ToastApi["notify"]>(
    (toast) => {
      const id = nextId.current++;
      const ttl = toast.ttl ?? 4500;
      setToasts((prev) => [...prev.slice(-(MAX_VISIBLE - 1)), { ...toast, id, tone: toast.tone ?? "info" }]);
      if (ttl > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), ttl)
        );
      }
      return id;
    },
    [dismiss]
  );

  // Clear every pending timer on unmount.
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const api = useMemo<ToastApi>(() => ({ notify, dismiss }), [notify, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        role="region"
        aria-label="Notifications"
        className="pointer-events-none fixed inset-x-3 top-3 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:top-4 sm:items-end"
      >
        {toasts.map((t) => {
          const Icon = TONE_ICON[t.tone];
          return (
            <div
              key={t.id}
              role="status"
              className={cn(
                "pointer-events-auto w-full max-w-sm rounded-2xl border bg-white/95 p-3 shadow-float backdrop-blur-xl",
                TONE_STYLE[t.tone]
              )}
            >
              <div className="flex items-start gap-2.5">
                <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink">{t.title}</p>
                  {t.body && <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{t.body}</p>}
                  {t.actions && t.actions.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      {t.actions.map((a) => (
                        <button
                          key={a.label}
                          onClick={() => {
                            a.onClick();
                            dismiss(t.id);
                          }}
                          className="rounded-full bg-brand-700 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-brand-800 active:scale-95"
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="-m-1 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
