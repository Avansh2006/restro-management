"use client";

// ─── Shared UI primitives styled to the Stitch "Precision SaaS" system ───────

import { useEffect, useRef, useState, type ReactNode } from "react";
import { X, ChevronDown, Search, Check } from "lucide-react";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// ── Buttons ──────────────────────────────────────────────────────────────────

type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "success";

const BTN: Record<BtnVariant, string> = {
  primary:
    "bg-primary text-on-primary hover:bg-primary-container shadow-sm active:scale-[0.98]",
  secondary:
    "bg-white border border-outline-variant text-on-surface-variant hover:bg-surface-container-low active:scale-[0.98]",
  ghost: "text-on-surface-variant hover:bg-surface-container-high active:scale-[0.98]",
  danger:
    "bg-error text-on-error hover:brightness-110 shadow-sm active:scale-[0.98]",
  success:
    "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm active:scale-[0.98]",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
        size === "sm" && "px-3 py-1.5 text-label-md",
        size === "md" && "px-4 py-2 text-label-md",
        size === "lg" && "px-5 py-3 text-body-md font-bold",
        BTN[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

// ── Badges (soft-tint per Stitch spec) ──────────────────────────────────────

export type BadgeTone =
  | "green"
  | "blue"
  | "amber"
  | "red"
  | "purple"
  | "indigo"
  | "slate"
  | "cyan";

const BADGE: Record<BadgeTone, string> = {
  green: "bg-emerald-50 text-emerald-700",
  blue: "bg-blue-50 text-blue-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  purple: "bg-purple-50 text-purple-700",
  indigo: "bg-indigo-50 text-indigo-700",
  slate: "bg-slate-100 text-slate-600",
  cyan: "bg-cyan-50 text-cyan-700",
};

export function Badge({
  tone = "slate",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-bold whitespace-nowrap",
        BADGE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

// ── Form controls ────────────────────────────────────────────────────────────

export function Field({
  label,
  children,
  hint,
  className,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={cx("block space-y-1", className)}>
      <span className="text-label-md font-semibold text-on-surface">{label}</span>
      {children}
      {hint && <span className="block text-label-sm text-outline">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full px-3.5 py-2.5 bg-white border border-outline-variant rounded-lg text-body-md text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:border-primary-container outline-none transition-all";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(inputCls, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(inputCls, props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cx(inputCls, "cursor-pointer", props.className)}>
      {props.children}
    </select>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cx("relative", className)}>
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cx(inputCls, "pl-9 bg-surface-container-low")}
        type="text"
      />
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  description?: string;
}) {
  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cx(
        "relative w-11 h-6 rounded-full transition-colors shrink-0",
        checked ? "bg-primary" : "bg-surface-container-highest",
      )}
    >
      <span
        className={cx(
          "absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full shadow transition-transform",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
  if (!label) return control;
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-label-md font-semibold text-on-surface">{label}</p>
        {description && <p className="text-label-sm text-on-surface-variant">{description}</p>}
      </div>
      {control}
    </div>
  );
}

// ── Tabs (pill style used across Stitch screens) ─────────────────────────────

export function PillTabs<T extends string>({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: Array<{ key: T; label: string; count?: number }>;
  active: T;
  onChange: (t: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex bg-surface-container-low p-1 rounded-lg border border-outline-variant overflow-x-auto custom-scrollbar max-w-full",
        className,
      )}
    >
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cx(
            "px-3 sm:px-4 py-1.5 rounded-md text-label-md font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5",
            active === t.key
              ? "bg-white shadow-sm text-primary"
              : "text-on-surface-variant hover:bg-surface-container-high",
          )}
        >
          {t.label}
          {t.count !== undefined && (
            <span
              className={cx(
                "px-1.5 py-px rounded text-[10px] font-bold",
                active === t.key ? "bg-primary/10 text-primary" : "bg-surface-container-highest text-on-surface-variant",
              )}
            >
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function UnderlineTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: Array<{ key: T; label: string }>;
  active: T;
  onChange: (t: T) => void;
}) {
  return (
    <div className="flex gap-6 border-b border-outline-variant overflow-x-auto custom-scrollbar">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cx(
            "pb-3 px-1 text-label-md font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px",
            active === t.key
              ? "text-primary border-primary"
              : "text-on-surface-variant border-transparent hover:text-primary",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Category chips (POS / inventory filter style) ────────────────────────────

export function ChipRow<T extends string>({
  chips,
  active,
  onChange,
}: {
  chips: Array<{ key: T; label: string }>;
  active: T;
  onChange: (t: T) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
      {chips.map((c) => (
        <button
          key={c.key}
          onClick={() => onChange(c.key)}
          className={cx(
            "px-4 py-2 rounded-full text-label-md font-semibold whitespace-nowrap transition-colors",
            active === c.key
              ? "bg-primary text-on-primary shadow-sm"
              : "bg-surface-container-high text-on-surface-variant hover:bg-surface-variant",
          )}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────────

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm fade-in p-0 sm:p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cx(
          "bg-white w-full sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden pop-in flex flex-col max-h-[92dvh]",
          wide ? "sm:max-w-2xl" : "sm:max-w-lg",
        )}
      >
        <div className="p-5 sm:p-6 flex justify-between items-start border-b border-outline-variant shrink-0">
          <div>
            <h3 className="text-headline-md font-semibold text-on-surface">{title}</h3>
            {subtitle && <p className="text-body-md text-on-surface-variant mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1">{children}</div>
        {footer && (
          <div className="p-4 sm:p-5 bg-surface-container-lowest border-t border-outline-variant flex gap-3 justify-end shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Drawer (right side panel, Stitch menu drawer pattern) ────────────────────

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = "w-full sm:w-[480px]",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[110]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm fade-in" onClick={onClose} />
      <div
        className={cx(
          "absolute right-0 top-0 h-full bg-surface shadow-2xl border-l border-outline-variant flex flex-col slide-in-right",
          width,
        )}
      >
        <div className="p-5 sm:p-6 border-b border-outline-variant flex justify-between items-start bg-white shrink-0">
          <div>
            <h3 className="text-headline-md font-semibold">{title}</h3>
            {subtitle && <p className="text-body-md text-on-surface-variant mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center hover:bg-surface-container-high rounded-full text-on-surface-variant transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 bg-surface-container-lowest">
          {children}
        </div>
        {footer && (
          <div className="p-4 sm:p-5 bg-white border-t border-outline-variant flex gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Confirm dialog ───────────────────────────────────────────────────────────

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  danger,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-body-md text-on-surface-variant">{message}</p>
    </Modal>
  );
}

// ── Dropdown menu ────────────────────────────────────────────────────────────

export function DropdownMenu({
  trigger,
  items,
  align = "right",
}: {
  trigger: ReactNode;
  items: Array<{ label: string; icon?: ReactNode; onClick: () => void; danger?: boolean } | "divider">;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <span onClick={() => setOpen((o) => !o)}>{trigger}</span>
      {open && (
        <div
          className={cx(
            "absolute z-50 mt-1 min-w-[180px] bg-white border border-outline-variant rounded-xl shadow-xl py-1.5 pop-in",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {items.map((item, i) =>
            item === "divider" ? (
              <div key={i} className="h-px bg-outline-variant my-1.5 mx-2" />
            ) : (
              <button
                key={i}
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
                className={cx(
                  "w-full text-left px-3.5 py-2 text-body-md flex items-center gap-2.5 transition-colors",
                  item.danger
                    ? "text-error hover:bg-red-50"
                    : "text-on-surface hover:bg-surface-container-low",
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}

// ── Select-style dropdown button ─────────────────────────────────────────────

export function SelectMenu<T extends string>({
  value,
  options,
  onChange,
  icon,
  className,
}: {
  value: T;
  options: Array<{ key: T; label: string }>;
  onChange: (v: T) => void;
  icon?: ReactNode;
  className?: string;
}) {
  const current = options.find((o) => o.key === value);
  return (
    <DropdownMenu
      align="right"
      trigger={
        <button
          className={cx(
            "flex items-center gap-2 px-3 py-2 bg-surface-container rounded-lg border border-outline-variant cursor-pointer hover:bg-surface-container-high transition-colors text-label-md font-semibold",
            className,
          )}
        >
          {icon}
          <span className="truncate">{current?.label}</span>
          <ChevronDown className="w-4 h-4 text-outline shrink-0" />
        </button>
      }
      items={options.map((o) => ({
        label: o.label,
        icon:
          o.key === value ? (
            <Check className="w-4 h-4 text-primary" />
          ) : (
            <span className="w-4" />
          ),
        onClick: () => onChange(o.key),
      }))}
    />
  );
}

// ── Cards / misc ─────────────────────────────────────────────────────────────

export function Card({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={cx(
        "bg-white rounded-xl border border-outline-variant shadow-sm",
        padded && "p-4 sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-outline mb-4">
        {icon}
      </div>
      <p className="text-title-lg font-semibold text-on-surface">{title}</p>
      {message && <p className="text-body-md text-on-surface-variant mt-1 max-w-sm">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  trend,
  trendUp,
  extra,
  className,
}: {
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  extra?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "bg-white p-4 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow",
        className,
      )}
    >
      <p className="text-on-surface-variant text-label-md font-semibold mb-1">{label}</p>
      <h3 className="text-headline-lg font-semibold text-on-surface">{value}</h3>
      {(trend || extra) && (
        <div className="flex items-center justify-between mt-3">
          {trend && (
            <span
              className={cx(
                "text-xs font-bold flex items-center gap-0.5",
                trendUp ? "text-emerald-600" : "text-error",
              )}
            >
              {trendUp ? "▲" : "▼"} {trend}
            </span>
          )}
          {extra}
        </div>
      )}
    </div>
  );
}

export function Avatar({
  name,
  color,
  size = "md",
  className,
}: {
  name: string;
  color?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const sz =
    size === "sm"
      ? "w-8 h-8 text-[11px]"
      : size === "md"
        ? "w-10 h-10 text-xs"
        : size === "lg"
          ? "w-14 h-14 text-base"
          : "w-20 h-20 text-xl";
  return (
    <div
      className={cx(
        "rounded-full flex items-center justify-center font-bold text-white shrink-0 border-2 border-white shadow-sm",
        sz,
        className,
      )}
      style={{ backgroundColor: color ?? "#4f46e5" }}
    >
      {initials}
    </div>
  );
}

export function ProgressBar({
  pct,
  tone = "primary",
  className,
}: {
  pct: number;
  tone?: "primary" | "amber" | "red" | "green";
  className?: string;
}) {
  const color =
    tone === "primary"
      ? "bg-primary"
      : tone === "amber"
        ? "bg-amber-500"
        : tone === "red"
          ? "bg-error"
          : "bg-emerald-500";
  return (
    <div className={cx("w-full bg-surface-container rounded-full h-1.5 overflow-hidden", className)}>
      <div
        className={cx("h-full rounded-full transition-all", color)}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}

export function StarRating({ rating, className }: { rating: number; className?: string }) {
  return (
    <div className={cx("flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={cx("w-4 h-4", i <= rating ? "text-primary" : "text-outline-variant")}
          fill="currentColor"
        >
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
    </div>
  );
}
