"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Armchair,
  ArrowRight,
  Bike,
  CheckCircle2,
  Printer,
  ShoppingBag,
  Timer,
  QrCode,
  ListOrdered,
  XCircle,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell/AppShell";
import { useRestro, money, elapsedMmSs, elapsedMins, timeAgo } from "@/lib/store";
import { Badge, Button, ConfirmDialog, Drawer, EmptyState, PillTabs, SearchInput, cx } from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import type { Order, OrderChannel } from "@/lib/types";

const CHANNEL_ICON: Record<OrderChannel, React.ReactNode> = {
  "dine-in": <Armchair className="w-4 h-4" />,
  takeaway: <ShoppingBag className="w-4 h-4" />,
  delivery: <Bike className="w-4 h-4" />,
  qr: <QrCode className="w-4 h-4" />,
};

type ChannelFilter = "all" | OrderChannel;

export default function LiveOrdersPage() {
  const orders = useRestro((s) => s.orders);
  const tables = useRestro((s) => s.tables);
  const setOrderStatus = useRestro((s) => s.setOrderStatus);
  const cancelOrder = useRestro((s) => s.cancelOrder);
  const [channel, setChannel] = useState<ChannelFilter>("all");
  const [q, setQ] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [, tick] = useState(0);

  // live timers
  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const tableName = (id?: string) => tables.find((t) => t.id === id)?.name;

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return orders.filter((o) => {
      if (channel !== "all" && o.channel !== channel) return false;
      if (!needle) return true;
      return (
        `#${o.number}`.includes(needle) ||
        o.customerName?.toLowerCase().includes(needle) ||
        tableName(o.tableId)?.toLowerCase().includes(needle) ||
        o.items.some((it) => it.name.toLowerCase().includes(needle))
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, channel, q, tables]);

  const columns: Array<{ key: string; title: string; statuses: Order["status"][]; countCls: string }> = [
    { key: "new", title: "New", statuses: ["new"], countCls: "bg-surface-container-highest text-on-surface" },
    { key: "kitchen", title: "Kitchen", statuses: ["preparing"], countCls: "bg-secondary-container text-on-secondary-container" },
    { key: "ready", title: "Ready", statuses: ["ready"], countCls: "bg-emerald-100 text-emerald-800" },
    { key: "done", title: "Served / Out", statuses: ["served", "paid"], countCls: "bg-surface-container-highest text-on-surface" },
  ];

  const detail = orders.find((o) => o.id === detailId) ?? null;

  const advance = (o: Order) => {
    const next: Partial<Record<Order["status"], Order["status"]>> = {
      new: "preparing",
      preparing: "ready",
      ready: "served",
    };
    const to = next[o.status];
    if (!to) return;
    setOrderStatus(o.id, to);
    toast.success(
      to === "preparing" ? `Order #${o.number} sent to kitchen` : to === "ready" ? `Order #${o.number} marked ready` : `Order #${o.number} handed over`,
    );
  };

  const actionLabel: Partial<Record<Order["status"], string>> = {
    new: "Accept",
    preparing: "Ready",
    ready: "Hand Over",
  };

  return (
    <AppShell title="Live Orders" fullBleed>
      <div className="p-4 sm:p-6 pb-2 shrink-0">
        <PageHeader
          title="Live Orders"
          subtitle="Track every order from acceptance to hand-over."
          actions={
            <div className="flex flex-wrap gap-2 items-center">
              <SearchInput value={q} onChange={setQ} placeholder="Search orders..." className="w-full sm:w-60" />
              <PillTabs
                tabs={[
                  { key: "all", label: "All" },
                  { key: "dine-in", label: "Dine-in" },
                  { key: "takeaway", label: "Takeaway" },
                  { key: "delivery", label: "Delivery" },
                  { key: "qr", label: "QR" },
                ]}
                active={channel}
                onChange={setChannel}
              />
            </div>
          }
        />
      </div>

      {/* Kanban: horizontal scroll desktop, stacked mobile */}
      <section className="flex-1 min-h-0 overflow-x-auto overflow-y-auto lg:overflow-y-hidden custom-scrollbar px-4 sm:px-6 pb-6 flex flex-col lg:flex-row gap-5">
        {columns.map((col) => {
          const colOrders = filtered
            .filter((o) => col.statuses.includes(o.status))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          return (
            <div key={col.key} className="flex flex-col lg:h-full lg:w-[320px] xl:w-[340px] shrink-0 min-h-0">
              <div className="flex items-center gap-2 mb-3 shrink-0">
                <h3 className="text-title-lg font-semibold uppercase tracking-wider text-on-surface-variant text-sm">
                  {col.title}
                </h3>
                <span className={cx("px-2 py-0.5 rounded text-label-sm font-bold", col.countCls)}>
                  {String(colOrders.length).padStart(2, "0")}
                </span>
              </div>
              <div className={cx("lg:flex-1 lg:overflow-y-auto space-y-3 custom-scrollbar lg:pr-1 min-h-0", col.key === "done" && "opacity-70")}>
                {colOrders.length === 0 && (
                  <div className="border-2 border-dashed border-outline-variant rounded-xl p-6 text-center text-label-md text-outline">
                    No {col.title.toLowerCase()} orders
                  </div>
                )}
                {colOrders.map((o) => {
                  const late = (o.status === "new" || o.status === "preparing") && elapsedMins(o.createdAt) > 12;
                  const done = o.status === "served" || o.status === "paid";
                  if (done)
                    return (
                      <div
                        key={o.id}
                        className="bg-surface-container-low border border-outline-variant rounded-xl p-4 cursor-pointer hover:shadow-sm transition-shadow"
                        onClick={() => setDetailId(o.id)}
                      >
                        <div className="flex justify-between items-center">
                          <p className="text-label-md font-semibold text-on-surface-variant">
                            #{o.number} • {tableName(o.tableId) ?? o.customerName ?? o.channel}
                          </p>
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <p className="text-label-sm text-on-surface-variant mt-1">
                          {o.status === "paid" ? "Paid" : "Served"} {timeAgo(o.updatedAt)} • {money(o.total)}
                        </p>
                      </div>
                    );
                  return (
                    <div
                      key={o.id}
                      onClick={() => setDetailId(o.id)}
                      className={cx(
                        "bg-white border border-outline-variant rounded-xl p-4 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md",
                        o.status === "preparing" && "border-l-4 border-l-primary",
                        o.status === "ready" && "border-l-4 border-l-emerald-500",
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-label-md font-bold text-primary">#{o.number}</p>
                          <div className="flex items-center gap-1.5 text-on-surface font-semibold mt-1 text-sm">
                            {CHANNEL_ICON[o.channel]}
                            <span>{tableName(o.tableId) ?? o.customerName ?? o.channel}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          {o.status === "ready" ? (
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-label-sm font-bold">
                              READY
                            </span>
                          ) : (
                            <span
                              className={cx(
                                "px-2 py-1 rounded text-label-sm font-bold flex items-center gap-1",
                                late ? "bg-error-container text-on-error-container animate-pulse" : "bg-surface-container-highest text-on-surface-variant",
                              )}
                            >
                              <Timer className="w-3 h-3" />
                              {elapsedMmSs(o.createdAt)}
                            </span>
                          )}
                          <span className="text-label-sm text-on-surface-variant mt-1 capitalize">{o.channel}</span>
                        </div>
                      </div>
                      <div className="py-2 border-y border-outline-variant/60 my-2">
                        <p className="text-body-md text-on-surface-variant italic line-clamp-2">
                          {o.items.map((it) => `${it.qty}x ${it.name}`).join(", ")}
                        </p>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-title-lg font-bold">{money(o.total)}</p>
                        <div className="flex gap-1.5">
                          <button
                            className="p-1.5 rounded-lg border border-outline-variant hover:bg-surface-container-high transition-colors"
                            title="Print ticket"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.info(`Ticket for #${o.number} sent to printer`);
                            }}
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              advance(o);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-on-primary rounded-lg text-label-sm font-bold hover:bg-primary-container transition-colors"
                          >
                            {actionLabel[o.status]}
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState icon={<ListOrdered className="w-7 h-7" />} title="No orders match" message="Try a different search or filter." />
          </div>
        )}
      </section>

      {/* Order detail drawer */}
      <Drawer
        open={!!detail}
        onClose={() => setDetailId(null)}
        title="Order Details"
        subtitle={detail ? `#${detail.number} • ${detail.channel}` : undefined}
        width="w-full sm:w-[420px]"
        footer={
          detail && detail.status !== "paid" && detail.status !== "cancelled" ? (
            <>
              <Button variant="secondary" className="flex-1" onClick={() => toast.info(`Receipt for #${detail.number} printed`)}>
                <Printer className="w-4 h-4" /> Print
              </Button>
              {detail.status !== "served" ? (
                <Button
                  className="flex-1"
                  onClick={() => {
                    advance(detail);
                  }}
                >
                  {actionLabel[detail.status] ?? "Next"} <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button className="flex-1" onClick={() => setDetailId(null)}>
                  Close
                </Button>
              )}
            </>
          ) : undefined
        }
      >
        {detail && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-on-surface-variant text-label-md font-semibold uppercase tracking-wide">
                  {detail.tableId ? "Table" : "Customer"}
                </h4>
                <p className="text-headline-md font-bold">
                  {tableName(detail.tableId) ?? detail.customerName ?? "Walk-in"}
                </p>
              </div>
              <div className="text-right">
                <h4 className="text-on-surface-variant text-label-md font-semibold uppercase tracking-wide">Elapsed</h4>
                <p className={cx("font-bold text-headline-md", elapsedMins(detail.createdAt) > 12 && detail.status !== "paid" ? "text-error" : "text-on-surface")}>
                  {elapsedMmSs(detail.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Badge
                tone={
                  detail.status === "new"
                    ? "blue"
                    : detail.status === "preparing"
                      ? "indigo"
                      : detail.status === "ready"
                        ? "green"
                        : detail.status === "cancelled"
                          ? "red"
                          : "slate"
                }
              >
                {detail.status.toUpperCase()}
              </Badge>
              {detail.paymentMethod && <Badge tone="green">PAID • {detail.paymentMethod}</Badge>}
            </div>

            <div className="bg-surface-container-low rounded-xl p-4 space-y-4">
              {detail.items.map((it, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white border border-outline-variant flex items-center justify-center font-bold text-primary text-sm shrink-0">
                    {it.qty}x
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <span className="font-semibold text-body-md">{it.name}</span>
                      <span className="font-bold text-primary text-body-md shrink-0">{money(it.price * it.qty)}</span>
                    </div>
                    {it.modifiers && it.modifiers.length > 0 && (
                      <p className="text-label-sm text-on-surface-variant">{it.modifiers.join(" • ")}</p>
                    )}
                    <Badge
                      tone={it.kitchenStatus === "done" ? "green" : it.kitchenStatus === "cooking" ? "amber" : "slate"}
                      className="mt-1"
                    >
                      {it.kitchenStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {detail.notes && (
              <div>
                <h4 className="text-on-surface-variant text-label-md font-semibold uppercase tracking-wide mb-2">
                  Kitchen Notes
                </h4>
                <div className="p-4 border border-outline-variant rounded-lg bg-white italic text-body-md text-on-surface-variant">
                  “{detail.notes}”
                </div>
              </div>
            )}

            <div className="space-y-2 pt-4 border-t border-outline-variant">
              <div className="flex justify-between text-body-md text-on-surface-variant">
                <span>Subtotal</span>
                <span>{money(detail.subtotal)}</span>
              </div>
              <div className="flex justify-between text-body-md text-on-surface-variant">
                <span>Tax (8%)</span>
                <span>{money(detail.tax)}</span>
              </div>
              {detail.discount > 0 && (
                <div className="flex justify-between text-body-md text-emerald-700">
                  <span>Discount</span>
                  <span>-{money(detail.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-headline-md font-bold pt-2">
                <span>Total</span>
                <span className="text-primary">{money(detail.total)}</span>
              </div>
            </div>

            {detail.status !== "paid" && detail.status !== "cancelled" && (
              <button
                onClick={() => setConfirmCancel(detail.id)}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-red-200 text-error rounded-lg text-label-md font-bold hover:bg-red-50 transition-colors"
              >
                <XCircle className="w-4 h-4" /> Cancel Order
              </button>
            )}
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!confirmCancel}
        onClose={() => setConfirmCancel(null)}
        onConfirm={() => {
          if (confirmCancel) {
            const o = orders.find((x) => x.id === confirmCancel);
            cancelOrder(confirmCancel);
            setDetailId(null);
            toast.warning(`Order #${o?.number} cancelled`);
          }
        }}
        title="Cancel this order?"
        message="The order will be voided and any linked table will be released. This action is recorded in the audit log."
        confirmLabel="Cancel Order"
        danger
      />
    </AppShell>
  );
}
