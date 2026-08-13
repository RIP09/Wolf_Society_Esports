import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { EmptyState, NeoCard, PageHeader, StatusBadge } from "@/components/neo";
import { fmtDateTime } from "@/lib/format";
import { btnGhost } from "@/lib/neo";
import { cn } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { CheckCheck, Mail, MessageSquareHeart, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/** Small neobrutal chip for a contact-detail value (category, game, phone…). */
function InfoChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center border-2 border-foreground bg-neo-cream px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider">
      {label}
    </span>
  );
}

export default function AdminInquiries() {
  const messages = useQuery(api.inquiries.list);
  const toggleRead = useMutation(api.inquiries.toggleRead);
  const remove = useMutation(api.inquiries.remove);
  const feedback = useQuery(api.account.listFeedback);
  const markFeedbackRead = useMutation(api.account.markFeedbackRead);
  const [deleting, setDeleting] = useState<Id<"contactMessages"> | null>(null);

  const unread = (messages ?? []).filter((m) => !m.read).length;

  const handleRemove = async (id: Id<"contactMessages">) => {
    setDeleting(id);
    try {
      await remove({ messageId: id });
      toast.success("Inquiry removed.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove inquiry.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="The Den · Inquiries"
        title="Contact inbox"
        description="Every message from the public portal lands here, real time, and is forwarded to the organization mailbox automatically."
        actions={
          <span className="flex items-center gap-2 border-2 border-foreground bg-card px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <Mail className="size-4" />
            {unread} unread
          </span>
        }
      />

      {!messages ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse border-2 border-foreground bg-card" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <EmptyState
          title="No inquiries yet"
          description="Messages from the public contact form appear here the moment they're submitted."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {messages.map((m) => (
            <NeoCard
              key={m._id}
              className={cn("gap-3 p-5", m.read && "opacity-70")}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {!m.read ? (
                    <StatusBadge status="pending">New</StatusBadge>
                  ) : null}
                  <span className="font-bold">{m.name}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {m.email}
                  </span>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {fmtDateTime(m.createdAt)}
                </span>
              </div>
              {(m.category || m.game || m.organization || m.country || m.phone || m.replyPreference) && (
                <div className="flex flex-wrap gap-1.5">
                  {m.category ? <InfoChip label={m.category} /> : null}
                  {m.game ? <InfoChip label={m.game} /> : null}
                  {m.organization ? <InfoChip label={m.organization} /> : null}
                  {m.country ? <InfoChip label={m.country} /> : null}
                  {m.phone ? <InfoChip label={m.phone} /> : null}
                  {m.replyPreference ? <InfoChip label={`Reply: ${m.replyPreference}`} /> : null}
                </div>
              )}
              <p className="text-sm font-bold">{m.subject}</p>
              <p className="text-sm leading-6 text-muted-foreground">{m.message}</p>
              <div className="flex items-center gap-2 border-t-2 border-foreground/20 pt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className={btnGhost}
                  onClick={async () => {
                    await toggleRead({ messageId: m._id });
                    toast.success(m.read ? "Marked as unread." : "Marked as read.");
                  }}
                >
                  <CheckCheck className="size-3.5" />
                  {m.read ? "Mark unread" : "Mark read"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="neo-press rounded-none border-2 border-foreground bg-neo-red text-white shadow-[2px_2px_0_0_var(--neo-ink)] hover:shadow-[3px_3px_0_0_var(--neo-ink)]"
                  onClick={() => handleRemove(m._id)}
                  disabled={deleting === m._id}
                >
                  <Trash2 className="size-3.5" />
                  {deleting === m._id ? "Removing…" : "Delete"}
                </Button>
              </div>
            </NeoCard>
          ))}
        </div>
      )}

      {/* Public feedback — submitted from the Account page */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-bold">
            <MessageSquareHeart className="size-4" />
            Public feedback
          </h2>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {(feedback ?? []).filter((f) => f.status === "new").length} new
          </span>
        </div>
        {feedback === undefined ? (
          <div className="grid gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse border-2 border-foreground bg-card" />
            ))}
          </div>
        ) : feedback.length === 0 ? (
          <EmptyState
            title="No feedback yet"
            description="Feedback submitted by signed-in users from the public Account page appears here."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {feedback.map((f) => (
              <NeoCard key={f._id} className={cn("gap-3 p-5", f.status === "read" && "opacity-70")}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {f.status === "new" ? <StatusBadge status="pending">New</StatusBadge> : null}
                    <span className="font-bold">{f.name || "Anonymous"}</span>
                    {f.email ? (
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {f.email}
                      </span>
                    ) : null}
                    {f.rating ? (
                      <span className="flex items-center gap-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-neo-yellow">
                        {f.rating} <Star className="size-3 fill-current" />
                      </span>
                    ) : null}
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {fmtDateTime(f.createdAt)}
                  </span>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{f.message}</p>
                {f.status === "new" ? (
                  <div className="flex items-center gap-2 border-t-2 border-foreground/20 pt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className={btnGhost}
                      onClick={async () => {
                        await markFeedbackRead({ feedbackId: f._id });
                        toast.success("Marked as read.");
                      }}
                    >
                      <CheckCheck className="size-3.5" />
                      Mark read
                    </Button>
                  </div>
                ) : null}
              </NeoCard>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
