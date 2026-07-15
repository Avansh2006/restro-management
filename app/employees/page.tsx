"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MoreVertical, Pencil, Plus, Trash2, UserRound, Users } from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell/AppShell";
import { useRestro, money } from "@/lib/store";
import {
  Avatar,
  Badge,
  Button,
  ConfirmDialog,
  Drawer,
  DropdownMenu,
  EmptyState,
  Field,
  Input,
  PillTabs,
  SearchInput,
  Select,
  StarRating,

} from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import type { Employee, EmployeeRole } from "@/lib/types";

const ROLES: EmployeeRole[] = [
  "Manager",
  "Head Chef",
  "Sous Chef",
  "Line Cook",
  "Server",
  "Senior Waiter",
  "Bartender",
  "Barista",
  "Host",
  "Cleaner",
];

const COLORS = ["#4f46e5", "#a44100", "#505f76", "#0f766e", "#be185d", "#0369a1", "#7c3aed", "#b45309", "#0e7490", "#15803d"];

type Filter = "all" | "active" | "on-leave" | "on-clock";

const emptyForm = {
  name: "",
  role: "Server" as EmployeeRole,
  email: "",
  phone: "",
  hourlyRate: 18,
  pin: "",
};

export default function EmployeesPage() {
  const employees = useRestro((s) => s.employees);
  const attendance = useRestro((s) => s.attendance);
  const addEmployee = useRestro((s) => s.addEmployee);
  const updateEmployee = useRestro((s) => s.updateEmployee);
  const deleteEmployee = useRestro((s) => s.deleteEmployee);
  const activeBranchId = useRestro((s) => s.settings.activeBranchId);

  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const today = new Date().toISOString().slice(0, 10);
  const onClock = (id: string) => attendance.some((a) => a.employeeId === id && a.date === today && a.clockIn && !a.clockOut);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return employees.filter((e) => {
      if (filter === "active" && e.status !== "active") return false;
      if (filter === "on-leave" && e.status !== "on-leave") return false;
      if (filter === "on-clock" && !onClock(e.id)) return false;
      if (needle && !e.name.toLowerCase().includes(needle) && !e.role.toLowerCase().includes(needle) && !e.code.toLowerCase().includes(needle))
        return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees, filter, q, attendance]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setDrawerOpen(true);
  };
  const openEdit = (e: Employee) => {
    setEditId(e.id);
    setForm({ name: e.name, role: e.role, email: e.email, phone: e.phone, hourlyRate: e.hourlyRate, pin: e.pin });
    setDrawerOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) return toast.error("Name is required");
    if (editId) {
      updateEmployee(editId, { ...form, name: form.name.trim() });
      toast.success(`${form.name} updated`);
    } else {
      const code = `EMP-${String(160 + employees.length)}`;
      addEmployee({
        ...form,
        name: form.name.trim(),
        code,
        hiredAt: today,
        status: "active",
        rating: 3,
        pin: form.pin || String(Math.floor(1000 + Math.random() * 9000)),
        avatarColor: COLORS[employees.length % COLORS.length],
        branchId: activeBranchId,
      });
      toast.success(`${form.name} added to the team`, `Employee ID ${code}`);
    }
    setDrawerOpen(false);
  };

  return (
    <AppShell title="Employees">
      <PageHeader
        title="Employees & HR"
        subtitle="Manage your kitchen and floor staff."
        actions={
          <>
            <SearchInput value={q} onChange={setQ} placeholder="Search staff..." className="w-full sm:w-60" />
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4" /> Add Employee
            </Button>
          </>
        }
      />

      <PillTabs
        className="mb-5 w-fit max-w-full"
        tabs={[
          { key: "all", label: "All", count: employees.length },
          { key: "on-clock", label: "On Clock", count: employees.filter((e) => onClock(e.id)).length },
          { key: "active", label: "Active", count: employees.filter((e) => e.status === "active").length },
          { key: "on-leave", label: "On Leave", count: employees.filter((e) => e.status === "on-leave").length },
        ]}
        active={filter}
        onChange={setFilter}
      />

      {filtered.length === 0 ? (
        <EmptyState icon={<Users className="w-7 h-7" />} title="No employees found" message="Adjust the filter or add a team member." />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white border border-outline-variant rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <Th>Employee</Th>
                  <Th>Role</Th>
                  <Th>Status</Th>
                  <Th>Rate</Th>
                  <Th>Performance</Th>
                  <th className="py-3.5 px-4 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3.5 px-5">
                      <Link href={`/employees/${e.id}`} className="flex items-center gap-3 group">
                        <Avatar name={e.name} color={e.avatarColor} />
                        <div>
                          <p className="text-body-lg font-semibold group-hover:text-primary transition-colors">{e.name}</p>
                          <p className="text-label-sm text-on-surface-variant">ID: {e.code}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant text-label-sm font-semibold whitespace-nowrap">
                        {e.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {onClock(e.id) ? (
                        <span className="flex items-center gap-1.5 text-label-md font-semibold text-primary">
                          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> On Clock
                        </span>
                      ) : e.status === "on-leave" ? (
                        <Badge tone="amber">On Leave</Badge>
                      ) : (
                        <span className="flex items-center gap-1.5 text-label-md text-on-surface-variant">
                          <span className="w-2 h-2 rounded-full bg-outline-variant" /> Off Clock
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-body-md font-medium">
                      {e.hourlyRate ? `${money(e.hourlyRate)}/hr` : "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      <StarRating rating={e.rating} />
                    </td>
                    <td className="py-3.5 px-4">
                      <RowMenu e={e} onEdit={openEdit} onDelete={setConfirmDelete} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((e) => (
              <div key={e.id} className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <Link href={`/employees/${e.id}`} className="flex items-center gap-3">
                    <Avatar name={e.name} color={e.avatarColor} />
                    <div>
                      <p className="font-bold text-body-md">{e.name}</p>
                      <p className="text-label-sm text-on-surface-variant">
                        {e.role} • {e.code}
                      </p>
                    </div>
                  </Link>
                  <RowMenu e={e} onEdit={openEdit} onDelete={setConfirmDelete} />
                </div>
                <div className="flex items-center justify-between">
                  {onClock(e.id) ? (
                    <span className="flex items-center gap-1.5 text-label-md font-semibold text-primary">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> On Clock
                    </span>
                  ) : e.status === "on-leave" ? (
                    <Badge tone="amber">On Leave</Badge>
                  ) : (
                    <span className="text-label-md text-on-surface-variant">Off Clock</span>
                  )}
                  <StarRating rating={e.rating} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editId ? "Edit Employee" : "Add Employee"}
        footer={
          <>
            <Button variant="secondary" className="flex-1" onClick={() => setDrawerOpen(false)}>
              Discard
            </Button>
            <Button className="flex-1" onClick={save}>
              {editId ? "Save Changes" : "Add to Team"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Full Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Jordan Michaels" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Role">
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as EmployeeRole })}>
                {ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </Select>
            </Field>
            <Field label="Hourly Rate ($)">
              <Input type="number" min={0} value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: Number(e.target.value) })} />
            </Field>
          </div>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@restroos.demo" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(415) 555-0000" />
            </Field>
            <Field label="Kiosk PIN" hint="4 digits for the attendance kiosk">
              <Input value={form.pin} maxLength={4} onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "") })} placeholder="0000" />
            </Field>
          </div>
        </div>
      </Drawer>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            const e = employees.find((x) => x.id === confirmDelete);
            deleteEmployee(confirmDelete);
            toast.success(`${e?.name} removed from the roster`);
          }
        }}
        title="Remove employee?"
        message="This will remove the employee record. Attendance and payroll history stay in the audit trail."
        confirmLabel="Remove"
        danger
      />
    </AppShell>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="py-3.5 px-4 first:pl-5 text-label-md font-semibold text-on-surface-variant uppercase tracking-wider">{children}</th>;
}

function RowMenu({ e, onEdit, onDelete }: { e: Employee; onEdit: (e: Employee) => void; onDelete: (id: string) => void }) {
  return (
    <DropdownMenu
      trigger={
        <button className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
      }
      items={[
        {
          label: "View profile",
          icon: <UserRound className="w-4 h-4" />,
          onClick: () => {
            window.location.href = `/employees/${e.id}`;
          },
        },
        { label: "Edit", icon: <Pencil className="w-4 h-4" />, onClick: () => onEdit(e) },
        "divider",
        { label: "Remove", icon: <Trash2 className="w-4 h-4" />, onClick: () => onDelete(e.id), danger: true },
      ]}
    />
  );
}
