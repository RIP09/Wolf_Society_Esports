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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, NeoCard, PageHeader, StatusBadge } from "@/components/neo";
import { dateInputToTs, fmtDateTime, tsToDateInput } from "@/lib/format";
import { btnGhost, btnYellow, input, label, select, tableCell, tableHead } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { CalendarPlus, Radio, Trash2, Trophy } from "lucide-react";
import { useState } from "react";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

type ResultTarget = {
  id: Id<"matches">;
  teamAName: string;
  teamBName: string;
};

type DeleteTarget = { id: Id<"matches">; teamAName: string; teamBName: string };

interface Form {
  tournamentId: string;
  teamAId: string;
  teamBId: string;
  map: string;
  scheduledAt: string;
}

export default function AdminMatches() {
  const matches = useQuery(api.matches.listMatches, {});
  const teams = useQuery(api.teams.listTeams);
  const tournaments = useQuery(api.tournaments.listTournaments);

  const createMatch = useMutation(api.matches.createMatch);
  const setStatus = useMutation(api.matches.setStatus);
  const recordResult = useMutation(api.matches.recordResult);
  const deleteMatch = useMutation(api.matches.deleteMatch);

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [form, setForm] = useState<Form>({
    tournamentId: "none",
    teamAId: "none",
    teamBId: "none",
    map: "",
    scheduledAt: tsToDateInput(Date.now()),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resultMatch, setResultMatch] = useState<ResultTarget | null>(null);
  const [scoreA, setScoreA] = useState("0");
  const [scoreB, setScoreB] = useState("0");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const openSchedule = () => {
    setForm({
      tournamentId: "none",
      teamAId: "none",
      teamBId: "none",
      map: "",
      scheduledAt: tsToDateInput(Date.now()),
    });
    setScheduleOpen(true);
  };

  const handleSchedule = async () => {
    setSaving(true);
    setError(null);
    try {
      await createMatch({
        tournamentId: form.tournamentId === "none" ? undefined : (form.tournamentId as Doc<"tournaments">["_id"]),
        teamAId: form.teamAId as Doc<"teams">["_id"],
        teamBId: form.teamBId as Doc<"teams">["_id"],
        map: form.map || undefined,
        scheduledAt: dateInputToTs(form.scheduledAt),
      });
      setScheduleOpen(false);
      toast.success("Match scheduled — live on the public schedule.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Schedule failed.");
      toast.error("Could not schedule the match.");
    } finally {
      setSaving(false);
    }
  };

  const handleRecord = async () => {
    if (!resultMatch) return;
    setSaving(true);
    try {
      await recordResult({
        matchId: resultMatch.id,
        scoreA: Number(scoreA),
        scoreB: Number(scoreB),
      });
      setResultMatch(null);
      toast.success("Result locked in — published everywhere instantly.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Recording failed.");
      toast.error("Could not record the result.");
    } finally {
      setSaving(false);
    }
  };

  if (!matches || !teams) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse border-2 border-foreground bg-card" />
        ))}
      </div>
    );
  }

  const teamOptions = teams.filter((t) => t._id !== form.teamAId);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Schedule"
        title="Matches"
        description="Schedule fixtures, push matches live and lock in final scores."
        actions={
          <Button className={btnYellow} onClick={openSchedule} disabled={teams.length < 2}>
            <CalendarPlus className="size-4" />
            Schedule match
          </Button>
        }
      />

      {error ? (
        <p className="border-2 border-foreground bg-neo-red px-4 py-2 text-sm font-bold text-white">
          {error}
        </p>
      ) : null}

      {teams.length < 2 ? (
        <EmptyState
          title="Need at least two teams"
          description="Create teams in the Teams section before scheduling matches."
        />
      ) : matches.length === 0 ? (
        <EmptyState
          title="No matches yet"
          description="Schedule your first fixture between two rosters."
          action={
            <Button className={btnYellow} onClick={openSchedule}>
              <CalendarPlus className="size-4" />
              Schedule match
            </Button>
          }
        />
      ) : (
        <NeoCard className="gap-0 overflow-x-auto p-0">
          <table className="w-full min-w-[860px] border-collapse">
            <thead>
              <tr>
                <th className={tableHead}>Fixture</th>
                <th className={tableHead}>Tournament</th>
                <th className={tableHead}>Map</th>
                <th className={tableHead}>Kickoff</th>
                <th className={tableHead}>Result</th>
                <th className={tableHead}>Status</th>
                <th className={cn(tableHead, "text-right")}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => {
                const winnerIsA = m.winnerId === m.teamAId;
                return (
                  <tr key={m._id} className="bg-card hover:bg-neo-yellow/20">
                    <td className={tableCell}>
                      <p className="font-bold">
                        <span className={m.winnerId === m.teamAId ? "underline decoration-2 decoration-neo-yellow" : ""}>
                          {m.teamA?.name ?? "?"}
                        </span>{" "}
                        <span className="text-muted-foreground">vs</span>{" "}
                        <span className={m.winnerId === m.teamBId ? "underline decoration-2 decoration-neo-yellow" : ""}>
                          {m.teamB?.name ?? "?"}
                        </span>
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {winnerIsA ? "A wins" : m.winnerId === m.teamBId ? "B wins" : ""}
                      </p>
                    </td>
                    <td className={cn(tableCell, "text-muted-foreground")}>
                      {m.tournamentName ?? "Friendly"}
                    </td>
                    <td className={cn(tableCell, "font-mono text-xs")}>{m.map ?? "—"}</td>
                    <td className={cn(tableCell, "text-muted-foreground")}>
                      {fmtDateTime(m.scheduledAt)}
                    </td>
                    <td className={cn(tableCell, "font-mono text-sm font-bold tabular-nums")}>
                      {m.status === "completed" ? `${m.scoreA ?? 0} – ${m.scoreB ?? 0}` : "—"}
                    </td>
                    <td className={tableCell}>
                      <StatusBadge status={m.status} />
                    </td>
                    <td className={cn(tableCell, "text-right")}>
                      <div className="flex items-center justify-end gap-1.5">
                        {m.status === "scheduled" ? (
                          <>
                            <Button
                              size="sm"
                              className="neo-press rounded-none border-2 border-foreground bg-neo-orange text-white shadow-[2px_2px_0_0_var(--neo-ink)] hover:shadow-[3px_3px_0_0_var(--neo-ink)]"
                              onClick={async () => setStatus({ matchId: m._id, status: "live" })}
                              title="Go live"
                            >
                              <Radio className="size-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              className="neo-press rounded-none border-2 border-foreground bg-neo-green text-white shadow-[2px_2px_0_0_var(--neo-ink)] hover:shadow-[3px_3px_0_0_var(--neo-ink)]"
                              onClick={() => {
                                setResultMatch({ id: m._id, teamAName: m.teamA?.name ?? "?", teamBName: m.teamB?.name ?? "?" });
                                setScoreA(String(m.scoreA ?? 0));
                                setScoreB(String(m.scoreB ?? 0));
                              }}
                              title="Record result"
                            >
                              <Trophy className="size-3.5" />
                            </Button>
                          </>
                        ) : m.status === "live" ? (
                          <Button
                            size="sm"
                            className="neo-press rounded-none border-2 border-foreground bg-neo-green text-white shadow-[2px_2px_0_0_var(--neo-ink)] hover:shadow-[3px_3px_0_0_var(--neo-ink)]"
                            onClick={() => {
                              setResultMatch({ id: m._id, teamAName: m.teamA?.name ?? "?", teamBName: m.teamB?.name ?? "?" });
                              setScoreA(String(m.scoreA ?? 0));
                              setScoreB(String(m.scoreB ?? 0));
                            }}
                          >
                            <Trophy className="size-3.5" />
                            Result
                          </Button>
                        ) : null}
                        <Button size="sm" variant="outline" className={btnGhost} title="Delete" onClick={() => setDeleteTarget({ id: m._id, teamAName: m.teamA?.name ?? "?", teamBName: m.teamB?.name ?? "?" })}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </NeoCard>
      )}

      {/* Schedule dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none border-2 border-foreground bg-card shadow-[6px_6px_0_0_var(--neo-ink)]">
          <DialogHeader>
            <DialogTitle className="text-left text-2xl font-bold">Schedule match</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="flex flex-col gap-1.5">
              <span className={label}>Tournament (optional)</span>
              <Select
                value={form.tournamentId}
                onValueChange={(tournamentId) => setForm({ ...form, tournamentId })}
              >
                <SelectTrigger className={cn(select, "w-full")}>
                  <SelectValue placeholder="Friendly / none" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-2 border-foreground">
                  <SelectItem value="none">Friendly / none</SelectItem>
                  {(tournaments ?? []).map((t) => (
                    <SelectItem key={t._id} value={t._id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <span className={label}>Team A (home)</span>
                <Select
                  value={form.teamAId}
                  onValueChange={(teamAId) => setForm({ ...form, teamAId })}
                >
                  <SelectTrigger className={cn(select, "w-full")}>
                    <SelectValue placeholder="Select team…" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2 border-foreground">
                    {teams.map((t) => (
                      <SelectItem key={t._id} value={t._id}>
                        {t.name} ({t.tag})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className={label}>Team B (away)</span>
                <Select
                  value={form.teamBId}
                  onValueChange={(teamBId) => setForm({ ...form, teamBId })}
                >
                  <SelectTrigger className={cn(select, "w-full")}>
                    <SelectValue placeholder="Select team…" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2 border-foreground">
                    {teamOptions.map((t) => (
                      <SelectItem key={t._id} value={t._id}>
                        {t.name} ({t.tag})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <span className={label}>Map</span>
                <Input
                  className={input}
                  value={form.map}
                  onChange={(e) => setForm({ ...form, map: e.target.value })}
                  placeholder="Haven / Mirage / Summoner's Rift"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className={label}>Kickoff date</span>
                <Input
                  className={input}
                  type="date"
                  value={form.scheduledAt}
                  onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" className={btnGhost} onClick={() => setScheduleOpen(false)}>
                Cancel
              </Button>
              <Button
                className={btnYellow}
                onClick={handleSchedule}
                disabled={saving || form.teamAId === "none" || form.teamBId === "none"}
              >
                {saving ? "Scheduling…" : "Schedule match"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Result dialog */}
      <Dialog open={!!resultMatch} onOpenChange={(o) => !o && setResultMatch(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none border-2 border-foreground bg-card shadow-[6px_6px_0_0_var(--neo-ink)]">
          <DialogHeader>
            <DialogTitle className="text-left text-2xl font-bold">Record result</DialogTitle>
          </DialogHeader>
          {resultMatch ? (
            <div className="flex flex-col gap-4">
              <p className="border-2 border-foreground bg-background px-3 py-2 text-sm font-bold">
                {resultMatch.teamAName} vs {resultMatch.teamBName}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className={label}>{resultMatch.teamAName}</span>
                  <Input
                    className={cn(input, "text-center font-mono text-lg font-bold")}
                    type="number"
                    min={0}
                    value={scoreA}
                    onChange={(e) => setScoreA(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className={label}>{resultMatch.teamBName}</span>
                  <Input
                    className={cn(input, "text-center font-mono text-lg font-bold")}
                    type="number"
                    min={0}
                    value={scoreB}
                    onChange={(e) => setScoreB(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                The winner is derived automatically from the final scores.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" className={btnGhost} onClick={() => setResultMatch(null)}>
                  Cancel
                </Button>
                <Button
                  className={btnYellow}
                  onClick={handleRecord}
                  disabled={saving || scoreA === "" || scoreB === ""}
                >
                  <Trophy className="size-4" />
                  Lock in result
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-none border-2 border-foreground bg-card shadow-[6px_6px_0_0_var(--neo-ink)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Delete match?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {deleteTarget?.teamAName} vs {deleteTarget?.teamBName} will be removed from the schedule.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none border-2 border-foreground bg-card shadow-[2px_2px_0_0_var(--neo-ink)]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="neo-press rounded-none border-2 border-foreground bg-neo-red text-white shadow-[3px_3px_0_0_var(--neo-ink)] hover:shadow-[4px_4px_0_0_var(--neo-ink)]"
              onClick={async () => {
                if (deleteTarget) await deleteMatch({ matchId: deleteTarget.id });
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
