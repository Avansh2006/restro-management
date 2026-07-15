"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Info, ScrollText, ShieldAlert } from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell/AppShell";
import { useRestro, timeAgo } from "@/lib/store";
import { Badge, EmptyState, PillTabs, SearchInput, Select, cx } from "@/components/ui";

type SevFilter = "all" | "info" | "warning" | "critical";

export default function AuditLogsPage() {
  const auditLogs = useRestro((s) => s.auditLogs);
  const [sev, setSev] = useState<SevFilter>("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [q, setQ] = useState("");

  const modules = useMemo(() => ["all", ...new Set(auditLogs.map((l) => l.module))], [auditLogs]);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return auditLogs.filter((l) => {
      if (sev !== "all" && l.severity !== sev) return false;
      if (moduleFilter !== "all" && l.module !== moduleFilter) return false;
      if (needle && !l.detail.toLowerCase().includes(needle) && !l.actor.toLowerCase().includes(needle) && !l.action.toLowerCase().includes(needle))
        return false;
      return true;
    });
  }, [auditLogs, sev, moduleFilter, q]);

  const counts = useMemo(
    () => ({
      all: auditLogs.length,
      info: auditLogs.filter((l) => l.severity === "info").length,
      warning: auditLogs.filter((l) => l.severity === "warning").length,
      critical: auditLogs.filter((l) => l.severity === "critical").length,
    }),
    [auditLogs],
  );

  return (
    <AppShell title="Audit Logs">
      <PageHeader
        title="Audit Logs"
        subtitle="Every sensitive action in the system, tracked automatically."
        actions={
          <>
            <SearchInput value={q} onChange={setQ} placeholder="Search actor, action, detail..." className="w-full sm:w-64" />
            <Select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} className="!w-auto">
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m === "all" ? "All Modules" : m}
                </option>
              ))}
            </Select>
          </>
        }
      />

      <PillTabs
        className="mb-5 w-fit max-w-full"
        tabs={[
          { key: "all", label: "All", count: counts.all },
          { key: "info", label: "Info", count: counts.info },
          { key: "warning", label: "Warning", count: counts.warning },
          { key: "critical", label: "Critical", count: counts.critical },
        ]}
        active={sev}
        onChange={setSev}
      />

      {filtered.length === 0 ? (
        <EmptyState icon={<ScrollText className="w-7 h-7" />} title="No log entries" message="No events match this filter." />
      ) : (
        <div className="bg-white border border-outline-variant rounded-xl overflow-hidden">
          <div className="divide-y divide-outline-variant">
            {filtered.map((l) => (
              <div key={l.id} className={cx("px-4 sm:px-5 py-3.5 flex items-start gap-3.5 hover:bg-surface-container-low transition-colors", l.severity === "critical" && "bg-red-50/40")}>
                <div
                  className={cx(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                    l.severity === "critical" ? "bg-red-600 text-white" : l.severity === "warning" ? "bg-amber-100 text-amber-700" : "bg-surface-container-high text-on-surface-variant",
                  )}
                >
                  {l.severity === "critical" ? (
                    <ShieldAlert className="w-4 h-4" />
                  ) : l.severity === "warning" ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <Info className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-label-md font-bold text-on-surface">{l.action.replace(/_/g, " ")}</span>
                    <Badge tone="indigo">{l.module}</Badge>
                    {l.severity !== "info" && <Badge tone={l.severity === "critical" ? "red" : "amber"}>{l.severity}</Badge>}
                  </div>
                  <p className="text-body-md text-on-surface-variant mt-0.5">{l.detail}</p>
                  <p className="text-label-sm text-outline mt-1">
                    {l.actor} • {timeAgo(l.at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
