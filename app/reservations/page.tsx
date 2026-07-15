"use client";

import { useMemo, useState } from "react";
import {
  Armchair,
  CalendarCheck,
  Check,

  ChevronRight,
  Pencil,
  Phone,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell/AppShell";
import { useRestro } from "@/lib/store";
import {
  Badge,
  Button,
  ConfirmDialog,
  Drawer,
  EmptyState,
  Field,
  Input,
  PillTabs,
  SearchInput,
  Select,
  Textarea,
  cx,
  type BadgeTone,
} from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import type { Reservation, ReservationStatus } from "@/lib/types";

const STATUS_TONE: Record<ReservationStatus, BadgeTone> = {
  pending: "amber",
  confirmed: "green",
  seated: "blue",
  completed: "slate",
  cancelled: "red",
  "no-show": "red",
};

type DayKey = "today" | "tomorrow" | "week" | "past";

const emptyForm = {
  customerName: "",
  phone: "",
  partySize: 2,
  tableId: "",
  date: new Date().toISOString().slice(0, 10),
  time: "19:00",
  notes: "",
};

export default function ReservationsPage() {
  const reservations = useRestro((s) => s.reservations);
  const tables = useRestro((s) => s.tables);
  const addReservation = useRestro((s) => s.addReservation);
  const updateReservation = useRestro((s) => s.updateReservation);
  const deleteReservation = useRestro((s) => s.deleteReservation);
  const seatReservation = useRestro((s) => s.seatReservation);
  const activeBranchId = useRestro((s) => s.settings.activeBranchId);

  const [day, setDay] = useState<DayKey>("today");
  const [q, setQ] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  })();

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return reservations
      .filter((r) => {
        if (day === "today" && r.date !== today) return false;
        if (day === "tomorrow" && r.date !== tomorrow) return false;
        if (day === "week" && r.date < today) return false;
        if (day === "past" && r.date >= today) return false;
        if (needle && !r.customerName.toLowerCase().includes(needle) && !r.phone.includes(needle)) return false;
        return true;
      })
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }, [reservations, day, q, today, tomorrow]);

  const counts = useMemo(
    () => ({
      today: reservations.filter((r) => r.date === today).length,
      tomorrow: reservations.filter((r) => r.date === tomorrow).length,
      week: reservations.filter((r) => r.date >= today).length,
      past: reservations.filter((r) => r.date < today).length,
    }),
    [reservations, today, tomorrow],
  );

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setDrawerOpen(true);
  };

  const openEdit = (r: Reservation) => {
    setEditId(r.id);
    setForm({
      customerName: r.customerName,
      phone: r.phone,
      partySize: r.partySize,
      tableId: r.tableId ?? "",
      date: r.date,
      time: r.time,
      notes: r.notes ?? "",
    });
    setDrawerOpen(true);
  };

  const save = () => {
    if (!form.customerName.trim()) return toast.error("Guest name is required");
    if (!form.date || !form.time) return toast.error("Date and time are required");
    const payload = {
      customerName: form.customerName.trim(),
      phone: form.phone,
      partySize: form.partySize,
      tableId: form.tableId || undefined,
      date: form.date,
      time: form.time,
      notes: form.notes || undefined,
      branchId: activeBranchId,
    };
    if (editId) {
      updateReservation(editId, payload);
      toast.success("Reservation updated");
    } else {
      addReservation(payload);
      toast.success(`Reservation booked for ${form.customerName}`);
    }
    setDrawerOpen(false);
  };

  const setStatus = (r: Reservation, status: ReservationStatus) => {
    if (status === "seated") {
      seatReservation(r.id);
      toast.success(`${r.customerName} seated${r.tableId ? ` at ${tables.find((t) => t.id === r.tableId)?.name}` : ""}`);
    } else {
      updateReservation(r.id, { status });
      toast.success(`Reservation ${status}`);
    }
  };

  return (
    <AppShell title="Reservations">
      <PageHeader
        title="Reservations"
        subtitle="Manage bookings, confirmations, and seatings."
        actions={
          <>
            <SearchInput value={q} onChange={setQ} placeholder="Search guest or phone..." className="w-full sm:w-60" />
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4" /> New Reservation
            </Button>
          </>
        }
      />

      <PillTabs
        className="mb-5 w-fit max-w-full"
        tabs={[
          { key: "today", label: "Today", count: counts.today },
          { key: "tomorrow", label: "Tomorrow", count: counts.tomorrow },
          { key: "week", label: "Upcoming", count: counts.week },
          { key: "past", label: "Past", count: counts.past },
        ]}
        active={day}
        onChange={setDay}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="w-7 h-7" />}
          title="No reservations"
          message="No bookings match this view yet."
          action={
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4" /> New Reservation
            </Button>
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white border border-outline-variant rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <Th>Guest</Th>
                  <Th>Date & Time</Th>
                  <Th>Party</Th>
                  <Th>Table</Th>
                  <Th>Status</Th>
                  <Th>Notes</Th>
                  <Th className="text-right pr-6">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3.5 px-5">
                      <p className="font-semibold text-body-md">{r.customerName}</p>
                      <p className="text-label-sm text-on-surface-variant flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {r.phone}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-body-md text-primary">{r.time}</p>
                      <p className="text-label-sm text-on-surface-variant">{r.date}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="flex items-center gap-1.5 text-body-md">
                        <Users className="w-4 h-4 text-outline" /> {r.partySize}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="flex items-center gap-1.5 text-body-md">
                        <Armchair className="w-4 h-4 text-outline" />
                        {tables.find((t) => t.id === r.tableId)?.name ?? "—"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                    </td>
                    <td className="py-3.5 px-4 max-w-[180px]">
                      <p className="text-label-sm text-on-surface-variant truncate italic">{r.notes ?? "—"}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <RowActions r={r} onEdit={openEdit} onDelete={setConfirmDelete} onStatus={setStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((r) => (
              <div key={r.id} className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-body-md">{r.customerName}</p>
                    <p className="text-label-sm text-on-surface-variant">{r.phone}</p>
                  </div>
                  <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                </div>
                <div className="flex items-center gap-4 text-label-md text-on-surface-variant mb-3">
                  <span className="font-semibold text-primary">
                    {r.date === today ? "Today" : r.date} • {r.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {r.partySize}p
                  </span>
                  <span className="flex items-center gap-1">
                    <Armchair className="w-3.5 h-3.5" />
                    {tables.find((t) => t.id === r.tableId)?.name ?? "Any"}
                  </span>
                </div>
                {r.notes && <p className="text-label-sm italic text-on-surface-variant mb-3">“{r.notes}”</p>}
                <RowActions r={r} onEdit={openEdit} onDelete={setConfirmDelete} onStatus={setStatus} mobile />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create/edit drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editId ? "Edit Reservation" : "New Reservation"}
        subtitle={editId ? "Update booking details." : "Book a table for a guest."}
        footer={
          <>
            <Button variant="secondary" className="flex-1" onClick={() => setDrawerOpen(false)}>
              Discard
            </Button>
            <Button className="flex-1" onClick={save}>
              {editId ? "Save Changes" : "Book Reservation"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Guest Name" className="col-span-2">
            <Input
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              placeholder="e.g. Sarah Connor"
            />
          </Field>
          <Field label="Phone" className="col-span-2">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(415) 555-0000" />
          </Field>
          <Field label="Date">
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Time">
            <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </Field>
          <Field label="Party Size">
            <Input
              type="number"
              min={1}
              max={30}
              value={form.partySize}
              onChange={(e) => setForm({ ...form, partySize: Number(e.target.value) })}
            />
          </Field>
          <Field label="Table">
            <Select value={form.tableId} onChange={(e) => setForm({ ...form, tableId: e.target.value })}>
              <option value="">Assign later</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.seats} seats, {t.zone})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Notes" className="col-span-2">
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Allergies, occasions, seating preferences..."
            />
          </Field>
        </div>
      </Drawer>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            deleteReservation(confirmDelete);
            toast.success("Reservation deleted");
          }
        }}
        title="Delete reservation?"
        message="This booking will be permanently removed."
        confirmLabel="Delete"
        danger
      />
    </AppShell>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={cx("py-3.5 px-4 first:pl-5 text-label-md font-semibold text-on-surface-variant uppercase tracking-wider", className)}>
      {children}
    </th>
  );
}

function RowActions({
  r,
  onEdit,
  onDelete,
  onStatus,
  mobile,
}: {
  r: Reservation;
  onEdit: (r: Reservation) => void;
  onDelete: (id: string) => void;
  onStatus: (r: Reservation, s: ReservationStatus) => void;
  mobile?: boolean;
}) {
  const actionable = r.status === "pending" || r.status === "confirmed";
  return (
    <div className={cx("flex gap-1.5", mobile ? "flex-wrap" : "justify-end")}>
      {r.status === "pending" && (
        <Button size="sm" variant="success" onClick={() => onStatus(r, "confirmed")}>
          <Check className="w-3.5 h-3.5" /> Confirm
        </Button>
      )}
      {r.status === "confirmed" && (
        <Button size="sm" onClick={() => onStatus(r, "seated")}>
          <ChevronRight className="w-3.5 h-3.5" /> Seat
        </Button>
      )}
      {r.status === "seated" && (
        <Button size="sm" variant="secondary" onClick={() => onStatus(r, "completed")}>
          <Check className="w-3.5 h-3.5" /> Complete
        </Button>
      )}
      {actionable && (
        <Button size="sm" variant="secondary" onClick={() => onStatus(r, "cancelled")}>
          <X className="w-3.5 h-3.5" /> {mobile ? "Cancel" : ""}
        </Button>
      )}
      <button
        onClick={() => onEdit(r)}
        className="p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors"
        title="Edit"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => onDelete(r.id)}
        className="p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-error hover:bg-red-50 transition-colors"
        title="Delete"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
