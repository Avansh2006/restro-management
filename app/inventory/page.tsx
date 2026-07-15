"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  FileDown,
  History,
  Minus,
  MoreVertical,
  Package,
  Pencil,
  Plus,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import Link from "next/link";
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
  cx,
} from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import type { InventoryCategory, InventoryItem, InventoryUnit } from "@/lib/types";

type CatFilter = "all" | InventoryCategory;
type SortKey = "stock" | "value" | "name";

const emptyForm = {
  name: "",
  category: "Produce" as InventoryCategory,
  unit: "kg" as InventoryUnit,
  stock: 0,
  minStock: 10,
  costPerUnit: 0,
  supplierId: "",
};

export default function InventoryPage() {
  const inventory = useRestro((s) => s.inventory);
  const suppliers = useRestro((s) => s.suppliers);
  const purchaseOrders = useRestro((s) => s.purchaseOrders);
  const addInventoryItem = useRestro((s) => s.addInventoryItem);
  const updateInventoryItem = useRestro((s) => s.updateInventoryItem);
  const deleteInventoryItem = useRestro((s) => s.deleteInventoryItem);
  const adjustStock = useRestro((s) => s.adjustStock);
  const addPurchaseOrder = useRestro((s) => s.addPurchaseOrder);

  const activeBranchId = useRestro((s) => s.settings.activeBranchId);

  const [cat, setCat] = useState<CatFilter>("all");
  const [sort, setSort] = useState<SortKey>("stock");
  const [q, setQ] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("Manual recount");
  const [form, setForm] = useState(emptyForm);

  const stats = useMemo(() => {
    const totalValue = inventory.reduce((s, i) => s + i.stock * i.costPerUnit, 0);
    const low = inventory.filter((i) => i.stock < i.minStock);
    const pendingPos = purchaseOrders.filter((p) => p.status === "sent" || p.status === "confirmed").length;
    return { totalValue, low, pendingPos };
  }, [inventory, purchaseOrders]);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    const arr = inventory.filter((i) => {
      if (cat !== "all" && i.category !== cat) return false;
      if (needle && !i.name.toLowerCase().includes(needle)) return false;
      return true;
    });
    return arr.sort((a, b) => {
      if (sort === "stock") return a.stock / Math.max(1, a.minStock) - b.stock / Math.max(1, b.minStock);
      if (sort === "value") return b.stock * b.costPerUnit - a.stock * a.costPerUnit;
      return a.name.localeCompare(b.name);
    });
  }, [inventory, cat, sort, q]);

  const supplierName = (id?: string) => suppliers.find((s) => s.id === id)?.name ?? "—";

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setDrawerOpen(true);
  };
  const openEdit = (i: InventoryItem) => {
    setEditId(i.id);
    setForm({
      name: i.name,
      category: i.category,
      unit: i.unit,
      stock: i.stock,
      minStock: i.minStock,
      costPerUnit: i.costPerUnit,
      supplierId: i.supplierId ?? "",
    });
    setDrawerOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) return toast.error("Item name is required");
    const payload = { ...form, name: form.name.trim(), supplierId: form.supplierId || undefined, branchId: activeBranchId };
    if (editId) {
      updateInventoryItem(editId, payload);
      toast.success(`"${form.name}" updated`);
    } else {
      addInventoryItem(payload);
      toast.success(`"${form.name}" added to inventory`);
    }
    setDrawerOpen(false);
  };

  const reorder = (i: InventoryItem) => {
    if (!i.supplierId) return toast.error("No supplier linked to this item");
    const qty = Math.max(i.minStock * 2 - i.stock, i.minStock);
    addPurchaseOrder({
      supplierId: i.supplierId,
      status: "draft",
      lines: [{ inventoryItemId: i.id, name: i.name, qty, unitCost: i.costPerUnit }],
      branchId: activeBranchId,
    });
    toast.success(`Draft PO created for ${qty} ${i.unit} of ${i.name}`, "Review it in Purchase Orders");
  };

  const exportCsv = () => {
    const rows = [
      ["Name", "Category", "Stock", "Unit", "Min Stock", "Cost/Unit", "Value", "Supplier"],
      ...inventory.map((i) => [
        i.name,
        i.category,
        String(i.stock),
        i.unit,
        String(i.minStock),
        i.costPerUnit.toFixed(2),
        (i.stock * i.costPerUnit).toFixed(2),
        supplierName(i.supplierId),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "restroos-inventory.csv";
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Inventory exported as CSV");
  };

  return (
    <AppShell title="Inventory">
      <PageHeader
        title="Inventory & Stock"
        subtitle="Manage your supplies, track real-time levels, and handle reorders."
        actions={
          <>
            <Button variant="secondary" onClick={exportCsv}>
              <FileDown className="w-4 h-4" /> Export CSV
            </Button>
            <Link href="/audit-logs">
              <Button variant="secondary">
                <History className="w-4 h-4" /> Audit Logs
              </Button>
            </Link>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4" /> Add Item
            </Button>
          </>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border border-outline-variant shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-primary-fixed rounded-lg text-primary">
              <Banknote className="w-5 h-5" />
            </div>
            <Badge tone="green">+12% vs LW</Badge>
          </div>
          <div>
            <p className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wider">Total Stock Value</p>
            <h3 className="text-headline-lg sm:text-[32px] sm:leading-10 font-bold text-on-surface">{money(stats.totalValue)}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-outline-variant border-l-4 border-l-error shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-error-container rounded-lg text-error">
              <AlertTriangle className="w-5 h-5" />
            </div>
            {stats.low.length > 0 && <span className="text-error text-label-sm font-bold animate-pulse">Critical</span>}
          </div>
          <div>
            <p className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wider">Low Stock Items</p>
            <h3 className="text-headline-lg sm:text-[32px] sm:leading-10 font-bold text-on-surface">{stats.low.length}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-outline-variant shadow-sm flex flex-col gap-3">
          <div className="p-2 bg-secondary-fixed rounded-lg text-secondary w-fit">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <p className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wider">Pending Purchase Orders</p>
            <h3 className="text-headline-lg sm:text-[32px] sm:leading-10 font-bold text-on-surface">
              {String(stats.pendingPos).padStart(2, "0")}
            </h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-outline-variant shadow-sm flex flex-col gap-3">
          <div className="p-2 bg-tertiary-fixed rounded-lg text-tertiary w-fit">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wider">Waste this Month</p>
            <h3 className="text-headline-lg sm:text-[32px] sm:leading-10 font-bold text-on-surface">{money(1420)}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* Main table */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <div className="p-4 border-b border-outline-variant flex flex-wrap gap-3 justify-between items-center">
            <div className="flex gap-2 overflow-x-auto custom-scrollbar">
              {(["all", "Produce", "Meat", "Seafood", "Dairy", "Dry Goods", "Beverage"] as CatFilter[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={cx(
                    "px-4 py-1.5 rounded-full text-label-md font-semibold whitespace-nowrap transition-colors",
                    cat === c ? "bg-primary text-white" : "hover:bg-surface-container-high text-on-surface-variant",
                  )}
                >
                  {c === "all" ? "All Items" : c}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <SearchInput value={q} onChange={setQ} placeholder="Search stock..." className="flex-1 sm:w-44" />
              <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="!w-auto !py-2 text-label-md">
                <option value="stock">Stock (Low → High)</option>
                <option value="value">Value (High → Low)</option>
                <option value="name">Alphabetical</option>
              </Select>
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <Th>Item Name</Th>
                  <Th>Category</Th>
                  <Th className="text-center">Stock Level</Th>
                  <Th>Supplier</Th>
                  <Th className="text-right">Value</Th>
                  <th className="px-4 py-3.5 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filtered.map((i) => {
                  const low = i.stock < i.minStock;
                  const pct = Math.min(100, (i.stock / Math.max(1, i.minStock * 2)) * 100);
                  return (
                    <tr key={i.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={cx(
                              "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                              low ? "bg-error-container text-error" : "bg-surface-container-high text-on-surface-variant",
                            )}
                          >
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-body-md font-semibold">{i.name}</p>
                            <p className="text-label-sm text-on-surface-variant">
                              {i.stock} {i.unit} on hand • min {i.minStock}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-1 bg-surface-container-high rounded text-label-sm">{i.category}</span>
                      </td>
                      <td className="px-4 py-3.5 min-w-[130px]">
                        <ProgressBar pct={pct} tone={i.stock === 0 ? "red" : low ? "amber" : "primary"} />
                        <span className={cx("text-[11px] mt-1 block text-center", low ? "text-error font-bold" : "text-outline")}>
                          {i.stock === 0 ? "Out of stock" : low ? "Below minimum" : "Healthy"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-body-md text-on-surface-variant">{supplierName(i.supplierId)}</td>
                      <td className="px-4 py-3.5 text-right font-semibold text-body-md">{money(i.stock * i.costPerUnit)}</td>
                      <td className="px-4 py-3.5">
                        <RowMenu i={i} onEdit={openEdit} onAdjust={setAdjustItem} onReorder={reorder} onDelete={setConfirmDelete} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-outline-variant">
            {filtered.map((i) => {
              const low = i.stock < i.minStock;
              return (
                <div key={i.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-body-md">{i.name}</p>
                      <p className="text-label-sm text-on-surface-variant">
                        {i.category} • {supplierName(i.supplierId)}
                      </p>
                    </div>
                    <RowMenu i={i} onEdit={openEdit} onAdjust={setAdjustItem} onReorder={reorder} onDelete={setConfirmDelete} />
                  </div>
                  <ProgressBar pct={Math.min(100, (i.stock / Math.max(1, i.minStock * 2)) * 100)} tone={i.stock === 0 ? "red" : low ? "amber" : "primary"} />
                  <div className="flex justify-between mt-1.5 text-label-sm">
                    <span className={cx(low ? "text-error font-bold" : "text-on-surface-variant")}>
                      {i.stock} {i.unit} (min {i.minStock})
                    </span>
                    <span className="font-semibold">{money(i.stock * i.costPerUnit)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <EmptyState icon={<Package className="w-7 h-7" />} title="No items found" message="Try another filter or add stock items." />
          )}
        </div>

        {/* Right rail: alerts */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-title-lg font-semibold">Reorder Alerts</h3>
              <Badge tone="red">{stats.low.length}</Badge>
            </div>
            <div className="space-y-3">
              {stats.low.length === 0 && <p className="text-body-md text-on-surface-variant">All stock levels are healthy.</p>}
              {stats.low.map((i) => (
                <div key={i.id} className="flex items-center justify-between gap-2 p-3 bg-red-50/60 border border-red-100 rounded-xl">
                  <div className="min-w-0">
                    <p className="text-label-md font-bold text-on-surface truncate">{i.name}</p>
                    <p className="text-label-sm text-error">
                      {i.stock} / {i.minStock} {i.unit}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => reorder(i)}>
                    <ShoppingCart className="w-3.5 h-3.5" /> Reorder
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-5">
            <h3 className="text-title-lg font-semibold mb-4">Category Value</h3>
            <div className="space-y-3">
              {(["Meat", "Seafood", "Dairy", "Produce", "Dry Goods", "Beverage"] as InventoryCategory[]).map((c) => {
                const val = inventory.filter((i) => i.category === c).reduce((s, i) => s + i.stock * i.costPerUnit, 0);
                const pct = stats.totalValue ? (val / stats.totalValue) * 100 : 0;
                return (
                  <div key={c}>
                    <div className="flex justify-between text-label-md mb-1">
                      <span className="font-semibold">{c}</span>
                      <span className="text-on-surface-variant">{money(val)}</span>
                    </div>
                    <ProgressBar pct={pct} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Add/edit drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editId ? "Edit Stock Item" : "Add Stock Item"}
        footer={
          <>
            <Button variant="secondary" className="flex-1" onClick={() => setDrawerOpen(false)}>
              Discard
            </Button>
            <Button className="flex-1" onClick={save}>
              {editId ? "Save Changes" : "Add Item"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Item Name" className="col-span-2">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Cherry Tomatoes" />
          </Field>
          <Field label="Category">
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as InventoryCategory })}>
              {["Produce", "Meat", "Seafood", "Dairy", "Dry Goods", "Beverage"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Unit">
            <Select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value as InventoryUnit })}>
              {["kg", "g", "L", "ml", "pcs", "box"].map((u) => (
                <option key={u}>{u}</option>
              ))}
            </Select>
          </Field>
          <Field label="Current Stock">
            <Input type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
          </Field>
          <Field label="Minimum Stock">
            <Input type="number" min={0} value={form.minStock} onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} />
          </Field>
          <Field label="Cost per Unit ($)">
            <Input
              type="number"
              step="0.1"
              min={0}
              value={form.costPerUnit}
              onChange={(e) => setForm({ ...form, costPerUnit: Number(e.target.value) })}
            />
          </Field>
          <Field label="Supplier">
            <Select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
              <option value="">No supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Drawer>

      {/* Stock adjust modal */}
      <Drawer
        open={!!adjustItem}
        onClose={() => setAdjustItem(null)}
        title={`Adjust: ${adjustItem?.name ?? ""}`}
        subtitle={`Current stock: ${adjustItem?.stock ?? 0} ${adjustItem?.unit ?? ""}`}
        width="w-full sm:w-[400px]"
        footer={
          <>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                const amt = Math.abs(parseFloat(adjustAmount) || 0);
                if (!amt || !adjustItem) return toast.error("Enter an amount");
                adjustStock(adjustItem.id, -amt, adjustReason);
                toast.warning(`Removed ${amt} ${adjustItem.unit} of ${adjustItem.name}`);
                setAdjustItem(null);
                setAdjustAmount("");
              }}
            >
              <Minus className="w-4 h-4" /> Remove
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                const amt = Math.abs(parseFloat(adjustAmount) || 0);
                if (!amt || !adjustItem) return toast.error("Enter an amount");
                adjustStock(adjustItem.id, amt, adjustReason);
                toast.success(`Added ${amt} ${adjustItem.unit} of ${adjustItem.name}`);
                setAdjustItem(null);
                setAdjustAmount("");
              }}
            >
              <Plus className="w-4 h-4" /> Add
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label={`Amount (${adjustItem?.unit ?? ""})`}>
            <Input type="number" min={0} step="0.1" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} placeholder="0" />
          </Field>
          <Field label="Reason">
            <Select value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)}>
              <option>Manual recount</option>
              <option>Delivery received</option>
              <option>Spoilage / waste</option>
              <option>Kitchen usage</option>
              <option>Transfer between branches</option>
            </Select>
          </Field>
        </div>
      </Drawer>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            const i = inventory.find((x) => x.id === confirmDelete);
            deleteInventoryItem(confirmDelete);
            toast.success(`"${i?.name}" removed from inventory`);
          }
        }}
        title="Delete stock item?"
        message="This item and its stock history reference will be removed."
        confirmLabel="Delete"
        danger
      />
    </AppShell>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={cx("px-4 py-3.5 first:pl-5 text-label-md font-semibold text-on-surface-variant uppercase tracking-tight", className)}>
      {children}
    </th>
  );
}

function RowMenu({
  i,
  onEdit,
  onAdjust,
  onReorder,
  onDelete,
}: {
  i: InventoryItem;
  onEdit: (i: InventoryItem) => void;
  onAdjust: (i: InventoryItem) => void;
  onReorder: (i: InventoryItem) => void;
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
        { label: "Adjust stock", icon: <Package className="w-4 h-4" />, onClick: () => onAdjust(i) },
        { label: "Edit item", icon: <Pencil className="w-4 h-4" />, onClick: () => onEdit(i) },
        { label: "Create reorder PO", icon: <ShoppingCart className="w-4 h-4" />, onClick: () => onReorder(i) },
        "divider",
        { label: "Delete", icon: <Trash2 className="w-4 h-4" />, onClick: () => onDelete(i.id), danger: true },
      ]}
    />
  );
}
