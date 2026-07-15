"use client";

import { useRef, useState } from "react";
import {
  Bell,
  Database,
  Download,
  Percent,
  RefreshCcw,
  Save,
  Store,
  Timer,
  Upload,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell/AppShell";
import { useRestro } from "@/lib/store";
import { Button, Card, ConfirmDialog, Field, Input, Select, Toggle } from "@/components/ui";
import { toast } from "@/components/ui/Toast";

export default function SettingsPage() {
  const settings = useRestro((s) => s.settings);
  const branches = useRestro((s) => s.branches);
  const updateSettings = useRestro((s) => s.updateSettings);
  const resetDemo = useRestro((s) => s.resetDemo);
  const exportJson = useRestro((s) => s.exportJson);
  const importJson = useRestro((s) => s.importJson);

  const [form, setForm] = useState({
    restaurantName: settings.restaurantName,
    taxRate: settings.taxRate * 100,
    serviceCharge: settings.serviceCharge * 100,
    kdsWarnMinutes: settings.kdsWarnMinutes,
    kdsCriticalMinutes: settings.kdsCriticalMinutes,
    loyaltyEarnRate: settings.loyaltyEarnRate,
    activeBranchId: settings.activeBranchId,
  });
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const save = () => {
    updateSettings({
      restaurantName: form.restaurantName,
      taxRate: form.taxRate / 100,
      serviceCharge: form.serviceCharge / 100,
      kdsWarnMinutes: form.kdsWarnMinutes,
      kdsCriticalMinutes: form.kdsCriticalMinutes,
      loyaltyEarnRate: form.loyaltyEarnRate,
      activeBranchId: form.activeBranchId,
    });
    toast.success("Settings saved");
  };

  const doExport = () => {
    const json = exportJson();
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `restroos-demo-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Demo data exported", "Full snapshot saved as JSON");
  };

  const doImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = importJson(String(reader.result));
      toast[res.ok ? "success" : "error"](res.message);
    };
    reader.readAsText(file);
  };

  return (
    <AppShell title="Settings">
      <PageHeader
        title="Settings"
        subtitle="Restaurant configuration and demo data controls."
        actions={
          <Button onClick={save}>
            <Save className="w-4 h-4" /> Save Changes
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 max-w-5xl">
        {/* General */}
        <Card>
          <h3 className="text-title-lg font-semibold mb-1 flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" /> General
          </h3>
          <p className="text-body-md text-on-surface-variant mb-5">Identity and location defaults.</p>
          <div className="space-y-4">
            <Field label="Restaurant Name">
              <Input value={form.restaurantName} onChange={(e) => setForm({ ...form, restaurantName: e.target.value })} />
            </Field>
            <Field label="Active Branch">
              <Select value={form.activeBranchId} onChange={(e) => setForm({ ...form, activeBranchId: e.target.value })}>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Currency">
              <Select value="USD" onChange={() => toast.info("Demo is fixed to USD")}>
                <option value="USD">USD — US Dollar</option>
              </Select>
            </Field>
          </div>
        </Card>

        {/* Financial */}
        <Card>
          <h3 className="text-title-lg font-semibold mb-1 flex items-center gap-2">
            <Percent className="w-5 h-5 text-primary" /> Financial
          </h3>
          <p className="text-body-md text-on-surface-variant mb-5">Taxes, charges, and loyalty economics.</p>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tax Rate (%)">
                <Input type="number" min={0} max={30} step="0.5" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })} />
              </Field>
              <Field label="Service Charge (%)">
                <Input type="number" min={0} max={20} step="0.5" value={form.serviceCharge} onChange={(e) => setForm({ ...form, serviceCharge: Number(e.target.value) })} />
              </Field>
            </div>
            <Field label="Loyalty Earn Rate" hint="Points earned per $1 spent">
              <Input type="number" min={0} max={10} step="0.5" value={form.loyaltyEarnRate} onChange={(e) => setForm({ ...form, loyaltyEarnRate: Number(e.target.value) })} />
            </Field>
          </div>
        </Card>

        {/* Kitchen */}
        <Card>
          <h3 className="text-title-lg font-semibold mb-1 flex items-center gap-2">
            <Timer className="w-5 h-5 text-primary" /> Kitchen Display
          </h3>
          <p className="text-body-md text-on-surface-variant mb-5">Ticket timing thresholds for the KDS.</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Warning After (min)">
              <Input type="number" min={1} max={60} value={form.kdsWarnMinutes} onChange={(e) => setForm({ ...form, kdsWarnMinutes: Number(e.target.value) })} />
            </Field>
            <Field label="Critical After (min)">
              <Input type="number" min={2} max={90} value={form.kdsCriticalMinutes} onChange={(e) => setForm({ ...form, kdsCriticalMinutes: Number(e.target.value) })} />
            </Field>
          </div>
        </Card>

        {/* Notifications */}
        <Card>
          <h3 className="text-title-lg font-semibold mb-1 flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" /> Notifications
          </h3>
          <p className="text-body-md text-on-surface-variant mb-5">What appears in the top-bar notification center.</p>
          <div className="space-y-4">
            <Toggle
              label="Low stock alerts"
              description="Notify when inventory drops below minimum"
              checked={settings.notifications.lowStock}
              onChange={(v) => updateSettings({ notifications: { ...settings.notifications, lowStock: v } })}
            />
            <Toggle
              label="New order alerts"
              description="Notify when orders await acceptance"
              checked={settings.notifications.newOrders}
              onChange={(v) => updateSettings({ notifications: { ...settings.notifications, newOrders: v } })}
            />
            <Toggle
              label="Reservation alerts"
              description="Notify on pending reservation requests"
              checked={settings.notifications.reservations}
              onChange={(v) => updateSettings({ notifications: { ...settings.notifications, reservations: v } })}
            />
          </div>
        </Card>

        {/* Demo data */}
        <Card className="lg:col-span-2">
          <h3 className="text-title-lg font-semibold mb-1 flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" /> Demo Data
          </h3>
          <p className="text-body-md text-on-surface-variant mb-5">
            All demo data lives in your browser&apos;s localStorage. Export a snapshot, import a previous one, or reset to the original seed.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={doExport}>
              <Download className="w-4 h-4" /> Export Demo Data (JSON)
            </Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload className="w-4 h-4" /> Import Demo Data
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) doImport(f);
                e.target.value = "";
              }}
            />
            <Button variant="danger" onClick={() => setConfirmReset(true)}>
              <RefreshCcw className="w-4 h-4" /> Reset Demo Data
            </Button>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          resetDemo();
          toast.success("Demo data reset", "All modules restored to the original seed");
        }}
        title="Reset all demo data?"
        message="Every change you've made — orders, menu edits, staff records, settings — will be replaced with the original seed data. This cannot be undone."
        confirmLabel="Reset Everything"
        danger
      />
    </AppShell>
  );
}
