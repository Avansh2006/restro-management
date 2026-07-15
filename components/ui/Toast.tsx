"use client";

import { create } from "zustand";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";

type ToastKind = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  detail?: string;
}

interface ToastState {
  toasts: Toast[];
  push: (kind: ToastKind, title: string, detail?: string) => void;
  dismiss: (id: number) => void;
}

let toastId = 0;

export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push: (kind, title, detail) => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, kind, title, detail }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (title: string, detail?: string) => useToasts.getState().push("success", title, detail),
  error: (title: string, detail?: string) => useToasts.getState().push("error", title, detail),
  info: (title: string, detail?: string) => useToasts.getState().push("info", title, detail),
  warning: (title: string, detail?: string) => useToasts.getState().push("warning", title, detail),
};

const ICONS: Record<ToastKind, React.ReactNode> = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
  error: <XCircle className="w-5 h-5 text-error shrink-0" />,
  info: <Info className="w-5 h-5 text-primary shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
};

export function ToastViewport() {
  const { toasts, dismiss } = useToasts();
  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[200] flex flex-col gap-2 sm:w-[360px] pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast-in pointer-events-auto bg-white border border-outline-variant rounded-xl shadow-lg p-3.5 flex items-start gap-3"
        >
          {ICONS[t.kind]}
          <div className="flex-1 min-w-0">
            <p className="text-body-md font-semibold text-on-surface leading-tight">{t.title}</p>
            {t.detail && <p className="text-label-sm text-on-surface-variant mt-0.5">{t.detail}</p>}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
