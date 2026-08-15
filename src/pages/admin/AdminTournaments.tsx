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
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, NeoCard, PageHeader, StatusBadge } from "@/components/neo";
import { GAMES } from "@/lib/constants";
import { dateInputToTs, fmtDate, fmtPrize, tsToDateInput } from "@/lib/format";
import { btnGhost, btnYellow, input, label, select, tableCell, tableHead } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import {
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Swords,
  Trash2,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

type Participant = Doc<"tournamentParticipants"> & {
  gamertag: string;
  email: string;
  phone?: string;
  teamName?: string;
};

type BracketNode = {
  nodeId: Id<"bracketNodes">;
  round: number;
  position: number;
  slotA: { kind: "team" | "player"; id: string; name: string } | null;
  slotB: { kind: "team" | "player"; id: string; name: string } | null;
  winner: { kind: "team" | "player"; id: string; name: string } | null;
  nextNodeId?: Id<"bracketNodes">;
  status: string;
};

type Tournament = Doc<"tournaments">;

const STATUSES = ["upcoming", "live", "completed", "cancelled"] as const;

interface Form {
  name: string;
  game: string;
  description: string;
  prizePool: string;
  startDate: string;
  endDate: string;
}

export default function AdminTournaments() {
  const tournaments = useQuery(api.tournaments.listTournaments);
  const createTournament = useMutation(api.tournaments.createTournament);
  const updateTournament = useMutation(api.tournaments.updateTournament);
  const setStatus = useMutation(api.tournaments.setStatus);
  const deleteTournament = useMutation(api.tournaments.deleteTournament);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Tournament | null>(null);
  const [form, setForm] = useState<Form>({
    name: "",
    game: GAMES[0],
    description: "",
    prizePool: "",
    startDate: tsToDateInput(Date.now()),
    endDate: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tournament | null>(null);

  // Participant + bracket management panel
  const [manageTarget, setManageTarget] = useState<Tournament | null>(null);
  const participants = useQuery(
    api.tournaments.listParticipants,
    manageTarget ? { tournamentId: manageTarget._id } : "skip",
  );
  const bracket = useQuery(
    api.tournaments.getBracket,
    manageTarget ? { tournamentId: manageTarget._id } : "skip",
  );
  const setParticipantStatus = useMutation(api.tournaments.setParticipantStatus);
  const generateBracket = useMutation(api.tournaments.generateBracket);
  const recordBracketResult = useMutation(api.tournaments.recordBracketResult);
  const [genBusy, setGenBusy] = useState(false);
  const [resultBusy, setResultBusy] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      game: GAMES[0],
      description: "",
      prizePool: "",
      startDate: tsToDateInput(Date.now()),
      endDate: "",
    });
    setFormOpen(true);
  };

  const openEdit = (t: Tournament) => {
    setEditing(t);
    setForm({
      name: t.name,
      game: t.game,
      description: t.description ?? "",
      prizePool: t.prizePool ? String(t.prizePool) : "",
      startDate: tsToDateInput(t.startDate),
      endDate: t.endDate ? tsToDateInput(t.endDate) : "",
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const args = {
        name: form.name,
        game: form.game,
        description: form.description || undefined,
        prizePool: form.prizePool ? Number(form.prizePool) : undefined,
        startDate: dateInputToTs(form.startDate),
        endDate: form.endDate ? dateInputToTs(form.endDate) : undefined,
      };
      if (editing) {
        await updateTournament({ tournamentId: editing._id, ...args });
        toast.success("Tournament updated — live across all portals.");
      } else {
        await createTournament(args);
        toast.success("Tournament created — live across all portals.");
      }
      setFormOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
      toast.error("Could not save the tournament.");
    } finally {
      setSaving(false);
    }
  };

  if (!tournaments) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse border-2 border-foreground bg-card" />
        ))}
      </div>
    );
  }

  const handleManage = (t: Tournament) => {
    setManageTarget(t);
  };

  const handleParticipantStatus = async (p: Participant, status: "approved" | "declined") => {
    try {
      await setParticipantStatus({ participantId: p._id, status });
      toast.success(
        status === "approved"
          ? `${p.gamertag} approved — they're in the tournament.`
          : `${p.gamertag}'s entry declined.`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update the entry.");
    }
  };

  const handleGenerateBracket = async () => {
    if (!manageTarget) return;
    setGenBusy(true);
    try {
      await generateBracket({ tournamentId: manageTarget._id });
      toast.success("Bracket generated — entrants are seeded and live.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not generate the bracket.");
    } finally {
      setGenBusy(false);
    }
  };

  const handleRecordResult = async (node: BracketNode, winnerIsA: boolean) => {
    setResultBusy(node.nodeId);
    try {
      await recordBracketResult({ nodeId: node.nodeId, winnerIsA });
      toast.success("Winner recorded — they advance automatically.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not record the winner.");
    } finally {
      setResultBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Competitions"
        title="Tournaments"
        description="Plan events, book prize pools and move them through the live lifecycle."
        actions={
          <Button className={btnYellow} onClick={openCreate}>
            <Plus className="size-4" />
            New tournament
          </Button>
        }
      />

      {error ? (
        <p className="border-2 border-foreground bg-neo-red px-4 py-2 text-sm font-bold text-white">
          {error}
        </p>
      ) : null}

      {tournaments.length === 0 ? (
        <EmptyState
          title="No tournaments yet"
          description="Create a tournament to start scheduling matches against your rosters."
          action={
            <Button className={btnYellow} onClick={openCreate}>
              <Plus className="size-4" />
              New tournament
            </Button>
          }
        />
      ) : (
        <NeoCard className="gap-0 overflow-x-auto p-0">
          <table className="w-full min-w-[840px] border-collapse">
            <thead>
              <tr>
                <th className={tableHead}>Tournament</th>
                <th className={tableHead}>Game</th>
                <th className={tableHead}>Prize pool</th>
                <th className={tableHead}>Window</th>
                <th className={tableHead}>Matches</th>
                <th className={tableHead}>Status</th>
                <th className={cn(tableHead, "text-right")}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tournaments.map((t) => (
                <tr key={t._id} className="bg-card hover:bg-neo-yellow/20">
                  <td className={tableCell}>
                    <p className="font-bold">{t.name}</p>
                    {t.description ? (
                      <p className="max-w-xs truncate text-xs text-muted-foreground">{t.description}</p>
                    ) : null}
                  </td>
                  <td className={tableCell}>{t.game}</td>
                  <td className={cn(tableCell, "font-mono text-sm font-bold tabular-nums")}>
                    {fmtPrize(t.prizePool)}
                  </td>
                  <td className={cn(tableCell, "text-muted-foreground")}>
                    {fmtDate(t.startDate)}
                    {t.endDate ? ` → ${fmtDate(t.endDate)}` : ""}
                  </td>
                  <td className={cn(tableCell, "font-mono font-bold")}>{t.matchCount}</td>
                  <td className={tableCell}>
                    <Select
                      value={t.status}
                      onValueChange={async (status) =>
                        setStatus({ tournamentId: t._id, status: status as (typeof STATUSES)[number] })
                      }
                    >
                      <SelectTrigger className={cn(select, "h-8 w-32")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none border-2 border-foreground">
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            <StatusBadge status={s} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className={cn(tableCell, "text-right")}>
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="neo-press rounded-none border-2 border-foreground bg-neo-blue text-white shadow-[2px_2px_0_0_var(--neo-ink)] hover:shadow-[3px_3px_0_0_var(--neo-ink)]"
                        onClick={() => handleManage(t)}
                        title="Participants & bracket"
                      >
                        <Users className="size-3.5" />
                        Manage
                      </Button>
                      <Button size="sm" variant="outline" className={btnGhost} onClick={() => openEdit(t)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="neo-press rounded-none border-2 border-foreground bg-neo-red text-white shadow-[2px_2px_0_0_var(--neo-ink)] hover:shadow-[3px_3px_0_0_var(--neo-ink)]"
                        onClick={() => setDeleteTarget(t)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </NeoCard>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none border-2 border-foreground bg-card shadow-[6px_6px_0_0_var(--neo-ink)]">
          <DialogHeader>
            <DialogTitle className="text-left text-2xl font-bold">
              {editing ? `Edit ${editing.name}` : "New tournament"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="flex flex-col gap-1.5">
              <span className={label}>Name</span>
              <Input
                className={input}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Pulse Invitational 2026"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <span className={label}>Game</span>
                <Select value={form.game} onValueChange={(game) => setForm({ ...form, game })}>
                  <SelectTrigger className={cn(select, "w-full")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2 border-foreground">
                    {GAMES.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className={label}>Prize pool ($)</span>
                <Input
                  className={input}
                  type="number"
                  min={0}
                  value={form.prizePool}
                  onChange={(e) => setForm({ ...form, prizePool: e.target.value })}
                  placeholder="25000"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className={label}>Start date</span>
                <Input
                  className={input}
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={label}>End date (optional)</span>
              <Input
                className={cn(input, "max-w-56")}
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={label}>Description</span>
              <Textarea
                className="rounded-none border-2 border-foreground bg-background"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Format, invited teams, broadcast notes…"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" className={btnGhost} onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button
                className={btnYellow}
                onClick={handleSave}
                disabled={saving || !form.name.trim() || !form.startDate}
              >
                {saving ? "Saving…" : editing ? "Save changes" : "Create tournament"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Participants + bracket management */}
      <Dialog open={!!manageTarget} onOpenChange={(o) => !o && setManageTarget(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-none border-2 border-foreground bg-card shadow-[6px_6px_0_0_var(--neo-ink)]">
          <DialogHeader>
            <DialogTitle className="text-left text-2xl font-bold">
              {manageTarget?.name} — manage
            </DialogTitle>
          </DialogHeader>
          {manageTarget ? (
            <div className="flex flex-col gap-6">
              {/* Participants */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 font-bold">
                    <Users className="size-4" />
                    Entries
                  </h3>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {participants === undefined ? "…" : `${participants.length} registered`}
                  </span>
                </div>
                {participants === undefined ? (
                  <div className="h-20 animate-pulse border-2 border-foreground bg-card" />
                ) : participants.length === 0 ? (
                  <p className="border-2 border-foreground bg-background px-4 py-4 text-sm text-muted-foreground">
                    No entries yet — players register from their portal, then approve them here.
                  </p>
                ) : (
                  <div className="divide-y-2 divide-foreground/10 border-2 border-foreground bg-background">
                    {participants.map((p) => (
                      <div key={p._id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">
                            {p.teamName ? `${p.teamName} — ` : ""}{p.gamertag}
                          </p>
                          <p className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            {p.email}{p.phone ? ` · ${p.phone}` : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <StatusBadge status={p.status} />
                          {p.status === "pending" ? (
                            <>
                              <Button
                                size="sm"
                                className="neo-press rounded-none border-2 border-foreground bg-neo-green px-2 py-1 text-white shadow-[2px_2px_0_0_var(--neo-ink)]"
                                onClick={() => handleParticipantStatus(p, "approved")}
                              >
                                <CheckCircle2 className="size-3.5" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="neo-press rounded-none border-2 border-foreground bg-neo-red px-2 py-1 text-white shadow-[2px_2px_0_0_var(--neo-ink)]"
                                onClick={() => handleParticipantStatus(p, "declined")}
                              >
                                <XCircle className="size-3.5" />
                                Decline
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bracket */}
              <div className="flex flex-col gap-3 border-t-2 border-foreground pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 font-bold">
                    <Swords className="size-4" />
                    Bracket
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {bracket === undefined ? "…" : `${bracket.totalNodes} slots`}
                    </span>
                    <Button className={btnYellow} size="sm" onClick={handleGenerateBracket} disabled={genBusy || bracket === undefined}>
                      {genBusy ? <Loader2 className="size-3.5 animate-spin" /> : <Swords className="size-3.5" />}
                      {genBusy ? "Generating…" : "Generate bracket"}
                    </Button>
                  </div>
                </div>
                {bracket === undefined ? (
                  <div className="h-24 animate-pulse border-2 border-foreground bg-card" />
                ) : bracket.rounds.length === 0 ? (
                  <p className="border-2 border-foreground bg-background px-4 py-4 text-sm text-muted-foreground">
                    No bracket yet — approve at least two entries, then generate it. Recording a
                    winner automatically advances them to the next round.
                  </p>
                ) : (
                  <div className="flex gap-3 overflow-x-auto border-2 border-foreground bg-neo-cream p-3">
                    {bracket.rounds.map((round, roundIndex) => (
                      <div key={roundIndex} className="flex min-w-44 flex-col gap-3">
                        <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                          {roundIndex === bracket.rounds.length - 1 ? "Final" : `Round ${roundIndex + 1}`}
                        </p>
                        {round.map((node) => {
                          const aName = node.slotA?.name ?? "TBD";
                          const bName = node.slotB?.name ?? "TBD";
                          const aWon = node.winner && node.slotA && node.winner.id === node.slotA.id;
                          const bWon = node.winner && node.slotB && node.winner.id === node.slotB.id;
                          const both = !!node.slotA && !!node.slotB;
                          return (
                            <div key={node.nodeId} className="border-2 border-foreground bg-card">
                              <button
                                type="button"
                                disabled={node.status === "completed" || !both || resultBusy === node.nodeId}
                                onClick={() => handleRecordResult(node, true)}
                                className={cn(
                                  "flex w-full items-center justify-between gap-2 border-b-2 border-foreground px-2.5 py-2 text-left text-xs font-bold transition-colors",
                                  node.status === "completed"
                                    ? aWon
                                      ? "bg-neo-green text-white"
                                      : "bg-neo-cream text-muted-foreground"
                                    : both
                                      ? "cursor-pointer hover:bg-neo-yellow/60"
                                      : "bg-neo-cream text-muted-foreground",
                                )}
                                title={both && node.status !== "completed" ? "Record A as winner" : undefined}
                              >
                                <span className="truncate">{aName}</span>
                                {aWon ? <Trophy className="size-3.5 shrink-0" /> : null}
                              </button>
                              <button
                                type="button"
                                disabled={node.status === "completed" || !both || resultBusy === node.nodeId}
                                onClick={() => handleRecordResult(node, false)}
                                className={cn(
                                  "flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left text-xs font-bold transition-colors",
                                  node.status === "completed"
                                    ? bWon
                                      ? "bg-neo-green text-white"
                                      : "bg-neo-cream text-muted-foreground"
                                    : both
                                      ? "cursor-pointer hover:bg-neo-yellow/60"
                                      : "bg-neo-cream text-muted-foreground",
                                )}
                                title={both && node.status !== "completed" ? "Record B as winner" : undefined}
                              >
                                <span className="truncate">{bName}</span>
                                {bWon ? <Trophy className="size-3.5 shrink-0" /> : null}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-none border-2 border-foreground bg-card shadow-[6px_6px_0_0_var(--neo-ink)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">
              Delete {deleteTarget?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              The tournament and all matches scheduled under it will be removed permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none border-2 border-foreground bg-card shadow-[2px_2px_0_0_var(--neo-ink)]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="neo-press rounded-none border-2 border-foreground bg-neo-red text-white shadow-[3px_3px_0_0_var(--neo-ink)] hover:shadow-[4px_4px_0_0_var(--neo-ink)]"
              onClick={async () => {
                try {
                  if (deleteTarget) await deleteTournament({ tournamentId: deleteTarget._id });
                  toast.success("Tournament and all its matches deleted completely.");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Could not delete the tournament.");
                } finally {
                  setDeleteTarget(null);
                }
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
