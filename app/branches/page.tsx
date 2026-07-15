"use client";

import { useState } from "react";
import { Check, Clock, MapPin, Pencil, Phone, Plus, Store, UserRound } from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell/AppShell";
import { useRestro, money } from "@/lib/store";
import { Badge, Button, Drawer, Field, Input, Select, cx } from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import type { Branch } from "@/lib/types";

const emptyForm = { name: "", address: "", phone: "", manager: "", openingHours: "11:00 – 23:00", status: "open" as Branch["status"] };

export default function BranchesPage() {
  const branches = useRestro((s) => s.branches);
  const settings = useRestro((s) => s.settings);
  const orders = useRestro((s) => s.orders);
  const tables = useRestro((s) => s.tables);
  const employees = useRestro((s) => s.employees);
  const addBranch = useRestro((s) => s.addBranch);
  const updateBranch = useRestro((s) => s.updateBranch);
  const updateSettings = useRestro((s) => s.updateSettings);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setDrawerOpen(true);
  };
  const openEdit = (b: Branch) => {
    setEditId(b.id);
    setForm({ name: b.name, address: b.address, phone: b.phone, manager: b.manager, openingHours: b.openingHours, status: b.status });
    setDrawerOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) return toast.error("Branch name is required");
    if (editId) {
      updateBranch(editId, form);
      toast.success(`${form.name} updated`);
    } else {
      addBranch(form);
      toast.success(`Branch "${form.name}" added`);
    }
    setDrawerOpen(false);
  };

  return (
    <AppShell title="Branches">
      <PageHeader
        title="Branches"
        subtitle="Locations under this RestroOS account. Data in the demo is scoped to the active branch."
        actions={
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" /> Add Branch
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {branches.map((b) => {
          const isActive = b.id === settings.activeBranchId;
          const branchOrders = orders.filter((o) => o.branchId === b.id && o.status === "paid");
          const revenue = branchOrders.reduce((s, o) => s + o.total, 0);
          const branchTables = tables.filter((t) => t.branchId === b.id);
          const branchStaff = employees.filter((e) => e.branchId === b.id);
          return (
            <div
              key={b.id}
              className={cx(
                "bg-white border rounded-xl p-5 shadow-sm transition-all",
                isActive ? "border-primary ring-2 ring-primary/15" : "border-outline-variant hover:shadow-md",
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cx("w-11 h-11 rounded-xl flex items-center justify-center", isActive ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant")}>
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-title-lg font-semibold">{b.name}</h3>
                    <Badge tone={b.status === "open" ? "green" : "slate"}>{b.status}</Badge>
                  </div>
                </div>
                <button onClick={() => openEdit(b)} className="p-2 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-colors" title="Edit">
                  <Pencil className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 text-body-md text-on-surface-variant mb-4">
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 shrink-0" /> {b.address}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 shrink-0" /> {b.phone}
                </p>
                <p className="flex items-center gap-2">
                  <UserRound className="w-4 h-4 shrink-0" /> {b.manager}
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="w-4 h-4 shrink-0" /> {b.openingHours}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-outline-variant text-center mb-4">
                <div>
                  <p className="text-title-lg font-bold">{isActive ? money(revenue) : "—"}</p>
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase">Revenue</p>
                </div>
                <div>
                  <p className="text-title-lg font-bold">{isActive ? branchTables.length : "—"}</p>
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase">Tables</p>
                </div>
                <div>
                  <p className="text-title-lg font-bold">{isActive ? branchStaff.length : "—"}</p>
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase">Staff</p>
                </div>
              </div>

              {isActive ? (
                <div className="flex items-center justify-center gap-1.5 py-2 bg-primary-fixed/50 rounded-lg text-primary text-label-md font-bold">
                  <Check className="w-4 h-4" /> Active Branch
                </div>
              ) : (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    updateSettings({ activeBranchId: b.id });
                    toast.success(`Switched to ${b.name}`);
                  }}
                >
                  Switch to this Branch
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editId ? "Edit Branch" : "Add Branch"}
        footer={
          <>
            <Button variant="secondary" className="flex-1" onClick={() => setDrawerOpen(false)}>
              Discard
            </Button>
            <Button className="flex-1" onClick={save}>
              {editId ? "Save Changes" : "Add Branch"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Branch Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Downtown Branch" />
          </Field>
          <Field label="Address">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, City" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(415) 555-0000" />
            </Field>
            <Field label="Manager">
              <Input value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} placeholder="Manager name" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Opening Hours">
              <Input value={form.openingHours} onChange={(e) => setForm({ ...form, openingHours: e.target.value })} placeholder="11:00 – 23:00" />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Branch["status"] })}>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </Select>
            </Field>
          </div>
        </div>
      </Drawer>
    </AppShell>
  );
}
