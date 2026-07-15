"use client";

import { useMemo, useState } from "react";
import { TrendingUp, Timer, UserPlus, Trash2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell/AppShell";
import { useRestro, money } from "@/lib/store";
import { Card, PillTabs, cx } from "@/components/ui";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,

} from "recharts";

type Range = "30d" | "quarter" | "ytd";

export default function AnalyticsPage() {
  const orders = useRestro((s) => s.orders);
  const menuItems = useRestro((s) => s.menuItems);
  const categories = useRestro((s) => s.menuCategories);
  const customers = useRestro((s) => s.customers);
  const employees = useRestro((s) => s.employees);
  const [range, setRange] = useState<Range>("30d");

  const mult = range === "30d" ? 1 : range === "quarter" ? 3 : 7.4;

  const kpis = useMemo(() => {
    const paid = orders.filter((o) => o.status === "paid");
    const revenue = paid.reduce((s, o) => s + o.total, 0) * 30 * mult;
    return {
      revenue,
      turn: 48.2,
      customers: Math.round(customers.reduce((s, c) => s + c.visits, 0) * 2.1 * mult),
      waste: 3.4,
    };
  }, [orders, customers, mult]);

  const weekSeries = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const base = kpis.revenue / (30 * mult) || 4200;
    const curve = [0.72, 0.68, 0.85, 0.92, 1.25, 1.48, 1.1];
    return days.map((d, i) => ({
      day: d,
      revenue: Math.round(base * curve[i]),
      expenses: Math.round(base * curve[i] * 0.62),
    }));
  }, [kpis.revenue, mult]);

  const byCategory = useMemo(() => {
    const totals = new Map<string, number>();
    for (const o of orders) {
      if (o.status === "cancelled") continue;
      for (const it of o.items) {
        const m = menuItems.find((x) => x.id === it.menuItemId);
        const cat = categories.find((c) => c.id === m?.categoryId)?.name ?? "Other";
        totals.set(cat, (totals.get(cat) ?? 0) + it.price * it.qty);
      }
    }
    const colors = ["#3525cd", "#505f76", "#7e3000", "#0f766e", "#7c3aed", "#b45309"];
    return [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({ name, value: Math.round(value), color: colors[i % colors.length] }));
  }, [orders, menuItems, categories]);

  const topItems = useMemo(() => {
    const counts = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const o of orders) {
      if (o.status === "cancelled") continue;
      for (const it of o.items) {
        const cur = counts.get(it.menuItemId) ?? { name: it.name, qty: 0, revenue: 0 };
        cur.qty += it.qty;
        cur.revenue += it.price * it.qty;
        counts.set(it.menuItemId, cur);
      }
    }
    return [...counts.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  }, [orders]);

  const hourly = useMemo(() => {
    const hours = ["11a", "12p", "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p", "10p"];
    const curve = [0.4, 0.9, 1.0, 0.7, 0.35, 0.3, 0.5, 0.95, 1.35, 1.5, 1.15, 0.6];
    return hours.map((h, i) => ({ hour: h, orders: Math.round(14 * curve[i]) }));
  }, []);

  const staffPerf = useMemo(
    () =>
      employees
        .filter((e) => ["Server", "Senior Waiter", "Bartender", "Barista"].includes(e.role))
        .map((e) => ({ name: e.name.split(" ")[0], sales: Math.round(e.rating * 820 + e.hourlyRate * 40), rating: e.rating }))
        .sort((a, b) => b.sales - a.sales),
    [employees],
  );

  const tooltipStyle = { borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 };

  return (
    <AppShell title="Analytics">
      <PageHeader
        title="Analytics & Insights"
        subtitle="Real-time performance metrics across all operational branches."
        actions={
          <PillTabs
            tabs={[
              { key: "30d", label: "Last 30 Days" },
              { key: "quarter", label: "Last Quarter" },
              { key: "ytd", label: "Year to Date" },
            ]}
            active={range}
            onChange={setRange}
          />
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi
          label="Gross Revenue"
          value={money(kpis.revenue)}
          delta="+12.5% vs LW"
          up
          icon={<TrendingUp className="w-5 h-5 text-primary" />}
        />
        <Kpi
          label="Avg. Table Turn"
          value={`${kpis.turn} min`}
          delta="-4.1% vs LW"
          up={false}
          icon={<Timer className="w-5 h-5 text-tertiary" />}
        />
        <Kpi
          label="Customer Count"
          value={kpis.customers.toLocaleString()}
          delta="+8.9% vs LW"
          up
          icon={<UserPlus className="w-5 h-5 text-secondary" />}
        />
        <Kpi
          label="Waste Ratio"
          value={`${kpis.waste}%`}
          delta="-0.5% vs LW"
          up
          icon={<Trash2 className="w-5 h-5 text-error" />}
        />
      </div>

      {/* Main charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <Card className="lg:col-span-8">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <div>
              <h3 className="text-title-lg font-semibold">Revenue vs. Expenses</h3>
              <p className="text-body-md text-on-surface-variant">Daily financial breakdown</p>
            </div>
            <div className="flex items-center gap-4">
              <LegendDot color="#3525cd" label="Revenue" />
              <LegendDot color="#7e3000" label="Expenses" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={weekSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceef0" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: "#777587" }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#777587" }} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} width={48} />
              <Tooltip formatter={(v) => money(Number(v))} contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="revenue" stroke="#3525cd" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="expenses" stroke="#7e3000" strokeWidth={2.5} strokeDasharray="8 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="lg:col-span-4 flex flex-col">
          <h3 className="text-title-lg font-semibold mb-0.5">Sales by Category</h3>
          <p className="text-body-md text-on-surface-variant mb-4">Revenue share distribution</p>
          <div className="flex-1 relative min-h-[190px]">
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie data={byCategory} dataKey="value" innerRadius={62} outerRadius={86} paddingAngle={2} strokeWidth={0}>
                  {byCategory.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => money(Number(v))} contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-label-sm text-outline uppercase font-semibold">Total</span>
              <span className="text-headline-md font-bold">
                {money(byCategory.reduce((s, c) => s + c.value, 0))}
              </span>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {byCategory.slice(0, 4).map((c) => {
              const total = byCategory.reduce((s, x) => s + x.value, 0) || 1;
              return (
                <div key={c.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: c.color }} />
                    <span className="text-body-md">{c.name}</span>
                  </div>
                  <span className="text-label-md font-semibold">{Math.round((c.value / total) * 100)}%</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card className="lg:col-span-5">
          <h3 className="text-title-lg font-semibold mb-0.5">Peak Hours</h3>
          <p className="text-body-md text-on-surface-variant mb-4">Orders by hour of day</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hourly}>
              <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: "#777587" }} />
              <Tooltip cursor={{ fill: "#eef2ff" }} contentStyle={tooltipStyle} />
              <Bar dataKey="orders" fill="#3525cd" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="lg:col-span-4" padded={false}>
          <div className="p-5 border-b border-outline-variant">
            <h3 className="text-title-lg font-semibold">Top Items by Revenue</h3>
          </div>
          <div className="divide-y divide-outline-variant">
            {topItems.map((t, i) => (
              <div key={t.name} className="px-5 py-3 flex items-center gap-3">
                <span className="w-6 h-6 rounded-md bg-primary-fixed text-primary text-label-sm font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-body-md font-semibold truncate">{t.name}</p>
                  <p className="text-label-sm text-on-surface-variant">{t.qty} sold</p>
                </div>
                <span className="text-label-md font-bold">{money(t.revenue)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-3" padded={false}>
          <div className="p-5 border-b border-outline-variant">
            <h3 className="text-title-lg font-semibold">Staff Sales</h3>
          </div>
          <div className="divide-y divide-outline-variant">
            {staffPerf.map((s) => (
              <div key={s.name} className="px-5 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-body-md font-semibold">{s.name}</span>
                  <span className="text-label-md font-bold">{money(s.sales)}</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${(s.sales / (staffPerf[0]?.sales || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function Kpi({ label, value, delta, up, icon }: { label: string; value: string; delta: string; up: boolean; icon: React.ReactNode }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-outline-variant shadow-sm flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-on-surface-variant text-label-md font-semibold">{label}</span>
        {icon}
      </div>
      <p className="text-[28px] leading-9 font-bold text-on-surface tracking-tight">{value}</p>
      <span
        className={cx(
          "text-label-sm font-semibold self-start px-2 py-0.5 rounded-full",
          up ? "bg-secondary-container text-on-secondary-container" : "bg-error-container text-on-error-container",
        )}
      >
        {delta}
      </span>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-label-sm font-medium">{label}</span>
    </div>
  );
}
