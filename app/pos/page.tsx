"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  CreditCard,
  Minus,
  Pause,
  Percent,
  Plus,
  Search,
  ShoppingCart,
  Split,
  Star,
  Trash2,
  Utensils,
  Wallet,
  X,
} from "lucide-react";
import { useRestro, money } from "@/lib/store";
import { Button, ChipRow, Modal, Select, cx } from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import { ExperienceSwitcher } from "@/components/shell/AppShell";
import type { MenuItem, OrderItem, PaymentMethod } from "@/lib/types";

interface CartLine {
  item: MenuItem;
  qty: number;
  modifiers: string[];
}

const STATION_EMOJI: Record<string, string> = {
  Grill: "🥩",
  Cold: "🥗",
  Saute: "🍝",
  Bar: "🍹",
  Pastry: "🍰",
  Fry: "🍟",
};

export default function PosPage() {
  const menuItems = useRestro((s) => s.menuItems);
  const categories = useRestro((s) => s.menuCategories);
  const tables = useRestro((s) => s.tables);
  const customers = useRestro((s) => s.customers);
  const settings = useRestro((s) => s.settings);
  const createOrder = useRestro((s) => s.createOrder);
  const payOrder = useRestro((s) => s.payOrder);
  const setOrderStatus = useRestro((s) => s.setOrderStatus);

  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [tableId, setTableId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [discountPct, setDiscountPct] = useState(0);
  const [payOpen, setPayOpen] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [modItem, setModItem] = useState<MenuItem | null>(null);
  const [selectedMods, setSelectedMods] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false); // mobile sheet

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return menuItems.filter((m) => {
      if (cat !== "all" && m.categoryId !== cat) return false;
      if (needle && !m.name.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [menuItems, cat, q]);

  const totals = useMemo(() => {
    const subtotal = cart.reduce((s, l) => s + l.item.price * l.qty, 0);
    const discount = Math.round(subtotal * (discountPct / 100) * 100) / 100;
    const tax = Math.round(subtotal * settings.taxRate * 100) / 100;
    const total = Math.round((subtotal + tax - discount) * 100) / 100;
    return { subtotal, discount, tax, total };
  }, [cart, discountPct, settings.taxRate]);

  const itemCount = cart.reduce((s, l) => s + l.qty, 0);

  const addToCart = (m: MenuItem, mods: string[] = []) => {
    if (!m.available || (m.trackStock && m.stock <= 0)) {
      toast.error(`${m.name} is sold out`);
      return;
    }
    setCart((c) => {
      const key = (l: CartLine) => l.item.id + "|" + l.modifiers.join(",");
      const idx = c.findIndex((l) => key(l) === m.id + "|" + mods.join(","));
      if (idx >= 0) return c.map((l, i) => (i === idx ? { ...l, qty: l.qty + 1 } : l));
      return [...c, { item: m, qty: 1, modifiers: mods }];
    });
  };

  const changeQty = (idx: number, delta: number) =>
    setCart((c) =>
      c
        .map((l, i) => (i === idx ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0),
    );

  const placeOrder = (pay: boolean) => {
    if (!cart.length) return toast.warning("Cart is empty");
    const items: OrderItem[] = cart.map((l) => ({
      menuItemId: l.item.id,
      name: l.item.name,
      price: l.item.price,
      qty: l.qty,
      modifiers: l.modifiers.length ? l.modifiers : undefined,
      kitchenStatus: "queued" as const,
    }));
    const customer = customers.find((c) => c.id === customerId);
    const order = createOrder({
      channel: tableId ? "dine-in" : "takeaway",
      items,
      tableId: tableId || undefined,
      customerId: customerId || undefined,
      customerName: customer?.name,
      discount: totals.discount,
    });
    if (pay) {
      // paying immediately: mark served then paid so KDS history is consistent
      setOrderStatus(order.id, "served");
      payOrder(order.id, method);
      toast.success(`Payment of ${money(totals.total)} confirmed`, `Order #${order.number} • ${method}`);
    } else {
      toast.success(`Order #${order.number} sent to kitchen`, tableId ? `Table ${tables.find((t) => t.id === tableId)?.name}` : "Takeaway");
    }
    setCart([]);
    setDiscountPct(0);
    setTableId("");
    setCustomerId("");
    setPayOpen(false);
    setCartOpen(false);
  };

  const cartPanel = (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-white shrink-0">
        <div>
          <h2 className="text-title-lg font-semibold text-on-surface">Current Order</h2>
          <p className="text-[11px] text-on-surface-variant">
            {tableId ? `Dine-in • Table ${tables.find((t) => t.id === tableId)?.name}` : "Takeaway / counter"}
          </p>
        </div>
        <button
          onClick={() => {
            if (cart.length) {
              setCart([]);
              toast.info("Cart cleared");
            }
          }}
          className="p-2 hover:bg-error-container hover:text-on-error-container rounded-lg transition-colors text-on-surface-variant"
          title="Clear cart"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 border-b border-outline-variant grid grid-cols-2 gap-2 bg-surface-container-lowest shrink-0">
        <Select value={tableId} onChange={(e) => setTableId(e.target.value)} className="!py-2 text-label-md">
          <option value="">No table (takeaway)</option>
          {tables
            .filter((t) => t.status === "available" || t.status === "occupied")
            .map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} • {t.status}
              </option>
            ))}
        </Select>
        <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="!py-2 text-label-md">
          <option value="">Guest customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.tier})
            </option>
          ))}
        </Select>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3 space-y-2.5 min-h-0">
        {cart.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingCart className="w-10 h-10 text-outline-variant mb-3" />
            <p className="text-body-md text-on-surface-variant">Tap menu items to build the order</p>
          </div>
        )}
        {cart.map((l, i) => (
          <div key={i} className="bg-white p-3 rounded-xl border border-outline-variant hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start mb-1 gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="text-label-md font-semibold text-on-surface leading-tight">{l.item.name}</h4>
                {l.modifiers.length > 0 && (
                  <ul className="text-[10px] text-on-surface-variant mt-0.5 space-y-0.5">
                    {l.modifiers.map((m, mi) => (
                      <li key={mi}>+ {m}</li>
                    ))}
                  </ul>
                )}
              </div>
              <span className="font-bold text-sm text-on-surface shrink-0">{money(l.item.price * l.qty)}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2 bg-surface-container px-2 py-1 rounded-lg">
                <button
                  onClick={() => changeQty(i, -1)}
                  className="w-6 h-6 flex items-center justify-center hover:bg-surface-variant rounded transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-bold text-xs w-4 text-center">{l.qty}</span>
                <button
                  onClick={() => changeQty(i, 1)}
                  className="w-6 h-6 flex items-center justify-center hover:bg-surface-variant rounded transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              {(l.item.modifiers?.length ?? 0) > 0 && (
                <button
                  onClick={() => {
                    setModItem(l.item);
                    setSelectedMods(l.modifiers);
                    setCart((c) => c.filter((_, ci) => ci !== i));
                  }}
                  className="text-primary text-[11px] font-semibold hover:underline"
                >
                  Edit Modifiers
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-outline-variant bg-white p-4 space-y-3 shrink-0">
        <div className="space-y-1">
          <div className="flex justify-between text-body-md text-on-surface-variant">
            <span>Subtotal</span>
            <span>{money(totals.subtotal)}</span>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between text-body-md text-emerald-700">
              <span>Discount ({discountPct}%)</span>
              <span>-{money(totals.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-body-md text-on-surface-variant">
            <span>Tax ({Math.round(settings.taxRate * 100)}%)</span>
            <span>{money(totals.tax)}</span>
          </div>
          <div className="flex justify-between text-headline-md font-semibold text-primary pt-1">
            <span>Total</span>
            <span>{money(totals.total)}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => {
              if (!cart.length) return toast.warning("Cart is empty");
              placeOrder(false);
            }}
            className="flex items-center justify-center gap-1 py-2.5 border border-outline-variant rounded-xl text-label-md font-semibold hover:bg-surface-container-high active:scale-95 transition-all"
          >
            <Pause className="w-3.5 h-3.5" /> Hold
          </button>
          <button
            onClick={() => {
              const next = discountPct === 0 ? 10 : discountPct === 10 ? 20 : 0;
              setDiscountPct(next);
              toast.info(next ? `${next}% discount applied` : "Discount removed");
            }}
            className={cx(
              "flex items-center justify-center gap-1 py-2.5 border rounded-xl text-label-md font-semibold active:scale-95 transition-all",
              discountPct ? "border-primary text-primary bg-primary-fixed/40" : "border-outline-variant hover:bg-surface-container-high",
            )}
          >
            <Percent className="w-3.5 h-3.5" /> {discountPct ? `${discountPct}%` : "Discount"}
          </button>
          <button
            onClick={() => toast.info("Split bill", "Choose items per guest in a live setup — demo splits evenly.")}
            className="flex items-center justify-center gap-1 py-2.5 border border-outline-variant rounded-xl text-label-md font-semibold hover:bg-surface-container-high active:scale-95 transition-all"
          >
            <Split className="w-3.5 h-3.5" /> Split
          </button>
        </div>
        <button
          onClick={() => {
            if (!cart.length) return toast.warning("Cart is empty");
            setPayOpen(true);
          }}
          className="w-full py-3.5 bg-primary text-on-primary rounded-xl text-title-lg font-semibold shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Wallet className="w-5 h-5" />
          Pay {money(totals.total)}
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-dvh flex flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <header className="flex justify-between items-center h-16 px-3 sm:px-6 bg-surface border-b border-outline-variant shadow-sm shrink-0 gap-2">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Link href="/" className="p-2 -ml-1 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors" title="Back to dashboard">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-title-lg font-semibold text-on-surface">RestroOS</h1>
          <div className="h-6 w-px bg-outline-variant hidden sm:block" />
          <span className="text-on-surface-variant text-label-md hidden sm:block">POS Terminal</span>
          <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
            Live
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="relative hidden md:flex items-center bg-surface-container-low rounded-full px-3 py-2 border border-outline-variant w-64 lg:w-80">
            <Search className="w-4 h-4 text-outline" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="bg-transparent border-none outline-none text-body-md w-full px-2 placeholder:text-outline"
              placeholder="Search menu items..."
            />
            {q && (
              <button onClick={() => setQ("")}>
                <X className="w-3.5 h-3.5 text-outline" />
              </button>
            )}
          </div>
          <ExperienceSwitcher compact />
          <div className="flex items-center gap-2 bg-surface-container-high px-2.5 py-1.5 rounded-full">
            <div className="w-7 h-7 rounded-full bg-primary-container flex items-center justify-center text-white text-xs font-bold">
              SJ
            </div>
            <span className="text-label-md font-semibold hidden sm:block">Sarah J.</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex min-h-0 overflow-hidden">
        {/* Menu section */}
        <section className="flex-1 flex flex-col min-w-0 border-r border-outline-variant">
          <div className="p-3 sm:p-4 bg-surface border-b border-outline-variant space-y-2.5 shrink-0">
            {/* Mobile search */}
            <div className="md:hidden relative flex items-center bg-surface-container-low rounded-full px-3 py-2 border border-outline-variant">
              <Search className="w-4 h-4 text-outline" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="bg-transparent border-none outline-none text-body-md w-full px-2 placeholder:text-outline"
                placeholder="Search menu items..."
              />
            </div>
            <ChipRow
              chips={[{ key: "all", label: "All Items" }, ...categories.map((c) => ({ key: c.id, label: c.name }))]}
              active={cat}
              onChange={setCat}
            />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 pb-28 lg:pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
              {filtered.map((m) => {
                const soldOut = !m.available || (m.trackStock && m.stock <= 0);
                return (
                  <button
                    key={m.id}
                    disabled={soldOut}
                    onClick={() => {
                      if (m.modifiers?.length) {
                        setModItem(m);
                        setSelectedMods([]);
                      } else addToCart(m);
                    }}
                    className={cx(
                      "bg-white rounded-xl border text-left overflow-hidden transition-all group",
                      soldOut
                        ? "border-outline-variant opacity-50 cursor-not-allowed"
                        : "border-outline-variant cursor-pointer hover:border-primary hover:shadow-md active:scale-95",
                    )}
                  >
                    <div className="h-20 sm:h-24 w-full bg-gradient-to-br from-surface-container to-surface-container-high flex items-center justify-center text-4xl relative">
                      <span className="group-hover:scale-110 transition-transform duration-300">
                        {STATION_EMOJI[m.station] ?? "🍽"}
                      </span>
                      {m.popular && !soldOut && (
                        <span className="absolute top-2 left-2 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-current" /> POPULAR
                        </span>
                      )}
                      {soldOut && (
                        <span className="absolute inset-0 bg-white/60 flex items-center justify-center">
                          <span className="bg-error text-white text-[10px] font-bold px-2 py-1 rounded-full">SOLD OUT</span>
                        </span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="font-semibold text-on-surface text-sm mb-1 line-clamp-1">{m.name}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-primary font-bold text-sm">{money(m.price)}</span>
                        <span className="text-[10px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">
                          {soldOut ? "—" : m.trackStock && m.stock <= 10 ? `${m.stock} Left` : "Available"}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-16 text-on-surface-variant">
                <Utensils className="w-10 h-10 mx-auto mb-3 text-outline-variant" />
                <p className="text-body-md">No items match your search.</p>
              </div>
            )}
          </div>
        </section>

        {/* Cart: desktop panel */}
        <section className="hidden lg:flex w-[360px] xl:w-[380px] flex-col bg-surface shrink-0 min-h-0">{cartPanel}</section>
      </main>

      {/* Mobile cart trigger */}
      <div className="lg:hidden fixed bottom-4 inset-x-4 z-40">
        <button
          onClick={() => setCartOpen(true)}
          className="w-full py-3.5 bg-primary text-on-primary rounded-2xl font-bold shadow-xl shadow-primary/30 flex items-center justify-between px-5 active:scale-[0.98] transition-transform"
        >
          <span className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            {itemCount} item{itemCount !== 1 ? "s" : ""}
          </span>
          <span>{money(totals.total)}</span>
        </button>
      </div>

      {/* Mobile cart sheet */}
      {cartOpen && (
        <div className="lg:hidden fixed inset-0 z-[110]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm fade-in" onClick={() => setCartOpen(false)} />
          <div className="absolute bottom-0 inset-x-0 top-14 bg-surface rounded-t-3xl slide-in-up flex flex-col overflow-hidden">
            <div className="flex justify-center py-2 shrink-0">
              <div className="w-10 h-1 rounded-full bg-outline-variant" />
            </div>
            {cartPanel}
          </div>
        </div>
      )}

      {/* Modifier picker */}
      <Modal
        open={!!modItem}
        onClose={() => setModItem(null)}
        title={modItem?.name ?? ""}
        subtitle="Choose modifiers"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModItem(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (modItem) addToCart(modItem, selectedMods);
                setModItem(null);
              }}
            >
              Add to Order
            </Button>
          </>
        }
      >
        <div className="flex flex-wrap gap-2">
          {modItem?.modifiers?.map((m) => {
            const on = selectedMods.includes(m);
            return (
              <button
                key={m}
                onClick={() => setSelectedMods((s) => (on ? s.filter((x) => x !== m) : [...s, m]))}
                className={cx(
                  "px-4 py-2 rounded-full text-label-md font-semibold border transition-colors",
                  on
                    ? "bg-primary text-on-primary border-primary"
                    : "bg-white text-on-surface-variant border-outline-variant hover:border-primary",
                )}
              >
                {m}
              </button>
            );
          })}
        </div>
      </Modal>

      {/* Payment modal */}
      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title="Checkout"
        wide
        footer={
          <Button className="w-full !py-3.5 !text-title-lg" onClick={() => placeOrder(true)}>
            Confirm Payment
          </Button>
        }
      >
        <div className="space-y-6">
          <div className="bg-primary-fixed/40 p-4 rounded-2xl flex justify-between items-center">
            <span className="text-label-md font-bold text-primary">Amount to Pay</span>
            <span className="text-3xl font-bold text-primary">{money(totals.total)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { key: "card", label: "Credit Card", icon: <CreditCard className="w-7 h-7" /> },
                { key: "cash", label: "Cash", icon: <Banknote className="w-7 h-7" /> },
                { key: "wallet", label: "Digital Wallet", icon: <Wallet className="w-7 h-7" /> },
                { key: "points", label: "Loyalty Points", icon: <Star className="w-7 h-7" /> },
              ] as Array<{ key: PaymentMethod; label: string; icon: React.ReactNode }>
            ).map((p) => (
              <button
                key={p.key}
                onClick={() => setMethod(p.key)}
                className={cx(
                  "flex flex-col items-center justify-center gap-2 p-5 border-2 rounded-2xl transition-all",
                  method === p.key
                    ? "border-primary bg-secondary-container/20 text-primary shadow-md"
                    : "border-outline-variant text-outline hover:border-primary hover:bg-surface-container-low",
                )}
              >
                {p.icon}
                <span className={cx("text-label-md font-bold", method === p.key && "text-on-surface")}>{p.label}</span>
              </button>
            ))}
          </div>
          {method === "cash" && (
            <div className="space-y-2">
              <p className="text-label-md font-semibold text-on-surface-variant">Quick Cash Entry</p>
              <div className="grid grid-cols-4 gap-2.5">
                {[20, 40, 50, 100].map((v) => (
                  <button
                    key={v}
                    onClick={() => toast.info(`Change due: ${money(Math.max(0, v - totals.total))}`)}
                    className="py-2.5 bg-surface-container-high rounded-xl font-bold hover:bg-surface-variant transition-colors"
                  >
                    ${v}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
