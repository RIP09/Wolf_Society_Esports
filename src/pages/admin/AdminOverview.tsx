import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { EmptyState, NeoCard, PageHeader, StatCard, StatusBadge } from "@/components/neo";
import { fmtDay, fmtRelative } from "@/lib/format";
import { btnYellow, cardSm } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import {
  Activity,
  BellRing,
  CalendarClock,
  ClipboardList,
  Eye,
  FlaskConical,
  Gauge,
  Handshake,
  HeartHandshake,
  Inbox,
  KeyRound,
  Link2,
  Megaphone,
  Newspaper,
  Plug,
  Radio,
  Rss,
  Shield,
  ShieldAlert,
  Swords,
  Trophy,
  Users,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const tooltipStyle = {
  borderRadius: 0,
  border: "2px solid #17181a",
  boxShadow: "4px 4px 0 0 #17181a",
  fontSize: 12,
  fontFamily: "Space Mono, monospace",
};

const FEED_STYLES: Record<string, { label: string; cls: string }> = {
  player: { label: "Player", cls: "bg-neo-blue text-white" },
  match: { label: "Match", cls: "bg-neo-orange text-white" },
  announcement: { label: "Broadcast", cls: "bg-neo-yellow text-white" },
  content: { label: "Article", cls: "bg-neo-purple text-white" },
  donation: { label: "Donation", cls: "bg-neo-green text-white" },
  tryout: { label: "Tryout", cls: "bg-neo-blue text-white" },
  inquiry: { label: "Inquiry", cls: "bg-neo-cream text-foreground" },
  security: { label: "Security", cls: "bg-neo-red text-white" },
  notification: { label: "Delivery", cls: "bg-neo-cream text-foreground" },
  access: { label: "Access", cls: "bg-neo-yellow text-white" },
  scrim: { label: "Scrim", cls: "bg-neo-orange text-white" },
};

interface HubTile {
  label: string;
  icon: LucideIcon;
  to: string;
  accent: string;
  value: number;
  sub: string;
}

function LiveSyncBadge() {
  return (
    <span className="flex items-center gap-2 border-2 border-foreground bg-neo-cream px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neo-green opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-neo-green" />
      </span>
      Live sync
    </span>
  );
}

export default function AdminOverview() {
  const data = useQuery(api.stats.getAdminDashboard);
  const securityLogs = useQuery(api.securityLogs.listRecent);
  const integrations = useQuery(api.admin.getIntegrationStatus);
  const notifications = useQuery(api.notify.listRecent);
  const online = useQuery(api.presence.onlineCount);
  const seedDemoData = useMutation(api.seed.seedDemoData);
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);

  const handleSeed = async () => {
    setSeeding(true);
    setSeedError(null);
    try {
      await seedDemoData({});
      toast.success("Demo data seeded — the dashboard now reflects it live.");
    } catch (e) {
      setSeedError(e instanceof Error ? e.message : "Seeding failed.");
      toast.error(e instanceof Error ? e.message : "Seeding failed.");
    } finally {
      setSeeding(false);
    }
  };

  if (!data) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse border-2 border-foreground bg-card" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse border-2 border-foreground bg-card" />
          ))}
        </div>
      </div>
    );
  }

  const { counts, live, feed, entriesPerDay, topPlayers, recentPlayers, recentMatches, recentAnnouncements } = data;
  const chartData = entriesPerDay.map((d) => ({ label: fmtDay(d.day), count: d.count }));
  const kdData = topPlayers.map((p) => ({ ...p, kdLabel: p.kd }));

  const hubTiles: HubTile[] = [
    { label: "Players", icon: Users, to: "/admin/players", accent: "bg-neo-blue", value: live.players.total, sub: `${live.players.active} active · ${live.players.pending} pending` },
    { label: "Teams", icon: Shield, to: "/admin/teams", accent: "bg-neo-yellow", value: live.teams, sub: "rosters on file" },
    { label: "Tournaments", icon: Trophy, to: "/admin/tournaments", accent: "bg-neo-orange", value: live.tournaments.total, sub: `${live.tournaments.live} live · ${live.tournaments.upcoming} upcoming` },
    { label: "Matches", icon: Swords, to: "/admin/matches", accent: "bg-neo-green", value: live.matches.total, sub: `${live.matches.live} live now · ${live.matches.scheduled} scheduled` },
    { label: "Schedule", icon: CalendarClock, to: "/admin/schedule", accent: "bg-neo-purple", value: live.schedule.scrims.confirmed + live.schedule.blocks, sub: `${live.schedule.scrims.total} scrims · ${live.schedule.record.wins}W–${live.schedule.record.losses}L · ${live.schedule.confirmations} confirmations` },
    { label: "Performance", icon: Gauge, to: "/admin/players", accent: "bg-neo-purple", value: live.entries, sub: "entries logged by players" },
    { label: "Announcements", icon: Megaphone, to: "/admin/announcements", accent: "bg-neo-yellow", value: live.announcements.total, sub: `${live.announcements.urgent} urgent` },
    { label: "News articles", icon: Newspaper, to: "/admin/content", accent: "bg-neo-blue", value: live.content.total, sub: `${live.content.published} published · ${live.content.drafts} drafts` },
    { label: "Sponsors", icon: Handshake, to: "/admin/sponsors", accent: "bg-neo-green", value: live.sponsors.total, sub: `${live.sponsors.platinum} platinum · ${live.sponsors.gold} gold` },
    { label: "Inquiries", icon: Inbox, to: "/admin/inquiries", accent: "bg-neo-orange", value: live.inquiries.total, sub: `${live.inquiries.unread} unread` },
    { label: "Donations", icon: HeartHandshake, to: "/admin/donations", accent: "bg-neo-red", value: live.donations.total, sub: `${live.donations.paid} paid · ${live.donations.pending} pending` },
    { label: "Tryouts", icon: ClipboardList, to: "/admin/donations", accent: "bg-neo-blue", value: live.tryouts.total, sub: `${live.tryouts.pending} pending · ${live.tryouts.approved} approved` },
    { label: "Subscribers", icon: Rss, to: "/admin/announcements", accent: "bg-neo-purple", value: live.subscribers.total, sub: `${live.subscribers.active} active alerts` },
    { label: "Access requests", icon: KeyRound, to: "/grant", accent: "bg-neo-yellow", value: live.accessRequests.total, sub: `${live.accessRequests.pending} pending review` },
    { label: "Security log", icon: ShieldAlert, to: "/admin", accent: "bg-neo-red", value: live.security, sub: "blocked attempts" },
    { label: "Pageviews", icon: Eye, to: "/admin/analytics", accent: "bg-neo-purple", value: live.pageviews.total, sub: `${live.pageviews.today} today` },
    { label: "Notification outbox", icon: BellRing, to: "/admin", accent: "bg-neo-cream", value: live.notifications.total, sub: `${live.notifications.sent} sent · ${live.notifications.failed} failed` },
    { label: "Online now", icon: Radio, to: "/admin/automations", accent: "bg-neo-green", value: online?.total ?? 0, sub: "people on the site this moment" },
    { label: "AI automations", icon: Workflow, to: "/admin/automations", accent: "bg-neo-purple", value: notifications?.filter((n) => n.channel === "webhook").length ?? 0, sub: "Huginn fires · manage in Automations" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Wolf Society Esports · The Den"
        title="Society command center"
        description="Every table in the organization database, streamed live — edit anything in any portal and it changes here instantly."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <LiveSyncBadge />
            {counts.teams === 0 ? (
              <Button className={btnYellow} onClick={handleSeed} disabled={seeding}>
                <FlaskConical className="size-4" />
                {seeding ? "Seeding…" : "Load demo data"}
              </Button>
            ) : null}
          </div>
        }
      />

      {seedError ? (
        <p className="border-2 border-foreground bg-neo-red px-4 py-2 text-sm font-bold text-white">
          {seedError}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Players"
          value={counts.players}
          sub={`${counts.activePlayers} active`}
          accent="yellow"
        />
        <StatCard
          label="Pending approvals"
          value={counts.pendingPlayers}
          sub="awaiting review"
          accent={counts.pendingPlayers > 0 ? "orange" : "green"}
        />
        <StatCard label="Teams" value={counts.teams} sub="rosters on file" accent="blue" />
        <StatCard
          label="Tournaments"
          value={counts.tournaments}
          sub={`${counts.matches} matches`}
          accent="green"
        />
      </div>

      {counts.pendingPlayers > 0 ? (
        <Link
          to="/admin/players?status=pending"
          className={`${cardSm} neo-press flex items-center justify-between gap-3 px-5 py-4`}
        >
          <div className="flex items-center gap-3">
            <Users className="size-5" />
            <div>
              <p className="font-bold">
                {counts.pendingPlayers} registration{counts.pendingPlayers > 1 ? "s" : ""} waiting
              </p>
              <p className="text-xs text-muted-foreground">
                Approve or suspend in the players registry.
              </p>
            </div>
          </div>
          <span className="font-mono text-xs font-bold uppercase tracking-wider">Review →</span>
        </Link>
      ) : null}

      {/* ── Live data hub — every data source, realtime ── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-bold">
            <Activity className="size-4" />
            Live data hub
          </h2>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {hubTiles.length} sources · database → portal → public, in realtime
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {hubTiles.map((tile) => (
            <Link
              key={tile.label}
              to={tile.to}
              className={`${cardSm} neo-press flex h-full min-h-[9rem] flex-col justify-between gap-3 p-4 transition-transform hover:-translate-y-0.5`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center border-2 border-foreground text-white",
                      tile.accent,
                    )}
                  >
                    <tile.icon className="size-4" />
                  </span>
                  <span className="truncate font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {tile.label}
                  </span>
                </div>
                <StatusBadge status="live">live</StatusBadge>
              </div>
              <div>
                <p className="text-3xl font-bold leading-none tracking-tight tabular-nums">{tile.value}</p>
                <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{tile.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Unified realtime activity feed ── */}
      <NeoCard className="gap-0 p-0">
        <div className="flex items-center justify-between border-b-2 border-foreground px-5 py-4">
          <h2 className="flex items-center gap-2 font-bold">
            <Activity className="size-4" />
            Live activity feed
          </h2>
          <span className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neo-green opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-neo-green" />
            </span>
            streaming
          </span>
        </div>
        <div className="flex max-h-[30rem] flex-col divide-y-2 divide-foreground/10 overflow-y-auto">
          {feed.length === 0 ? (
            <p className="px-5 py-10 text-sm text-muted-foreground">
              Nothing yet — registrations, matches, donations, tryouts, inquiries, broadcasts and
              security events from every portal will stream in here the moment they happen.
            </p>
          ) : (
            feed.map((item, i) => (
              <div key={`${item.kind}-${i}`} className="flex items-center gap-3 px-5 py-3">
                <span
                  className={cn(
                    "shrink-0 border-2 border-foreground px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider",
                    FEED_STYLES[item.kind]?.cls ?? "bg-neo-cream text-foreground",
                  )}
                >
                  {FEED_STYLES[item.kind]?.label ?? item.kind}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{item.title}</p>
                  <p className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {item.meta}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                  {fmtRelative(item.ts)}
                </span>
              </div>
            ))
          )}
        </div>
      </NeoCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <NeoCard className="gap-0 p-0">
          <div className="flex items-center justify-between border-b-2 border-foreground px-5 py-4">
            <h2 className="font-bold">Performance entries</h2>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              last 14 days
            </span>
          </div>
          <div className="p-4">
            {chartData.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke="#141414" strokeOpacity={0.15} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: "Space Mono, monospace" }} interval={2} tickMargin={4} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fontFamily: "Space Mono, monospace" }} width={36} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area
                    type="stepAfter"
                    dataKey="count"
                    name="entries"
                    stroke="#141414"
                    strokeWidth={2}
                    fill="#ffde00"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                title="No performance data yet"
                description="Players log scrim and match results in The Pack — they'll show up here."
              />
            )}
          </div>
        </NeoCard>

        <NeoCard className="gap-0 p-0">
          <div className="flex items-center justify-between border-b-2 border-foreground px-5 py-4">
            <h2 className="font-bold">Top performers</h2>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              by K/D ratio
            </span>
          </div>
          <div className="p-4">
            {kdData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={kdData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid stroke="#141414" strokeOpacity={0.15} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fontFamily: "Space Mono, monospace" }} />
                  <YAxis
                    type="category"
                    dataKey="gamertag"
                    width={110}
                    tick={{ fontSize: 11, fontFamily: "Space Grotesk, sans-serif", fontWeight: 700 }}
                  />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#eae3d3" }} />
                  <Bar dataKey="kd" name="K/D" fill="#ff6b35" stroke="#141414" strokeWidth={2} radius={0} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                title="No logged matches"
                description="K/D leaderboard will populate once players log performance."
              />
            )}
          </div>
        </NeoCard>
      </div>

      {/* Equal-height recent lists — no layout shift between rows */}
      <div className="grid items-stretch gap-6 lg:grid-cols-3">
        <NeoCard className="flex h-full min-h-[22rem] flex-col gap-0 p-0">
          <div className="border-b-2 border-foreground px-5 py-4">
            <h2 className="font-bold">Recent registrations</h2>
          </div>
          <div className="flex flex-1 flex-col divide-y-2 divide-foreground/10">
            {recentPlayers.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">No players yet.</p>
            ) : (
              recentPlayers.map((p) => (
                <div key={p._id} className="flex items-center justify-between gap-2 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{p.gamertag}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {p.game} · {p.rank ?? "Unranked"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge status={p.status} />
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {fmtRelative(p.joinedAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </NeoCard>

        <NeoCard className="flex h-full min-h-[22rem] flex-col gap-0 p-0">
          <div className="flex items-center justify-between border-b-2 border-foreground px-5 py-4">
            <h2 className="font-bold">Recent matches</h2>
            <Link2 className="size-4" />
          </div>
          <div className="flex flex-1 flex-col divide-y-2 divide-foreground/10">
            {recentMatches.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">No matches scheduled.</p>
            ) : (
              recentMatches.map((m) => (
                <div key={m._id} className="flex items-center justify-between gap-2 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      {m.teamAName} <span className="text-muted-foreground">vs</span> {m.teamBName}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {m.tournamentName ?? "Friendly"} · {fmtRelative(m.scheduledAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {m.status === "completed" ? (
                      <span className="font-mono text-xs font-bold tabular-nums">
                        {m.scoreA ?? 0}–{m.scoreB ?? 0}
                      </span>
                    ) : null}
                    <StatusBadge status={m.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </NeoCard>

        <NeoCard className="flex h-full min-h-[22rem] flex-col gap-0 p-0">
          <div className="flex items-center justify-between border-b-2 border-foreground px-5 py-4">
            <h2 className="font-bold">Latest broadcasts</h2>
            <CalendarClock className="size-4" />
          </div>
          <div className="flex flex-1 flex-col divide-y-2 divide-foreground/10">
            {recentAnnouncements.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">No announcements posted.</p>
            ) : (
              recentAnnouncements.map((a) => (
                <div key={a._id} className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={a.priority} />
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {fmtRelative(a.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-bold leading-snug">{a.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{a.body}</p>
                </div>
              ))
            )}
          </div>
        </NeoCard>
      </div>

      {/* Integrations + delivery outbox */}
      <div className="grid items-stretch gap-6 lg:grid-cols-2">
        <NeoCard className="flex h-full flex-col gap-0 p-0">
          <div className="flex items-center justify-between border-b-2 border-foreground px-5 py-4">
            <h2 className="flex items-center gap-2 font-bold">
              <Plug className="size-4" />
              Connected services
            </h2>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              realtime status
            </span>
          </div>
          {!integrations ? (
            <div className="h-24 animate-pulse" />
          ) : (
            <div className="flex flex-1 flex-col divide-y-2 divide-foreground/10">
              {[
                ["Email (Resend)", integrations.email.configured, integrations.email.keys.join(", ")],
                ["SMS (Vonage)", integrations.sms.configured, integrations.sms.keys.join(", ")],
                ["WhatsApp (Vonage)", integrations.whatsapp.configured, integrations.whatsapp.keys.join(", ")],
                ["Push (VAPID)", integrations.push.configured, integrations.push.keys.join(", ")],
                ["Discord", integrations.discord.configured, integrations.discord.keys.join(", ")],
                ["Payments (Stripe)", integrations.payments.configured, integrations.payments.keys.join(", ")],
                ["AI (Huginn)", integrations.automation.configured, integrations.automation.keys.join(", ")],
                ["Site URL", integrations.siteUrl.configured, integrations.siteUrl.keys.join(", ")],
              ].map(([name, on, keys]) => (
                <div key={String(name)} className="flex items-center justify-between gap-2 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold">{String(name)}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {String(keys)}
                    </p>
                  </div>
                  {on ? (
                    <StatusBadge status="approved">Connected</StatusBadge>
                  ) : (
                    <StatusBadge status="pending">Add key</StatusBadge>
                  )}
                </div>
              ))}
            </div>
          )}
        </NeoCard>

        <NeoCard className="flex h-full flex-col gap-0 p-0">
          <div className="flex items-center justify-between border-b-2 border-foreground px-5 py-4">
            <h2 className="flex items-center gap-2 font-bold">
              <BellRing className="size-4" />
              Notification delivery
            </h2>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              outbox · live
            </span>
          </div>
          {!notifications ? (
            <div className="h-24 animate-pulse" />
          ) : notifications.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">
              Every email, SMS and Discord message the platform sends is recorded here the
              moment it's dispatched.
            </p>
          ) : (
            <div className="flex flex-1 flex-col divide-y-2 divide-foreground/10">
              {notifications.slice(0, 6).map((n) => (
                <div key={n._id} className="flex items-center justify-between gap-2 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{n.subject ?? n.channel}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {n.channel}{n.recipient ? ` · ${n.recipient}` : ""} · {fmtRelative(n.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={n.status === "sent" ? "approved" : n.status === "failed" ? "urgent" : "pending"}>
                    {n.status}
                  </StatusBadge>
                </div>
              ))}
            </div>
          )}
        </NeoCard>
      </div>

      {/* Security alerts */}
      <NeoCard className="gap-0 p-0">
        <div className="flex items-center justify-between border-b-2 border-foreground px-5 py-4">
          <h2 className="flex items-center gap-2 font-bold">
            <ShieldAlert className="size-4" />
            Security — blocked access attempts
          </h2>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            live audit trail
          </span>
        </div>
        {!securityLogs ? (
          <div className="h-24 animate-pulse" />
        ) : securityLogs.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">
            No unauthorized access attempts logged. Every blocked attempt is recorded here
            and emailed to the organization automatically.
          </p>
        ) : (
          <div className="flex flex-col divide-y-2 divide-foreground/10">
            {securityLogs.slice(0, 6).map((log) => (
              <div key={log._id} className="flex items-center justify-between gap-2 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{log.reason}</p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {log.email ?? "Not signed in"} · {fmtRelative(log.createdAt)}
                  </p>
                </div>
                <StatusBadge status="urgent">Blocked</StatusBadge>
              </div>
            ))}
          </div>
        )}
      </NeoCard>

      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Tip — load demo data once to populate the Society with sample rosters, fixtures
        and analytics. Every number on this page is a live database subscription.
      </p>
    </div>
  );
}
