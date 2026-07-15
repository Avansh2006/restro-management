"use client";

import { useMemo, useState } from "react";
import { Gift, Minus, Plus, Star, Trophy } from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell/AppShell";
import { useRestro, money } from "@/lib/store";
import { Avatar, Badge, Button, Card, Drawer, Field, Input, Select, cx, type BadgeTone } from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import type { LoyaltyTier } from "@/lib/types";

const TIERS: Array<{ tier: LoyaltyTier; min: number; perks: string[]; color: string; tone: BadgeTone }> = [
  { tier: "Bronze", min: 0, perks: ["1 pt per $1 spent", "Birthday dessert"], color: "#b45309", tone: "amber" },
  { tier: "Silver", min: 400, perks: ["Everything in Bronze", "Priority waitlist", "Free coffee refills"], color: "#64748b", tone: "slate" },
  { tier: "Gold", min: 1200, perks: ["Everything in Silver", "5% off dine-in", "Chef's table invitations"], color: "#d97706", tone: "amber" },
  { tier: "Platinum", min: 3000, perks: ["Everything in Gold", "10% off all orders", "Dedicated reservations line", "Annual tasting dinner"], color: "#7c3aed", tone: "purple" },
];

const REWARDS = [
  { name: "Free Dessert", points: 250, icon: "🍰" },
  { name: "Free Appetizer", points: 400, icon: "🥗" },
  { name: "$10 Off Voucher", points: 1000, icon: "🎟" },
  { name: "Free Main Course", points: 2200, icon: "🍔" },
  { name: "Chef's Tasting for Two", points: 5000, icon: "👨‍🍳" },
];

export default function LoyaltyPage() {
  const customers = useRestro((s) => s.customers);
  const settings = useRestro((s) => s.settings);
  const adjustLoyaltyPoints = useRestro((s) => s.adjustLoyaltyPoints);

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjCustomer, setAdjCustomer] = useState("");
  const [adjPoints, setAdjPoints] = useState("");
  const [adjReason, setAdjReason] = useState("Goodwill bonus");

  const stats = useMemo(() => {
    const totalPoints = customers.reduce((s, c) => s + c.loyaltyPoints, 0);
    const liability = totalPoints * settings.loyaltyRedeemValue;
    return { totalPoints, liability, members: customers.length };
  }, [customers, settings.loyaltyRedeemValue]);

  const top = useMemo(() => [...customers].sort((a, b) => b.loyaltyPoints - a.loyaltyPoints).slice(0, 8), [customers]);

  const redeem = (reward: (typeof REWARDS)[0]) => {
    const eligible = customers.filter((c) => c.loyaltyPoints >= reward.points);
    if (!eligible.length) return toast.warning("No members have enough points for this reward");
    const c = eligible[0];
    adjustLoyaltyPoints(c.id, -reward.points, `Redeemed: ${reward.name}`);
    toast.success(`${c.name} redeemed ${reward.name}`, `-${reward.points.toLocaleString()} points`);
  };

  return (
    <AppShell title="Loyalty">
      <PageHeader
        title="Loyalty Program"
        subtitle={`Members earn ${settings.loyaltyEarnRate} point per $1 · each point is worth ${money(settings.loyaltyRedeemValue)}.`}
        actions={
          <Button onClick={() => setAdjustOpen(true)}>
            <Star className="w-4 h-4" /> Adjust Points
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <p className="text-headline-lg font-bold">{stats.totalPoints.toLocaleString()}</p>
            <p className="text-label-md text-on-surface-variant font-semibold">Points in circulation</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <p className="text-headline-lg font-bold">{money(stats.liability)}</p>
            <p className="text-label-md text-on-surface-variant font-semibold">Redemption liability</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-tertiary-fixed flex items-center justify-center text-tertiary">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-headline-lg font-bold">{stats.members}</p>
            <p className="text-label-md text-on-surface-variant font-semibold">Enrolled members</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
        {/* Tiers */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-title-lg font-semibold">Membership Tiers</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TIERS.map((t) => {
              const count = customers.filter((c) => c.tier === t.tier).length;
              return (
                <div key={t.tier} className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: t.color }} />
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-title-lg font-bold" style={{ color: t.color }}>
                      {t.tier}
                    </h4>
                    <Badge tone={t.tone}>{count} members</Badge>
                  </div>
                  <p className="text-label-md text-on-surface-variant font-semibold mb-3">
                    {t.min === 0 ? "Starting tier" : `${t.min.toLocaleString()}+ points`}
                  </p>
                  <ul className="space-y-1.5">
                    {t.perks.map((p, i) => (
                      <li key={i} className="text-body-md text-on-surface flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <h3 className="text-title-lg font-semibold pt-2">Reward Catalog</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
            {REWARDS.map((r) => (
              <button
                key={r.name}
                onClick={() => redeem(r)}
                className="bg-white border border-outline-variant rounded-xl p-4 text-center hover:border-primary hover:shadow-md transition-all active:scale-95"
              >
                <span className="text-3xl block mb-2">{r.icon}</span>
                <p className="text-label-md font-bold text-on-surface leading-tight">{r.name}</p>
                <p className="text-label-sm text-primary font-bold mt-1.5 flex items-center justify-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> {r.points.toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <Card padded={false}>
          <div className="p-5 border-b border-outline-variant">
            <h3 className="text-title-lg font-semibold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" /> Top Members
            </h3>
          </div>
          <div className="divide-y divide-outline-variant">
            {top.map((c, i) => (
              <div key={c.id} className="px-5 py-3 flex items-center gap-3">
                <span className={cx("w-6 text-center font-bold text-title-lg", i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-700" : "text-outline")}>
                  {i + 1}
                </span>
                <Avatar name={c.name} size="sm" color={TIERS.find((t) => t.tier === c.tier)?.color} />
                <div className="flex-1 min-w-0">
                  <p className="text-body-md font-semibold truncate">{c.name}</p>
                  <p className="text-label-sm text-on-surface-variant">{c.tier}</p>
                </div>
                <span className="text-label-md font-bold text-primary flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> {c.loyaltyPoints.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Adjust points drawer */}
      <Drawer
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        title="Adjust Loyalty Points"
        width="w-full sm:w-[400px]"
        footer={
          <>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                const pts = Math.abs(parseInt(adjPoints) || 0);
                if (!pts || !adjCustomer) return toast.error("Pick a member and enter points");
                adjustLoyaltyPoints(adjCustomer, -pts, adjReason);
                toast.warning(`Removed ${pts} points`);
                setAdjustOpen(false);
                setAdjPoints("");
              }}
            >
              <Minus className="w-4 h-4" /> Deduct
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                const pts = Math.abs(parseInt(adjPoints) || 0);
                if (!pts || !adjCustomer) return toast.error("Pick a member and enter points");
                adjustLoyaltyPoints(adjCustomer, pts, adjReason);
                toast.success(`Added ${pts} points`);
                setAdjustOpen(false);
                setAdjPoints("");
              }}
            >
              <Plus className="w-4 h-4" /> Award
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Member">
            <Select value={adjCustomer} onChange={(e) => setAdjCustomer(e.target.value)}>
              <option value="">Select member...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.loyaltyPoints.toLocaleString()} pts
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Points">
            <Input type="number" min={0} value={adjPoints} onChange={(e) => setAdjPoints(e.target.value)} placeholder="0" />
          </Field>
          <Field label="Reason">
            <Select value={adjReason} onChange={(e) => setAdjReason(e.target.value)}>
              <option>Goodwill bonus</option>
              <option>Service recovery</option>
              <option>Promotion</option>
              <option>Reward redemption</option>
              <option>Correction</option>
            </Select>
          </Field>
        </div>
      </Drawer>
    </AppShell>
  );
}
