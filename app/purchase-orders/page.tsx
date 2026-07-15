"use client";

import { useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  PackageCheck,
  Plus,
  Send,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell/AppShell";
import { useRestro, money, timeAgo } from "@/lib/store";
import {
  Badge,
  Button,
  ConfirmDialog,
  Drawer,
  EmptyState,
  Field,
  Input,
  PillTabs,
  Select,
  cx,
  type BadgeTone,
} from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import type { PurchaseOrder, PurchaseOrderStatus } from "@/lib/types";

const STATUS_TONE: Record<PurchaseOrderStatus, BadgeTone> = {
  draft: "slate",
  sent: "blue",
  confirmed: "indigo",
  received: "green",
  cancelled: "red",
};

type Filter = "all" | PurchaseOrderStatus;

export default function PurchaseOrdersPage() {
  const purchaseOrders = useRestro((s) => s.purchaseOrders);
  const suppliers = useRestro((s) => s.suppliers);
  const inventory = useRestro((s) => s.inventory);
  const addPurchaseOrder = useRestro((s) => s.addPurchaseOrder);
  const setPurchaseOrderStatus = useRestro((s) => s.setPurchaseOrderStatus);
  const deletePurchaseOrder = useRestro((s) => s.deletePurchaseOrder);
  const activeBranchId = useRestro((s) => s.settings.activeBranchId);

  const [filter, setFilter] = useState<Filter>("all");
  const [detail, setDetail] = useState<PurchaseOrder | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [form, setForm] = useState({
    supplierId: "",
    expectedAt: "",
    lines: [] as Array<{ inventoryItemId: string; qty: number }>,
  });

  const filtered = useMemo(
    () =>
      purchaseOrders
        .filter((p) => filter === "all" || p.status === filter)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [purchaseOrders, filter],
  );

  const supplierName = (id: string) => suppliers.find((s) => s.id === id)?.name ?? "—";
  const liveDetail = detail ? purchaseOrders.find((p) => p.id === detail.id) ?? null : null;

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: purchaseOrders.length };
    for (const s of ["draft", "sent", "confirmed", "received", "cancelled"]) {
      c[s] = purchaseOrders.filter((p) => p.status === s).length;
    }
    return c;
  }, [purchaseOrders]);

  const create = () => {
    if (!form.supplierId) return toast.error("Select a supplier");
    const lines = form.lines
      .filter((l) => l.inventoryItemId && l.qty > 0)
      .map((l) => {
        const inv = inventory.find((i) => i.id === l.inventoryItemId)!;
        return { inventoryItemId: l.inventoryItemId, name: inv.name, qty: l.qty, unitCost: inv.costPerUnit };
      });
    if (!lines.length) return toast.error("Add at least one line item");
    addPurchaseOrder({
      supplierId: form.supplierId,
      status: "draft",
      lines,
      expectedAt: form.expectedAt || undefined,
      branchId: activeBranchId,
    });
    toast.success("Purchase order drafted");
    setCreateOpen(false);
    setForm({ supplierId: "", expectedAt: "", lines: [] });
  };

  const advance = (po: PurchaseOrder) => {
    const next: Partial<Record<PurchaseOrderStatus, PurchaseOrderStatus>> = {
      draft: "sent",
      sent: "confirmed",
      confirmed: "received",
    };
    const to = next[po.status];
    if (!to) return;
    setPurchaseOrderStatus(po.id, to);
    toast.success(
      to === "sent"
        ? `${po.number} sent to ${supplierName(po.supplierId)}`
        : to === "confirmed"
          ? `${po.number} confirmed by supplier`
          : `${po.number} received — inventory restocked`,
    );
  };

  const nextLabel: Partial<Record<PurchaseOrderStatus, { label: string; icon: React.ReactNode }>> = {
    draft: { label: "Send", icon: <Send className="w-3.5 h-3.5" /> },
    sent: { label: "Confirm", icon: <Check className="w-3.5 h-3.5" /> },
    confirmed: { label: "Receive", icon: <PackageCheck className="w-3.5 h-3.5" /> },
  };

  return (
    <AppShell title="Purchase Orders">
      <PageHeader
        title="Purchase Orders"
        subtitle="Draft, send, and receive supplier orders. Receiving restocks inventory automatically."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" /> New Purchase Order
          </Button>
        }
      />

      <PillTabs
        className="mb-5 w-fit max-w-full"
        tabs={[
          { key: "all", label: "All", count: counts.all },
          { key: "draft", label: "Draft", count: counts.draft },
          { key: "sent", label: "Sent", count: counts.sent },
          { key: "confirmed", label: "Confirmed", count: counts.confirmed },
          { key: "received", label: "Received", count: counts.received },
        ]}
        active={filter}
        onChange={setFilter}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="w-7 h-7" />}
          title="No purchase orders"
          message="Create one manually or from a low-stock alert in Inventory."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((po) => (
            <div
              key={po.id}
              onClick={() => setDetail(po)}
              className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary transition-all cursor-pointer"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-label-md font-bold text-primary">{po.number}</p>
                  <h3 className="text-title-lg font-semibold text-on-surface">{supplierName(po.supplierId)}</h3>
                </div>
                <Badge tone={STATUS_TONE[po.status]}>{po.status}</Badge>
              </div>
              <p className="text-body-md text-on-surface-variant italic line-clamp-2 mb-3">
                {po.lines.map((l) => `${l.qty}x ${l.name}`).join(", ")}
              </p>
              <div className="flex justify-between items-center pt-3 border-t border-outline-variant">
                <div>
                  <p className="text-title-lg font-bold">{money(po.total)}</p>
                  <p className="text-label-sm text-on-surface-variant">
                    {po.status === "received" && po.receivedAt
                      ? `Received ${timeAgo(po.receivedAt)}`
                      : po.expectedAt
                        ? `Expected ${po.expectedAt}`
                        : `Created ${timeAgo(po.createdAt)}`}
                  </p>
                </div>
                {nextLabel[po.status] && (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      advance(po);
                    }}
                  >
                    {nextLabel[po.status]!.icon}
                    {nextLabel[po.status]!.label}
                  </Button>
                )}
                {po.status === "received" && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail drawer */}
      <Drawer
        open={!!liveDetail}
        onClose={() => setDetail(null)}
        title={liveDetail?.number ?? ""}
        subtitle={liveDetail ? `${supplierName(liveDetail.supplierId)} • ${liveDetail.status}` : undefined}
        footer={
          liveDetail && liveDetail.status !== "received" && liveDetail.status !== "cancelled" ? (
            <>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setPurchaseOrderStatus(liveDetail.id, "cancelled");
                  toast.warning(`${liveDetail.number} cancelled`);
                  setDetail(null);
                }}
              >
                <X className="w-4 h-4" /> Cancel PO
              </Button>
              {nextLabel[liveDetail.status] && (
                <Button className="flex-1" onClick={() => advance(liveDetail)}>
                  {nextLabel[liveDetail.status]!.icon}
                  {nextLabel[liveDetail.status]!.label}
                </Button>
              )}
            </>
          ) : undefined
        }
      >
        {liveDetail && (
          <div className="space-y-5">
            <div className="flex gap-2">
              <Badge tone={STATUS_TONE[liveDetail.status]}>{liveDetail.status.toUpperCase()}</Badge>
              {liveDetail.expectedAt && <Badge tone="slate">ETA {liveDetail.expectedAt}</Badge>}
            </div>
            <div className="bg-surface-container-low rounded-xl divide-y divide-outline-variant overflow-hidden">
              {liveDetail.lines.map((l, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-body-md font-semibold">{l.name}</p>
                    <p className="text-label-sm text-on-surface-variant">
                      {l.qty} × {money(l.unitCost)}
                    </p>
                  </div>
                  <span className="font-bold text-body-md">{money(l.qty * l.unitCost)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-3 bg-white">
                <span className="font-bold text-body-md">Total</span>
                <span className="font-bold text-primary text-title-lg">{money(liveDetail.total)}</span>
              </div>
            </div>
            {liveDetail.status === "draft" && (
              <button
                onClick={() => {
                  setConfirmDelete(liveDetail.id);
                  setDetail(null);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-red-200 text-error rounded-lg text-label-md font-bold hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete Draft
              </button>
            )}
          </div>
        )}
      </Drawer>

      {/* Create drawer */}
      <Drawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New Purchase Order"
        subtitle="Draft an order for a supplier."
        footer={
          <>
            <Button variant="secondary" className="flex-1" onClick={() => setCreateOpen(false)}>
              Discard
            </Button>
            <Button className="flex-1" onClick={create}>
              Create Draft
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Supplier">
            <Select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
              <option value="">Select supplier...</option>
              {suppliers
                .filter((s) => s.active)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Expected Delivery">
            <Input type="date" value={form.expectedAt} onChange={(e) => setForm({ ...form, expectedAt: e.target.value })} />
          </Field>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-label-md font-semibold">Line Items</span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setForm({ ...form, lines: [...form.lines, { inventoryItemId: inventory[0]?.id ?? "", qty: 10 }] })}
              >
                <Plus className="w-3.5 h-3.5" /> Add Line
              </Button>
            </div>
            <div className="space-y-2">
              {form.lines.length === 0 && <p className="text-label-sm italic text-on-surface-variant">No lines yet.</p>}
              {form.lines.map((l, i) => {
                const inv = inventory.find((x) => x.id === l.inventoryItemId);
                return (
                  <div key={i} className="flex gap-2 items-center">
                    <Select
                      value={l.inventoryItemId}
                      onChange={(e) => {
                        const next = [...form.lines];
                        next[i] = { ...next[i], inventoryItemId: e.target.value };
                        setForm({ ...form, lines: next });
                      }}
                      className="flex-1"
                    >
                      {inventory.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.name} — {money(x.costPerUnit)}/{x.unit}
                        </option>
                      ))}
                    </Select>
                    <Input
                      type="number"
                      min={1}
                      value={l.qty}
                      onChange={(e) => {
                        const next = [...form.lines];
                        next[i] = { ...next[i], qty: Number(e.target.value) };
                        setForm({ ...form, lines: next });
                      }}
                      className="!w-20"
                    />
                    <button
                      onClick={() => setForm({ ...form, lines: form.lines.filter((_, xi) => xi !== i) })}
                      className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-red-50 transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {inv && (
                      <span className="text-label-sm font-bold w-16 text-right shrink-0">{money(inv.costPerUnit * l.qty)}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Drawer>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            deletePurchaseOrder(confirmDelete);
            toast.success("Draft deleted");
          }
        }}
        title="Delete draft PO?"
        message="This draft purchase order will be permanently removed."
        confirmLabel="Delete"
        danger
      />
    </AppShell>
  );
}
