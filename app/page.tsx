"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Timer,
  Package,
  UserX,
  CalendarX,
  Flag,
  TrendingUp,
  TrendingDown,
  Maximize2,
  SlidersHorizontal,
  CalendarDays,
  ChevronDown,
} from "lucide-react";
import { AppShell, QuickCreateButton } from "@/components/shell/AppShell";
import { useRestro, money, elapsedMins } from "@/lib/store";
import { cx, DropdownMenu, Badge } from "@/components/ui";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const TABLE_TONE: Record<string, string> = {
  occupied: "bg-emerald-500 text-white",
  available: "bg-white border-2 border-outline-variant text-on-surface",
  reserved: "bg-purple-500 text-white",
  dirty: "bg-amber-400 text-white",
};

export default function DashboardPage() {
  const router = useRouter();
  const orders = useRestro((s) => s.orders);
  const tables = useRestro((s) => s.tables);
  const inventory = useRestro((s) => s.inventory);
  const employees = useRestro((s) => s.employees);
  const attendance = useRestro((s) => s.attendance);
  const menuItems = useRestro((s) => s.menuItems);
  const leave = useRestro((s) => s.leaveRequests);
  const [range, setRange] = useState<"today" | "week" | "month">("today");

  const today = new Date().toISOString().slice(0, 10);

  const stats = useMemo(() => {
    const paid = orders.filter((o) => o.status === "paid");
    const netSales = paid.reduce((s, o) => s + o.total, 0);
    const totalOrders = orders.filter((o) => o.status !== "cancelled").length;
    const aov = totalOrders ? netSales / Math.max(1, paid.length) : 0;
    const occupied = tables.filter((t) => t.status === "occupied").length;
    const activeEmps = employees.filter((e) => e.status === "active").length;
    const present = attendance.filter((a) => a.date === today && a.clockIn && !a.clockOut).length;
    const customers = orders.reduce((s, o) => s + (o.channel === "dine-in" ? 2.2 : 1), 0);
    return {
      netSales,
      totalOrders,
      aov,
      occupied,
      totalTables: tables.length,
      present,
      activeEmps,
      customers: Math.round(customers),
    };
  }, [orders, tables, employees, attendance, today]);

  const bestSellers = useMemo(() => {
    const counts = new Map<string, { name: string; qty: number; price: number }>();
    for (const o of orders) {
      if (o.status === "cancelled") continue;
      for (const it of o.items) {
        const cur = counts.get(it.menuItemId) ?? { name: it.name, qty: 0, price: it.price };
        cur.qty += it.qty;
        counts.set(it.menuItemId, cur);
      }
    }
    return [...counts.entries()]
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 4);
  }, [orders]);

  const channelData = useMemo(() => {
    const counts = { "dine-in": 0, delivery: 0, takeaway: 0, qr: 0 };
    for (const o of orders) if (o.status !== "cancelled") counts[o.channel]++;
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return {
      total,
      data: [
        { name: "Dine-in", value: counts["dine-in"], color: "#3525cd" },
        { name: "Delivery", value: counts.delivery, color: "#505f76" },
        { name: "Takeaway", value: counts.takeaway, color: "#a8a29e" },
        { name: "QR", value: counts.qr, color: "#a44100" },
      ],
    };
  }, [orders]);

  const revenueByHour = useMemo(() => {
    const hours = ["12PM", "2PM", "4PM", "6PM", "8PM", "10PM", "12AM"];
    const base = Math.max(200, stats.netSales / 7);
    const curve = [0.45, 0.8, 1.3, 1.1, 1.6, 1.4, 0.6];
    return hours.map((h, i) => ({
      hour: h,
      today: Math.round(base * curve[i]),
      yesterday: Math.round(base * curve[i] * 0.88),
    }));
  }, [stats.netSales]);

  const alerts = useMemo(() => {
    const out: Array<{
      icon: React.ReactNode;
      iconBg: string;
      title: string;
      tag: string;
      tagCls: string;
      sub: string;
      href: string;
    }> = [];
    for (const o of orders
      .filter((x) => (x.status === "new" || x.status === "preparing") && elapsedMins(x.createdAt) > 12)
      .slice(0, 2)) {
      out.push({
        icon: <Timer className="w-4 h-4 text-red-600" />,
        iconBg: "bg-red-100",
        title: `Delayed: Order #${o.number}`,
        tag: `${elapsedMins(o.createdAt)}m`,
        tagCls: "text-red-600",
        sub: o.tableId ? `Table ${tables.find((t) => t.id === o.tableId)?.name ?? ""}` : o.channel,
        href: "/orders",
      });
    }
    for (const i of inventory.filter((x) => x.stock < x.minStock).slice(0, 2)) {
      out.push({
        icon: <Package className="w-4 h-4 text-amber-600" />,
        iconBg: "bg-amber-100",
        title: `Low Stock: ${i.name}`,
        tag: i.stock === 0 ? "Out" : "Critical",
        tagCls: "text-amber-700",
        sub: `Only ${i.stock} ${i.unit} left in inventory`,
        href: "/inventory",
      });
    }
    const late = attendance.find((a) => a.date === today && a.status === "late");
    if (late) {
      const emp = employees.find((e) => e.id === late.employeeId);
      out.push({
        icon: <UserX className="w-4 h-4 text-slate-600" />,
        iconBg: "bg-slate-100",
        title: `Attendance: ${emp?.name ?? "Staff"}`,
        tag: "Late",
        tagCls: "text-on-surface-variant",
        sub: `Clocked in ${late.clockIn}`,
        href: "/attendance",
      });
    }
    const pendingLeave = leave.find((l) => l.status === "pending");
    if (pendingLeave) {
      const emp = employees.find((e) => e.id === pendingLeave.employeeId);
      out.push({
        icon: <CalendarX className="w-4 h-4 text-blue-600" />,
        iconBg: "bg-blue-100",
        title: "Leave Request",
        tag: "New",
        tagCls: "text-blue-700",
        sub: `${emp?.name ?? "Employee"} requested ${pendingLeave.from}`,
        href: "/leave",
      });
    }
    out.push({
      icon: <Flag className="w-4 h-4 text-white" />,
      iconBg: "bg-red-600",
      title: "Flagged Refund",
      tag: "$85.00",
      tagCls: "text-red-600",
      sub: "Manager override by 'Marcus P.'",
      href: "/audit-logs",
    });
    return out.slice(0, 5);
  }, [orders, inventory, attendance, employees, leave, tables, today]);

  const soldOut = menuItems.filter((m) => !m.available).length;
  const greeting =
    new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <AppShell title="Dashboard" actions={<QuickCreateButton onClick={() => router.push("/pos")} />}>
      {/* Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <h2 className="text-[28px] leading-9 sm:text-display-lg font-bold text-on-surface">
            {greeting}, Alex
          </h2>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <p className="text-on-surface-variant text-body-md">
              {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
            <span className="w-1.5 h-1.5 rounded-full bg-outline-variant hidden sm:block" />
            <span className="pulse-dot ml-4 text-xs font-semibold text-on-surface uppercase tracking-wider">
              Live Operations: Active
            </span>
          </div>
        </div>
        <DropdownMenu
          align="right"
          trigger={
            <button className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-outline-variant shadow-sm cursor-pointer hover:bg-surface-container-low transition-colors">
              <CalendarDays className="w-4 h-4 text-primary" />
              <span className="text-label-md font-semibold capitalize">
                {range === "today" ? "Today" : range === "week" ? "This Week" : "This Month"}
              </span>
              <ChevronDown className="w-4 h-4 text-outline" />
            </button>
          }
          items={[
            { label: "Today", onClick: () => setRange("today") },
            { label: "This Week", onClick: () => setRange("week") },
            { label: "This Month", onClick: () => setRange("month") },
          ]}
        />
      </section>

      {/* KPI grid */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
        <KPI label="Net Sales" value={money(stats.netSales * (range === "today" ? 1 : range === "week" ? 6.4 : 27))} trend="12.4%" up />
        <KPI
          label="Total Orders"
          value={String(range === "today" ? stats.totalOrders : range === "week" ? stats.totalOrders * 6 : stats.totalOrders * 26)}
          trend="8.2%"
          up
        />
        <KPI label="Avg Order Value" value={money(stats.aov)} trend="1.5%" up={false} />
        <KPI
          label="Customers"
          value={String(range === "today" ? stats.customers : range === "week" ? stats.customers * 6 : stats.customers * 25)}
          trend="5.0%"
          up
        />
        <div className="bg-white p-4 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
          <p className="text-on-surface-variant text-label-md font-semibold mb-1">Tables</p>
          <h3 className="text-headline-lg font-semibold">
            {stats.occupied} / {stats.totalTables}
          </h3>
          <div className="mt-3 w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all"
              style={{ width: `${Math.round((stats.occupied / Math.max(1, stats.totalTables)) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] mt-1 font-semibold text-primary">
            {Math.round((stats.occupied / Math.max(1, stats.totalTables)) * 100)}% Capacity
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
          <p className="text-on-surface-variant text-label-md font-semibold mb-1">Staff Present</p>
          <h3 className="text-headline-lg font-semibold">
            {stats.present} / {stats.activeEmps}
          </h3>
          <div className="flex items-center gap-1 mt-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-600 uppercase">Operational</span>
          </div>
        </div>
      </section>

      {/* Floor + revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <section className="lg:col-span-2 bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-outline-variant flex justify-between items-center">
            <div>
              <h3 className="text-title-lg font-semibold text-on-surface">Live Floor View</h3>
              <p className="text-on-surface-variant text-body-md">Main Dining Area</p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/tables"
                className="p-2 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors"
                title="Open floor plan"
              >
                <Maximize2 className="w-4 h-4 text-on-surface-variant" />
              </Link>
              <Link
                href="/tables"
                className="p-2 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors"
                title="Manage tables"
              >
                <SlidersHorizontal className="w-4 h-4 text-on-surface-variant" />
              </Link>
            </div>
          </div>
          <div className="flex overflow-x-auto p-3 gap-4 bg-surface-container-low border-b border-outline-variant custom-scrollbar">
            <LegendDot cls="bg-emerald-500" label={`Occupied (${tables.filter((t) => t.status === "occupied").length})`} />
            <LegendDot cls="bg-white border border-outline" label={`Available (${tables.filter((t) => t.status === "available").length})`} />
            <LegendDot cls="bg-purple-500" label={`Reserved (${tables.filter((t) => t.status === "reserved").length})`} />
            <LegendDot cls="bg-amber-400" label={`Dirty (${tables.filter((t) => t.status === "dirty").length})`} />
          </div>
          <div className="p-4 sm:p-6 flex-1 relative min-h-[280px] sm:min-h-[340px] bg-[#F1F5F9]">
            <div
              className="absolute inset-0 opacity-20"
              style={{ backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)", backgroundSize: "24px 24px" }}
            />
            <div className="relative grid grid-cols-4 sm:grid-cols-6 gap-3 sm:gap-5">
              {tables
                .filter((t) => t.zone === "Main Dining")
                .map((t) => (
                  <Link
                    key={t.id}
                    href="/tables"
                    className={cx(
                      "flex items-center justify-center font-bold text-xs shadow-md transition-all hover:scale-105 cursor-pointer h-14 sm:h-16",
                      t.shape === "round" ? "rounded-full" : t.shape === "booth" ? "rounded" : "rounded-lg",
                      TABLE_TONE[t.status],
                    )}
                    title={`${t.name} — ${t.status}`}
                  >
                    {t.name}
                  </Link>
                ))}
            </div>
            <div className="absolute bottom-0 left-4 w-32 h-2 bg-slate-300 rounded-t" />
            <div className="absolute bottom-3 left-10 text-[10px] font-bold text-slate-400 uppercase">Entrance</div>
          </div>
        </section>

        {/* Revenue chart */}
        <section className="bg-white rounded-xl border border-outline-variant shadow-sm p-4 sm:p-5 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-title-lg font-semibold text-on-surface">Revenue Analytics</h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                <span className="w-2 h-2 rounded-full bg-primary" /> Today
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold text-outline">
                <span className="w-2 h-2 rounded-full bg-outline" /> Yday
              </span>
            </div>
          </div>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={revenueByHour} barGap={2}>
                <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: "#464555" }} />
                <Tooltip
                  cursor={{ fill: "#eef2ff" }}
                  formatter={(v) => money(Number(v))}
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Bar dataKey="yesterday" fill="#c7d2fe" radius={[4, 4, 0, 0]} />
                <Bar dataKey="today" fill="#3525cd" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 pt-4 border-t border-outline-variant flex items-center justify-between">
            <div>
              <p className="text-on-surface-variant text-xs font-medium">Projected End-of-Day</p>
              <p className="text-headline-md font-bold">{money(stats.netSales * 1.35)}</p>
            </div>
            <div className="text-right">
              <p className="text-emerald-600 text-xs font-bold flex items-center gap-1 justify-end">
                <TrendingUp className="w-3.5 h-3.5" /> +18.2% vs avg
              </p>
              <p className="text-on-surface-variant text-[10px]">Peak hour incoming</p>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Best sellers */}
        <section className="bg-white rounded-xl border border-outline-variant shadow-sm p-4 sm:p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-title-lg font-semibold text-on-surface">Best Selling Items</h3>
            <Link href="/menu" className="text-primary text-xs font-bold hover:underline">
              View Menu
            </Link>
          </div>
          <div className="space-y-4">
            {bestSellers.map((b, i) => (
              <div key={b.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cx(
                      "w-11 h-11 rounded-lg flex items-center justify-center font-bold text-white text-sm shrink-0",
                      ["bg-primary", "bg-primary-container", "bg-secondary", "bg-tertiary-container"][i],
                    )}
                  >
                    #{i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-label-md font-semibold text-on-surface truncate">{b.name}</p>
                    <p className="text-[10px] text-on-surface-variant">{b.qty} orders today</p>
                  </div>
                </div>
                <p className="font-semibold text-sm shrink-0">{money(b.price)}</p>
              </div>
            ))}
          </div>
          {soldOut > 0 && (
            <div className="mt-4 pt-3 border-t border-outline-variant">
              <Badge tone="red">
                {soldOut} item{soldOut > 1 ? "s" : ""} sold out
              </Badge>
            </div>
          )}
        </section>

        {/* Order channels */}
        <section className="bg-white rounded-xl border border-outline-variant shadow-sm p-4 sm:p-5 flex flex-col">
          <h3 className="text-title-lg font-semibold text-on-surface mb-2">Order Channels</h3>
          <div className="flex-1 flex items-center justify-center relative min-h-[180px]">
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie data={channelData.data} dataKey="value" innerRadius={58} outerRadius={80} paddingAngle={2} strokeWidth={0}>
                  {channelData.data.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold">{channelData.total}</span>
              <span className="text-[10px] text-on-surface-variant uppercase font-bold">Total</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {channelData.data.map((d) => (
              <div key={d.name} className="bg-surface-container-low p-2 rounded-lg text-center">
                <p className="text-[10px] text-on-surface-variant font-bold uppercase truncate">{d.name}</p>
                <p className="text-sm font-bold" style={{ color: d.color }}>
                  {Math.round((d.value / channelData.total) * 100)}%
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Attention */}
        <section className="bg-white rounded-xl border border-outline-variant shadow-sm p-4 sm:p-5 md:col-span-2 lg:col-span-1">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-title-lg font-semibold text-on-surface">Attention Required</h3>
            <span className="bg-error-container text-on-error-container px-2 py-0.5 rounded-full text-[10px] font-bold">
              {alerts.length} ALERTS
            </span>
          </div>
          <div className="space-y-1 -mx-2">
            {alerts.map((a, i) => (
              <Link
                key={i}
                href={a.href}
                className="p-3 hover:bg-surface-container-low transition-colors flex items-start gap-3 rounded-lg"
              >
                <div className={cx("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", a.iconBg)}>
                  {a.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <p className="text-label-md font-semibold text-on-surface truncate">{a.title}</p>
                    <span className={cx("text-[10px] font-bold shrink-0", a.tagCls)}>{a.tag}</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant truncate">{a.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function KPI({ label, value, trend, up }: { label: string; value: string; trend: string; up: boolean }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
      <p className="text-on-surface-variant text-label-md font-semibold mb-1 truncate">{label}</p>
      <h3 className="text-headline-lg font-semibold truncate">{value}</h3>
      <div className="flex items-center justify-between mt-3">
        <span className={cx("text-xs font-bold flex items-center gap-0.5", up ? "text-emerald-600" : "text-error")}>
          {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />} {trend}
        </span>
        <div
          className="h-6 w-14 rounded hidden sm:block"
          style={{
            backgroundImage: `linear-gradient(90deg, transparent 0%, ${up ? "#10b981" : "#ef4444"} 100%)`,
            opacity: 0.35,
          }}
        />
      </div>
    </div>
  );
}

function LegendDot({ cls, label }: { cls: string; label: string }) {
  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <span className={cx("w-3 h-3 rounded", cls)} />
      <span className="text-xs font-semibold">{label}</span>
    </div>
  );
}
