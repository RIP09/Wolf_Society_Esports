import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { EmptyState, NeoCard, PageHeader, StatusBadge } from "@/components/neo";
import { fmtRelative } from "@/lib/format";
import { btnYellow } from "@/lib/neo";
import { useMutation, useQuery } from "convex/react";
import { BellRing, FlaskConical, KeyRound, Plug, Radio, Workflow } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface EventDef {
  event: string;
  label: string;
  description: string;
}

const EVENTS: EventDef[] = [
  { event: "contact", label: "Contact form", description: "A visitor submits the public contact form." },
  { event: "subscribe", label: "Alert subscriber", description: "A visitor signs up for SMS + email alerts." },
  { event: "player.registered", label: "Player registration", description: "A new player registers through The Pack." },
  { event: "tryout.registered", label: "Tryout registration", description: "A tryout signup lands (free or paid)." },
  { event: "donation.paid", label: "Donation paid", description: "A Stripe donation is confirmed." },
  { event: "announcement.published", label: "Announcement published", description: "The Den publishes a new announcement." },
  { event: "security.alert", label: "Security alert", description: "A blocked unauthorized-access attempt." },
];

export default function AdminAutomations() {
  const status = useQuery(api.automation.automationStatus);
  const testWorkflow = useMutation(api.automation.testWorkflow);
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    try {
      await testWorkflow({});
      toast.success("Test event fired — check your Huginn agents for the new event in seconds.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not fire the test event.");
    } finally {
      setTesting(false);
    }
  };

  const recent = status?.recent ?? [];
  const recentEvents = new Set(recent.map((r) => r.subject));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="The Den · Automations"
        title="Huginn AI automation hub"
        description="Every key platform event fires a real webhook into your Huginn agents — AI replies, CRM logging, Discord/Slack/Telegram, spreadsheets, anything Huginn can do. Delivery status streams here live."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-2 border-2 border-foreground bg-card px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <Radio className="size-4" />
              {status === undefined ? "checking…" : status.configured ? "connected" : "setup pending"}
            </span>
            <Button className={btnYellow} onClick={handleTest} disabled={testing}>
              <FlaskConical className="size-4" />
              {testing ? "Firing…" : "Send test event"}
            </Button>
          </div>
        }
      />

      {/* Connection status */}
      <NeoCard className="gap-4 p-5">
        <div className="flex items-center gap-2">
          <Plug className="size-5" />
          <h2 className="font-bold">Connection</h2>
        </div>
        {status === undefined ? (
          <div className="h-16 animate-pulse" />
        ) : status.configured ? (
          <div className="flex flex-col gap-2 text-sm">
            <p className="flex items-center gap-2">
              <StatusBadge status="approved">Live</StatusBadge>
              <span>
                Webhook active — events are flowing to your Huginn instance.
                {status.chat ? " The AI assistant chat workflow is connected too." : ""}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Recent fires appear below. Every delivery is also recorded in the notification outbox.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm">
              <StatusBadge status="pending">Setup needed</StatusBadge>
              <span className="ml-2">
                No Huginn webhook configured yet — the platform still works (email, SMS, Discord, Stripe all run natively), but automation events are skipped and recorded here.
              </span>
            </p>
            <div className="border-2 border-foreground bg-neo-cream p-4">
              <p className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest">
                <KeyRound className="size-3.5" />
                Keys to add in the Keys tab
              </p>
              <ul className="mt-2 grid gap-1 font-mono text-xs sm:grid-cols-2">
                {status.keys.map((k) => (
                  <li key={k} className="truncate">
                    {k}
                  </li>
                ))}
              </ul>
              <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs leading-5 text-muted-foreground">
                <li>Run Huginn for free — huginn.sh (open-source, self-hosted Docker image; no license cost).</li>
                <li>Import the included scenario (<span className="font-mono">huginn/wolf-society-scenario.json</span> in this repo) via Scenarios → Add a Scenario → Import.</li>
                <li>Copy the Events Webhook Agent URL (…/users/1/web_requests/&lt;id&gt;/&lt;secret&gt;) into <span className="font-mono">HUGINN_WEBHOOK_URL</span>.</li>
                <li>Optional: point the AI assistant at the chat Webhook Agent with <span className="font-mono">HUGINN_CHAT_WEBHOOK_URL</span>.</li>
                <li>Hit “Send test event” — a new event appears in Huginn and here in seconds.</li>
              </ol>
            </div>
          </div>
        )}
      </NeoCard>

      {/* Event triggers */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-bold">
            <Workflow className="size-4" />
            Event triggers
          </h2>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {EVENTS.length} events · fired automatically
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EVENTS.map((ev) => {
            const fired = recentEvents.has(ev.event);
            return (
              <NeoCard key={ev.event} className="gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {ev.event}
                  </p>
                  <StatusBadge status={fired ? "approved" : "pending"}>
                    {fired ? "fired" : "armed"}
                  </StatusBadge>
                </div>
                <p className="text-sm font-bold">{ev.label}</p>
                <p className="text-xs leading-5 text-muted-foreground">{ev.description}</p>
              </NeoCard>
            );
          })}
        </div>
      </section>

      {/* Recent webhook runs */}
      <NeoCard className="gap-0 p-0">
        <div className="flex items-center justify-between border-b-2 border-foreground px-5 py-4">
          <h2 className="flex items-center gap-2 font-bold">
            <BellRing className="size-4" />
            Recent automation fires
          </h2>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Huginn delivery outbox · live
          </span>
        </div>
        {status === undefined ? (
          <div className="h-24 animate-pulse" />
        ) : recent.length === 0 ? (
          <EmptyState
            title="No automation fires yet"
            description="The moment an event fires — or is skipped because Huginn isn't connected — it shows up here."
          />
        ) : (
          <div className="flex flex-col divide-y-2 divide-foreground/10">
            {recent.slice(0, 10).map((r) => (
              <div key={r._id} className="flex items-center justify-between gap-2 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{r.subject}</p>
                  <p className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    webhook{r.error ? ` · ${r.error}` : ""} · {fmtRelative(r.createdAt)}
                  </p>
                </div>
                <StatusBadge
                  status={r.status === "sent" ? "approved" : r.status === "failed" ? "urgent" : "pending"}
                >
                  {r.status}
                </StatusBadge>
              </div>
            ))}
          </div>
        )}
      </NeoCard>
    </div>
  );
}
