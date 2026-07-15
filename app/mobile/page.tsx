"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,

  CalendarRange,
  Home,
  LogIn,
  LogOut,
  Plane,
  Plus,

  Wallet,
} from "lucide-react";
import { useRestro, money } from "@/lib/store";
import { Avatar, Badge, Button, Field, Input, Select, Textarea, cx, type BadgeTone } from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import { ExperienceSwitcher } from "@/components/shell/AppShell";
import type { LeaveType } from "@/lib/types";

type Tab = "home" | "shifts" | "leave" | "pay";

export default function EmployeeMobilePage() {
  const employees = useRestro((s) => s.employees);
  const attendance = useRestro((s) => s.attendance);
  const shifts = useRestro((s) => s.shifts);
  const leave = useRestro((s) => s.leaveRequests);
  const payroll = useRestro((s) => s.payroll);
  const punchIn = useRestro((s) => s.punchIn);
  const punchOut = useRestro((s) => s.punchOut);
  const addLeaveRequest = useRestro((s) => s.addLeaveRequest);

  // "logged in" staff member for the demo
  const [meId, setMeId] = useState("emp-3");
  const [tab, setTab] = useState<Tab>("home");
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    type: "vacation" as LeaveType,
    from: new Date().toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
    reason: "",
  });

  const me = employees.find((e) => e.id === meId) ?? employees[0];
  const today = new Date().toISOString().slice(0, 10);

  const todayRec = attendance.find((a) => a.employeeId === me.id && a.date === today);
  const isOnClock = !!todayRec?.clockIn && !todayRec.clockOut;

  const myShifts = useMemo(
    () => shifts.filter((s) => s.employeeId === me.id && s.date >= today).sort((a, b) => a.date.localeCompare(b.date)),
    [shifts, me.id, today],
  );
  const todayShift = myShifts.find((s) => s.date === today);
  const myLeave = useMemo(
    () => leave.filter((l) => l.employeeId === me.id).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)),
    [leave, me.id],
  );
  const myPay = useMemo(
    () => payroll.filter((p) => p.employeeId === me.id).sort((a, b) => b.period.localeCompare(a.period)),
    [payroll, me.id],
  );

  const weekHours = useMemo(() => {
    let mins = 0;
    for (const a of attendance.filter((x) => x.employeeId === me.id && x.clockIn && x.clockOut)) {
      const [h1, m1] = a.clockIn!.split(":").map(Number);
      const [h2, m2] = a.clockOut!.split(":").map(Number);
      mins += Math.max(0, h2 * 60 + m2 - (h1 * 60 + m1));
    }
    return Math.round(mins / 60);
  }, [attendance, me.id]);

  const LEAVE_TONE: Record<string, BadgeTone> = { approved: "green", pending: "amber", rejected: "red" };

  return (
    <div className="min-h-dvh bg-surface-container-low flex justify-center">
      <div className="w-full max-w-[480px] bg-background min-h-dvh flex flex-col relative shadow-2xl">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-surface border-b border-outline-variant px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link href="/" className="p-1.5 -ml-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors" title="Exit demo">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <p className="font-bold text-on-surface leading-tight">RestroOS Staff</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">Employee App</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ExperienceSwitcher compact />
            <select
              value={meId}
              onChange={(e) => {
                setMeId(e.target.value);
                toast.info(`Viewing as ${employees.find((x) => x.id === e.target.value)?.name}`);
              }}
              className="text-label-sm font-bold bg-surface-container border border-outline-variant rounded-lg px-2 py-1.5 outline-none max-w-[110px]"
              title="Switch demo employee"
            >
              {employees
                .filter((e) => e.role !== "Owner")
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name.split(" ")[0]}
                  </option>
                ))}
            </select>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-24">
          {/* HOME */}
          {tab === "home" && (
            <div className="p-4 space-y-4">
              {/* Greeting + punch card */}
              <div className="bg-primary rounded-3xl p-5 text-white shadow-xl shadow-primary/25">
                <div className="flex items-center gap-3 mb-5">
                  <Avatar name={me.name} color="rgba(255,255,255,0.25)" />
                  <div>
                    <p className="text-headline-md font-bold leading-tight">Hi, {me.name.split(" ")[0]}!</p>
                    <p className="text-white/70 text-label-md">
                      {me.role} • {me.code}
                    </p>
                  </div>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 mb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white/60 text-label-sm font-bold uppercase">Today&apos;s Shift</p>
                      <p className="text-title-lg font-bold">
                        {todayShift ? `${todayShift.start} – ${todayShift.end}` : "No shift scheduled"}
                      </p>
                      {todayShift && <p className="text-white/70 text-label-sm">{todayShift.role}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-white/60 text-label-sm font-bold uppercase">Status</p>
                      <p className={cx("text-title-lg font-bold", isOnClock ? "text-emerald-300" : "text-white/80")}>
                        {isOnClock ? `In since ${todayRec?.clockIn}` : todayRec?.clockOut ? "Shift done" : "Off clock"}
                      </p>
                    </div>
                  </div>
                </div>
                {isOnClock ? (
                  <button
                    onClick={() => {
                      const res = punchOut(me.id);
                      toast[res.ok ? "success" : "error"](res.message);
                    }}
                    className="w-full py-3.5 bg-white text-primary rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                  >
                    <LogOut className="w-5 h-5" /> Punch Out
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const res = punchIn(me.id, "mobile");
                      toast[res.ok ? "success" : "error"](res.message);
                    }}
                    className="w-full py-3.5 bg-white text-primary rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                  >
                    <LogIn className="w-5 h-5" /> Punch In
                  </button>
                )}
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3">
                <MobileStat label="Hours (7d)" value={`${weekHours}h`} />
                <MobileStat label="Rating" value={`${me.rating}.0★`} />
                <MobileStat label="Rate" value={me.hourlyRate ? `$${me.hourlyRate}/h` : "—"} />
              </div>

              {/* Next shifts preview */}
              <div className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
                <div className="p-4 border-b border-outline-variant flex items-center justify-between">
                  <h3 className="font-bold text-body-md">Upcoming Shifts</h3>
                  <button onClick={() => setTab("shifts")} className="text-primary text-label-sm font-bold">
                    See all
                  </button>
                </div>
                <div className="divide-y divide-outline-variant">
                  {myShifts.slice(0, 3).map((s) => (
                    <div key={s.id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-body-md font-semibold">{s.date === today ? "Today" : s.date}</p>
                        <p className="text-label-sm text-on-surface-variant">{s.role}</p>
                      </div>
                      <span className="text-label-md font-bold text-primary">
                        {s.start} – {s.end}
                      </span>
                    </div>
                  ))}
                  {myShifts.length === 0 && <p className="p-4 text-body-md text-on-surface-variant">No upcoming shifts.</p>}
                </div>
              </div>
            </div>
          )}

          {/* SHIFTS */}
          {tab === "shifts" && (
            <div className="p-4 space-y-3">
              <h2 className="text-headline-md font-bold px-1">My Shifts</h2>
              {myShifts.length === 0 && <p className="text-body-md text-on-surface-variant px-1">No upcoming shifts scheduled.</p>}
              {myShifts.map((s) => (
                <div key={s.id} className="bg-white rounded-2xl border border-outline-variant p-4 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-fixed flex flex-col items-center justify-center text-primary shrink-0">
                    <span className="text-[10px] font-bold uppercase leading-none">
                      {new Date(s.date + "T12:00:00").toLocaleDateString("en-US", { month: "short" })}
                    </span>
                    <span className="text-title-lg font-bold leading-tight">{new Date(s.date + "T12:00:00").getDate()}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-body-md">
                      {s.date === today ? "Today" : new Date(s.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long" })}
                    </p>
                    <p className="text-label-sm text-on-surface-variant">{s.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary text-body-md">
                      {s.start}–{s.end}
                    </p>
                    <Badge tone={s.status === "in-progress" ? "green" : "slate"}>{s.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* LEAVE */}
          {tab === "leave" && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-headline-md font-bold">My Leave</h2>
                <Button size="sm" onClick={() => setLeaveOpen(true)}>
                  <Plus className="w-3.5 h-3.5" /> Request
                </Button>
              </div>
              {myLeave.length === 0 && <p className="text-body-md text-on-surface-variant px-1">No leave requests yet.</p>}
              {myLeave.map((l) => (
                <div key={l.id} className="bg-white rounded-2xl border border-outline-variant p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-body-md capitalize">{l.type} leave</p>
                    <Badge tone={LEAVE_TONE[l.status]}>{l.status}</Badge>
                  </div>
                  <p className="text-label-md text-on-surface-variant">
                    {l.from} → {l.to}
                  </p>
                  <p className="text-label-sm text-outline italic mt-1">“{l.reason}”</p>
                </div>
              ))}

              {leaveOpen && (
                <div className="fixed inset-0 z-[110] max-w-[480px] mx-auto">
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm fade-in" onClick={() => setLeaveOpen(false)} />
                  <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-3xl slide-in-up p-5 space-y-4">
                    <div className="flex justify-center">
                      <div className="w-10 h-1 rounded-full bg-outline-variant" />
                    </div>
                    <h3 className="text-headline-md font-bold">Request Leave</h3>
                    <Field label="Type">
                      <Select value={leaveForm.type} onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value as LeaveType })}>
                        <option value="vacation">Vacation</option>
                        <option value="sick">Sick</option>
                        <option value="personal">Personal</option>
                        <option value="unpaid">Unpaid</option>
                      </Select>
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="From">
                        <Input type="date" value={leaveForm.from} onChange={(e) => setLeaveForm({ ...leaveForm, from: e.target.value })} />
                      </Field>
                      <Field label="To">
                        <Input type="date" value={leaveForm.to} onChange={(e) => setLeaveForm({ ...leaveForm, to: e.target.value })} />
                      </Field>
                    </div>
                    <Field label="Reason">
                      <Textarea rows={2} value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} placeholder="Short explanation..." />
                    </Field>
                    <Button
                      className="w-full !py-3"
                      onClick={() => {
                        if (!leaveForm.reason.trim()) return toast.error("Add a short reason");
                        addLeaveRequest({ employeeId: me.id, ...leaveForm });
                        toast.success("Leave request sent to your manager");
                        setLeaveOpen(false);
                        setLeaveForm({ ...leaveForm, reason: "" });
                      }}
                    >
                      Submit Request
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PAY */}
          {tab === "pay" && (
            <div className="p-4 space-y-3">
              <h2 className="text-headline-md font-bold px-1">My Pay</h2>
              {myPay.length === 0 && <p className="text-body-md text-on-surface-variant px-1">No payroll records.</p>}
              {myPay.map((p) => (
                <div key={p.id} className="bg-white rounded-2xl border border-outline-variant p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-body-md">{p.period}</p>
                    <Badge tone={p.status === "paid" ? "green" : p.status === "processed" ? "blue" : "slate"}>{p.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-label-md">
                    <div className="text-on-surface-variant">
                      Hours: <span className="font-semibold text-on-surface">{p.baseHours}h{p.overtimeHours ? ` +${p.overtimeHours} OT` : ""}</span>
                    </div>
                    <div className="text-on-surface-variant text-right">
                      Gross: <span className="font-semibold text-on-surface">{money(p.gross)}</span>
                    </div>
                    <div className="text-on-surface-variant">
                      Deductions: <span className="font-semibold text-on-surface">-{money(p.deductions)}</span>
                    </div>
                    <div className="text-right">
                      Net: <span className="font-bold text-primary text-body-md">{money(p.net)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Bottom nav */}
        <nav className="fixed bottom-0 inset-x-0 max-w-[480px] mx-auto bg-white border-t border-outline-variant flex justify-around items-stretch h-16 pb-[env(safe-area-inset-bottom)] z-40">
          {(
            [
              { key: "home", label: "Home", icon: Home },
              { key: "shifts", label: "Shifts", icon: CalendarRange },
              { key: "leave", label: "Leave", icon: Plane },
              { key: "pay", label: "Pay", icon: Wallet },
            ] as Array<{ key: Tab; label: string; icon: typeof Home }>
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cx(
                "flex flex-col items-center justify-center gap-0.5 flex-1 transition-colors",
                tab === t.key ? "text-primary" : "text-on-surface-variant",
              )}
            >
              <t.icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold">{t.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

function MobileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl border border-outline-variant p-3.5 text-center shadow-sm">
      <p className="text-title-lg font-bold">{value}</p>
      <p className="text-[10px] text-on-surface-variant font-bold uppercase">{label}</p>
    </div>
  );
}
