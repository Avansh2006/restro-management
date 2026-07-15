"use client";

import { useMemo, useState } from "react";
import { BookOpenText, ChefHat, Clock, Pencil, Plus, Trash2, UtensilsCrossed } from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell/AppShell";
import { useRestro, money } from "@/lib/store";
import {
  Badge,
  Button,
  ConfirmDialog,
  Drawer,
  EmptyState,
  Field,
  Input,
  SearchInput,
  Select,
  Textarea,
  cx,
} from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import type { Recipe } from "@/lib/types";

const emptyForm = {
  menuItemId: "",
  name: "",
  yieldQty: 1,
  prepMinutes: 10,
  instructions: "",
  ingredients: [] as Array<{ inventoryItemId: string; qty: number }>,
};

export default function RecipesPage() {
  const recipes = useRestro((s) => s.recipes);
  const menuItems = useRestro((s) => s.menuItems);
  const inventory = useRestro((s) => s.inventory);
  const addRecipe = useRestro((s) => s.addRecipe);
  const updateRecipe = useRestro((s) => s.updateRecipe);
  const deleteRecipe = useRestro((s) => s.deleteRecipe);

  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(
    () => recipes.filter((r) => !q || r.name.toLowerCase().includes(q.toLowerCase())),
    [recipes, q],
  );

  const invName = (id: string) => inventory.find((i) => i.id === id);

  const recipeCost = (r: Recipe) =>
    r.ingredients.reduce((s, ing) => {
      const inv = invName(ing.inventoryItemId);
      return s + (inv ? inv.costPerUnit * ing.qty : 0);
    }, 0);

  const openCreate = () => {
    setEditId(null);
    setForm({ ...emptyForm, menuItemId: menuItems[0]?.id ?? "" });
    setDrawerOpen(true);
  };

  const openEdit = (r: Recipe) => {
    setEditId(r.id);
    setForm({
      menuItemId: r.menuItemId,
      name: r.name,
      yieldQty: r.yieldQty,
      prepMinutes: r.prepMinutes,
      instructions: r.instructions.join("\n"),
      ingredients: r.ingredients.map((i) => ({ ...i })),
    });
    setDrawerOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) return toast.error("Recipe name is required");
    const payload = {
      menuItemId: form.menuItemId,
      name: form.name.trim(),
      yieldQty: form.yieldQty,
      prepMinutes: form.prepMinutes,
      instructions: form.instructions.split("\n").map((s) => s.trim()).filter(Boolean),
      ingredients: form.ingredients.filter((i) => i.inventoryItemId && i.qty > 0),
    };
    if (editId) {
      updateRecipe(editId, payload);
      toast.success(`Recipe "${form.name}" updated`);
      if (selected?.id === editId) setSelected({ ...selected, ...payload });
    } else {
      addRecipe(payload);
      toast.success(`Recipe "${form.name}" created`);
    }
    setDrawerOpen(false);
  };

  return (
    <AppShell title="Recipes">
      <PageHeader
        title="Recipes"
        subtitle="Standardize preparation and tie menu items to inventory costs."
        actions={
          <>
            <SearchInput value={q} onChange={setQ} placeholder="Search recipes..." className="w-full sm:w-60" />
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4" /> New Recipe
            </Button>
          </>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<BookOpenText className="w-7 h-7" />}
          title="No recipes"
          message="Create your first recipe card to standardize the kitchen."
          action={
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4" /> New Recipe
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((r) => {
            const menuItem = menuItems.find((m) => m.id === r.menuItemId);
            const cost = recipeCost(r);
            const margin = menuItem ? ((menuItem.price - cost / r.yieldQty) / menuItem.price) * 100 : 0;
            return (
              <div
                key={r.id}
                onClick={() => setSelected(r)}
                className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
                    <ChefHat className="w-5 h-5" />
                  </div>
                  <Badge tone={margin > 70 ? "green" : margin > 50 ? "amber" : "red"}>{Math.round(margin)}% margin</Badge>
                </div>
                <h3 className="text-title-lg font-semibold text-on-surface mb-1">{r.name}</h3>
                <p className="text-label-sm text-on-surface-variant mb-4">
                  {r.ingredients.length} ingredients • yields {r.yieldQty}
                </p>
                <div className="flex items-center justify-between text-label-md">
                  <span className="flex items-center gap-1.5 text-on-surface-variant">
                    <Clock className="w-4 h-4" /> {r.prepMinutes} min
                  </span>
                  <span className="font-bold text-on-surface">
                    Cost: {money(cost / r.yieldQty)}
                    {menuItem && <span className="text-on-surface-variant font-medium"> / sells {money(menuItem.price)}</span>}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail drawer */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        subtitle={`Prep time ${selected?.prepMinutes ?? 0} min • yields ${selected?.yieldQty ?? 1}`}
        footer={
          selected ? (
            <>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  openEdit(selected);
                  setSelected(null);
                }}
              >
                <Pencil className="w-4 h-4" /> Edit
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => {
                  setConfirmDelete(selected.id);
                  setSelected(null);
                }}
              >
                <Trash2 className="w-4 h-4" /> Delete
              </Button>
            </>
          ) : undefined
        }
      >
        {selected && (
          <div className="space-y-6">
            <div>
              <h4 className="text-label-md font-bold text-on-surface-variant uppercase tracking-wide mb-3">Ingredients</h4>
              <div className="bg-surface-container-low rounded-xl divide-y divide-outline-variant overflow-hidden">
                {selected.ingredients.map((ing, i) => {
                  const inv = invName(ing.inventoryItemId);
                  return (
                    <div key={i} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-body-md font-semibold">{inv?.name ?? "Unknown item"}</p>
                        <p className="text-label-sm text-on-surface-variant">
                          {ing.qty} {inv?.unit}
                        </p>
                      </div>
                      <span className="text-label-md font-bold">{inv ? money(inv.costPerUnit * ing.qty) : "—"}</span>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between px-4 py-3 bg-white">
                  <span className="text-body-md font-bold">Total batch cost</span>
                  <span className="text-body-md font-bold text-primary">{money(recipeCost(selected))}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-label-md font-bold text-on-surface-variant uppercase tracking-wide mb-3">Instructions</h4>
              <ol className="space-y-2.5">
                {selected.instructions.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-label-sm font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-body-md text-on-surface">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </Drawer>

      {/* Create/edit drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editId ? "Edit Recipe" : "New Recipe"}
        footer={
          <>
            <Button variant="secondary" className="flex-1" onClick={() => setDrawerOpen(false)}>
              Discard
            </Button>
            <Button className="flex-1" onClick={save}>
              {editId ? "Save Recipe" : "Create Recipe"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Recipe Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Signature Wagyu Burger" />
          </Field>
          <Field label="Linked Menu Item">
            <Select value={form.menuItemId} onChange={(e) => setForm({ ...form, menuItemId: e.target.value })}>
              {menuItems.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Yield (servings)">
              <Input type="number" min={1} value={form.yieldQty} onChange={(e) => setForm({ ...form, yieldQty: Number(e.target.value) })} />
            </Field>
            <Field label="Prep Time (min)">
              <Input type="number" min={1} value={form.prepMinutes} onChange={(e) => setForm({ ...form, prepMinutes: Number(e.target.value) })} />
            </Field>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-label-md font-semibold">Ingredients</span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  setForm({ ...form, ingredients: [...form.ingredients, { inventoryItemId: inventory[0]?.id ?? "", qty: 1 }] })
                }
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {form.ingredients.length === 0 && (
                <p className="text-label-sm text-on-surface-variant italic">No ingredients yet — add from inventory.</p>
              )}
              {form.ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Select
                    value={ing.inventoryItemId}
                    onChange={(e) => {
                      const next = [...form.ingredients];
                      next[i] = { ...next[i], inventoryItemId: e.target.value };
                      setForm({ ...form, ingredients: next });
                    }}
                    className="flex-1"
                  >
                    {inventory.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.name} ({inv.unit})
                      </option>
                    ))}
                  </Select>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={ing.qty}
                    onChange={(e) => {
                      const next = [...form.ingredients];
                      next[i] = { ...next[i], qty: Number(e.target.value) };
                      setForm({ ...form, ingredients: next });
                    }}
                    className="!w-24"
                  />
                  <button
                    onClick={() => setForm({ ...form, ingredients: form.ingredients.filter((_, xi) => xi !== i) })}
                    className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-red-50 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <Field label="Instructions" hint="One step per line">
            <Textarea
              rows={5}
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              placeholder={"Season patty and grill\nToast the bun\nAssemble and plate"}
            />
          </Field>
        </div>
      </Drawer>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            deleteRecipe(confirmDelete);
            toast.success("Recipe deleted");
          }
        }}
        title="Delete recipe?"
        message="This recipe card will be permanently removed."
        confirmLabel="Delete"
        danger
      />
    </AppShell>
  );
}
