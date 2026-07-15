"use client";

import { useMemo, useState } from "react";
import { Banknote, CheckCircle2, Download, Wallet } from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell/AppShell";
import { useRestro, money } from "@/lib/store";
import { Avatar, Badge, Button, Card, Select, StatCard } from "@/components/ui";
import { toast } from "@/components/ui/Toast";

export default function PayrollPage() {
  const payroll = useRestro((s) => s.payroll);
  const employees = useRestro((s) => s.employees);
  const setPayrollStatus = useRestro((s) => s.setPayrollStatus);
  const processPayrollPeriod = useRestro((s) => s.processPayrollPeriod);

  const periods = useMemo(() => [...new Set(payroll.map((p) => p.period))].sort().reverse(), [payroll]);
  const [period, setPeriod] = useState(periods[0] ?? "");

  const rows = useMemo(
    () =>
      payroll
        .filter((p) => p.period === period)
        .map((p) => ({ ...p, emp: employees.find((e) => e.id === p.employeeId) }))
        .filter((p) => p.emp)
        .sort((a, b) => b.gross - a.gross),
    [payroll, period, employees],
  );

  const totals = useMemo(
    () => ({
      gross: rows.reduce((s, r) => s + r.gross, 0),
      net: rows.reduce((s, r) => s + r.net, 0),
      deductions: rows.reduce((s, r) => s + r.deductions, 0),
      hours: rows.reduce((s, r) => s + r.baseHours + r.overtimeHours, 0),
      drafts: rows.filter((r) => r.status === "draft").length,
    }),
    [rows],
  );

  const exportCsv = () => {
    const data = [
      ["Employee", "Period", "Base Hours", "OT Hours", "Rate", "Bonus", "Deductions", "Gross", "Net", "Status"],
      ...rows.map((r) => [
        r.emp!.name,
        r.period,
        String(r.baseHours),
        String(r.overtimeHours),
        r.hourlyRate.toFixed(2),
        r.bonus.toFixed(2),
        r.deductions.toFixed(2),
        r.gross.toFixed(2),
        r.net.toFixed(2),
        r.status,
      ]),
    ];
    const csv = data.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `restroos-payroll-${period}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Payroll exported as CSV");
  };

  return (
    <AppShell title="Payroll">
      <PageHeader
        title="Payroll"
        subtitle="Wages, overtime, and payout processing by pay period."
        actions={
          <>
            <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="!w-auto">
              {periods.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
            <Button variant="secondary" onClick={exportCsv}>
              <Download className="w-4 h-4" /> Export
            </Button>
            {totals.drafts > 0 && (
              <Button
                onClick={() => {
                  processPayrollPeriod(period);
                  toast.success(`Payroll for ${period} processed`, `${totals.drafts} records moved to processed`);
                }}
              >
                <Banknote className="w-4 h-4" /> Process Period
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Gross Payroll" value={money(totals.gross)} />
        <StatCard label="Net Payout" value={money(totals.net)} />
        <StatCard label="Deductions" value={money(totals.deductions)} />
        <StatCard label="Total Hours" value={`${totals.hours}h`} />
      </div>

      {/* Desktop table */}
      <Card padded={false} className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <Th>Employee</Th>
                <Th>Hours</Th>
                <Th>Rate</Th>
                <Th>Bonus</Th>
                <Th>Deductions</Th>
                <Th>Gross</Th>
                <Th>Net</Th>
                <Th>Status</Th>
                <th className="py-3.5 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.emp!.name} color={r.emp!.avatarColor} size="sm" />
                      <div>
                        <p className="text-body-md font-semibold">{r.emp!.name}</p>
                        <p className="text-label-sm text-on-surface-variant">{r.emp!.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-body-md">
                    {r.baseHours}h{r.overtimeHours > 0 && <span className="text-primary font-semibold"> +{r.overtimeHours} OT</span>}
                  </td>
                  <td className="py-3 px-4 text-body-md">{money(r.hourlyRate)}/hr</td>
                  <td className="py-3 px-4 text-body-md">{r.bonus ? <span className="text-emerald-700 font-semibold">+{money(r.bonus)}</span> : "—"}</td>
                  <td className="py-3 px-4 text-body-md text-on-surface-variant">-{money(r.deductions)}</td>
                  <td className="py-3 px-4 text-body-md font-semibold">{money(r.gross)}</td>
                  <td className="py-3 px-4 text-body-md font-bold text-primary">{money(r.net)}</td>
                  <td className="py-3 px-4">
                    <Badge tone={r.status === "paid" ? "green" : r.status === "processed" ? "blue" : "slate"}>{r.status}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    {r.status === "processed" && (
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => {
                          setPayrollStatus(r.id, "paid");
                          toast.success(`${r.emp!.name} paid ${money(r.net)}`);
                        }}
                      >
                        <Wallet className="w-3.5 h-3.5" /> Pay
                      </Button>
                    )}
                    {r.status === "paid" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Avatar name={r.emp!.name} color={r.emp!.avatarColor} size="sm" />
                <div>
                  <p className="font-semibold text-body-md">{r.emp!.name}</p>
                  <p className="text-label-sm text-on-surface-variant">
                    {r.baseHours}h{r.overtimeHours ? ` +${r.overtimeHours} OT` : ""} @ {money(r.hourlyRate)}/hr
                  </p>
                </div>
              </div>
              <Badge tone={r.status === "paid" ? "green" : r.status === "processed" ? "blue" : "slate"}>{r.status}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body-md">
                Net: <span className="font-bold text-primary">{money(r.net)}</span>
              </span>
              {r.status === "processed" && (
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => {
                    setPayrollStatus(r.id, "paid");
                    toast.success(`${r.emp!.name} paid ${money(r.net)}`);
                  }}
                >
                  <Wallet className="w-3.5 h-3.5" /> Pay Out
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="py-3.5 px-4 first:pl-5 text-label-md font-semibold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">{children}</th>;
}
