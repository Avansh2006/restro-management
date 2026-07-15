"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChefHat,
  CircleCheck,
  Clock,
  Minus,
  Plus,
  QrCode,
  Receipt,
  Search,
  ShoppingBag,
  Star,
  Utensils,
  X,
} from "lucide-react";
import { useRestro, money, elapsedMins } from "@/lib/store";
import { cx } from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import { ExperienceSwitcher } from "@/components/shell/AppShell";
import type { MenuItem, OrderItem } from "@/lib/types";

type Screen = "scan" | "menu" | "track";

const STATION_EMOJI: Record<string, string> = {
  Grill: "🥩",
  Cold: "🥗",
  Saute: "🍝",
  Bar: "🍹",
  Pastry: "🍰",
  Fry: "🍟",
};

export default function QrOrderingPage() {
  const menuItems = useRestro((s) => s.menuItems);
  const categories = useRestro((s) => s.menuCategories);
  const tables = useRestro((s) => s.tables);
  const orders = useRestro((s) => s.orders);
  const settings = useRestro((s) => s.settings);
  const createOrder = useRestro((s) => s.createOrder);

  const [screen, setScreen] = useState<Screen>("scan");
  const [tableId, setTableId] = useState("");
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<Array<{ item: MenuItem; qty: number }>>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [trackOrderId, setTrackOrderId] = useState<string | null>(null);
  const [, tick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 3000);
    return () => clearInterval(t);
  }, []);

  const table = tables.find((t) => t.id === tableId);
  const tracked = trackOrderId ? orders.find((o) => o.id === trackOrderId) : null;

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return menuItems.filter((m) => {
      if (!m.available) return false;
      if (cat !== "all" && m.categoryId !== cat) return false;
      if (needle && !m.name.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [menuItems, cat, q]);

  const totals = useMemo(() => {
    const subtotal = cart.reduce((s, l) => s + l.item.price * l.qty, 0);
    const tax = Math.round(subtotal * settings.taxRate * 100) / 100;
    return { subtotal, tax, total: Math.round((subtotal + tax) * 100) / 100 };
  }, [cart, settings.taxRate]);

  const itemCount = cart.reduce((s, l) => s + l.qty, 0);

  const changeQty = (m: MenuItem, delta: number) => {
    setCart((c) => {
      const idx = c.findIndex((l) => l.item.id === m.id);
      if (idx < 0) {
        if (delta > 0) return [...c, { item: m, qty: 1 }];
        return c;
      }
      return c.map((l, i) => (i === idx ? { ...l, qty: l.qty + delta } : l)).filter((l) => l.qty > 0);
    });
  };

  const qtyOf = (id: string) => cart.find((l) => l.item.id === id)?.qty ?? 0;

  const placeOrder = () => {
    if (!cart.length) return;
    const items: OrderItem[] = cart.map((l) => ({
      menuItemId: l.item.id,
      name: l.item.name,
      price: l.item.price,
      qty: l.qty,
      kitchenStatus: "queued" as const,
    }));
    const order = createOrder({
      channel: "qr",
      items,
      tableId: tableId || undefined,
      customerName: table ? `Table ${table.name} (QR)` : "QR Guest",
    });
    setCart([]);
    setCartOpen(false);
    setTrackOrderId(order.id);
    setScreen("track");
    toast.success(`Order #${order.number} sent to the kitchen!`);
  };

  const STEPS = [
    { key: "new", label: "Received", icon: <Receipt className="w-4 h-4" /> },
    { key: "preparing", label: "Preparing", icon: <ChefHat className="w-4 h-4" /> },
    { key: "ready", label: "Ready", icon: <CircleCheck className="w-4 h-4" /> },
    { key: "served", label: "Served", icon: <Utensils className="w-4 h-4" /> },
  ];
  const stepIndex = tracked
    ? tracked.status === "paid"
      ? 3
      : Math.max(0, STEPS.findIndex((s) => s.key === tracked.status))
    : 0;

  return (
    <div className="min-h-dvh bg-surface-container-low flex justify-center">
      {/* phone-width canvas on desktop, full width mobile */}
      <div className="w-full max-w-[480px] bg-background min-h-dvh flex flex-col relative shadow-2xl">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-primary text-white px-4 py-3 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <Link href="/" className="p-1.5 -ml-1.5 rounded-lg hover:bg-white/10 transition-colors" title="Exit demo">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <p className="font-bold leading-tight">RestroOS Kitchen</p>
              <p className="text-[10px] text-white/70 uppercase tracking-widest font-semibold">
                {screen === "scan" ? "Scan to order" : table ? `Table ${table.name}` : "Guest ordering"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {tracked && screen !== "track" && (
              <button
                onClick={() => setScreen("track")}
                className="px-2.5 py-1.5 bg-white/15 rounded-lg text-label-sm font-bold flex items-center gap-1"
              >
                <Clock className="w-3.5 h-3.5" /> #{tracked.number}
              </button>
            )}
            <ExperienceSwitcher compact />
          </div>
        </header>

        {/* SCAN SCREEN */}
        {screen === "scan" && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6 text-center">
            <div className="w-40 h-40 rounded-3xl bg-white border-2 border-outline-variant shadow-lg flex items-center justify-center">
              <QrCode className="w-20 h-20 text-primary" />
            </div>
            <div>
              <h1 className="text-headline-lg font-bold text-on-surface">Welcome!</h1>
              <p className="text-body-md text-on-surface-variant mt-1 max-w-[260px]">
                In a restaurant you&apos;d scan the QR code on your table. Pick a table to simulate:
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
              {tables
                .filter((t) => t.zone === "Main Dining")
                .slice(0, 9)
                .map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTableId(t.id);
                      setScreen("menu");
                      toast.success(`Connected to table ${t.name}`);
                    }}
                    className="py-3 bg-white border border-outline-variant rounded-xl font-bold text-on-surface hover:border-primary hover:text-primary transition-colors active:scale-95"
                  >
                    {t.name}
                  </button>
                ))}
            </div>
            <button
              onClick={() => {
                setTableId("");
                setScreen("menu");
              }}
              className="text-primary text-label-md font-bold hover:underline"
            >
              Continue as takeaway guest →
            </button>
          </div>
        )}

        {/* MENU SCREEN */}
        {screen === "menu" && (
          <>
            <div className="sticky top-[60px] z-20 bg-background border-b border-outline-variant">
              <div className="p-3">
                <div className="relative flex items-center bg-white rounded-full px-3.5 py-2.5 border border-outline-variant shadow-sm">
                  <Search className="w-4 h-4 text-outline" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="bg-transparent border-none outline-none text-body-md w-full px-2 placeholder:text-outline"
                    placeholder="Search the menu..."
                  />
                  {q && (
                    <button onClick={() => setQ("")}>
                      <X className="w-4 h-4 text-outline" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto custom-scrollbar px-3 pb-3">
                {[{ id: "all", name: "All" }, ...categories].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCat(c.id)}
                    className={cx(
                      "px-4 py-1.5 rounded-full text-label-md font-semibold whitespace-nowrap transition-colors",
                      cat === c.id ? "bg-primary text-white shadow-sm" : "bg-white border border-outline-variant text-on-surface-variant",
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 p-3 space-y-3 pb-32">
              {filtered.map((m) => {
                const qty = qtyOf(m.id);
                return (
                  <div key={m.id} className="bg-white rounded-2xl border border-outline-variant p-3.5 flex gap-3.5 shadow-sm">
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-surface-container to-surface-container-high flex items-center justify-center text-4xl shrink-0">
                      {STATION_EMOJI[m.station] ?? "🍽"}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-body-md text-on-surface leading-tight">{m.name}</p>
                        {m.popular && (
                          <span className="shrink-0 bg-primary-fixed text-primary text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-current" /> HOT
                          </span>
                        )}
                      </div>
                      <p className="text-label-sm text-on-surface-variant line-clamp-2 mt-0.5 flex-1">{m.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-primary">{money(m.price)}</span>
                        {qty === 0 ? (
                          <button
                            onClick={() => changeQty(m, 1)}
                            className="px-4 py-1.5 bg-primary text-white rounded-full text-label-md font-bold active:scale-95 transition-transform"
                          >
                            Add
                          </button>
                        ) : (
                          <div className="flex items-center gap-3 bg-primary rounded-full px-2 py-1">
                            <button onClick={() => changeQty(m, -1)} className="w-6 h-6 flex items-center justify-center text-white active:scale-90 transition-transform">
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="font-bold text-white text-sm w-4 text-center">{qty}</span>
                            <button onClick={() => changeQty(m, 1)} className="w-6 h-6 flex items-center justify-center text-white active:scale-90 transition-transform">
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="text-center py-16 text-on-surface-variant">
                  <Utensils className="w-10 h-10 mx-auto mb-3 text-outline-variant" />
                  <p className="text-body-md">Nothing matches your search.</p>
                </div>
              )}
            </div>

            {/* Cart bar */}
            {itemCount > 0 && (
              <div className="fixed bottom-4 inset-x-4 max-w-[448px] mx-auto z-40">
                <button
                  onClick={() => setCartOpen(true)}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/40 flex items-center justify-between px-5 active:scale-[0.98] transition-transform"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" />
                    {itemCount} item{itemCount > 1 ? "s" : ""}
                  </span>
                  <span>View cart • {money(totals.total)}</span>
                </button>
              </div>
            )}

            {/* Cart sheet */}
            {cartOpen && (
              <div className="fixed inset-0 z-[110] max-w-[480px] mx-auto">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm fade-in" onClick={() => setCartOpen(false)} />
                <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-3xl slide-in-up max-h-[85dvh] flex flex-col">
                  <div className="flex justify-center py-2.5 shrink-0">
                    <div className="w-10 h-1 rounded-full bg-outline-variant" />
                  </div>
                  <div className="px-5 pb-3 flex items-center justify-between shrink-0">
                    <h3 className="text-headline-md font-bold">Your Order</h3>
                    <span className="text-label-md text-on-surface-variant font-semibold">
                      {table ? `Table ${table.name}` : "Takeaway"}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar px-5 space-y-3 min-h-0">
                    {cart.map((l) => (
                      <div key={l.item.id} className="flex items-center gap-3 py-2 border-b border-outline-variant/60 last:border-0">
                        <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-2xl shrink-0">
                          {STATION_EMOJI[l.item.station] ?? "🍽"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-body-md truncate">{l.item.name}</p>
                          <p className="text-label-sm text-on-surface-variant">{money(l.item.price)}</p>
                        </div>
                        <div className="flex items-center gap-2.5 bg-surface-container rounded-full px-2 py-1">
                          <button onClick={() => changeQty(l.item, -1)} className="w-6 h-6 flex items-center justify-center active:scale-90 transition-transform">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-bold text-sm w-4 text-center">{l.qty}</span>
                          <button onClick={() => changeQty(l.item, 1)} className="w-6 h-6 flex items-center justify-center active:scale-90 transition-transform">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-5 border-t border-outline-variant space-y-1.5 shrink-0">
                    <div className="flex justify-between text-body-md text-on-surface-variant">
                      <span>Subtotal</span>
                      <span>{money(totals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-body-md text-on-surface-variant">
                      <span>Tax</span>
                      <span>{money(totals.tax)}</span>
                    </div>
                    <div className="flex justify-between text-headline-md font-bold pt-1">
                      <span>Total</span>
                      <span className="text-primary">{money(totals.total)}</span>
                    </div>
                    <button
                      onClick={placeOrder}
                      className="w-full mt-3 py-4 bg-primary text-white rounded-2xl font-bold text-body-lg shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                    >
                      <Check className="w-5 h-5" /> Place Order
                    </button>
                    <p className="text-center text-label-sm text-on-surface-variant pt-1">Pay at the table when your server arrives.</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* TRACK SCREEN */}
        {screen === "track" && tracked && (
          <div className="flex-1 p-5 space-y-5 pb-24">
            <div className="bg-white rounded-2xl border border-outline-variant p-5 shadow-sm text-center">
              <p className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider">Order</p>
              <p className="text-display-lg font-bold text-primary">#{tracked.number}</p>
              <p className="text-body-md text-on-surface-variant mt-1">
                {tracked.status === "new"
                  ? "We've received your order!"
                  : tracked.status === "preparing"
                    ? "The kitchen is on it 🔥"
                    : tracked.status === "ready"
                      ? "Almost there — being brought to you!"
                      : tracked.status === "cancelled"
                        ? "This order was cancelled."
                        : "Enjoy your meal! 🎉"}
              </p>
              <p className="text-label-sm text-outline mt-2">Ordered {elapsedMins(tracked.createdAt)}m ago</p>
            </div>

            {/* Progress steps */}
            <div className="bg-white rounded-2xl border border-outline-variant p-5 shadow-sm">
              <div className="flex items-center">
                {STEPS.map((s, i) => (
                  <div key={s.key} className={cx("flex items-center", i < STEPS.length - 1 && "flex-1")}>
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={cx(
                          "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                          i <= stepIndex ? "bg-primary border-primary text-white" : "bg-white border-outline-variant text-outline",
                          i === stepIndex && tracked.status !== "served" && tracked.status !== "paid" && "animate-pulse",
                        )}
                      >
                        {s.icon}
                      </div>
                      <span className={cx("text-[10px] font-bold uppercase", i <= stepIndex ? "text-primary" : "text-outline")}>
                        {s.label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={cx("flex-1 h-0.5 mx-1 -mt-5", i < stepIndex ? "bg-primary" : "bg-outline-variant")} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Items */}
            <div className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
              <div className="p-4 border-b border-outline-variant">
                <h3 className="font-bold text-body-md">Your Items</h3>
              </div>
              <div className="divide-y divide-outline-variant">
                {tracked.items.map((it, i) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-md bg-surface-container text-label-sm font-bold flex items-center justify-center">
                        {it.qty}x
                      </span>
                      <span className="text-body-md font-medium">{it.name}</span>
                    </div>
                    <span
                      className={cx(
                        "text-label-sm font-bold px-2 py-0.5 rounded-full",
                        it.kitchenStatus === "done"
                          ? "bg-emerald-50 text-emerald-700"
                          : it.kitchenStatus === "cooking"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-surface-container text-on-surface-variant",
                      )}
                    >
                      {it.kitchenStatus === "done" ? "Ready" : it.kitchenStatus === "cooking" ? "Cooking" : "Queued"}
                    </span>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-surface-container-low flex justify-between font-bold">
                <span>Total</span>
                <span className="text-primary">{money(tracked.total)}</span>
              </div>
            </div>

            <button
              onClick={() => setScreen("menu")}
              className="w-full py-3.5 bg-white border border-outline-variant rounded-2xl font-bold text-on-surface active:scale-[0.98] transition-transform"
            >
              + Order More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
