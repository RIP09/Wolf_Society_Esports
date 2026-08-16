import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, NeoCard, PageHeader, StatCard, StatusBadge } from "@/components/neo";
import { fmtDateTime } from "@/lib/format";
import { btnYellow, chip, input, label } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { useAction, useQuery } from "convex/react";
import { BellRing, Mail, Megaphone, MessageSquareText, Send, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const CHANNELS = [
  {
    key: "push",
    label: "Push notification",
    hint: "Instant browser alert to every opted-in device — free & unlimited",
    icon: BellRing,
  },
  {
    key: "email",
    label: "Email",
    hint: "Sent to every active alert subscriber's inbox",
    icon: Mail,
  },
  {
    key: "sms",
    label: "SMS",
    hint: "Texted to every subscriber with a contact number on file",
    icon: MessageSquareText,
  },
] as const;

export default function AdminBroadcast() {
  const stats = useQuery(api.broadcast.getBroadcastStats);
  const history = useQuery(api.broadcast.listBroadcasts);
  const broadcast = useAction(api.push.adminBroadcast);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [channels, setChannels] = useState<Set<string>>(new Set(["push"]));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ pushSent: number; emailSent: number; smsSent: number } | null>(null);

  const toggleChannel = (key: string) => {
    setChannels((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSend = async () => {
    setError(null);
    setResult(null);
    if (!title.trim()) {
      setError("Give the broadcast a short title (shows in the notification header).");
      return;
    }
    if (!body.trim()) {
      setError("Write the message body — this is what subscribers actually read.");
      return;
    }
    if (channels.size === 0) {
      setError("Pick at least one channel (Push, Email or SMS).");
      return;
    }
    setSending(true);
    try {
      const res = await broadcast({
        title: title.trim(),
        body: body.trim(),
        url: url.trim() || undefined,
        channels: [...channels] as ("push" | "email" | "sms")[],
      });
      if (!res.ok) {
        setError(res.error ?? "Broadcast failed.");
        return;
      }
      setResult({
        pushSent: res.pushSent ?? 0,
        emailSent: res.emailSent ?? 0,
        smsSent: res.smsSent ?? 0,
      });
      toast.success("Broadcast sent — subscribers are being notified now.");
      setTitle("");
      setBody("");
      setUrl("");
      setChannels(new Set(["push"]));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Broadcast failed — try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="The Den · Broadcast Center"
        title="Notify the whole community"
        description="One click reaches every player, fan and subscriber — instant browser push (free & unlimited), email and SMS. Every send is logged here in real time."
        actions={
          <span className="inline-flex items-center gap-2 rounded-none border-2 border-foreground bg-neo-yellow px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider">
            <Zap className="h-3.5 w-3.5" /> 100% free · no limits
          </span>
        }
      />

      {/* Audience stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Push devices"
          value={stats === undefined ? "…" : stats.pushDevices}
          sub={
            stats === undefined
              ? "loading…"
              : stats.pushConfigured
                ? "VAPID keys connected — devices get instant alerts"
                : "Add VAPID keys in Settings to enable push"
          }
          accent="yellow"
        />
        <StatCard
          label="Email subscribers"
          value={stats === undefined ? "…" : stats.emailSubscribers}
          sub={
            stats === undefined
              ? "loading…"
              : stats.emailConfigured
                ? "Resend connected — emails deliver instantly"
                : "Add RESEND_API_KEY in Settings to enable email"
          }
          accent="blue"
        />
        <StatCard
          label="SMS subscribers"
          value={stats === undefined ? "…" : stats.smsSubscribers}
          sub={
            stats === undefined
              ? "loading…"
              : stats.smsConfigured
                ? "Vonage connected — texts deliver instantly"
                : "Add VONAGE keys in Settings to enable SMS"
          }
          accent="green"
        />
      </div>

      {/* Composer */}
      <NeoCard className="gap-4">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          <h2 className="text-lg font-bold tracking-tight">New broadcast</h2>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={label}>Title *</span>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. New update live — Season 3 tryouts open"
            maxLength={140}
            className={input}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={label}>Message *</span>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What should everyone know? Announcements, match results, schedule changes, urgent news…"
            rows={5}
            maxLength={2000}
            className={cn(input, "resize-none")}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={label}>Link (optional)</span>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://wolfsocietygg.vercel.app/news — defaults to the news page"
            className={input}
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className={label}>Channels</span>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {CHANNELS.map((c) => {
              const active = channels.has(c.key);
              const Icon = c.icon;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => toggleChannel(c.key)}
                  className={cn(
                    "flex flex-col items-start gap-1 border-2 border-foreground p-3 text-left transition-transform",
                    active
                      ? "bg-neo-yellow shadow-[3px_3px_0_0_var(--neo-ink)]"
                      : "bg-card hover:bg-neo-cream",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-bold">{c.label}</span>
                  </span>
                  <span className="text-[11px] leading-snug text-muted-foreground">{c.hint}</span>
                </button>
              );
            })}
          </div>
        </div>

        {error ? (
          <p className="rounded-none border-2 border-foreground bg-neo-red/10 px-3 py-2 text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : null}

        {result ? (
          <div className="flex flex-col gap-1 rounded-none border-2 border-foreground bg-neo-green/10 px-3 py-3 text-sm">
            <p className="font-bold text-green-800">✅ Broadcast delivered</p>
            <p className="text-muted-foreground">
              {result.pushSent} push devices · {result.emailSent} emails · {result.smsSent} SMS
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleSend} disabled={sending} className={cn(btnYellow, "gap-2")}>
            {sending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {sending ? "Broadcasting…" : "Send to everyone"}
          </Button>
          <span className="text-xs text-muted-foreground">
            Reaches every subscriber who accepted notification permission or subscribed with email / contact number.
          </span>
        </div>
      </NeoCard>

      {/* History */}
      <div className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <Zap className="h-4 w-4" /> Broadcast history
        </h2>

        {history === undefined ? (
          <NeoCard>Loading history…</NeoCard>
        ) : history.length === 0 ? (
          <EmptyState
            title="No broadcasts yet"
            description="The first message you send will show up here with live delivery counts."
          />
        ) : (
          history.map((b) => (
            <NeoCard key={b._id} className="gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">{b.title}</p>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {fmtDateTime(b.createdAt)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{b.body}</p>
              <div className="flex flex-wrap items-center gap-2">
                {b.channels.includes("push") ? (
                  <StatusBadge status="present">Push {b.pushSent}</StatusBadge>
                ) : null}
                {b.channels.includes("email") ? (
                  <StatusBadge status="important">Email {b.emailSent}</StatusBadge>
                ) : null}
                {b.channels.includes("sms") ? (
                  <StatusBadge status="live">SMS {b.smsSent}</StatusBadge>
                ) : null}
                <span className={cn(chip, "ml-auto border-2 border-foreground px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider")}>
                  {b.channels.join(" + ")}
                </span>
              </div>
            </NeoCard>
          ))
        )}
      </div>
    </div>
  );
}
