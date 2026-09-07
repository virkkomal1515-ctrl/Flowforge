"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastTone = "success" | "error" | "info" | "warning";

type Toast = {
  id: number;
  title: string;
  message?: string;
  tone: ToastTone;
};

type ToastContextValue = {
  toast: (input: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);
let nextToastId = 1;

const toneClasses: Record<ToastTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-950",
  error: "border-red-200 bg-red-50 text-red-950",
  info: "border-indigo-200 bg-indigo-50 text-indigo-950",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
};

export function ToastProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((input: Omit<Toast, "id">) => {
    const id = nextToastId++;
    setToasts((current) => [...current, { ...input, id }].slice(-4));
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 4500);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-end gap-3 sm:left-auto sm:max-w-sm" aria-live="polite" aria-atomic="false">
        {toasts.map((item) => (
          <div key={item.id} className={`pointer-events-auto w-full rounded-xl border px-4 py-3 shadow-lg backdrop-blur ${toneClasses[item.tone]}`} role={item.tone === "error" ? "alert" : "status"}>
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className="mt-0.5 text-sm font-bold">{item.tone === "success" ? "✓" : item.tone === "error" ? "!" : item.tone === "warning" ? "△" : "i"}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{item.title}</p>
                {item.message ? <p className="mt-0.5 text-xs opacity-80">{item.message}</p> : null}
              </div>
              <button type="button" className="rounded-md px-1 text-sm opacity-60 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current" onClick={() => setToasts((current) => current.filter((toastItem) => toastItem.id !== item.id))} aria-label="Dismiss notification">×</button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
