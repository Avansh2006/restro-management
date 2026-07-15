"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, Clock, LogIn, LogOut, ScanFace, UserCheck, UserX } from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell/AppShell";
import { useRestro } from "@/lib/store";
import { Avatar, Badge, Button, Card, PillTabs, SearchInput, StatCard } from "@/components/ui";
import { toast } from "@/components/ui/Toast";

type DayFilter = "today" | "yesterday" | "week";

export default function AttendancePage() {
  const employees = useRestro((s) => s.employees);
  const attendance = useRestro((s) => s.attendance);
  const shifts = useRestro((s) => s.shifts);
  const punchIn = useRestro((s) => s.punchIn);
  const punchOut = useRestro((s) => s.punchOut);

  const [day, setDay] = useState<DayFilter>("today");
  const [q, setQ] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  })();
  const weekAgo = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  })();

  const records = useMemo(() => {
    const needle = q.toLowerCase();
    return attendance
      .filter((a) => {
        if (day === "today" && a.date !== today) return false;
        if (day === "yesterday" && a.date !== yesterday) return false;
        if (day === "week" && a.date < weekAgo) return false;
        if (needle) {
          const emp = employees.find((e) => e.id === a.employeeId);
          if (!emp?.name.toLowerCase().includes(needle)) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || (b.clockIn ?? "").localeCompare(a.clockIn ?? ""));
  }, [attendance, day, q, employees, today, yesterday, weekAgo]);

  const stats = useMemo(() => {
    const todayRecs = attendance.filter((a) => a.date === today);
    const present = todayRecs.filter((a) => a.clockIn && !a.clockOut).length;
    const late = todayRecs.filter((a) => a.status === "late").length;
    const scheduled = shifts.filter((s) => s.date === today).length;
    const absent = Math.max(0, scheduled - todayRecs.length);
    return { present, late, scheduled, absent };
  }, [attendance, shifts, today]);

  const notClockedIn = useMemo(() => {
    const clocked = new Set(attendance.filter((a) => a.date === today).map((a) => a.employeeId));
    return employees.filter((e) => e.status === "active" && e.role !== "Owner" && !clocked.has(e.id));
  }, [employees, attendance, today]);

  return (
    <AppShell title="Attendance">
      <PageHeader
        title="Attendance"
        subtitle="Daily clock-ins across kiosk, face scan, and mobile."
        actions={
          <>
            <SearchInput value={q} onChange={setQ} placeholder="Search staff..." className="w-full sm:w-56" />
            <Link href="/kiosk">
              <Button variant="secondary">
                <ScanFace className="w-4 h-4" /> Open Kiosk
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="On Clock Now" value={String(stats.present)} extra={<UserCheck className="w-5 h-5 text-emerald-600" />} />
        <StatCard label="Late Today" value={String(stats.late)} extra={<Clock className="w-5 h-5 text-amber-600" />} />
        <StatCard label="Scheduled" value={String(stats.scheduled)} extra={<CalendarClock className="w-5 h-5 text-primary" />} />
        <StatCard label="Not Clocked In" value={String(notClockedIn.length)} extra={<UserX className="w-5 h-5 text-error" />} />
      </div>

      <PillTabs
        className="mb-5 w-fit max-w-full"
        tabs={[
          { key: "today", label: "Today" },
          { key: "yesterday", label: "Yesterday" },
          { key: "week", label: "Last 7 Days" },
        ]}
        active={day}
        onChange={setDay}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
        {/* Records */}
        <Card padded={false} className="lg:col-span-2 overflow-hidden">
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <Th>Employee</Th>
                  <Th>Date</Th>
                  <Th>Clock In</Th>
                  <Th>Clock Out</Th>
                  <Th>Method</Th>
                  <Th>Status</Th>
                  <th className="py-3.5 px-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {records.map((a) => {
                  const emp = employees.find((e) => e.id === a.employeeId);
                  if (!emp) return null;
                  const active = a.clockIn && !a.clockOut && a.date === today;
                  return (
                    <tr key={a.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3 px-5">
                        <Link href={`/employees/${emp.id}`} className="flex items-center gap-3 group">
                          <Avatar name={emp.name} color={emp.avatarColor} size="sm" />
                          <div>
                            <p className="text-body-md font-semibold group-hover:text-primary transition-colors">{emp.name}</p>
                            <p className="text-label-sm text-on-surface-variant">{emp.role}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-body-md">{a.date === today ? "Today" : a.date}</td>
                      <td className="py-3 px-4 text-body-md font-semibold">{a.clockIn ?? "—"}</td>
                      <td className="py-3 px-4 text-body-md">{a.clockOut ?? (active ? <span className="text-primary font-semibold">working…</span> : "—")}</td>
                      <td className="py-3 px-4">
                        <Badge tone={a.method === "face" ? "purple" : a.method === "kiosk" ? "indigo" : a.method === "mobile" ? "cyan" : "slate"}>
                          {a.method}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge tone={a.status === "present" ? "green" : a.status === "late" ? "amber" : "red"}>{a.status}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        {active && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              const res = punchOut(emp.id);
                              toast[res.ok ? "success" : "error"](res.message);
                            }}
                          >
                            <LogOut className="w-3.5 h-3.5" /> Out
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Mobile */}
          <div className="md:hidden divide-y divide-outline-variant">
            {records.map((a) => {
              const emp = employees.find((e) => e.id === a.employeeId);
              if (!emp) return null;
              const active = a.clockIn && !a.clockOut && a.date === today;
              return (
                <div key={a.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Avatar name={emp.name} color={emp.avatarColor} size="sm" />
                      <div>
                        <p className="font-semibold text-body-md">{emp.name}</p>
                        <p className="text-label-sm text-on-surface-variant">{a.date === today ? "Today" : a.date}</p>
                      </div>
                    </div>
                    <Badge tone={a.status === "present" ? "green" : a.status === "late" ? "amber" : "red"}>{a.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-label-md">
                    <span className="text-on-surface-variant">
                      {a.clockIn ?? "—"} → {a.clockOut ?? (active ? "working…" : "—")} • {a.method}
                    </span>
                    {active && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          const res = punchOut(emp.id);
                          toast[res.ok ? "success" : "error"](res.message);
                        }}
                      >
                        Clock Out
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {records.length === 0 && <p className="p-6 text-body-md text-on-surface-variant text-center">No attendance records for this range.</p>}
        </Card>

        {/* Not clocked in */}
        <Card padded={false}>
          <div className="p-5 border-b border-outline-variant">
            <h3 className="text-title-lg font-semibold">Not Clocked In</h3>
            <p className="text-body-md text-on-surface-variant">Active staff without a record today.</p>
          </div>
          <div className="divide-y divide-outline-variant">
            {notClockedIn.length === 0 && <p className="p-5 text-body-md text-on-surface-variant">Everyone is accounted for 🎉</p>}
            {notClockedIn.map((e) => (
              <div key={e.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={e.name} color={e.avatarColor} size="sm" />
                  <div>
                    <p className="text-body-md font-semibold">{e.name}</p>
                    <p className="text-label-sm text-on-surface-variant">{e.role}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    const res = punchIn(e.id, "manual");
                    toast[res.ok ? "success" : "error"](res.message);
                  }}
                >
                  <LogIn className="w-3.5 h-3.5" /> In
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="py-3.5 px-4 first:pl-5 text-label-md font-semibold text-on-surface-variant uppercase tracking-wider">{children}</th>;
}
