import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, NeoCard, PageHeader, StatCard, StatusBadge } from "@/components/neo";
import { LoadingScreen } from "@/components/Loading";
import { fmtDate } from "@/lib/format";
import { btnGhost, btnYellow, input, select, tableCell, tableHead } from "@/lib/neo";
import { useMutation, useQuery } from "convex/react";
import { CalendarDays, Download, Gauge, Loader2, ShieldAlert, Swords } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Doc, Id } from "@/convex/_generated/dataModel";

type Player = Doc<"players">;

const STATUS_OPTIONS = ["present", "late", "absent", "leave"] as const;

export default function AdminAttendance() {
  const [day, setDay] = useState(() => new Date().toISOString().slice(0, 10));
  const dayData = useQuery(api.attendance.adminDay, { date: day });
  const summary = useQuery(api.attendance.adminSummary);
  const reports = useQuery(api.attendance.adminMatchReports, {});

  const override = useMutation(api.attendance.adminOverride);
  const [overriding, setOverriding] = useState<string | null>(null);

  const flagged = useMemo(
    () => (summary ? summary.rows.filter((r) => r.flag) : []),
    [summary],
  );

  if (dayData === undefined || summary === undefined || reports === undefined) {
    return <LoadingScreen label="Loading attendance…" />;
  }

  const handleOverride = async (
    player: Player,
    date: string,
    status: (typeof STATUS_OPTIONS)[number],
  ) => {
    if (overriding) return;
    setOverriding(`${player._id}:${date}`);
    try {
      await override({ playerId: player._id, date, status });
      toast.success(`${player.gamertag} marked ${status} for ${date}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setOverriding(null);
    }
  };

  const downloadDay = () => {
    const rows = [
      ["Player", "Game", "Status", "Type", "Remarks", "Source"],
      ...dayData.rows.map(({ player, record }) => [
        player.gamertag,
        player.game,
        record?.status ?? "—",
        record?.type ?? "—",
        record?.remarks ?? "—",
        record?.source ?? "—",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${day}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Wolf Society Esports · The Den"
        title="Attendance & Match Reports"
        description="Live daily attendance for every verified player. The AI attendance system auto-marks absent anyone who doesn't check in within 24 hours — and flags players who miss 3+ days straight."
        actions={
          <Button variant="outline" className={btnGhost} onClick={downloadDay}>
            <Download className="size-4" />
            Export day CSV
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Present today" value={dayData.totals.present} sub={`${dayData.rows.length} verified players`} accent="green" />
        <StatCard label="Late" value={dayData.totals.late} sub="checked in late" accent="orange" />
        <StatCard label="Absent" value={dayData.totals.absent} sub={`${dayData.totals.unmarked} not yet marked`} accent="red" />
        <StatCard label="On leave" value={dayData.totals.leave} sub="approved / requested" accent="blue" />
      </div>

      {flagged.length > 0 ? (
        <div className="border-2 border-foreground bg-neo-red p-4 text-white">
          <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-widest">
            <ShieldAlert className="size-4" />
            AI attendance flags — 3+ consecutive misses
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {flagged.map((r) => (
              <li key={r.player._id} className="border-2 border-foreground bg-background px-2 py-1 text-[11px] font-bold text-foreground">
                {r.player.gamertag} — {r.currentStreak}d streak broken, {r.absent} absent / 30d
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Tabs defaultValue="board" className="flex flex-col gap-6">
        <TabsList className="w-fit gap-2 border-2 border-foreground bg-card p-1">
          <TabsTrigger value="board" className="border-2 border-foreground data-[state=active]:bg-neo-yellow data-[state=active]:text-white">
            <CalendarDays className="size-4" />
            Day board
          </TabsTrigger>
          <TabsTrigger value="rates" className="border-2 border-foreground data-[state=active]:bg-neo-yellow data-[state=active]:text-white">
            <Gauge className="size-4" />
            30-day rates
          </TabsTrigger>
          <TabsTrigger value="reports" className="border-2 border-foreground data-[state=active]:bg-neo-yellow data-[state=active]:text-white">
            <Swords className="size-4" />
            Match reports ({reports.length})
          </TabsTrigger>
        </TabsList>

        {/* DAY BOARD */}
        <TabsContent value="board" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider">Date</span>
              <Input type="date" className={input} value={day} onChange={(e) => setDay(e.target.value)} />
            </div>
            <p className="pb-2 text-xs text-muted-foreground">
              {dayData.totals.marked}/{dayData.rows.length} players marked · auto-absent runs daily for any day older than 24h
            </p>
          </div>

          <NeoCard className="gap-0 overflow-x-auto p-0">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr>
                  <th className={tableHead}>Player</th>
                  <th className={tableHead}>Game</th>
                  <th className={tableHead}>Status</th>
                  <th className={tableHead}>Type</th>
                  <th className={tableHead}>Remarks</th>
                  <th className={tableHead}>Override</th>
                </tr>
              </thead>
              <tbody>
                {dayData.rows.map(({ player, record }) => (
                  <tr key={player._id} className="border-t-2 border-foreground/30">
                    <td className={tableCell}>
                      <p className="font-bold">{player.gamertag}</p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {player.inGameRole ?? "Flex"}
                      </p>
                    </td>
                    <td className={tableCell}>{player.game}</td>
                    <td className={tableCell}>
                      {record ? (
                        <div className="flex flex-col gap-1">
                          <StatusBadge status={record.status}>{record.status}</StatusBadge>
                          {record.source === "auto" ? (
                            <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                              AI marked
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className={tableCell}>{record?.type ?? "—"}</td>
                    <td className={`${tableCell} max-w-[260px]`}>
                      <p className="line-clamp-2 text-xs">{record?.remarks ?? "—"}</p>
                      {record?.checkedInAt ? (
                        <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                          {fmtDate(record.checkedInAt)}
                        </p>
                      ) : null}
                    </td>
                    <td className={tableCell}>
                      <div className="flex flex-wrap gap-1">
                        {STATUS_OPTIONS.map((s) => (
                          <button
                            key={s}
                            type="button"
                            disabled={overriding !== null}
                            onClick={() => handleOverride(player, day, s)}
                            className={`border-2 border-foreground px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50 ${
                              record?.status === s
                                ? "bg-neo-yellow text-white"
                                : "bg-card hover:bg-neo-cream"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </NeoCard>
        </TabsContent>

        {/* 30-DAY RATES */}
        <TabsContent value="rates" className="flex flex-col gap-4">
          <NeoCard className="gap-0 overflow-x-auto p-0">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr>
                  <th className={tableHead}>Player</th>
                  <th className={tableHead}>Attendance rate</th>
                  <th className={tableHead}>Present</th>
                  <th className={tableHead}>Absent</th>
                  <th className={tableHead}>Leave</th>
                  <th className={tableHead}>AI absent</th>
                  <th className={tableHead}>Streak</th>
                  <th className={tableHead}>Flag</th>
                </tr>
              </thead>
              <tbody>
                {summary.rows.map((r) => (
                  <tr key={r.player._id} className="border-t-2 border-foreground/30">
                    <td className={tableCell}>
                      <p className="font-bold">{r.player.gamertag}</p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {r.player.game}
                      </p>
                    </td>
                    <td className={tableCell}>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-28 border-2 border-foreground bg-background">
                          <div
                            className="h-full bg-neo-green"
                            style={{ width: `${Math.min(100, r.rate)}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs font-bold">{r.rate}%</span>
                      </div>
                    </td>
                    <td className={tableCell}>{r.present}</td>
                    <td className={tableCell}>{r.absent}</td>
                    <td className={tableCell}>{r.leave}</td>
                    <td className={tableCell}>
                      {r.autoAbsent > 0 ? (
                        <StatusBadge status="auto">{r.autoAbsent}</StatusBadge>
                      ) : (
                        "0"
                      )}
                    </td>
                    <td className={tableCell}>
                      <span className="font-mono text-xs font-bold">{r.currentStreak}d</span>
                      <span className="text-muted-foreground"> / best {r.bestStreak}d</span>
                    </td>
                    <td className={tableCell}>
                      {r.flag === "consecutive-absences" ? (
                        <StatusBadge status="absent">3+ misses</StatusBadge>
                      ) : r.flag === "low-attendance" ? (
                        <StatusBadge status="late">low attendance</StatusBadge>
                      ) : (
                        <StatusBadge status="approved">ok</StatusBadge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </NeoCard>
          <p className="text-xs text-muted-foreground">
            Rate = (present + late + leave) / 30 days. AI absent counts days auto-marked by the attendance job.
          </p>
        </TabsContent>

        {/* MATCH REPORTS */}
        <TabsContent value="reports" className="flex flex-col gap-4">
          {reports.length === 0 ? (
            <EmptyState
              title="No match reports yet"
              description="When verified players submit post-match reports they land here instantly — with an email + Discord alert to the organization."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {reports.map((r) => (
                <NeoCard key={r._id} className="gap-3 p-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold">{r.gamertag}</p>
                    <StatusBadge status={r.result}>{r.result}</StatusBadge>
                  </div>
                  <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {r.game}
                    {r.opponent ? ` vs ${r.opponent}` : ""}
                  </p>
                  <p className="text-sm font-bold">
                    {r.kills}K / {r.deaths}D / {r.assists}A
                    {r.damage ? ` · ${r.damage.toLocaleString()} dmg` : ""}
                    {r.rating ? ` · ${r.rating}/10` : ""}
                  </p>
                  {r.rolePlayed ? <p className="text-xs text-muted-foreground">Role: {r.rolePlayed}</p> : null}
                  {r.highlights ? (
                    <p className="text-xs text-muted-foreground"><strong className="text-foreground">Well:</strong> {r.highlights}</p>
                  ) : null}
                  {r.improvement ? (
                    <p className="text-xs text-muted-foreground"><strong className="text-foreground">Improve:</strong> {r.improvement}</p>
                  ) : null}
                  {r.notes ? <p className="text-xs italic text-muted-foreground">“{r.notes}”</p> : null}
                  <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">
                    {new Date(r.submittedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </p>
                </NeoCard>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
