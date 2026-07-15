"use client";

import { useMemo, useState } from "react";
import { Check, Plane, Plus, X } from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell/AppShell";
import { useRestro, timeAgo } from "@/lib/store";
import {
  Avatar,
  Badge,
  Button,
  Drawer,
  EmptyState,
  Field,
  Input,
  PillTabs,
  Select,
  Textarea,
  cx,
  type BadgeTone,
} from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import type { LeaveType } from "@/lib/types";

type Filter = "pending" | "approved" | "rejected" | "all";

const TYPE_TONE: Record<LeaveType, BadgeTone> = {
  vacation: "blue",
  sick: "red",
  personal: "purple",
  unpaid: "slate",
};

export default function LeavePage() {
  const leave = useRestro((s) => s.leaveRequests);
  const employees = useRestro((s) => s.employees);
  const addLeaveRequest = useRestro((s) => s.addLeaveRequest);
  const setLeaveStatus = useRestro((s) => s.setLeaveStatus);

  const [filter, setFilter] = useState<Filter>("pending");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState({
    employeeId: "",
    type: "vacation" as LeaveType,
    from: new Date().toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
    reason: "",
  });

  const filtered = useMemo(
    () =>
      leave
        .filter((l) => filter === "all" || l.status === filter)
        .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()),
    [leave, filter],
  );

  const counts = useMemo(
    () => ({
      pending: leave.filter((l) => l.status === "pending").length,
      approved: leave.filter((l) => l.status === "approved").length,
      rejected: leave.filter((l) => l.status === "rejected").length,
      all: leave.length,
    }),
    [leave],
  );

  const emp = (id: string) => employees.find((e) => e.id === id);

  const days = (from: string, to: string) =>
    Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1);

  return (
    <AppShell title="Leave">
      <PageHeader
        title="Leave Management"
        subtitle="Review time-off requests and keep the rota covered."
        actions={
          <Button onClick={() => setDrawerOpen(true)}>
            <Plus className="w-4 h-4" /> New Request
          </Button>
        }
      />

      <PillTabs
        className="mb-5 w-fit max-w-full"
        tabs={[
          { key: "pending", label: "Pending", count: counts.pending },
          { key: "approved", label: "Approved", count: counts.approved },
          { key: "rejected", label: "Rejected", count: counts.rejected },
          { key: "all", label: "All", count: counts.all },
        ]}
        active={filter}
        onChange={setFilter}
      />

      {filtered.length === 0 ? (
        <EmptyState icon={<Plane className="w-7 h-7" />} title="No leave requests" message="Nothing in this view right now." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((l) => {
            const e = emp(l.employeeId);
            if (!e) return null;
            return (
              <div key={l.id} className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={e.name} color={e.avatarColor} />
                    <div>
                      <p className="font-bold text-body-md">{e.name}</p>
                      <p className="text-label-sm text-on-surface-variant">{e.role}</p>
                    </div>
                  </div>
                  <Badge tone={TYPE_TONE[l.type]}>{l.type}</Badge>
                </div>
                <div className="bg-surface-container-low rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between text-body-md font-semibold">
                    <span>{l.from}</span>
                    <span className="text-outline">→</span>
                    <span>{l.to}</span>
                  </div>
                  <p className="text-label-sm text-on-surface-variant text-center mt-1">
                    {days(l.from, l.to)} day{days(l.from, l.to) > 1 ? "s" : ""}
                  </p>
                </div>
                <p className="text-body-md text-on-surface-variant italic mb-4">“{l.reason}”</p>
                <div className="flex items-center justify-between">
                  <span className="text-label-sm text-outline">Requested {timeAgo(l.requestedAt)}</span>
                  {l.status === "pending" ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setLeaveStatus(l.id, "rejected");
                          toast.warning(`${e.name}'s request rejected`);
                        }}
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => {
                          setLeaveStatus(l.id, "approved");
                          toast.success(`${e.name}'s ${l.type} leave approved`);
                        }}
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </Button>
                    </div>
                  ) : (
                    <Badge tone={l.status === "approved" ? "green" : "red"}>{l.status}</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="New Leave Request"
        footer={
          <>
            <Button variant="secondary" className="flex-1" onClick={() => setDrawerOpen(false)}>
              Discard
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                if (!form.employeeId) return toast.error("Select an employee");
                if (!form.reason.trim()) return toast.error("A reason is required");
                addLeaveRequest(form);
                toast.success("Leave request submitted");
                setDrawerOpen(false);
              }}
            >
              Submit Request
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Employee">
            <Select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
              <option value="">Select...</option>
              {employees
                .filter((e) => e.role !== "Owner")
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Leave Type">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as LeaveType })}>
              <option value="vacation">Vacation</option>
              <option value="sick">Sick</option>
              <option value="personal">Personal</option>
              <option value="unpaid">Unpaid</option>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="From">
              <Input type="date" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} />
            </Field>
            <Field label="To">
              <Input type="date" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} />
            </Field>
          </div>
          <Field label="Reason">
            <Textarea rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Why is this leave needed?" />
          </Field>
        </div>
      </Drawer>
    </AppShell>
  );
}
