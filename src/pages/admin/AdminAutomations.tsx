import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { EmptyState, NeoCard, PageHeader, StatusBadge } from "@/components/neo";
import { fmtRelative } from "@/lib/format";
import { btnYellow } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  BellRing,
  CheckCircle2,
  FlaskConical,
  Globe,
  KeyRound,
  Loader2,
  Mail,
  MessageSquareText,
  Plug,
  Radio,
  ShieldCheck,
  Smartphone,
  Workflow,
  XCircle,
} from "lucide-react";
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
  { event: "tournament.created", label: "Tournament created", description: "A new tournament opens for registration." },
  { event: "tournament.status", label: "Tournament status change", description: "Auto-pilot moves a tournament live / completed." },
  { event: "tournament.bracket", label: "Bracket released", description: "The bracket is generated from approved entries." },
  { event: "security.alert", label: "Security alert", description: "A blocked unauthorized-access attempt." },
];

/** Every integration the platform runs, with pricing honesty + test wiring. */
const TOOLS = [
  {
    id: "email" as const,
    name: "Email delivery",
    provider: "Resend",
    purpose: "OTP codes, contact replies, registration & attendance alerts, broadcasts.",
    keys: ["RESEND_API_KEY"],
    free: "Free tier — 3,000 emails / month, lifetime",
    icon: Mail,
  },
  {
    id: "sms" as const,
    name: "SMS alerts",
    provider: "Vonage",
    purpose: "Org alert + OTP codes + player reminders straight to phones.",
    keys: ["VONAGE_API_KEY", "VONAGE_API_SECRET", "SMS_FROM"],
    free: "Free trial credit, then pay-as-you-go (per message)",
    icon: MessageSquareText,
  },
  {
    id: "whatsapp" as const,
    name: "WhatsApp messages",
    provider: "Vonage",
    purpose: "Contact replies, subscriber alerts and tournament updates on WhatsApp.",
    keys: ["VONAGE_API_KEY", "VONAGE_API_SECRET", "WHATSAPP_FROM"],
    free: "Free trial messages, then pay-as-you-go (per message)",
    icon: Smartphone,
  },
  {
    id: "push" as const,
    name: "Web push notifications",
    provider: "VAPID (browser)",
    purpose: "Instant browser alerts to every opted-in device — no middleman.",
    keys: ["VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "VAPID_SUBJECT", "VITE_VAPID_PUBLIC_KEY"],
    free: "100% free · unlimited · lifetime",
    icon: BellRing,
  },
  {
    id: "discord" as const,
    name: "Discord alerts",
    provider: "Webhook",
    purpose: "Posts registrations, inquiries, reports, absences and broadcasts into your server.",
    keys: ["DISCORD_WEBHOOK_URL"],
    free: "100% free · unlimited",
    icon: Radio,
  },
  {
    id: "automation" as const,
    name: "AI automation",
    provider: "Huginn (self-hosted)",
    purpose: "AI assistant chat + every platform event flowing into your own automation agents.",
    keys: ["HUGINN_WEBHOOK_URL", "HUGINN_CHAT_WEBHOOK_URL", "HUGINN_WEBHOOK_SECRET"],
    free: "100% free · unlimited (open-source, run it yourself)",
    icon: Workflow,
  },
  {
    id: "payments" as const,
    name: "Payments",
    provider: "Stripe",
    purpose: "Donations and paid tryout fees. Optional — the site works without it.",
    keys: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
    free: "Free to enable — small fee per successful payment only",
    icon: ShieldCheck,
  },
  {
    id: "siteUrl" as const,
    name: "Site URL",
    provider: "Vercel",
    purpose: "Public URL used inside every email button and link.",
    keys: ["SITE_URL"],
    free: "100% free · unlimited",
    icon: Globe,
  },
];

export default function AdminAutomations() {
  const status = useQuery(api.automation.automationStatus);
  const integrations = useQuery(api.admin.getIntegrationStatus);
  const testWorkflow = useMutation(api.automation.testWorkflow);
  const testIntegration = useAction(api.notify.testIntegration);
  const testPush = useAction(api.push.testPush);
  const [testing, setTesting] = useState<string | null>(null);

  const runTest = async (id: string) => {
    if (testing) return;
    setTesting(id);
    try {
      if (id === "huginn") {
        await testWorkflow({});
        toast.success("Test event fired — check your Huginn agents in seconds.");
      } else if (id === "push") {
        const res = await testPush();
        if (res.ok) toast.success(res.message);
        else toast.error(res.message);
      } else {
        const res = await testIntegration({ tool: id as "email" | "sms" | "whatsapp" | "discord" });
        if (res.ok) toast.success(res.message);
        else toast.error(res.message);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Test failed — try again.");
    } finally {
      setTesting(null);
    }
  };

  const recent = status?.recent ?? [];
  const recentEvents = new Set(recent.map((r) => r.subject));

  type ToolId = "email" | "sms" | "whatsapp" | "push" | "discord" | "automation" | "payments" | "siteUrl";
  const configOf = (id: ToolId) => integrations?.[id];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="The Den · Automations"
        title="Automation & integrations center"
        description="Every tool that keeps the platform running — live connection status, the free/unlimited pricing truth for each one, and one-click tests so you always know what's working. Huginn (self-hosted) and web push are 100% free & unlimited; the rest use generous free tiers."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-2 border-2 border-foreground bg-card px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <Radio className="size-4" />
              {status === undefined ? "checking…" : status.configured ? "Huginn connected" : "Huginn setup pending"}
            </span>
            <Button className={btnYellow} onClick={() => runTest("huginn")} disabled={testing !== null}>
              <FlaskConical className="size-4" />
              {testing === "huginn" ? "Firing…" : "Send test event"}
            </Button>
          </div>
        }
      />

      {/* ── Free integrations center ─────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-bold">
            <Plug className="size-4" />
            Free integrations center
          </h2>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            live status · test each one
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => {
            const cfg = configOf(tool.id);
            const on = cfg?.configured ?? false;
            const Icon = tool.icon;
            return (
              <NeoCard key={tool.id} className="flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-foreground bg-neo-cream">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{tool.name}</p>
                      <p className="truncate font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                        {tool.provider}
                      </p>
                    </div>
                  </div>
                  {on ? (
                    <StatusBadge status="approved">
                      <CheckCircle2 className="size-3" /> Connected
                    </StatusBadge>
                  ) : (
                    <StatusBadge status="pending">
                      <XCircle className="size-3" /> Add key
                    </StatusBadge>
                  )}
                </div>
                <p className="text-xs leading-5 text-muted-foreground">{tool.purpose}</p>
                <p className="flex items-start gap-1.5 border-2 border-foreground bg-neo-cream px-2.5 py-1.5 font-mono text-[9px] font-bold uppercase tracking-wider text-foreground">
                  <span className={tool.free.startsWith("100%") ? "text-neo-green" : ""}>◆</span>
                  <span className="leading-4">{tool.free}</span>
                </p>
                <p className="break-all font-mono text-[9px] text-muted-foreground/80">
                  Keys: {tool.keys.join(", ")}
                </p>
                <div className="mt-auto flex items-center gap-2 border-t-2 border-foreground/20 pt-3">
                  <Button
                    size="sm"
                    className={cn(
                      "neo-press rounded-none border-2 border-foreground shadow-[2px_2px_0_0_var(--neo-ink)] hover:shadow-[3px_3px_0_0_var(--neo-ink)]",
                      tool.id === "push" || tool.id === "discord" || tool.id === "automation"
                        ? "bg-neo-green text-white"
                        : "bg-neo-yellow text-white",
                    )}
                    disabled={testing !== null}
                    onClick={() => runTest(tool.id === "automation" ? "huginn" : tool.id)}
                  >
                    {testing === (tool.id === "automation" ? "huginn" : tool.id) ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <FlaskConical className="size-3.5" />
                    )}
                    {testing === (tool.id === "automation" ? "huginn" : tool.id) ? "Testing…" : "Test"}
                  </Button>
                  {!on ? (
                    <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                      paste keys in the Keys tab
                    </span>
                  ) : null}
                </div>
              </NeoCard>
            );
          })}
        </div>
      </section>

      {/* Huginn connection detail */}
      <NeoCard className="gap-4 p-5">
        <div className="flex items-center gap-2">
          <Plug className="size-5" />
          <h2 className="font-bold">Huginn connection</h2>
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
                No Huginn webhook configured yet — the platform still works (email, SMS, WhatsApp, Discord all run natively), but automation events are skipped and recorded here.
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
