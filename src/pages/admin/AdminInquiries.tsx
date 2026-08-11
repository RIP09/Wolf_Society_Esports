import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { EmptyState, NeoCard, PageHeader, StatusBadge } from "@/components/neo";
import { fmtDateTime } from "@/lib/format";
import { btnGhost } from "@/lib/neo";
import { cn } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { CheckCheck, Mail, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminInquiries() {
  const messages = useQuery(api.inquiries.list);
  const toggleRead = useMutation(api.inquiries.toggleRead);
  const remove = useMutation(api.inquiries.remove);
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
    </div>
  );
}
