"use client";

import { useMemo, useState } from "react";
import { Archive, MessageSquareText, Reply, Star } from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell/AppShell";
import { useRestro } from "@/lib/store";
import { Badge, Button, Card, EmptyState, Modal, PillTabs, StarRating, Textarea, cx, type BadgeTone } from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import type { Feedback } from "@/lib/types";

type Filter = "all" | "new" | "responded" | "archived";

const CAT_TONE: Record<Feedback["category"], BadgeTone> = {
  food: "amber",
  service: "blue",
  ambience: "purple",
  value: "green",
};

export default function FeedbackPage() {
  const feedback = useRestro((s) => s.feedback);
  const setFeedbackStatus = useRestro((s) => s.setFeedbackStatus);

  const [filter, setFilter] = useState<Filter>("all");
  const [replyTo, setReplyTo] = useState<Feedback | null>(null);
  const [reply, setReply] = useState("");

  const filtered = useMemo(
    () => feedback.filter((f) => filter === "all" || f.status === filter),
    [feedback, filter],
  );

  const stats = useMemo(() => {
    const avg = feedback.length ? feedback.reduce((s, f) => s + f.rating, 0) / feedback.length : 0;
    const dist = [5, 4, 3, 2, 1].map((r) => ({
      rating: r,
      count: feedback.filter((f) => f.rating === r).length,
    }));
    return { avg, dist, total: feedback.length };
  }, [feedback]);

  return (
    <AppShell title="Feedback">
      <PageHeader title="Customer Feedback" subtitle="Reviews and sentiment across all touchpoints." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
        {/* Summary */}
        <Card>
          <div className="text-center mb-5">
            <p className="text-[44px] leading-none font-bold text-on-surface">{stats.avg.toFixed(1)}</p>
            <StarRating rating={Math.round(stats.avg)} className="justify-center mt-2" />
            <p className="text-label-md text-on-surface-variant mt-1">{stats.total} reviews</p>
          </div>
          <div className="space-y-2">
            {stats.dist.map((d) => (
              <div key={d.rating} className="flex items-center gap-3">
                <span className="text-label-md font-semibold w-3">{d.rating}</span>
                <Star className="w-3.5 h-3.5 text-amber-400 fill-current shrink-0" />
                <div className="flex-1 bg-surface-container rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all"
                    style={{ width: `${stats.total ? (d.count / stats.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-label-sm text-on-surface-variant w-6 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Feed */}
        <div className="lg:col-span-2">
          <PillTabs
            className="mb-4 w-fit max-w-full"
            tabs={[
              { key: "all", label: "All", count: feedback.length },
              { key: "new", label: "New", count: feedback.filter((f) => f.status === "new").length },
              { key: "responded", label: "Responded", count: feedback.filter((f) => f.status === "responded").length },
              { key: "archived", label: "Archived", count: feedback.filter((f) => f.status === "archived").length },
            ]}
            active={filter}
            onChange={setFilter}
          />

          {filtered.length === 0 ? (
            <EmptyState icon={<MessageSquareText className="w-7 h-7" />} title="No feedback" message="Nothing in this view." />
          ) : (
            <div className="space-y-3">
              {filtered.map((f) => (
                <div key={f.id} className={cx("bg-white border border-outline-variant rounded-xl p-5 shadow-sm", f.status === "archived" && "opacity-60")}>
                  <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                    <div>
                      <p className="font-bold text-body-md">{f.customerName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StarRating rating={f.rating} />
                        <span className="text-label-sm text-on-surface-variant">{f.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={CAT_TONE[f.category]}>{f.category}</Badge>
                      {f.status === "new" && <Badge tone="red">New</Badge>}
                      {f.status === "responded" && <Badge tone="green">Responded</Badge>}
                    </div>
                  </div>
                  <p className="text-body-md text-on-surface mb-4">“{f.comment}”</p>
                  <div className="flex gap-2">
                    {f.status !== "responded" && (
                      <Button size="sm" variant="secondary" onClick={() => { setReplyTo(f); setReply(""); }}>
                        <Reply className="w-3.5 h-3.5" /> Respond
                      </Button>
                    )}
                    {f.status !== "archived" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setFeedbackStatus(f.id, "archived");
                          toast.info("Feedback archived");
                        }}
                      >
                        <Archive className="w-3.5 h-3.5" /> Archive
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={!!replyTo}
        onClose={() => setReplyTo(null)}
        title={`Respond to ${replyTo?.customerName}`}
        subtitle="Your response is shared with the guest by email."
        footer={
          <>
            <Button variant="secondary" onClick={() => setReplyTo(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!reply.trim()) return toast.error("Write a response first");
                if (replyTo) {
                  setFeedbackStatus(replyTo.id, "responded");
                  toast.success(`Response sent to ${replyTo.customerName}`);
                }
                setReplyTo(null);
              }}
            >
              <Reply className="w-4 h-4" /> Send Response
            </Button>
          </>
        }
      >
        {replyTo && (
          <div className="space-y-4">
            <div className="p-4 bg-surface-container-low rounded-xl">
              <StarRating rating={replyTo.rating} />
              <p className="text-body-md text-on-surface-variant italic mt-2">“{replyTo.comment}”</p>
            </div>
            <Textarea rows={4} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Thank you for dining with us..." />
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
