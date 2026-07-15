"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Armchair,
  BrushCleaning,
  CalendarClock,
  ChevronRight,
  CreditCard,
  Info,
  LogIn,
  Merge,
  MoveRight,
  Plus,
  Receipt,
  Trash2,
  Users,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell/AppShell";
import { useRestro, money, elapsedMins } from "@/lib/store";
import {
  Badge,
  Button,
  ConfirmDialog,
  Field,
  Input,
  Modal,
  PillTabs,
  Select,
  cx,
} from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import type { DiningTable, TableStatus, TableZone } from "@/lib/types";

const STATUS_BADGE: Record<TableStatus, { label: string; tone: "green" | "blue" | "amber" | "purple" }> = {
  available: { label: "Available", tone: "green" },
  occupied: { label: "Occupied", tone: "blue" },
  dirty: { label: "Dirty", tone: "amber" },
  reserved: { label: "Reserved", tone: "purple" },
};

type ZoneFilter = "Main Dining" | "Patio" | "Bar Area";

export default function TablesPage() {
  const router = useRouter();
  const tables = useRestro((s) => s.tables);
  const orders = useRestro((s) => s.orders);
  const reservations = useRestro((s) => s.reservations);
  const setTableStatus = useRestro((s) => s.setTableStatus);
  const addTable = useRestro((s) => s.addTable);
  const deleteTable = useRestro((s) => s.deleteTable);
  const seatReservation = useRestro((s) => s.seatReservation);
  const activeBranchId = useRestro((s) => s.settings.activeBranchId);

  const [zone, setZone] = useState<ZoneFilter>("Main Dining");
  const [selectedId, setSelectedId] = useState<string | null>(tables.find((t) => t.status === "occupied")?.id ?? null);
  const [addOpen, setAddOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", seats: 4, zone: "Main Dining" as TableZone, shape: "square" as DiningTable["shape"] });

  const zoneTables = useMemo(() => tables.filter((t) => t.zone === zone), [tables, zone]);
  const selected = tables.find((t) => t.id === selectedId) ?? null;
  const selectedOrder = selected?.currentOrderId ? orders.find((o) => o.id === selected.currentOrderId) : null;

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = reservations
    .filter((r) => r.date === today && (r.status === "confirmed" || r.status === "pending"))
    .sort((a, b) => a.time.localeCompare(b.time));

  const doAction = (action: string) => {
    if (!selected) {
      toast.warning("Select a table first");
      return;
    }
    switch (action) {
      case "check-in":
        if (selected.status === "occupied") return toast.warning(`${selected.name} is already occupied`);
        setTableStatus(selected.id, "occupied");
        toast.success(`Guests checked in at ${selected.name}`);
        break;
      case "clean":
        setTableStatus(selected.id, "available");
        toast.success(`${selected.name} cleaned & available`);
        break;
      case "bill":
        if (selectedOrder) router.push("/pos");
        else toast.info(`No open bill on ${selected.name}`);
        break;
      case "transfer":
        toast.info("Pick a target table on the floor to transfer (demo: instant)", `${selected.name} order stays put`);
        break;
      case "merge":
        toast.info("Merge mode", "In a live setup you'd tap a second table to merge bills.");
        break;
    }
  };

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="p-4 sm:p-5 border-b border-outline-variant">
        <h3 className="text-title-lg font-bold text-on-surface mb-4">Table Actions</h3>
        <div className="grid grid-cols-2 gap-2.5">
          <ActionTile icon={<LogIn className="w-5 h-5" />} label="Check-in" primary onClick={() => doAction("check-in")} />
          <ActionTile icon={<Merge className="w-5 h-5" />} label="Merge" onClick={() => doAction("merge")} />
          <ActionTile icon={<MoveRight className="w-5 h-5" />} label="Transfer" onClick={() => doAction("transfer")} />
          <ActionTile icon={<Receipt className="w-5 h-5" />} label="Quick Bill" onClick={() => doAction("bill")} />
        </div>

        {selected && (
          <div className="mt-4 p-4 bg-surface-container-low rounded-xl border border-outline-variant">
            <div className="flex justify-between items-center mb-2">
              <div>
                <span className="text-label-sm text-outline uppercase font-bold">Active Selection</span>
                <p className="text-headline-md font-bold text-primary">{selected.name}</p>
              </div>
              <Info className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-1.5 text-body-md text-on-surface-variant">
              <Row label="Status">
                <Badge tone={STATUS_BADGE[selected.status].tone}>{STATUS_BADGE[selected.status].label}</Badge>
              </Row>
              <Row label="Seats">
                <span className="font-semibold text-on-surface">{selected.seats}</span>
              </Row>
              {selected.server && (
                <Row label="Server">
                  <span className="font-semibold text-on-surface">{selected.server}</span>
                </Row>
              )}
              {selected.occupiedSince && (
                <Row label="Duration">
                  <span className="font-semibold text-on-surface">{elapsedMins(selected.occupiedSince)}m</span>
                </Row>
              )}
              {selectedOrder && (
                <Row label="Bill">
                  <span className="font-bold text-primary">{money(selectedOrder.total)}</span>
                </Row>
              )}
            </div>
            <div className="flex gap-2 mt-3">
              {selected.status === "dirty" && (
                <Button size="sm" variant="success" className="flex-1" onClick={() => doAction("clean")}>
                  <BrushCleaning className="w-4 h-4" /> Mark Clean
                </Button>
              )}
              {selected.status === "occupied" && selectedOrder && (
                <Button size="sm" className="flex-1" onClick={() => router.push("/pos")}>
                  <CreditCard className="w-4 h-4" /> Pay Bill
                </Button>
              )}
              {selected.status === "available" && (
                <Button
                  size="sm"
                  variant="danger"
                  className="flex-1"
                  onClick={() => setConfirmDelete(selected.id)}
                >
                  <Trash2 className="w-4 h-4" /> Remove
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-title-lg font-bold text-on-surface">Upcoming</h3>
          <span className="bg-primary-container text-white text-label-sm px-2.5 py-1 rounded-full font-bold">
            {upcoming.length} today
          </span>
        </div>
        <div className="space-y-3">
          {upcoming.length === 0 && (
            <p className="text-body-md text-on-surface-variant">No reservations for today.</p>
          )}
          {upcoming.map((r) => (
            <div
              key={r.id}
              className="group p-3.5 border border-outline-variant rounded-xl hover:border-primary transition-colors cursor-pointer bg-white"
              onClick={() => {
                seatReservation(r.id);
                toast.success(`${r.customerName} seated`);
              }}
              title="Click to seat this party"
            >
              <div className="flex justify-between items-start mb-1">
                <p className="text-body-md font-bold text-on-surface">{r.customerName}</p>
                <span className="text-label-md font-semibold text-primary">{r.time}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-label-sm text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {r.partySize}p
                  </span>
                  <span className="flex items-center gap-1">
                    <Armchair className="w-3.5 h-3.5" />
                    {tables.find((t) => t.id === r.tableId)?.name ?? "Any"}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-outline group-hover:text-primary transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-surface-container-highest border-t border-outline-variant">
        <Button variant="secondary" className="w-full" onClick={() => router.push("/reservations")}>
          <CalendarClock className="w-4 h-4" />
          View Full Schedule
        </Button>
      </div>
    </div>
  );

  return (
    <AppShell title="Tables" fullBleed>
      <div className="flex-1 flex flex-col xl:flex-row min-h-0 overflow-hidden">
        {/* Floor area */}
        <section className="flex-1 flex flex-col p-4 sm:p-6 gap-4 overflow-y-auto custom-scrollbar min-h-0">
          <PageHeader
            title="Tables Management"
            subtitle="Live floor status across zones."
            actions={
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="w-4 h-4" /> Add Table
              </Button>
            }
          />
          <div className="flex items-center justify-between flex-wrap gap-3">
            <PillTabs
              tabs={[
                { key: "Main Dining", label: "Main Dining", count: tables.filter((t) => t.zone === "Main Dining").length },
                { key: "Patio", label: "Patio", count: tables.filter((t) => t.zone === "Patio").length },
                { key: "Bar Area", label: "Bar Area", count: tables.filter((t) => t.zone === "Bar Area").length },
              ]}
              active={zone}
              onChange={setZone}
            />
            <div className="hidden md:flex items-center gap-4">
              <Legend cls="bg-emerald-500" label="Available" />
              <Legend cls="bg-primary" label="Occupied" />
              <Legend cls="bg-amber-500" label="Dirty" />
              <Legend cls="bg-purple-500" label="Reserved" />
            </div>
          </div>

          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {zoneTables.map((t) => {
              const order = t.currentOrderId ? orders.find((o) => o.id === t.currentOrderId) : null;
              const isSel = t.id === selectedId;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={cx(
                    "group relative bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer",
                    isSel ? "border-primary ring-2 ring-primary/20" : "border-outline-variant",
                    t.status === "dirty" && "opacity-80",
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={cx("text-headline-md font-bold", t.status === "occupied" ? "text-primary" : "text-on-surface")}>
                      {t.name}
                    </span>
                    <Badge tone={STATUS_BADGE[t.status].tone}>{STATUS_BADGE[t.status].label}</Badge>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-1.5 text-on-surface-variant">
                      <Users className="w-4 h-4" />
                      <span className="text-label-md">{t.seats} Seats</span>
                    </div>
                    <div className={cx("flex items-center gap-1.5", order ? "text-on-surface font-bold" : "text-outline italic")}>
                      <CreditCard className="w-4 h-4" />
                      <span className="text-label-md">{order ? money(order.total) : "No Bill"}</span>
                    </div>
                  </div>
                  <div className="text-label-sm text-outline italic">
                    {t.status === "occupied" && t.occupiedSince
                      ? `Time: ${elapsedMins(t.occupiedSince)}m${t.server ? ` • ${t.server}` : ""}`
                      : t.status === "dirty"
                        ? "Needs cleaning"
                        : t.status === "reserved"
                          ? (() => {
                              const r = upcoming.find((x) => x.tableId === t.id);
                              return r ? `Starts: ${r.time} • ${r.customerName}` : "Reserved";
                            })()
                          : t.shape === "booth"
                            ? "Booth Seating"
                            : "Status: Empty"}
                  </div>
                  {isSel && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white shadow-lg">
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Sidebar (desktop) */}
        <aside className="hidden xl:flex w-[320px] bg-white border-l border-outline-variant flex-col h-full shrink-0">
          {sidebar}
        </aside>
        {/* Sidebar becomes stacked section on smaller screens */}
        <div className="xl:hidden bg-white border-t border-outline-variant">{sidebar}</div>
      </div>

      {/* Add table modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Table"
        subtitle="Create a new table on the floor plan."
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!form.name.trim()) return toast.error("Table name is required");
                addTable({
                  name: form.name.trim(),
                  seats: form.seats,
                  zone: form.zone,
                  shape: form.shape,
                  status: "available",
                  branchId: activeBranchId,
                });
                toast.success(`Table ${form.name} added to ${form.zone}`);
                setAddOpen(false);
                setForm({ name: "", seats: 4, zone: "Main Dining", shape: "square" });
              }}
            >
              Add Table
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Table Name" className="col-span-2">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. T-21" />
          </Field>
          <Field label="Seats">
            <Input
              type="number"
              min={1}
              max={20}
              value={form.seats}
              onChange={(e) => setForm({ ...form, seats: Number(e.target.value) })}
            />
          </Field>
          <Field label="Zone">
            <Select value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value as TableZone })}>
              <option>Main Dining</option>
              <option>Patio</option>
              <option>Bar Area</option>
            </Select>
          </Field>
          <Field label="Shape" className="col-span-2">
            <Select value={form.shape} onChange={(e) => setForm({ ...form, shape: e.target.value as DiningTable["shape"] })}>
              <option value="square">Square</option>
              <option value="round">Round</option>
              <option value="booth">Booth</option>
            </Select>
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            const t = tables.find((x) => x.id === confirmDelete);
            deleteTable(confirmDelete);
            setSelectedId(null);
            toast.success(`Table ${t?.name} removed`);
          }
        }}
        title="Remove table?"
        message="This table will be removed from the floor plan permanently."
        confirmLabel="Remove"
        danger
      />
    </AppShell>
  );
}

function ActionTile({
  icon,
  label,
  primary,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "flex flex-col items-center justify-center p-3.5 rounded-xl gap-1.5 transition-all active:scale-95",
        primary
          ? "bg-primary-container text-white hover:opacity-90 shadow-md"
          : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
      )}
    >
      {icon}
      <span className="text-label-md font-bold">{label}</span>
    </button>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center">
      <span>{label}:</span>
      {children}
    </div>
  );
}

function Legend({ cls, label }: { cls: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-label-sm">
      <div className={cx("w-3 h-3 rounded-full", cls)} />
      <span className="text-on-surface-variant">{label}</span>
    </div>
  );
}
