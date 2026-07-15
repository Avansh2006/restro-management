"use client";

import { useMemo, useState } from "react";
import {
  GripVertical,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  UtensilsCrossed,
  EyeOff,
  Eye,
} from "lucide-react";
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
  ProgressBar,
  SearchInput,
  Select,
  Textarea,
  Toggle,
  UnderlineTabs,
  cx,
} from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import type { MenuItem } from "@/lib/types";

type Tab = "items" | "categories" | "modifiers" | "combos";

const emptyForm = {
  name: "",
  description: "",
  categoryId: "",
  price: "",
  station: "Grill" as MenuItem["station"],
  trackStock: true,
  stock: 50,
  taxRate: 0.08,
  modifiers: "",
};

export default function MenuPage() {
  const menuItems = useRestro((s) => s.menuItems);
  const categories = useRestro((s) => s.menuCategories);
  const addMenuItem = useRestro((s) => s.addMenuItem);
  const updateMenuItem = useRestro((s) => s.updateMenuItem);
  const deleteMenuItem = useRestro((s) => s.deleteMenuItem);
  const addMenuCategory = useRestro((s) => s.addMenuCategory);
  const deleteMenuCategory = useRestro((s) => s.deleteMenuCategory);

  const [tab, setTab] = useState<Tab>("items");
  const [q, setQ] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [newCat, setNewCat] = useState("");

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return menuItems.filter((m) => !needle || m.name.toLowerCase().includes(needle));
  }, [menuItems, q]);

  const allModifiers = useMemo(() => {
    const set = new Map<string, number>();
    for (const m of menuItems) for (const mod of m.modifiers ?? []) set.set(mod, (set.get(mod) ?? 0) + 1);
    return [...set.entries()].sort((a, b) => b[1] - a[1]);
  }, [menuItems]);

  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? "—";

  const openCreate = () => {
    setEditId(null);
    setForm({ ...emptyForm, categoryId: categories[0]?.id ?? "" });
    setDrawerOpen(true);
  };

  const openEdit = (m: MenuItem) => {
    setEditId(m.id);
    setForm({
      name: m.name,
      description: m.description,
      categoryId: m.categoryId,
      price: String(m.price),
      station: m.station,
      trackStock: m.trackStock,
      stock: m.stock,
      taxRate: m.taxRate,
      modifiers: (m.modifiers ?? []).join(", "),
    });
    setDrawerOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) return toast.error("Item name is required");
    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) return toast.error("Enter a valid price");
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      categoryId: form.categoryId || categories[0]?.id,
      price,
      station: form.station,
      trackStock: form.trackStock,
      stock: form.stock,
      available: form.stock > 0 || !form.trackStock,
      taxRate: form.taxRate,
      modifiers: form.modifiers
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    if (editId) {
      updateMenuItem(editId, payload);
      toast.success(`"${form.name}" updated`);
    } else {
      addMenuItem(payload);
      toast.success(`"${form.name}" published to menu`);
    }
    setDrawerOpen(false);
  };

  const toggleAvailability = (m: MenuItem) => {
    updateMenuItem(m.id, { available: !m.available });
    toast[m.available ? "warning" : "success"](
      m.available ? `"${m.name}" marked sold out` : `"${m.name}" back on the menu`,
      m.available ? "Hidden from POS and QR ordering" : "Visible in POS and QR ordering",
    );
  };

  return (
    <AppShell title="Menu">
      <PageHeader
        title="Menu Management"
        subtitle="Configure and organize your digital menu across all channels."
        actions={
          <>
            <SearchInput value={q} onChange={setQ} placeholder="Search items..." className="w-full sm:w-60" />
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4" /> Add Item
            </Button>
          </>
        }
      />

      <div className="mb-5">
        <UnderlineTabs
          tabs={[
            { key: "items", label: `Items (${menuItems.length})` },
            { key: "categories", label: `Categories (${categories.length})` },
            { key: "modifiers", label: "Modifiers" },
            { key: "combos", label: "Combos" },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === "items" && (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white border border-outline-variant rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    <th className="py-3.5 pl-5 w-10" />
                    <Th>Name</Th>
                    <Th>Category</Th>
                    <Th>Price</Th>
                    <Th>Status</Th>
                    <Th>Stock Level</Th>
                    <th className="py-3.5 px-4 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => (
                    <tr key={m.id} className="border-b border-outline-variant last:border-0 hover:bg-surface-container-low transition-colors group">
                      <td className="py-3.5 pl-5">
                        <GripVertical className="w-4 h-4 text-outline group-hover:text-primary transition-colors cursor-grab" />
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-body-md font-semibold text-on-surface">{m.name}</p>
                        <p className="text-label-sm text-on-surface-variant line-clamp-1 max-w-[280px]">{m.description}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-1 bg-secondary-container text-on-secondary-container text-[11px] font-bold rounded uppercase tracking-wide whitespace-nowrap">
                          {catName(m.categoryId)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-body-md font-medium">{money(m.price)}</td>
                      <td className="py-3.5 px-4">
                        <button className="flex items-center gap-2" onClick={() => toggleAvailability(m)} title="Toggle availability">
                          <div className={cx("w-2 h-2 rounded-full", m.available ? "bg-emerald-500" : "bg-outline")} />
                          <span className={cx("text-body-md font-medium", m.available ? "text-emerald-600" : "text-outline")}>
                            {m.available ? "Active" : "Sold Out"}
                          </span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 min-w-[140px]">
                        {m.trackStock ? (
                          <>
                            <ProgressBar
                              pct={(m.stock / 100) * 100}
                              tone={m.stock === 0 ? "red" : m.stock <= 15 ? "amber" : "primary"}
                              className="max-w-[100px]"
                            />
                            <span
                              className={cx(
                                "text-[11px] mt-1 block",
                                m.stock === 0 ? "text-error font-bold" : m.stock <= 15 ? "text-amber-700 font-bold" : "text-outline",
                              )}
                            >
                              {m.stock === 0 ? "Out of Stock" : m.stock <= 15 ? `Low Stock (${m.stock})` : `${m.stock} in stock`}
                            </span>
                          </>
                        ) : (
                          <span className="text-[11px] text-outline">Not tracked</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <ItemMenu m={m} onEdit={openEdit} onToggle={toggleAvailability} onDelete={setConfirmDelete} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((m) => (
              <div key={m.id} className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-bold text-body-md">{m.name}</p>
                    <p className="text-label-sm text-on-surface-variant line-clamp-1">{m.description}</p>
                  </div>
                  <ItemMenu m={m} onEdit={openEdit} onToggle={toggleAvailability} onDelete={setConfirmDelete} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge tone="indigo">{catName(m.categoryId)}</Badge>
                    <Badge tone={m.available ? "green" : "slate"}>{m.available ? "Active" : "Sold Out"}</Badge>
                  </div>
                  <span className="font-bold text-primary">{money(m.price)}</span>
                </div>
                {m.trackStock && (
                  <div className="mt-3">
                    <ProgressBar pct={m.stock} tone={m.stock === 0 ? "red" : m.stock <= 15 ? "amber" : "primary"} />
                    <span className="text-[11px] text-outline mt-1 block">{m.stock} in stock</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <EmptyState
              icon={<UtensilsCrossed className="w-7 h-7" />}
              title="No menu items"
              message="Add your first dish to get started."
              action={
                <Button onClick={openCreate}>
                  <Plus className="w-4 h-4" /> Add Item
                </Button>
              }
            />
          )}
        </>
      )}

      {tab === "categories" && (
        <div className="max-w-2xl space-y-4">
          <div className="flex gap-2">
            <Input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New category name..." />
            <Button
              onClick={() => {
                if (!newCat.trim()) return toast.error("Enter a category name");
                addMenuCategory(newCat.trim());
                toast.success(`Category "${newCat}" added`);
                setNewCat("");
              }}
            >
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>
          <div className="bg-white border border-outline-variant rounded-xl divide-y divide-outline-variant overflow-hidden">
            {categories.map((c) => {
              const count = menuItems.filter((m) => m.categoryId === c.id).length;
              return (
                <div key={c.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-container-low transition-colors">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-outline cursor-grab" />
                    <span className="text-body-md font-semibold">{c.name}</span>
                    <Badge tone="slate">{count} items</Badge>
                  </div>
                  <button
                    onClick={() => {
                      if (count > 0) return toast.error("Category has items", "Move or delete its items first.");
                      deleteMenuCategory(c.id);
                      toast.success(`Category "${c.name}" removed`);
                    }}
                    className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "modifiers" && (
        <div className="max-w-2xl">
          <p className="text-body-md text-on-surface-variant mb-4">
            Modifiers currently configured across menu items. Edit an item to change its modifiers.
          </p>
          <div className="flex flex-wrap gap-2">
            {allModifiers.map(([mod, count]) => (
              <span key={mod} className="px-4 py-2 bg-white border border-outline-variant rounded-full text-label-md font-semibold flex items-center gap-2">
                {mod}
                <span className="bg-surface-container-highest text-on-surface-variant text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {tab === "combos" && (
        <EmptyState
          icon={<UtensilsCrossed className="w-7 h-7" />}
          title="No combos yet"
          message="Bundle items into fixed-price combos to raise average order value. Create combos from menu items."
          action={
            <Button onClick={() => toast.info("Combo builder", "Select 2+ items in the Items tab to bundle them (demo).")}>
              <Plus className="w-4 h-4" /> Create Combo
            </Button>
          }
        />
      )}

      {/* Add/edit drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editId ? "Edit Menu Item" : "Add Menu Item"}
        subtitle={editId ? "Update this dish's details." : "Create a new entry for your branch menu."}
        footer={
          <>
            <Button variant="secondary" className="flex-1" onClick={() => setDrawerOpen(false)}>
              Discard Changes
            </Button>
            <Button className="flex-1" onClick={save}>
              {editId ? "Save Item" : "Publish Item"}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Item Name" className="col-span-2">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Truffle Mac & Cheese" />
            </Field>
            <Field label="Description" className="col-span-2">
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe ingredients, allergens, etc."
              />
            </Field>
            <Field label="Base Price ($)">
              <Input type="number" step="0.5" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
            </Field>
            <Field label="Category">
              <Select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tax Category">
              <Select value={String(form.taxRate)} onChange={(e) => setForm({ ...form, taxRate: parseFloat(e.target.value) })}>
                <option value="0.08">Standard Food (8%)</option>
                <option value="0.2">Premium Spirit (20%)</option>
                <option value="0.1">Soft Drinks (10%)</option>
                <option value="0">Exempt</option>
              </Select>
            </Field>
            <Field label="Kitchen Station Routing">
              <Select value={form.station} onChange={(e) => setForm({ ...form, station: e.target.value as MenuItem["station"] })}>
                <option value="Grill">Grill Station</option>
                <option value="Cold">Garde Manger (Cold)</option>
                <option value="Saute">Saute Station</option>
                <option value="Fry">Fry Station</option>
                <option value="Bar">Bar Counter</option>
                <option value="Pastry">Pastry / Bakery</option>
              </Select>
            </Field>
            <Field label="Modifiers" className="col-span-2" hint="Comma-separated, e.g. Extra Cheese, No Onions">
              <Input value={form.modifiers} onChange={(e) => setForm({ ...form, modifiers: e.target.value })} placeholder="Extra Cheese, No Onions" />
            </Field>
          </div>
          <div className="pt-4 border-t border-outline-variant space-y-4">
            <div className="flex items-center justify-between p-4 bg-surface-container-high rounded-xl">
              <div>
                <p className="text-label-md font-semibold">Track Inventory</p>
                <p className="text-[11px] text-on-surface-variant">Enable automated stock countdown</p>
              </div>
              <Toggle checked={form.trackStock} onChange={(v) => setForm({ ...form, trackStock: v })} />
            </div>
            {form.trackStock && (
              <Field label="Current Stock">
                <Input type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
              </Field>
            )}
          </div>
        </div>
      </Drawer>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            const m = menuItems.find((x) => x.id === confirmDelete);
            deleteMenuItem(confirmDelete);
            toast.success(`"${m?.name}" removed from menu`);
          }
        }}
        title="Delete menu item?"
        message="This item will be removed from the menu, POS, and QR ordering."
        confirmLabel="Delete"
        danger
      />
    </AppShell>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="py-3.5 px-4 text-label-md font-semibold text-on-surface-variant uppercase tracking-wider">{children}</th>
  );
}

function ItemMenu({
  m,
  onEdit,
  onToggle,
  onDelete,
}: {
  m: MenuItem;
  onEdit: (m: MenuItem) => void;
  onToggle: (m: MenuItem) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <DropdownMenu
      trigger={
        <button className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
      }
      items={[
        { label: "Edit item", icon: <Pencil className="w-4 h-4" />, onClick: () => onEdit(m) },
        {
          label: m.available ? "Mark sold out" : "Mark available",
          icon: m.available ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />,
          onClick: () => onToggle(m),
        },
        "divider",
        { label: "Delete", icon: <Trash2 className="w-4 h-4" />, onClick: () => onDelete(m.id), danger: true },
      ]}
    />
  );
}
