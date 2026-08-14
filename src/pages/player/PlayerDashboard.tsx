import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/Loading";
import { EmptyState, NeoCard, PageHeader, StatCard, StatusBadge } from "@/components/neo";
import { fmtDateTime, fmtKd } from "@/lib/format";
import { btnGhost, btnYellow } from "@/lib/neo";
import { useQuery } from "convex/react";
import { CalendarCheck, CalendarClock, CheckCircle2, Clock, Crown, Megaphone, Plus, Swords, XCircle } from "lucide-react";
import { Link, Navigate } from "react-router";
import {
  CartesianGrid,
  Line,
  LineChart,
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

export default function PlayerDashboard() {
  const data = useQuery(api.stats.getMyDashboard);
  const attendance = useQuery(api.attendance.myStatus);

  if (!data || !attendance) return <LoadingScreen label="Loading dashboard…" />;
  if (!data.profile) return <Navigate to="/player/register" replace />;

  const { profile, team, stats, recentEntries, kdTrend, upcomingMatches, announcements } = data;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Wolf Society Esports · The Pack"
        title={`Welcome back, ${profile.gamertag}`}
        description={`${profile.game} · ${profile.inGameRole ?? "Flex"} · ${profile.region ?? "Worldwide"} · ${profile.rank ?? "Unranked"}`}
        actions={
          <Link to="/player/profile">
            <Button variant="outline" className={btnGhost}>
              <Swords className="size-4" />
              {team ? `On ${team.team.name}` : "Free agent"}
            </Button>
          </Link>
        }
      />

      {profile.badges && profile.badges.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {profile.badges.map((b) => (
            <span
              key={b}
              className="border-2 border-foreground bg-neo-yellow px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-white shadow-[2px_2px_0_0_var(--neo-ink)]"
            >
              {b}
            </span>
          ))}
        </div>
      ) : null}

      <NeoCard className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center border-2 border-foreground text-white ${
              attendance.today && attendance.today.status !== "absent"
                ? "bg-neo-green"
                : attendance.today?.status === "absent"
                  ? "bg-neo-red"
                  : "bg-neo-blue"
            }`}
          >
            {attendance.today && attendance.today.status !== "absent" ? (
              <CheckCircle2 className="size-5" />
            ) : attendance.today?.status === "absent" ? (
              <XCircle className="size-5" />
            ) : (
              <Clock className="size-5" />
            )}
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Today's attendance
            </p>
            <p className="font-bold">
              {attendance.today
                ? `Checked in — ${attendance.today.status} · ${attendance.today.type}`
                : "Not checked in yet today"}
            </p>
            <p className="text-xs text-muted-foreground">
              {attendance.streaks.currentStreak > 0
                ? `${attendance.streaks.currentStreak}-day streak · ${attendance.streaks.bestStreak}-day best`
                : "No active streak — check in to start one"}
            </p>
          </div>
        </div>
        <Link to="/player/attendance">
          <Button className={btnYellow}>
            <CalendarCheck className="size-4" />
            {attendance.today && attendance.today.status !== "absent" ? "Update check-in" : "Check in now"}
          </Button>
        </Link>
      </NeoCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Win rate" value={`${stats.winRate}%`} sub={`${stats.wins}W · ${stats.losses}L · ${stats.draws}D`} accent="green" />
        <StatCard label="K/D ratio" value={stats.kd} sub={`${stats.kills} kills / ${stats.deaths} deaths`} accent="yellow" />
        <StatCard label="Matches logged" value={stats.total} sub={`${stats.avgDamage.toLocaleString()} avg damage`} accent="blue" />
        <StatCard label="Assists" value={stats.assists} sub="team play tracked" accent="orange" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <NeoCard className="gap-0 p-0 lg:col-span-3">
          <div className="flex items-center justify-between border-b-2 border-foreground px-5 py-4">
            <h2 className="font-bold">Recent form</h2>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              K/D per entry
            </span>
          </div>
          <div className="p-4">
            {kdTrend.length > 1 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={kdTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke="#141414" strokeOpacity={0.15} vertical={false} />
                  <XAxis
                    dataKey="day"
                    tickFormatter={(ts) => new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    interval={1}
                    tick={{ fontSize: 10, fontFamily: "Space Mono, monospace" }}
                  />
                  <YAxis tick={{ fontSize: 10, fontFamily: "Space Mono, monospace" }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line
                    type="stepAfter"
                    dataKey="kd"
                    name="K/D"
                    stroke="#141414"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#ffde00", stroke: "#141414", strokeWidth: 2 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                title="Not enough data yet"
                description="Log a few scrims or matches to unlock your form chart."
                action={
                  <Link to="/player/performance">
                    <Button className={btnYellow}>
                      <Plus className="size-4" />
                      Log performance
                    </Button>
                  </Link>
                }
              />
            )}
          </div>
        </NeoCard>

        <NeoCard className="gap-0 p-0 lg:col-span-2">
          <div className="flex items-center justify-between border-b-2 border-foreground px-5 py-4">
            <h2 className="font-bold">Upcoming matches</h2>
            <CalendarClock className="size-4" />
          </div>
          <div className="flex flex-col divide-y-2 divide-foreground/10">
            {upcomingMatches.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">
                No fixtures scheduled for your team yet.
              </p>
            ) : (
              upcomingMatches.map((m) => (
                <div key={m._id} className="px-5 py-3">
                  <p className="text-sm font-bold">
                    {m.teamAName} <span className="text-muted-foreground">vs</span> {m.teamBName}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {m.tournamentName ?? "Friendly"} · {m.map ?? "TBD"} · {fmtDateTime(m.scheduledAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </NeoCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <NeoCard className="gap-0 p-0 lg:col-span-2">
          <div className="flex items-center gap-2 border-b-2 border-foreground px-5 py-4">
            <Crown className="size-4" />
            <h2 className="font-bold">My team</h2>
          </div>
          {team ? (
            <div className="flex flex-col gap-3 p-5">
              <div>
                <p className="text-xl font-bold">{team.team.name}</p>
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {team.team.tag} · {team.team.game}
                </p>
              </div>
              <div className="divide-y-2 divide-foreground/10 border-2 border-foreground bg-background">
                {team.players.map((p) => (
                  <div key={p._id} className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2">
                      {team.captain?._id === p._id ? <Crown className="size-3.5" /> : null}
                      <span className="text-sm font-bold">{p.gamertag}</span>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {p.inGameRole ?? p.game}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="px-5 py-6 text-sm text-muted-foreground">
              You're not on a roster yet. Management in The Den assigns teams — check back soon.
            </p>
          )}
        </NeoCard>

        <NeoCard className="gap-0 p-0 lg:col-span-3">
          <div className="flex items-center justify-between border-b-2 border-foreground px-5 py-4">
            <h2 className="font-bold">Recent entries</h2>
            <Link to="/player/performance">
              <Button size="sm" variant="outline" className={btnGhost}>
                <Plus className="size-3.5" />
                Log new
              </Button>
            </Link>
          </div>
          <div className="flex flex-col divide-y-2 divide-foreground/10">
            {recentEntries.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">
                No performance logged yet. Every entry feeds your stats and The Den's analytics.
              </p>
            ) : (
              recentEntries.map((e) => (
                <div key={e._id} className="flex items-center justify-between gap-2 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      {e.game} <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{e.matchType}</span>
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {new Date(e.recordedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-mono text-xs tabular-nums">
                      {e.kills}/{e.deaths}/{e.assists} · {fmtKd(e.kills, e.deaths)}
                    </span>
                    <StatusBadge status={e.result} />
                  </div>
                </div>
              ))
            )}
          </div>
        </NeoCard>
      </div>

      {announcements.length > 0 ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Megaphone className="size-4" />
            <h2 className="font-bold">Latest broadcasts</h2>
          </div>
          {announcements.map((a) => (
            <NeoCard key={a._id} className="gap-1.5 p-5">
              <div className="flex items-center gap-2">
                <StatusBadge status={a.priority} />
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
              <p className="font-bold leading-snug">{a.title}</p>
              <p className="text-sm leading-6 text-muted-foreground">{a.body}</p>
            </NeoCard>
          ))}
        </div>
      ) : null}
    </div>
  );
}
