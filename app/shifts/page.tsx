"use client";

import { useMemo, useState } from "react";
import { CalendarRange, ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell/AppShell";
import { useRestro } from "@/lib/store";
import {
  Avatar,
  Badge,
  Button,
  ConfirmDialog,
  Drawer,
  Field,
  Input,
  Select,
  cx,
} from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import type { Shift } from "@/lib/types";

const dayLabel = (iso: string) => {
  const d = new Date(iso + "T12:00:00");
  return {
    dow: d.toLocaleDateString("en-US", { weekday: "short" }),
    date: d.getDate(),
    month: d.toLocaleDateString("en-US", { month: "short" }),
  };
};

const emptyForm = { employeeId: "", date: new Date().toISOString().slice(0, 10), start: "09:00", end: "17:00", role: "Floor" };

export default function ShiftsPage() {
  const shifts = useRestro((s) => s.shifts);
  const employees = useRestro((s) => s.employees);
  const addShift = useRestro((s) => s.addShift);
  const updateShift = useRestro((s) => s.updateShift);
  const deleteShift = useRestro((s) => s.deleteShift);
  const activeBranchId = useRestro((s) => s.settings.activeBranchId);

  const [weekOffset, setWeekOffset] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const today = new Date().toISOString().slice(0, 10);

  const weekDays = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - start.getDay() + 1 + weekOffset * 7); // Monday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d.toISOString().slice(0, 10);
    });
  }, [weekOffset]);

  const shiftsByDay = useMemo(() => {
    const map = new Map<string, Shift[]>();
    for (const day of weekDays) map.set(day, []);
    for (const sh of shifts) {
      if (map.has(sh.date)) map.get(sh.date)!.push(sh);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.start.localeCompare(b.start));
    return map;
  }, [shifts, weekDays]);

  const empName = (id: string) => employees.find((e) => e.id === id);

  const openCreate = (date?: string) => {
    setEditId(null);
    setForm({ ...emptyForm, date: date ?? today, employeeId: employees[1]?.id ?? "" });
    setDrawerOpen(true);
  };

  const openEdit = (sh: Shift) => {
    setEditId(sh.id);
    setForm({ employeeId: sh.employeeId, date: sh.date, start: sh.start, end: sh.end, role: sh.role });
    setDrawerOpen(true);
  };

  const save = () => {
    if (!form.employeeId) return toast.error("Select an employee");
    const payload = {
      ...form,
      status: (form.date < today ? "completed" : form.date === today ? "in-progress" : "scheduled") as Shift["status"],
      branchId: activeBranchId,
    };
    if (editId) {
      updateShift(editId, payload);
      toast.success("Shift updated");
    } else {
      addShift(payload);
      toast.success(`Shift scheduled for ${empName(form.employeeId)?.name}`);
    }
    setDrawerOpen(false);
  };

  const totalHours = useMemo(() => {
    let mins = 0;
    for (const day of weekDays) {
      for (const sh of shiftsByDay.get(day) ?? []) {
        const [sh1, sm1] = sh.start.split(":").map(Number);
        const [sh2, sm2] = sh.end.split(":").map(Number);
        mins += sh2 * 60 + sm2 - (sh1 * 60 + sm1);
      }
    }
    return Math.round(mins / 60);
  }, [weekDays, shiftsByDay]);

  return (
    <AppShell title="Shifts">
      <PageHeader
        title="Shift Scheduling"
        subtitle={`${totalHours} staff-hours planned this week.`}
        actions={
          <>
            <div className="flex items-center gap-1 bg-white border border-outline-variant rounded-lg p-1">
              <button onClick={() => setWeekOffset((w) => w - 1)} className="p-1.5 rounded hover:bg-surface-container transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-label-md font-semibold px-2 whitespace-nowrap">
                {weekOffset === 0 ? "This Week" : weekOffset === -1 ? "Last Week" : weekOffset === 1 ? "Next Week" : `${weekOffset > 0 ? "+" : ""}${weekOffset}w`}
              </span>
              <button onClick={() => setWeekOffset((w) => w + 1)} className="p-1.5 rounded hover:bg-surface-container transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <Button onClick={() => openCreate()}>
              <Plus className="w-4 h-4" /> Add Shift
            </Button>
          </>
        }
      />

      {/* Week grid: 7 columns desktop, stacked cards mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3">
        {weekDays.map((day) => {
          const info = dayLabel(day);
          const dayShifts = shiftsByDay.get(day) ?? [];
          const isToday = day === today;
          return (
            <div
              key={day}
              className={cx(
                "bg-white border rounded-xl overflow-hidden flex flex-col min-h-[120px]",
                isToday ? "border-primary ring-2 ring-primary/15" : "border-outline-variant",
              )}
            >
              <div className={cx("px-3 py-2.5 flex items-center justify-between border-b", isToday ? "bg-primary-fixed/50 border-primary/20" : "bg-surface-container-low border-outline-variant")}>
                <div className="flex items-baseline gap-1.5">
                  <span className={cx("text-label-md font-bold uppercase", isToday ? "text-primary" : "text-on-surface-variant")}>{info.dow}</span>
                  <span className="text-body-md font-bold">{info.date}</span>
                  <span className="text-label-sm text-on-surface-variant">{info.month}</span>
                </div>
                <button onClick={() => openCreate(day)} className="p-1 rounded hover:bg-white/70 text-outline hover:text-primary transition-colors" title="Add shift">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 p-2 space-y-1.5">
                {dayShifts.length === 0 && <p className="text-label-sm text-outline text-center py-4">No shifts</p>}
                {dayShifts.map((sh) => {
                  const emp = empName(sh.employeeId);
                  if (!emp) return null;
                  return (
                    <button
                      key={sh.id}
                      onClick={() => openEdit(sh)}
                      className="w-full text-left p-2 rounded-lg bg-surface-container-low hover:bg-secondary-container/60 border border-outline-variant/60 transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar name={emp.name} color={emp.avatarColor} size="sm" className="!w-6 !h-6 !text-[9px]" />
                        <div className="min-w-0 flex-1">
                          <p className="text-label-md font-semibold truncate leading-tight">{emp.name.split(" ")[0]} {emp.name.split(" ")[1]?.[0]}.</p>
                          <p className="text-[10px] text-on-surface-variant truncate">
                            {sh.start}–{sh.end} • {sh.role}
                          </p>
                        </div>
                        <Pencil className="w-3 h-3 text-outline opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editId ? "Edit Shift" : "Add Shift"}
        footer={
          <>
            {editId && (
              <Button
                variant="danger"
                onClick={() => {
                  setConfirmDelete(editId);
                  setDrawerOpen(false);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button variant="secondary" className="flex-1" onClick={() => setDrawerOpen(false)}>
              Discard
            </Button>
            <Button className="flex-1" onClick={save}>
              {editId ? "Save" : "Schedule"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Employee">
            <Select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
              <option value="">Select...</option>
              {employees
                .filter((e) => e.role !== "Owner")
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.role})
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Date">
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start">
              <Input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
            </Field>
            <Field label="End">
              <Input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
            </Field>
          </div>
          <Field label="Station / Role">
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {["Floor", "Kitchen", "Kitchen Lead", "Bar", "Cafe", "Front Desk", "Management"].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </Select>
          </Field>
        </div>
      </Drawer>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            deleteShift(confirmDelete);
            toast.success("Shift removed");
          }
        }}
        title="Delete shift?"
        message="This scheduled shift will be removed from the rota."
        confirmLabel="Delete"
        danger
      />
    </AppShell>
  );
}
