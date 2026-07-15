"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Bell,
  ChevronDown,
  Menu,
  Plus,
  Search,
  Store,
  Utensils,
  X,
  AlertTriangle,
  Timer,
  CalendarCheck,
  Zap,
} from "lucide-react";
import { EXPERIENCES, FOOTER_NAV, MOBILE_NAV, NAV_SECTIONS } from "./nav";
import { cx, DropdownMenu, Avatar } from "@/components/ui";
import { useRestro, money } from "@/lib/store";
import { toast } from "@/components/ui/Toast";

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const branches = useRestro((s) => s.branches);
  const activeBranchId = useRestro((s) => s.settings.activeBranchId);
  const branch = branches.find((b) => b.id === activeBranchId);

  return (
    <>
      <div className="flex items-center h-16 px-5 gap-3 border-b border-outline-variant shrink-0">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
          <Utensils className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-headline-md font-bold text-primary leading-tight">RestroOS</h1>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold truncate">
            {branch?.name ?? "Downtown Branch"}
          </p>
        </div>
      </div>
      <nav className="flex-1 py-3 overflow-y-auto custom-scrollbar">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si}>
            {section.title && (
              <div className="pt-4 pb-1 px-5 text-[10px] font-bold text-outline uppercase tracking-widest">
                {section.title}
              </div>
            )}
            <div className="space-y-0.5 px-2">
              {section.items.map((item) => {
                const active =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cx(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-body-md transition-colors",
                      active
                        ? "bg-secondary-container text-on-secondary-container border-l-2 border-primary font-semibold"
                        : "text-on-surface-variant hover:bg-surface-container-high border-l-2 border-transparent",
                    )}
                  >
                    <Icon className={cx("w-5 h-5 shrink-0", active && "text-primary")} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-2 border-t border-outline-variant shrink-0">
        {FOOTER_NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cx(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-body-md transition-colors",
                active
                  ? "bg-secondary-container text-on-secondary-container font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container-high",
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}

// ─── Experience switcher ─────────────────────────────────────────────────────

export function ExperienceSwitcher({ compact }: { compact?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const current =
    EXPERIENCES.find((e) => e.href !== "/" && pathname.startsWith(e.href)) ??
    EXPERIENCES[0];

  return (
    <DropdownMenu
      align="right"
      trigger={
        <button
          className={cx(
            "flex items-center gap-2 rounded-lg border border-outline-variant cursor-pointer transition-colors bg-primary-fixed/60 hover:bg-primary-fixed text-on-primary-fixed-variant",
            compact ? "px-2.5 py-2" : "px-3 py-1.5",
          )}
          title="Switch demo experience"
        >
          <Zap className="w-4 h-4" />
          {!compact && (
            <>
              <span className="text-label-md font-bold whitespace-nowrap">{current.label}</span>
              <ChevronDown className="w-4 h-4 opacity-60" />
            </>
          )}
        </button>
      }
      items={EXPERIENCES.map((e) => ({
        label: e.label,
        icon: <e.icon className="w-4 h-4 text-primary" />,
        onClick: () => {
          router.push(e.href);
          toast.info(`Switched to ${e.label}`, e.description);
        },
      }))}
    />
  );
}

// ─── Global search ───────────────────────────────────────────────────────────

function GlobalSearch() {
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const router = useRouter();
  const menuItems = useRestro((s) => s.menuItems);
  const employees = useRestro((s) => s.employees);
  const customers = useRestro((s) => s.customers);
  const orders = useRestro((s) => s.orders);

  const results = useMemo(() => {
    if (q.trim().length < 2) return [];
    const needle = q.toLowerCase();
    const out: Array<{ label: string; sub: string; href: string }> = [];
    for (const o of orders) {
      if (`#${o.number}`.includes(needle) || o.customerName?.toLowerCase().includes(needle))
        out.push({ label: `Order #${o.number}`, sub: `${o.status} • ${money(o.total)}`, href: "/orders" });
    }
    for (const m of menuItems) {
      if (m.name.toLowerCase().includes(needle))
        out.push({ label: m.name, sub: `Menu • ${money(m.price)}`, href: "/menu" });
    }
    for (const e of employees) {
      if (e.name.toLowerCase().includes(needle))
        out.push({ label: e.name, sub: `Employee • ${e.role}`, href: `/employees/${e.id}` });
    }
    for (const c of customers) {
      if (c.name.toLowerCase().includes(needle))
        out.push({ label: c.name, sub: `Customer • ${c.tier}`, href: "/customers" });
    }
    return out.slice(0, 7);
  }, [q, menuItems, employees, customers, orders]);

  return (
    <div className="relative w-full max-w-[320px]">
      <div className="relative flex items-center bg-surface-container rounded-full px-3.5 py-2">
        <Search className="w-4 h-4 text-outline shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          className="bg-transparent border-none outline-none text-sm w-full placeholder:text-outline ml-2"
          placeholder="Search orders, items, staff..."
          type="text"
        />
        {q && (
          <button onClick={() => setQ("")} className="text-outline hover:text-on-surface">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {focused && results.length > 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-outline-variant rounded-xl shadow-xl py-1.5 z-50 pop-in">
          {results.map((r, i) => (
            <button
              key={i}
              onMouseDown={() => {
                router.push(r.href);
                setQ("");
              }}
              className="w-full text-left px-3.5 py-2 hover:bg-surface-container-low transition-colors"
            >
              <p className="text-body-md font-semibold text-on-surface">{r.label}</p>
              <p className="text-label-sm text-on-surface-variant">{r.sub}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Notifications ───────────────────────────────────────────────────────────

function NotificationsMenu() {
  const inventory = useRestro((s) => s.inventory);
  const orders = useRestro((s) => s.orders);
  const reservations = useRestro((s) => s.reservations);
  const leave = useRestro((s) => s.leaveRequests);
  const router = useRouter();

  const lowStock = inventory.filter((i) => i.stock < i.minStock);
  const newOrders = orders.filter((o) => o.status === "new");
  const pendingRes = reservations.filter((r) => r.status === "pending");
  const pendingLeave = leave.filter((l) => l.status === "pending");
  const count = lowStock.length + newOrders.length + pendingRes.length + pendingLeave.length;

  const items: Array<{ label: string; icon: React.ReactNode; onClick: () => void }> = [];
  if (newOrders.length)
    items.push({
      label: `${newOrders.length} new order${newOrders.length > 1 ? "s" : ""} awaiting acceptance`,
      icon: <Timer className="w-4 h-4 text-primary" />,
      onClick: () => router.push("/orders"),
    });
  if (lowStock.length)
    items.push({
      label: `${lowStock.length} inventory item${lowStock.length > 1 ? "s" : ""} below minimum`,
      icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
      onClick: () => router.push("/inventory"),
    });
  if (pendingRes.length)
    items.push({
      label: `${pendingRes.length} reservation${pendingRes.length > 1 ? "s" : ""} pending confirmation`,
      icon: <CalendarCheck className="w-4 h-4 text-purple-600" />,
      onClick: () => router.push("/reservations"),
    });
  if (pendingLeave.length)
    items.push({
      label: `${pendingLeave.length} leave request${pendingLeave.length > 1 ? "s" : ""} to review`,
      icon: <Bell className="w-4 h-4 text-blue-600" />,
      onClick: () => router.push("/leave"),
    });
  if (!items.length)
    items.push({ label: "You're all caught up 🎉", icon: <Bell className="w-4 h-4 text-outline" />, onClick: () => {} });

  return (
    <DropdownMenu
      align="right"
      trigger={
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors relative">
          <Bell className="w-5 h-5" />
          {count > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-error rounded-full border-2 border-surface text-[9px] font-bold text-white flex items-center justify-center">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      }
      items={items}
    />
  );
}

// ─── Branch selector ─────────────────────────────────────────────────────────

function BranchSelector() {
  const branches = useRestro((s) => s.branches);
  const settings = useRestro((s) => s.settings);
  const updateSettings = useRestro((s) => s.updateSettings);
  const active = branches.find((b) => b.id === settings.activeBranchId);

  return (
    <DropdownMenu
      align="right"
      trigger={
        <button className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-surface-container rounded-lg border border-outline-variant cursor-pointer hover:bg-surface-container-high transition-colors">
          <Store className="w-4 h-4 text-primary" />
          <span className="text-label-md font-semibold">{active?.name ?? "Branch"}</span>
          <ChevronDown className="w-4 h-4 text-outline" />
        </button>
      }
      items={branches.map((b) => ({
        label: `${b.name}${b.status === "closed" ? " (closed)" : ""}`,
        icon: <Store className={cx("w-4 h-4", b.id === settings.activeBranchId ? "text-primary" : "text-outline")} />,
        onClick: () => {
          updateSettings({ activeBranchId: b.id });
          toast.success(`Switched to ${b.name}`);
        },
      }))}
    />
  );
}

// ─── Shell ───────────────────────────────────────────────────────────────────

export function AppShell({
  children,
  title,
  actions,
  fullBleed,
}: {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
  fullBleed?: boolean;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[260px] xl:w-[280px] bg-surface border-r border-outline-variant flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile drawer nav */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm fade-in" onClick={() => setMobileNavOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[280px] bg-surface flex flex-col slide-in-left shadow-2xl">
            <SidebarContent onNavigate={() => setMobileNavOpen(false)} />
          </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col h-dvh overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="flex justify-between items-center h-16 px-3 sm:px-6 bg-surface border-b border-outline-variant shrink-0 gap-2">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <button
              className="lg:hidden w-10 h-10 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors shrink-0"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            {title && (
              <h2 className="text-title-lg font-semibold text-on-surface lg:hidden truncate">{title}</h2>
            )}
            <div className="hidden md:block flex-1 max-w-[320px]">
              <GlobalSearch />
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {actions}
            <ExperienceSwitcher compact />
            <BranchSelector />
            <NotificationsMenu />
            <div className="hidden sm:block h-8 w-px bg-outline-variant" />
            <DropdownMenu
              align="right"
              trigger={
                <button className="flex items-center gap-3 cursor-pointer">
                  <div className="text-right hidden xl:block">
                    <p className="text-label-md font-semibold text-on-surface leading-tight">Alex Sterling</p>
                    <p className="text-[10px] text-on-surface-variant font-medium">Owner</p>
                  </div>
                  <Avatar name="Alex Sterling" color="#4f46e5" />
                </button>
              }
              items={[
                { label: "Settings", icon: <Store className="w-4 h-4" />, onClick: () => router.push("/settings") },
                { label: "Audit logs", icon: <Bell className="w-4 h-4" />, onClick: () => router.push("/audit-logs") },
              ]}
            />
          </div>
        </header>

        {/* Content */}
        <div
          className={cx(
            "flex-1 overflow-y-auto custom-scrollbar min-h-0",
            !fullBleed && "p-4 sm:p-6 pb-24 lg:pb-6",
            fullBleed && "pb-16 lg:pb-0 flex flex-col",
          )}
        >
          {children}
        </div>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-outline-variant flex justify-around items-stretch h-16 pb-[env(safe-area-inset-bottom)]">
          {MOBILE_NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cx(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 transition-colors",
                  active ? "text-primary" : "text-on-surface-variant",
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMobileNavOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 text-on-surface-variant"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-semibold">More</span>
          </button>
        </nav>
      </main>
    </div>
  );
}

// Page header used inside content area
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 mb-5">
      <div>
        <h2 className="text-headline-lg font-semibold text-on-surface">{title}</h2>
        {subtitle && <p className="text-body-md text-on-surface-variant mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function QuickCreateButton({ onClick, label = "Quick Create" }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="hidden sm:flex bg-primary text-white px-4 py-2 rounded-xl text-label-md font-bold hover:bg-primary-container transition-all items-center gap-1.5 shadow-lg shadow-primary/20"
    >
      <Plus className="w-4 h-4" />
      {label}
    </button>
  );
}
