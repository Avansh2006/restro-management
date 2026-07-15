"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ChefHat, Pause, Play } from "lucide-react";
import { useRestro, elapsedMins, elapsedMmSs } from "@/lib/store";
import { cx } from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import { ExperienceSwitcher } from "@/components/shell/AppShell";
import type { Order } from "@/lib/types";

type StationFilter = "all" | "Grill" | "Cold" | "Saute" | "Bar" | "Pastry" | "Fry";

export default function KdsPage() {
  const orders = useRestro((s) => s.orders);
  const tables = useRestro((s) => s.tables);
  const menuItems = useRestro((s) => s.menuItems);
  const settings = useRestro((s) => s.settings);
  const setOrderStatus = useRestro((s) => s.setOrderStatus);
  const setItemStatus = useRestro((s) => s.setOrderItemKitchenStatus);
  const [station, setStation] = useState<StationFilter>("all");
  const [paused, setPaused] = useState(false);
  const [, tick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const tickets = useMemo(
    () =>
      orders
        .filter((o) => o.status === "new" || o.status === "preparing")
        .filter((o) => {
          if (station === "all") return true;
          return o.items.some((it) => menuItems.find((m) => m.id === it.menuItemId)?.station === station);
        })
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [orders, station, menuItems],
  );

  const pendingItems = useMemo(() => {
    let count = 0;
    const byStation = new Map<string, number>();
    for (const o of orders) {
      if (o.status !== "new" && o.status !== "preparing") continue;
      for (const it of o.items) {
        if (it.kitchenStatus === "done") continue;
        count += it.qty;
        const st = menuItems.find((m) => m.id === it.menuItemId)?.station ?? "Other";
        byStation.set(st, (byStation.get(st) ?? 0) + it.qty);
      }
    }
    return { count, byStation: [...byStation.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4) };
  }, [orders, menuItems]);

  const avgTicket = useMemo(() => {
    if (!tickets.length) return "00:00";
    const avg = tickets.reduce((s, t) => s + elapsedMins(t.createdAt), 0) / tickets.length;
    return `${String(Math.floor(avg)).padStart(2, "0")}:${String(Math.round((avg % 1) * 60)).padStart(2, "0")}`;
  }, [tickets]);

  const location = (o: Order) =>
    o.tableId ? `Table ${tables.find((t) => t.id === o.tableId)?.name?.replace(/^T-/, "") ?? ""}` : o.channel === "qr" ? "QR Order" : o.customerName ?? o.channel;

  const ticketState = (o: Order) => {
    const mins = elapsedMins(o.createdAt);
    if (mins >= settings.kdsCriticalMinutes) return "overdue";
    if (mins >= settings.kdsWarnMinutes) return "warning";
    return o.status === "preparing" ? "cooking" : "new";
  };

  return (
    <div className="h-dvh flex flex-col bg-[#1e2124] text-inverse-on-surface overflow-hidden">
      {/* Top bar */}
      <header className="flex justify-between items-center h-16 px-4 sm:px-6 bg-inverse-surface border-b border-outline shrink-0 gap-3">
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <Link
            href="/"
            className="p-2 -ml-2 rounded-lg text-surface-variant hover:bg-white/10 transition-colors shrink-0"
            title="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <ChefHat className="w-5 h-5 text-inverse-primary shrink-0" />
            <h2 className="text-title-lg font-semibold text-inverse-on-surface truncate">Kitchen Display</h2>
          </div>
          <div className="hidden md:flex gap-1 bg-white/5 p-1 rounded-lg">
            {(["all", "Grill", "Saute", "Fry", "Cold", "Bar", "Pastry"] as StationFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStation(s)}
                className={cx(
                  "px-3 py-1.5 rounded text-label-md font-semibold transition-colors",
                  station === s ? "bg-primary text-on-primary" : "text-surface-variant hover:text-white",
                )}
              >
                {s === "all" ? "All Orders" : s}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <ExperienceSwitcher compact />
          <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-xs">
            MR
          </div>
        </div>
      </header>

      {/* Mobile station tabs */}
      <div className="md:hidden flex gap-1 bg-white/5 p-1.5 mx-3 mt-3 rounded-lg overflow-x-auto custom-scrollbar shrink-0">
        {(["all", "Grill", "Saute", "Fry", "Cold", "Bar", "Pastry"] as StationFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setStation(s)}
            className={cx(
              "px-3 py-1.5 rounded text-label-md font-semibold whitespace-nowrap transition-colors",
              station === s ? "bg-primary text-on-primary" : "text-surface-variant",
            )}
          >
            {s === "all" ? "All" : s}
          </button>
        ))}
      </div>

      {/* Tickets */}
      <div className="flex-1 min-h-0 flex flex-row overflow-x-auto overflow-y-hidden p-3 sm:p-5 gap-4 custom-scrollbar">
        {paused && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <Pause className="w-14 h-14 text-surface-variant" />
            <p className="text-headline-md text-surface-variant font-semibold">Incoming orders paused</p>
            <button
              onClick={() => {
                setPaused(false);
                toast.success("Kitchen resumed");
              }}
              className="bg-primary text-on-primary px-6 py-3 rounded-lg font-bold flex items-center gap-2 active:scale-95 transition-transform"
            >
              <Play className="w-5 h-5" /> RESUME ORDERS
            </button>
          </div>
        )}
        {!paused && tickets.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <CheckCircle2 className="w-14 h-14 text-emerald-500" />
            <p className="text-headline-md text-surface-variant font-semibold">All caught up — no open tickets</p>
          </div>
        )}
        {!paused &&
          tickets.map((o) => {
            const state = ticketState(o);
            return (
              <div
                key={o.id}
                className={cx(
                  "flex-none w-[300px] sm:w-[340px] flex flex-col bg-white rounded-xl overflow-hidden shadow-lg max-h-full",
                  state === "overdue"
                    ? "border-2 border-error pulse-urgent"
                    : state === "warning"
                      ? "border-2 border-tertiary-container"
                      : "border border-outline-variant",
                )}
              >
                <div
                  className={cx(
                    "p-4 flex justify-between items-start border-b",
                    state === "overdue"
                      ? "bg-error-container border-error"
                      : state === "warning"
                        ? "bg-tertiary-fixed border-tertiary-container"
                        : state === "cooking"
                          ? "bg-secondary-container border-outline-variant"
                          : "bg-surface-container-high border-outline-variant",
                  )}
                >
                  <div>
                    <p
                      className={cx(
                        "text-label-md font-bold",
                        state === "overdue" ? "text-error" : state === "warning" ? "text-tertiary" : "text-on-surface-variant",
                      )}
                    >
                      ORDER #{o.number}
                    </p>
                    <h3
                      className={cx(
                        "text-title-lg font-bold",
                        state === "overdue" ? "text-error" : state === "warning" ? "text-tertiary" : "text-primary",
                      )}
                    >
                      {location(o)}
                    </h3>
                  </div>
                  <div className="text-right">
                    <p
                      className={cx(
                        "text-[26px] leading-8 font-bold tabular-nums",
                        state === "overdue" ? "text-error" : state === "warning" ? "text-tertiary" : "text-on-surface",
                      )}
                    >
                      {elapsedMmSs(o.createdAt)}
                    </p>
                    <p
                      className={cx(
                        "text-label-sm font-semibold",
                        state === "overdue" ? "text-error" : state === "warning" ? "text-tertiary" : "text-on-surface-variant",
                      )}
                    >
                      {state === "overdue" ? "OVERDUE" : state === "warning" ? "WARNING" : state === "cooking" ? "COOKING" : "NEW"}
                    </p>
                  </div>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar text-on-surface min-h-0">
                  {o.items.map((it, i) => {
                    const itemStation = menuItems.find((m) => m.id === it.menuItemId)?.station ?? "—";
                    if (station !== "all" && itemStation !== station) return null;
                    return (
                      <div key={i} className={cx(i > 0 && "border-t border-dashed border-outline-variant pt-4")}>
                        <div className="flex justify-between items-start gap-2">
                          <button
                            className={cx(
                              "text-body-lg font-bold text-left transition-colors",
                              it.kitchenStatus === "done" ? "line-through text-outline" : "text-on-surface hover:text-primary",
                            )}
                            onClick={() =>
                              setItemStatus(
                                o.id,
                                i,
                                it.kitchenStatus === "queued" ? "cooking" : it.kitchenStatus === "cooking" ? "done" : "queued",
                              )
                            }
                            title="Tap to advance item status"
                          >
                            {it.qty}x {it.name}
                          </button>
                          <span
                            className={cx(
                              "text-label-md font-bold px-2 py-0.5 rounded shrink-0",
                              it.kitchenStatus === "done"
                                ? "bg-emerald-100 text-emerald-700"
                                : it.kitchenStatus === "cooking"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-secondary-container text-on-secondary-container",
                            )}
                          >
                            {it.kitchenStatus === "done" ? "DONE" : it.kitchenStatus === "cooking" ? "FIRE" : itemStation.toUpperCase()}
                          </span>
                        </div>
                        {it.modifiers && it.modifiers.length > 0 && (
                          <ul className="ml-4 mt-1 space-y-0.5 text-on-surface-variant text-body-md list-disc">
                            {it.modifiers.map((m, mi) => (
                              <li key={mi} className={cx(/no /i.test(m) && "text-error font-semibold uppercase")}>{m}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                  {o.notes && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-label-md text-amber-800 font-semibold">
                      ⚠ {o.notes}
                    </div>
                  )}
                </div>

                <div className="p-3.5 bg-surface-container-low grid grid-cols-2 gap-2.5 shrink-0">
                  {o.status === "new" ? (
                    <>
                      <button
                        onClick={() => {
                          setOrderStatus(o.id, "preparing");
                          toast.info(`Order #${o.number} started`);
                        }}
                        className="bg-secondary text-on-secondary py-3 rounded-lg text-label-md font-bold hover:bg-secondary/90 active:scale-95 transition-all"
                      >
                        START
                      </button>
                      <button
                        onClick={() => {
                          setOrderStatus(o.id, "ready");
                          toast.success(`Order #${o.number} ready for pickup`);
                        }}
                        className="bg-primary text-on-primary py-3 rounded-lg text-label-md font-bold hover:bg-primary/90 active:scale-95 transition-all"
                      >
                        READY
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setOrderStatus(o.id, "ready");
                        toast.success(`Order #${o.number} ready for pickup`);
                      }}
                      className="col-span-2 bg-primary text-on-primary py-3 rounded-lg text-label-md font-bold hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      MARK AS READY
                    </button>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* Summary footer */}
      <footer className="h-auto sm:h-20 bg-inverse-surface border-t border-outline flex flex-col sm:flex-row items-stretch sm:items-center px-4 sm:px-6 py-3 sm:py-0 justify-between gap-3 shrink-0">
        <div className="flex gap-4 sm:gap-8 overflow-x-auto items-center custom-scrollbar">
          <div className="flex items-center gap-2 pr-4 sm:border-r border-outline/30 shrink-0">
            <span className="text-label-md font-semibold text-surface-variant uppercase tracking-wider hidden sm:inline">
              Kitchen:
            </span>
            <span className="flex items-center gap-1.5 text-on-primary-fixed bg-primary-fixed px-3 py-1 rounded-full text-xs font-bold">
              <span className={cx("w-2 h-2 rounded-full", paused ? "bg-amber-500" : "bg-primary animate-pulse")} />
              {paused ? "PAUSED" : "LIVE"}
            </span>
          </div>
          <div className="flex flex-col shrink-0">
            <span className="text-label-sm text-surface-variant">PENDING</span>
            <span className="text-headline-md font-semibold text-white">{pendingItems.count} ITEMS</span>
          </div>
          <div className="hidden md:flex items-center gap-3">
            {pendingItems.byStation.map(([st, n]) => (
              <div key={st} className="bg-white/5 px-4 py-2 rounded-lg border border-outline/20 whitespace-nowrap">
                <span className="text-body-md text-inverse-primary font-bold">{n}</span>
                <span className="text-label-md text-surface-variant ml-2">{st}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 sm:gap-6 justify-between sm:justify-end">
          <div className="text-right">
            <p className="text-label-sm text-surface-variant">Avg Ticket Time</p>
            <p className="text-title-lg font-semibold text-white tabular-nums">{avgTicket}</p>
          </div>
          <button
            onClick={() => {
              setPaused((p) => !p);
              toast[paused ? "success" : "warning"](paused ? "Kitchen resumed" : "Incoming orders paused");
            }}
            className={cx(
              "px-5 sm:px-7 py-3 rounded-lg font-bold flex items-center gap-2 active:scale-95 transition-transform shadow-lg text-sm",
              paused ? "bg-emerald-600 text-white" : "bg-error text-on-error",
            )}
          >
            {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            {paused ? "RESUME" : "PAUSE ORDERS"}
          </button>
        </div>
      </footer>
    </div>
  );
}
