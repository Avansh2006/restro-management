"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Banknote,
  CalendarRange,
  Download,
  FileText,
  Package,
  ShoppingCart,
  Star,
  Users,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell/AppShell";
import { useRestro, money } from "@/lib/store";
import { Badge, Button, Card, Field, Select, cx } from "@/components/ui";
import { toast } from "@/components/ui/Toast";

interface ReportDef {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tone: string;
  build: () => { headers: string[]; rows: string[][] };
}

export default function ReportsPage() {
  const store = useRestro();
  const [range, setRange] = useState("this-month");
  const [generated, setGenerated] = useState<{ title: string; headers: string[]; rows: string[][] } | null>(null);

  const reports: ReportDef[] = useMemo(
    () => [
      {
        key: "sales",
        title: "Sales Summary",
        description: "Revenue, orders, and payment mix by channel.",
        icon: <Banknote className="w-5 h-5" />,
        tone: "bg-primary-fixed text-primary",
        build: () => ({
          headers: ["Channel", "Orders", "Revenue", "Avg Order"],
          rows: (["dine-in", "takeaway", "delivery", "qr"] as const).map((ch) => {
            const chOrders = store.orders.filter((o) => o.channel === ch && o.status === "paid");
            const rev = chOrders.reduce((s, o) => s + o.total, 0);
            return [ch, String(chOrders.length), money(rev), chOrders.length ? money(rev / chOrders.length) : "—"];
          }),
        }),
      },
      {
        key: "items",
        title: "Item Performance",
        description: "Best and worst selling menu items.",
        icon: <ShoppingCart className="w-5 h-5" />,
        tone: "bg-secondary-fixed text-secondary",
        build: () => {
          const counts = new Map<string, { qty: number; revenue: number }>();
          for (const o of store.orders) {
            if (o.status === "cancelled") continue;
            for (const it of o.items) {
              const cur = counts.get(it.name) ?? { qty: 0, revenue: 0 };
              cur.qty += it.qty;
              cur.revenue += it.price * it.qty;
              counts.set(it.name, cur);
            }
          }
          return {
            headers: ["Item", "Qty Sold", "Revenue"],
            rows: [...counts.entries()].sort((a, b) => b[1].revenue - a[1].revenue).map(([name, v]) => [name, String(v.qty), money(v.revenue)]),
          };
        },
      },
      {
        key: "inventory",
        title: "Inventory Valuation",
        description: "Stock levels, values, and low-stock flags.",
        icon: <Package className="w-5 h-5" />,
        tone: "bg-tertiary-fixed text-tertiary",
        build: () => ({
          headers: ["Item", "Stock", "Min", "Value", "Status"],
          rows: store.inventory.map((i) => [
            i.name,
            `${i.stock} ${i.unit}`,
            `${i.minStock} ${i.unit}`,
            money(i.stock * i.costPerUnit),
            i.stock < i.minStock ? "LOW" : "OK",
          ]),
        }),
      },
      {
        key: "labor",
        title: "Labor Cost",
        description: "Hours, wages, and overtime by employee.",
        icon: <BadgeCheck className="w-5 h-5" />,
        tone: "bg-secondary-container text-on-secondary-container",
        build: () => ({
          headers: ["Employee", "Role", "Hours", "OT", "Net Pay"],
          rows: store.payroll
            .filter((p) => p.period === [...new Set(store.payroll.map((x) => x.period))].sort().reverse()[0])
            .map((p) => {
              const e = store.employees.find((x) => x.id === p.employeeId);
              return [e?.name ?? "—", e?.role ?? "—", String(p.baseHours), String(p.overtimeHours), money(p.net)];
            }),
        }),
      },
      {
        key: "customers",
        title: "Customer Insights",
        description: "Visits, spend, and loyalty tiers.",
        icon: <Users className="w-5 h-5" />,
        tone: "bg-primary-fixed text-primary",
        build: () => ({
          headers: ["Customer", "Tier", "Visits", "Total Spent", "Points"],
          rows: [...store.customers]
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .map((c) => [c.name, c.tier, String(c.visits), money(c.totalSpent), String(c.loyaltyPoints)]),
        }),
      },
      {
        key: "feedback",
        title: "Feedback Digest",
        description: "Ratings breakdown with recent comments.",
        icon: <Star className="w-5 h-5" />,
        tone: "bg-tertiary-fixed text-tertiary",
        build: () => ({
          headers: ["Guest", "Rating", "Category", "Comment", "Date"],
          rows: store.feedback.map((f) => [f.customerName, `${f.rating}/5`, f.category, f.comment.slice(0, 60) + (f.comment.length > 60 ? "…" : ""), f.date]),
        }),
      },
    ],
    [store],
  );

  const generate = (r: ReportDef) => {
    const data = r.build();
    setGenerated({ title: r.title, ...data });
    toast.success(`${r.title} generated`, `${data.rows.length} rows`);
  };

  const downloadCsv = () => {
    if (!generated) return;
    const csv = [generated.headers, ...generated.rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `restroos-${generated.title.toLowerCase().replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Report downloaded");
  };

  return (
    <AppShell title="Reports">
      <PageHeader
        title="Reports"
        subtitle="Generate operational and financial reports from live demo data."
        actions={
          <Field label="">
            <Select value={range} onChange={(e) => setRange(e.target.value)} className="!w-auto">
              <option value="today">Today</option>
              <option value="this-week">This Week</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="ytd">Year to Date</option>
            </Select>
          </Field>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {reports.map((r) => (
          <div key={r.key} className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className={cx("w-11 h-11 rounded-xl flex items-center justify-center", r.tone)}>{r.icon}</div>
              <Badge tone="slate">
                <CalendarRange className="w-3 h-3" /> {range.replace(/-/g, " ")}
              </Badge>
            </div>
            <h3 className="text-title-lg font-semibold mb-1">{r.title}</h3>
            <p className="text-body-md text-on-surface-variant mb-4">{r.description}</p>
            <Button size="sm" variant="secondary" onClick={() => generate(r)}>
              <FileText className="w-3.5 h-3.5" /> Generate
            </Button>
          </div>
        ))}
      </div>

      {generated && (
        <Card padded={false} className="overflow-hidden">
          <div className="p-5 border-b border-outline-variant flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-title-lg font-semibold">{generated.title}</h3>
              <p className="text-body-md text-on-surface-variant">{generated.rows.length} rows • generated just now</p>
            </div>
            <Button onClick={downloadCsv}>
              <Download className="w-4 h-4" /> Download CSV
            </Button>
          </div>
          <div className="overflow-x-auto max-h-[480px] custom-scrollbar">
            <table className="w-full text-left">
              <thead className="sticky top-0">
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  {generated.headers.map((h) => (
                    <th key={h} className="py-3 px-4 first:pl-5 text-label-md font-semibold text-on-surface-variant uppercase tracking-wider whitespace-nowrap bg-surface-container-low">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {generated.rows.map((row, i) => (
                  <tr key={i} className="hover:bg-surface-container-low transition-colors">
                    {row.map((cell, ci) => (
                      <td key={ci} className={cx("py-2.5 px-4 first:pl-5 text-body-md", cell === "LOW" && "text-error font-bold")}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </AppShell>
  );
}
