"use client";

import { useMemo, useState } from "react";
import { Mail, MoreVertical, Pencil, Phone, Plus, Star, Trash2, Users } from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell/AppShell";
import { useRestro, money, timeAgo } from "@/lib/store";
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

  type BadgeTone,
} from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import type { Customer, LoyaltyTier } from "@/lib/types";

const TIER_TONE: Record<LoyaltyTier, BadgeTone> = {
  Bronze: "amber",
  Silver: "slate",
  Gold: "amber",
  Platinum: "purple",
};

const TIER_COLOR: Record<LoyaltyTier, string> = {
  Bronze: "#b45309",
  Silver: "#64748b",
  Gold: "#d97706",
  Platinum: "#7c3aed",
};

type Filter = "all" | LoyaltyTier;

const emptyForm = { name: "", phone: "", email: "", tags: "" };

export default function CustomersPage() {
  const customers = useRestro((s) => s.customers);
  const orders = useRestro((s) => s.orders);
  const addCustomer = useRestro((s) => s.addCustomer);
  const updateCustomer = useRestro((s) => s.updateCustomer);
  const deleteCustomer = useRestro((s) => s.deleteCustomer);

  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<Customer | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return customers
      .filter((c) => {
        if (filter !== "all" && c.tier !== filter) return false;
        if (needle && !c.name.toLowerCase().includes(needle) && !c.phone.includes(needle) && !c.email.toLowerCase().includes(needle))
          return false;
        return true;
      })
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }, [customers, filter, q]);

  const liveDetail = detail ? customers.find((c) => c.id === detail.id) ?? null : null;
  const detailOrders = liveDetail ? orders.filter((o) => o.customerId === liveDetail.id) : [];

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setDrawerOpen(true);
  };
  const openEdit = (c: Customer) => {
    setEditId(c.id);
    setForm({ name: c.name, phone: c.phone, email: c.email, tags: c.tags.join(", ") });
    setDrawerOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) return toast.error("Name is required");
    const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
    if (editId) {
      updateCustomer(editId, { name: form.name.trim(), phone: form.phone, email: form.email, tags });
      toast.success(`${form.name} updated`);
    } else {
      addCustomer({ name: form.name.trim(), phone: form.phone, email: form.email, tags });
      toast.success(`${form.name} added to customers`);
    }
    setDrawerOpen(false);
  };

  return (
    <AppShell title="Customers">
      <PageHeader
        title="Customers"
        subtitle="Guest profiles, visit history, and lifetime value."
        actions={
          <>
            <SearchInput value={q} onChange={setQ} placeholder="Search name, phone, email..." className="w-full sm:w-64" />
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4" /> Add Customer
            </Button>
          </>
        }
      />

      <PillTabs
        className="mb-5 w-fit max-w-full"
        tabs={[
          { key: "all", label: "All", count: customers.length },
          { key: "Platinum", label: "Platinum", count: customers.filter((c) => c.tier === "Platinum").length },
          { key: "Gold", label: "Gold", count: customers.filter((c) => c.tier === "Gold").length },
          { key: "Silver", label: "Silver", count: customers.filter((c) => c.tier === "Silver").length },
          { key: "Bronze", label: "Bronze", count: customers.filter((c) => c.tier === "Bronze").length },
        ]}
        active={filter}
        onChange={setFilter}
      />

      {filtered.length === 0 ? (
        <EmptyState icon={<Users className="w-7 h-7" />} title="No customers found" message="Adjust the filter or add a guest." />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white border border-outline-variant rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <Th>Customer</Th>
                  <Th>Tier</Th>
                  <Th>Visits</Th>
                  <Th>Total Spent</Th>
                  <Th>Points</Th>
                  <Th>Last Visit</Th>
                  <th className="py-3.5 px-4 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-container-low transition-colors cursor-pointer" onClick={() => setDetail(c)}>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} color={TIER_COLOR[c.tier]} />
                        <div>
                          <p className="text-body-md font-semibold">{c.name}</p>
                          <p className="text-label-sm text-on-surface-variant">{c.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge tone={TIER_TONE[c.tier]}>{c.tier}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-body-md">{c.visits}</td>
                    <td className="py-3.5 px-4 text-body-md font-semibold">{money(c.totalSpent)}</td>
                    <td className="py-3.5 px-4">
                      <span className="flex items-center gap-1 text-body-md font-semibold text-primary">
                        <Star className="w-3.5 h-3.5 fill-current" /> {c.loyaltyPoints.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-body-md text-on-surface-variant">{c.lastVisit ?? "—"}</td>
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <RowMenu c={c} onEdit={openEdit} onDelete={setConfirmDelete} onView={setDetail} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((c) => (
              <div key={c.id} className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm" onClick={() => setDetail(c)}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Avatar name={c.name} color={TIER_COLOR[c.tier]} />
                    <div>
                      <p className="font-bold text-body-md">{c.name}</p>
                      <p className="text-label-sm text-on-surface-variant">{c.phone}</p>
                    </div>
                  </div>
                  <Badge tone={TIER_TONE[c.tier]}>{c.tier}</Badge>
                </div>
                <div className="flex items-center justify-between text-label-md text-on-surface-variant">
                  <span>{c.visits} visits</span>
                  <span className="font-semibold text-on-surface">{money(c.totalSpent)}</span>
                  <span className="flex items-center gap-1 text-primary font-semibold">
                    <Star className="w-3 h-3 fill-current" /> {c.loyaltyPoints.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Detail drawer */}
      <Drawer
        open={!!liveDetail}
        onClose={() => setDetail(null)}
        title={liveDetail?.name ?? ""}
        subtitle={liveDetail ? `Customer since ${liveDetail.joinedAt}` : undefined}
        footer={
          liveDetail ? (
            <>
              <Button variant="secondary" className="flex-1" onClick={() => { openEdit(liveDetail); setDetail(null); }}>
                <Pencil className="w-4 h-4" /> Edit
              </Button>
              <Button variant="danger" className="flex-1" onClick={() => { setConfirmDelete(liveDetail.id); setDetail(null); }}>
                <Trash2 className="w-4 h-4" /> Delete
              </Button>
            </>
          ) : undefined
        }
      >
        {liveDetail && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar name={liveDetail.name} color={TIER_COLOR[liveDetail.tier]} size="lg" />
              <div>
                <Badge tone={TIER_TONE[liveDetail.tier]}>{liveDetail.tier} Member</Badge>
                <div className="flex items-center gap-3 mt-1.5 text-body-md text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> {liveDetail.phone}
                  </span>
                </div>
                <p className="flex items-center gap-1 text-body-md text-on-surface-variant mt-0.5">
                  <Mail className="w-3.5 h-3.5" /> {liveDetail.email}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <MiniStat label="Visits" value={String(liveDetail.visits)} />
              <MiniStat label="Lifetime" value={money(liveDetail.totalSpent)} />
              <MiniStat label="Points" value={liveDetail.loyaltyPoints.toLocaleString()} />
            </div>

            {liveDetail.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {liveDetail.tags.map((t) => (
                  <Badge key={t} tone="indigo">
                    {t}
                  </Badge>
                ))}
              </div>
            )}

            <div>
              <h4 className="text-label-md font-bold text-on-surface-variant uppercase tracking-wide mb-3">Order History</h4>
              {detailOrders.length === 0 && <p className="text-body-md text-on-surface-variant">No linked orders yet.</p>}
              <div className="space-y-2">
                {detailOrders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">
                    <div>
                      <p className="text-body-md font-semibold">#{o.number}</p>
                      <p className="text-label-sm text-on-surface-variant">
                        {o.items.length} items • {timeAgo(o.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-body-md">{money(o.total)}</p>
                      <Badge tone={o.status === "paid" ? "green" : o.status === "cancelled" ? "red" : "blue"}>{o.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Add/edit drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editId ? "Edit Customer" : "Add Customer"}
        footer={
          <>
            <Button variant="secondary" className="flex-1" onClick={() => setDrawerOpen(false)}>
              Discard
            </Button>
            <Button className="flex-1" onClick={save}>
              {editId ? "Save Changes" : "Add Customer"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Full Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Harold Miller" />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(415) 555-0000" />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="guest@example.com" />
          </Field>
          <Field label="Tags" hint="Comma-separated, e.g. vip, vegetarian">
            <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="vip, regular" />
          </Field>
        </div>
      </Drawer>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            deleteCustomer(confirmDelete);
            toast.success("Customer deleted");
          }
        }}
        title="Delete customer?"
        message="Their profile and loyalty points will be removed. Order history stays anonymized."
        confirmLabel="Delete"
        danger
      />
    </AppShell>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="py-3.5 px-4 first:pl-5 text-label-md font-semibold text-on-surface-variant uppercase tracking-wider">{children}</th>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-container-low rounded-xl p-3 text-center">
      <p className="text-title-lg font-bold">{value}</p>
      <p className="text-[10px] text-on-surface-variant font-bold uppercase">{label}</p>
    </div>
  );
}

function RowMenu({
  c,
  onEdit,
  onDelete,
  onView,
}: {
  c: Customer;
  onEdit: (c: Customer) => void;
  onDelete: (id: string) => void;
  onView: (c: Customer) => void;
}) {
  return (
    <DropdownMenu
      trigger={
        <button className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
      }
      items={[
        { label: "View profile", icon: <Users className="w-4 h-4" />, onClick: () => onView(c) },
        { label: "Edit", icon: <Pencil className="w-4 h-4" />, onClick: () => onEdit(c) },
        "divider",
        { label: "Delete", icon: <Trash2 className="w-4 h-4" />, onClick: () => onDelete(c.id), danger: true },
      ]}
    />
  );
}
