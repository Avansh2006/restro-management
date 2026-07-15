"use client";

import { use, useMemo } from "react";
import Link from "next/link";

import {
  ArrowLeft,
  CalendarClock,
  CalendarRange,
  LogIn,
  LogOut,
  Mail,
  Phone,
  Plane,
  Wallet,
} from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { useRestro, money } from "@/lib/store";
import { Avatar, Badge, Button, Card, StarRating, cx, type BadgeTone } from "@/components/ui";
import { toast } from "@/components/ui/Toast";

export default function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const employees = useRestro((s) => s.employees);
  const attendance = useRestro((s) => s.attendance);
  const shifts = useRestro((s) => s.shifts);
  const leave = useRestro((s) => s.leaveRequests);
  const payroll = useRestro((s) => s.payroll);
  const punchIn = useRestro((s) => s.punchIn);
  const punchOut = useRestro((s) => s.punchOut);

  const emp = employees.find((e) => e.id === id);
  const today = new Date().toISOString().slice(0, 10);

  const empAttendance = useMemo(
    () => attendance.filter((a) => a.employeeId === id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10),
    [attendance, id],
  );
  const empShifts = useMemo(
    () => shifts.filter((s) => s.employeeId === id && s.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5),
    [shifts, id, today],
  );
  const empLeave = useMemo(() => leave.filter((l) => l.employeeId === id), [leave, id]);
  const empPayroll = useMemo(() => payroll.filter((p) => p.employeeId === id).sort((a, b) => b.period.localeCompare(a.period)), [payroll, id]);

  const isOnClock = attendance.some((a) => a.employeeId === id && a.date === today && a.clockIn && !a.clockOut);

  const attendanceRate = useMemo(() => {
    const recs = attendance.filter((a) => a.employeeId === id);
    if (!recs.length) return 100;
    const present = recs.filter((a) => a.status === "present").length;
    return Math.round((present / recs.length) * 100);
  }, [attendance, id]);

  if (!emp) {
    return (
      <AppShell title="Employee">
        <div className="py-20 text-center">
          <p className="text-title-lg font-semibold mb-3">Employee not found</p>
          <Link href="/employees">
            <Button variant="secondary">
              <ArrowLeft className="w-4 h-4" /> Back to Employees
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const STATUS_TONE: Record<string, BadgeTone> = { approved: "green", pending: "amber", rejected: "red" };

  return (
    <AppShell title={emp.name}>
      <Link href="/employees" className="inline-flex items-center gap-1.5 text-label-md font-semibold text-on-surface-variant hover:text-primary transition-colors mb-4">
        <ArrowLeft className="w-4 h-4" /> All Employees
      </Link>

      {/* Header card */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <Avatar name={emp.name} color={emp.avatarColor} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-headline-lg font-semibold">{emp.name}</h2>
              {isOnClock ? (
                <span className="flex items-center gap-1.5 text-label-md font-bold text-primary">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> ON CLOCK
                </span>
              ) : (
                <Badge tone={emp.status === "on-leave" ? "amber" : "slate"}>
                  {emp.status === "on-leave" ? "On Leave" : "Off Clock"}
                </Badge>
              )}
            </div>
            <p className="text-body-md text-on-surface-variant mt-0.5">
              {emp.role} • {emp.code} • Hired {emp.hiredAt}
            </p>
            <div className="flex items-center gap-4 mt-2 flex-wrap text-body-md text-on-surface-variant">
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4" /> {emp.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-4 h-4" /> {emp.phone}
              </span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {isOnClock ? (
              <Button
                variant="secondary"
                onClick={() => {
                  const res = punchOut(emp.id);
                  toast[res.ok ? "success" : "error"](res.message);
                }}
              >
                <LogOut className="w-4 h-4" /> Clock Out
              </Button>
            ) : (
              <Button
                onClick={() => {
                  const res = punchIn(emp.id, "manual");
                  toast[res.ok ? "success" : "error"](res.message);
                }}
              >
                <LogIn className="w-4 h-4" /> Clock In
              </Button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-outline-variant">
          <Stat label="Performance">
            <StarRating rating={emp.rating} />
          </Stat>
          <Stat label="Attendance Rate">
            <span className={cx("text-title-lg font-bold", attendanceRate >= 90 ? "text-emerald-600" : "text-amber-600")}>
              {attendanceRate}%
            </span>
          </Stat>
          <Stat label="Hourly Rate">
            <span className="text-title-lg font-bold">{emp.hourlyRate ? `${money(emp.hourlyRate)}/hr` : "Salaried"}</span>
          </Stat>
          <Stat label="Kiosk PIN">
            <span className="text-title-lg font-bold tracking-[0.3em]">{emp.pin}</span>
          </Stat>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Attendance history */}
        <Card padded={false} className="lg:col-span-1">
          <div className="p-5 border-b border-outline-variant flex items-center justify-between">
            <h3 className="text-title-lg font-semibold flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-primary" /> Attendance
            </h3>
            <Link href="/attendance" className="text-label-sm font-bold text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-outline-variant max-h-[380px] overflow-y-auto custom-scrollbar">
            {empAttendance.length === 0 && <p className="p-5 text-body-md text-on-surface-variant">No records yet.</p>}
            {empAttendance.map((a) => (
              <div key={a.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-body-md font-semibold">{a.date === today ? "Today" : a.date}</p>
                  <p className="text-label-sm text-on-surface-variant">
                    {a.clockIn ?? "—"} → {a.clockOut ?? "…"} • {a.method}
                  </p>
                </div>
                <Badge tone={a.status === "present" ? "green" : a.status === "late" ? "amber" : "red"}>{a.status}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming shifts */}
        <Card padded={false}>
          <div className="p-5 border-b border-outline-variant flex items-center justify-between">
            <h3 className="text-title-lg font-semibold flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-primary" /> Upcoming Shifts
            </h3>
            <Link href="/shifts" className="text-label-sm font-bold text-primary hover:underline">
              Schedule
            </Link>
          </div>
          <div className="divide-y divide-outline-variant">
            {empShifts.length === 0 && <p className="p-5 text-body-md text-on-surface-variant">No shifts scheduled.</p>}
            {empShifts.map((s) => (
              <div key={s.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-body-md font-semibold">{s.date === today ? "Today" : s.date}</p>
                  <p className="text-label-sm text-on-surface-variant">{s.role}</p>
                </div>
                <span className="text-label-md font-bold text-primary">
                  {s.start} – {s.end}
                </span>
              </div>
            ))}
          </div>
          <div className="p-5 border-t border-outline-variant">
            <h4 className="text-label-md font-bold text-on-surface-variant uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Plane className="w-4 h-4" /> Leave Requests
            </h4>
            {empLeave.length === 0 && <p className="text-body-md text-on-surface-variant">No leave requests.</p>}
            <div className="space-y-2">
              {empLeave.map((l) => (
                <div key={l.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-body-md font-medium capitalize">{l.type}</p>
                    <p className="text-label-sm text-on-surface-variant">
                      {l.from} → {l.to}
                    </p>
                  </div>
                  <Badge tone={STATUS_TONE[l.status]}>{l.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Payroll */}
        <Card padded={false}>
          <div className="p-5 border-b border-outline-variant flex items-center justify-between">
            <h3 className="text-title-lg font-semibold flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" /> Payroll
            </h3>
            <Link href="/payroll" className="text-label-sm font-bold text-primary hover:underline">
              Payroll
            </Link>
          </div>
          <div className="divide-y divide-outline-variant">
            {empPayroll.length === 0 && <p className="p-5 text-body-md text-on-surface-variant">No payroll records.</p>}
            {empPayroll.map((p) => (
              <div key={p.id} className="px-5 py-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-body-md font-semibold">{p.period}</p>
                  <Badge tone={p.status === "paid" ? "green" : p.status === "processed" ? "blue" : "slate"}>{p.status}</Badge>
                </div>
                <div className="flex items-center justify-between text-label-md text-on-surface-variant">
                  <span>
                    {p.baseHours}h base{p.overtimeHours ? ` + ${p.overtimeHours}h OT` : ""}
                  </span>
                  <span className="font-bold text-on-surface">{money(p.net)} net</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-label-md font-semibold text-on-surface-variant mb-1">{label}</p>
      {children}
    </div>
  );
}
