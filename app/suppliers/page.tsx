"use client";

import { useMemo, useState } from "react";
import { Mail, MoreVertical, Pencil, Phone, Plus, ShoppingCart, Trash2, Truck, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppShell, PageHeader } from "@/components/shell/AppShell";
import { useRestro, money } from "@/lib/store";
import {
  Badge,
  Button,
  ConfirmDialog,
  Drawer,
  DropdownMenu,
  EmptyState,
  Field,
  Input,
  SearchInput,
  StarRating,
  Toggle,
  cx,
} from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import type { InventoryCategory, Supplier } from "@/lib/types";

const CATS: InventoryCategory[] = ["Produce", "Meat", "Seafood", "Dairy", "Dry Goods", "Beverage"];

const emptyForm = {
  name: "",
  contact: "",
  phone: "",
  email: "",
  categories: [] as InventoryCategory[],
  rating: 4,
  active: true,
};

export default function SuppliersPage() {
  const router = useRouter();
  const suppliers = useRestro((s) => s.suppliers);
  const inventory = useRestro((s) => s.inventory);
  const purchaseOrders = useRestro((s) => s.purchaseOrders);
  const addSupplier = useRestro((s) => s.addSupplier);
  const updateSupplier = useRestro((s) => s.updateSupplier);
  const deleteSupplier = useRestro((s) => s.deleteSupplier);

  const [q, setQ] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(
    () => suppliers.filter((s) => !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.contact.toLowerCase().includes(q.toLowerCase())),
    [suppliers, q],
  );

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setDrawerOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditId(s.id);
    setForm({ name: s.name, contact: s.contact, phone: s.phone, email: s.email, categories: [...s.categories], rating: s.rating, active: s.active });
    setDrawerOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) return toast.error("Supplier name is required");
    if (editId) {
      updateSupplier(editId, form);
      toast.success(`"${form.name}" updated`);
    } else {
      addSupplier(form);
      toast.success(`Supplier "${form.name}" added`);
    }
    setDrawerOpen(false);
  };

  return (
    <AppShell title="Suppliers">
      <PageHeader
        title="Suppliers"
        subtitle="Your vendor network for produce, proteins, and provisions."
        actions={
          <>
            <SearchInput value={q} onChange={setQ} placeholder="Search suppliers..." className="w-full sm:w-60" />
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4" /> Add Supplier
            </Button>
          </>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState icon={<Truck className="w-7 h-7" />} title="No suppliers" message="Add your first vendor to start ordering." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((s) => {
            const items = inventory.filter((i) => i.supplierId === s.id);
            const openPos = purchaseOrders.filter((p) => p.supplierId === s.id && (p.status === "sent" || p.status === "confirmed"));
            const spend = purchaseOrders.filter((p) => p.supplierId === s.id && p.status === "received").reduce((t, p) => t + p.total, 0);
            return (
              <div key={s.id} className={cx("bg-white border border-outline-variant rounded-xl p-5 shadow-sm transition-all hover:shadow-md", !s.active && "opacity-60")}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-title-lg font-semibold text-on-surface">{s.name}</h3>
                      <StarRating rating={s.rating} />
                    </div>
                  </div>
                  <DropdownMenu
                    trigger={
                      <button className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    }
                    items={[
                      { label: "Edit supplier", icon: <Pencil className="w-4 h-4" />, onClick: () => openEdit(s) },
                      { label: "New purchase order", icon: <ShoppingCart className="w-4 h-4" />, onClick: () => router.push("/purchase-orders") },
                      "divider",
                      { label: "Delete", icon: <Trash2 className="w-4 h-4" />, onClick: () => setConfirmDelete(s.id), danger: true },
                    ]}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {s.categories.map((c) => (
                    <Badge key={c} tone="indigo">
                      {c}
                    </Badge>
                  ))}
                  {!s.active && <Badge tone="slate">Inactive</Badge>}
                </div>
                <div className="space-y-1.5 text-body-md text-on-surface-variant mb-4">
                  <p className="flex items-center gap-2">
                    <User className="w-4 h-4 shrink-0" /> {s.contact}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 shrink-0" /> {s.phone}
                  </p>
                  <p className="flex items-center gap-2 truncate">
                    <Mail className="w-4 h-4 shrink-0" /> {s.email}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-outline-variant text-center">
                  <div>
                    <p className="text-title-lg font-bold text-on-surface">{items.length}</p>
                    <p className="text-[10px] text-on-surface-variant font-bold uppercase">Items</p>
                  </div>
                  <div>
                    <p className="text-title-lg font-bold text-on-surface">{openPos.length}</p>
                    <p className="text-[10px] text-on-surface-variant font-bold uppercase">Open POs</p>
                  </div>
                  <div>
                    <p className="text-title-lg font-bold text-on-surface">{money(spend)}</p>
                    <p className="text-[10px] text-on-surface-variant font-bold uppercase">Received</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editId ? "Edit Supplier" : "Add Supplier"}
        footer={
          <>
            <Button variant="secondary" className="flex-1" onClick={() => setDrawerOpen(false)}>
              Discard
            </Button>
            <Button className="flex-1" onClick={save}>
              {editId ? "Save Changes" : "Add Supplier"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Company Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. GreenLeaf Farms" />
          </Field>
          <Field label="Contact Person">
            <Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="e.g. Maria Santos" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(415) 555-0000" />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="orders@vendor.com" />
            </Field>
          </div>
          <div>
            <span className="text-label-md font-semibold block mb-2">Supply Categories</span>
            <div className="flex flex-wrap gap-2">
              {CATS.map((c) => {
                const on = form.categories.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() =>
                      setForm({ ...form, categories: on ? form.categories.filter((x) => x !== c) : [...form.categories, c] })
                    }
                    className={cx(
                      "px-3.5 py-1.5 rounded-full text-label-md font-semibold border transition-colors",
                      on ? "bg-primary text-on-primary border-primary" : "bg-white border-outline-variant text-on-surface-variant hover:border-primary",
                    )}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
          <Field label={`Rating: ${form.rating} / 5`}>
            <input
              type="range"
              min={1}
              max={5}
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
              className="w-full accent-[#3525cd]"
            />
          </Field>
          <div className="p-4 bg-surface-container-high rounded-xl">
            <Toggle checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label="Active Supplier" description="Inactive suppliers are hidden from reorder flows" />
          </div>
        </div>
      </Drawer>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            deleteSupplier(confirmDelete);
            toast.success("Supplier removed");
          }
        }}
        title="Delete supplier?"
        message="Linked inventory items will keep their history but lose the supplier link."
        confirmLabel="Delete"
        danger
      />
    </AppShell>
  );
}
