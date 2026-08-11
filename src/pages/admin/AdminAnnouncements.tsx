import { api } from "@/convex/_generated/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, NeoCard, PageHeader, StatusBadge } from "@/components/neo";
import { PRIORITIES } from "@/lib/constants";
import { fmtDateTime } from "@/lib/format";
import { btnYellow, input, label, select } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { BellRing, Megaphone, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

export default function AdminAnnouncements() {
  const announcements = useQuery(api.announcements.list);
  const create = useMutation(api.announcements.create);
  const remove = useMutation(api.announcements.remove);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<string>("info");
  const [notify, setNotify] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: Id<"announcements">; title: string } | null>(null);

  const handlePost = async () => {
    setPosting(true);
    setError(null);
    try {
      await create({
        title,
        body,
        priority: priority as "info" | "important" | "urgent",
        notifySubscribers: notify,
      });
      setTitle("");
      setBody("");
      setPriority("info");
      setNotify(true);
      toast.success(
        notify
          ? "Announcement live — public subscribers alerted by email & SMS."
          : "Announcement live on the public portal and in The Pack.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Posting failed.");
      toast.error("Could not post the announcement.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="The Den · Broadcasts"
        title="Announcements"
        description="Push schedule changes, roster locks and urgent notices straight into The Pack."
      />

      <NeoCard className="gap-4 p-6">
        <div className="flex items-center gap-2">
          <Megaphone className="size-5" />
          <h2 className="font-bold">New announcement</h2>
        </div>
        {error ? (
          <p className="border-2 border-foreground bg-neo-red px-3 py-2 text-xs font-bold text-white">
            {error}
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-1.5">
            <span className={label}>Title</span>
            <Input
              className={input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Roster lock for Pulse Invitational"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className={label}>Priority</span>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className={cn(select, "w-40")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none border-2 border-foreground">
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    <StatusBadge status={p} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className={label}>Body</span>
          <Textarea
            className="rounded-none border-2 border-foreground bg-background"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Details players need to know…"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-3 border-2 border-foreground bg-neo-cream px-4 py-3">
          <input
            type="checkbox"
            checked={notify}
            onChange={(e) => setNotify(e.target.checked)}
            className="size-4 accent-[var(--neo-ink)]"
          />
          <span className="flex items-center gap-2 text-sm font-bold">
            <BellRing className="size-4" />
            Alert public subscribers by email &amp; SMS
          </span>
          <span className="ml-auto hidden text-xs text-muted-foreground sm:block">
            Everyone signed up through the website gets notified automatically
          </span>
        </label>
        <div className="flex justify-end">
          <Button className={btnYellow} onClick={handlePost} disabled={posting || !title.trim() || !body.trim()}>
            <Send className="size-4" />
            {posting ? "Posting…" : "Broadcast"}
          </Button>
        </div>
      </NeoCard>

      {!announcements ? (
        <div className="grid gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse border-2 border-foreground bg-card" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <EmptyState title="Nothing broadcast yet" description="Your announcements will appear here and in the player app." />
      ) : (
        <div className="flex flex-col gap-3">
          {announcements.map((a) => (
            <NeoCard key={a._id} className="gap-2 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <StatusBadge status={a.priority} />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {fmtDateTime(a.createdAt)}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="neo-press rounded-none border-2 border-foreground bg-neo-red text-white shadow-[2px_2px_0_0_var(--neo-ink)] hover:shadow-[3px_3px_0_0_var(--neo-ink)]"
                  onClick={() => setDeleteTarget({ id: a._id, title: a.title })}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
              <p className="text-base font-bold leading-snug">{a.title}</p>
              <p className="text-sm leading-6 text-muted-foreground">{a.body}</p>
            </NeoCard>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-none border-2 border-foreground bg-card shadow-[6px_6px_0_0_var(--neo-ink)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Delete announcement?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              “{deleteTarget?.title}” will be removed from both apps.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none border-2 border-foreground bg-card shadow-[2px_2px_0_0_var(--neo-ink)]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="neo-press rounded-none border-2 border-foreground bg-neo-red text-white shadow-[3px_3px_0_0_var(--neo-ink)] hover:shadow-[4px_4px_0_0_var(--neo-ink)]"
              onClick={async () => {
                if (deleteTarget) await remove({ announcementId: deleteTarget.id });
                setDeleteTarget(null);
              }}
            >
              <Trash2 className="size-4" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
