import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
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
import { EmptyState, NeoCard, PageHeader, StatCard, StatusBadge } from "@/components/neo";
import { GAMES } from "@/lib/constants";
import { btnGhost, btnYellow, input, label, select } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import {
  CalendarClock,
  Check,
  CheckCircle2,
  Flag,
  Pencil,
  Plus,
  Swords,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const ROUTINE_TYPES = [
  { value: "practice", label: "Practice" },
  { value: "vod", label: "VOD review" },
  { value: "physical", label: "Physical" },
  { value: "content", label: "Content" },
  { value: "meeting", label: "Team meeting" },
  { value: "rest", label: "Rest" },
] as const;

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SCRIM_FORMATS = ["Bo1", "Bo3", "Bo5"];

function fmt12(h: number, m: number) {
  const period = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m).padStart(2, "0")} ${period}`;
}
function toTimeInput(h: number, m: number) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function toDateInput(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fromDateInput(s: string) {
  return new Date(`${s}T00:00:00`).getTime();
}

type RoutineBlock = Doc<"routineBlocks">;
type Scrim = Doc<"scrims"> & { teamName: string | null };

interface BlockForm {
  title: string;
  type: string;
  game: string;
  teamId: string;
  dayOfWeek: number;
  startTime: string;
  durationMin: string;
  location: string;
  required: boolean;
}

const emptyBlock: BlockForm = {
  title: "",
  type: "practice",
  game: "all",
  teamId: "all",
  dayOfWeek: 1,
  startTime: "19:00",
  durationMin: "120",
  location: "",
  required: true,
};

interface ScrimForm {
  title: string;
  game: string;
  teamId: string;
  opponentName: string;
  opponentContact: string;
  date: string;
  time: string;
  durationMin: string;
  format: string;
  notes: string;
}

function emptyScrim(teamId: string): ScrimForm {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return {
    title: "Practice scrim",
    game: GAMES[0],
    teamId,
    opponentName: "",
    opponentContact: "",
    date: toDateInput(d.getTime()),
    time: "19:00",
    durationMin: "90",
    format: "Bo3",
    notes: "",
  };
}

interface ResultForm {
  result: string;
  scoreUs: string;
  scoreThem: string;
  vodUrl: string;
}

export default function AdminSchedule() {
  const hub = useQuery(api.schedules.adminHub);
  const createBlock = useMutation(api.schedules.createRoutineBlock);
  const updateBlock = useMutation(api.schedules.updateRoutineBlock);
  const deleteBlock = useMutation(api.schedules.deleteRoutineBlock);
  const createScrim = useMutation(api.schedules.createScrim);
  const updateScrim = useMutation(api.schedules.updateScrim);
  const logScrimResult = useMutation(api.schedules.logScrimResult);
  const deleteScrim = useMutation(api.schedules.deleteScrim);

  const [view, setView] = useState<"routine" | "scrims">("routine");

  // Routine block dialog
  const [blockOpen, setBlockOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<RoutineBlock | null>(null);
  const [blockForm, setBlockForm] = useState<BlockForm>(emptyBlock);
  const [blockSaving, setBlockSaving] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);
  const [deleteBlockTarget, setDeleteBlockTarget] = useState<RoutineBlock | null>(null);

  // Scrim dialog
  const [scrimOpen, setScrimOpen] = useState(false);
  const [editingScrim, setEditingScrim] = useState<Scrim | null>(null);
  const [scrimForm, setScrimForm] = useState<ScrimForm>(emptyScrim("none"));
  const [scrimSaving, setScrimSaving] = useState(false);
  const [scrimError, setScrimError] = useState<string | null>(null);
  const [deleteScrimTarget, setDeleteScrimTarget] = useState<Scrim | null>(null);

  // Result dialog
  const [resultScrim, setResultScrim] = useState<Scrim | null>(null);
  const [resultForm, setResultForm] = useState<ResultForm>({ result: "win", scoreUs: "", scoreThem: "", vodUrl: "" });

  if (!hub) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse border-2 border-foreground bg-card" />
          ))}
        </div>
        <div className="h-72 animate-pulse border-2 border-foreground bg-card" />
      </div>
    );
  }

  const teamOptions = hub.teams;
  const defaultTeam = teamOptions.length > 0 ? teamOptions[0]._id : "none";

  const upcoming = hub.scrims.filter(
    (s) => (s.status === "proposed" || s.status === "confirmed") && s.scheduledAt >= Date.now(),
  );
  const confirmationsThisWeek = hub.blocks.reduce(
    (sum, b) => sum + b.attendance.reduce((s, a) => s + a.confirmed, 0),
    0,
  );
  const history = hub.scrims.filter((s) => s.status === "completed");

  const openCreateBlock = () => {
    setEditingBlock(null);
    setBlockForm({ ...emptyBlock, teamId: defaultTeam });
    setBlockOpen(true);
  };
  const openEditBlock = (b: RoutineBlock) => {
    setEditingBlock(b);
    setBlockForm({
      title: b.title,
      type: b.type,
      game: b.game,
      teamId: b.teamId ?? "all",
      dayOfWeek: b.dayOfWeek,
      startTime: toTimeInput(b.startHour, b.startMinute),
      durationMin: String(b.durationMin),
      location: b.location ?? "",
      required: b.required,
    });
    setBlockOpen(true);
  };

  const handleSaveBlock = async () => {
    setBlockSaving(true);
    setBlockError(null);
    try {
      const [h, m] = blockForm.startTime.split(":").map(Number);
      const args = {
        title: blockForm.title,
        type: blockForm.type as RoutineBlock["type"],
        game: blockForm.game,
        teamId: blockForm.teamId === "all" ? undefined : (blockForm.teamId as Id<"teams">),
        dayOfWeek: blockForm.dayOfWeek,
        startHour: h,
        startMinute: m,
        durationMin: Number(blockForm.durationMin) || 60,
        location: blockForm.location || undefined,
        required: blockForm.required,
      };
      if (editingBlock) {
        await updateBlock({ blockId: editingBlock._id, ...args });
        toast.success("Routine block updated — players see it instantly.");
      } else {
        await createBlock(args);
        toast.success("Routine block created — broadcast to email + Discord.");
      }
      setBlockOpen(false);
    } catch (e) {
      setBlockError(e instanceof Error ? e.message : "Save failed.");
      toast.error("Could not save the routine block.");
    } finally {
      setBlockSaving(false);
    }
  };

  const openCreateScrim = () => {
    setEditingScrim(null);
    setScrimForm(emptyScrim(defaultTeam));
    setScrimOpen(true);
  };
  const openEditScrim = (s: Scrim) => {
    setEditingScrim(s);
    setScrimForm({
      title: s.title,
      game: s.game,
      teamId: s.teamId ?? "none",
      opponentName: s.opponentName,
      opponentContact: s.opponentContact ?? "",
      date: toDateInput(s.scheduledAt),
      time: toTimeInput(new Date(s.scheduledAt).getHours(), new Date(s.scheduledAt).getMinutes()),
      durationMin: String(s.durationMin),
      format: s.format ?? "Bo3",
      notes: s.notes ?? "",
    });
    setScrimOpen(true);
  };

  const handleSaveScrim = async () => {
    setScrimSaving(true);
    setScrimError(null);
    try {
      const [h, m] = scrimForm.time.split(":").map(Number);
      const scheduledAt = fromDateInput(scrimForm.date) + h * 3600 * 1000 + m * 60 * 1000;
      const base = {
        title: scrimForm.title,
        game: scrimForm.game,
        teamId: scrimForm.teamId === "none" ? undefined : (scrimForm.teamId as Id<"teams">),
        opponentName: scrimForm.opponentName,
        opponentContact: scrimForm.opponentContact || undefined,
        scheduledAt,
        durationMin: Number(scrimForm.durationMin) || 90,
        format: scrimForm.format,
        notes: scrimForm.notes || undefined,
      };
      if (editingScrim) {
        await updateScrim({ scrimId: editingScrim._id, ...base });
        toast.success("Scrim updated.");
      } else {
        await createScrim(base);
        toast.success("Scrim proposed — organization alerted.");
      }
      setScrimOpen(false);
    } catch (e) {
      setScrimError(e instanceof Error ? e.message : "Save failed.");
      toast.error("Could not save the scrim.");
    } finally {
      setScrimSaving(false);
    }
  };

  const confirmScrim = async (s: Scrim) => {
    await updateScrim({ scrimId: s._id, status: "confirmed" });
    toast.success("Scrim confirmed — roster notified by email, SMS and Discord.");
  };
  const cancelScrim = async (s: Scrim) => {
    await updateScrim({ scrimId: s._id, status: "cancelled" });
    toast.success("Scrim cancelled — roster notified.");
  };
  const openResult = (s: Scrim) => {
    setResultScrim(s);
    setResultForm({ result: "win", scoreUs: "", scoreThem: "", vodUrl: "" });
  };
  const handleLogResult = async () => {
    if (!resultScrim) return;
    await logScrimResult({
      scrimId: resultScrim._id,
      result: resultForm.result as "win" | "loss" | "draw",
      scoreUs: resultForm.scoreUs ? Number(resultForm.scoreUs) : undefined,
      scoreThem: resultForm.scoreThem ? Number(resultForm.scoreThem) : undefined,
      vodUrl: resultForm.vodUrl || undefined,
    });
    toast.success("Result logged — record and public page updated live.");
    setResultScrim(null);
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Wolf Society Esports · The Den"
        title="Schedule Hub"
        description="Weekly routine template + scrim bookings. Players confirm attendance in The Pack — every change syncs live and alerts the roster."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className={btnGhost} onClick={openCreateBlock}>
              <CalendarClock className="size-4" />
              New routine block
            </Button>
            <Button className={btnYellow} onClick={openCreateScrim}>
              <Plus className="size-4" />
              New scrim
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Routine blocks" value={hub.blocks.length} sub="recurring weekly template" accent="yellow" />
        <StatCard label="Confirmations" value={confirmationsThisWeek} sub="attendance this week" accent="green" />
        <StatCard label="Upcoming scrims" value={upcoming.length} sub="proposed + confirmed" accent="blue" />
        <StatCard label="Scrim record" value={`${hub.record.wins}W–${hub.record.losses}L`} sub={`${hub.record.draws} draws`} accent="orange" />
      </div>

      <div className="flex items-center gap-2">
        {(["routine", "scrims"] as const).map((v) => (
          <Button
            key={v}
            size="sm"
            className={cn(
              "neo-press rounded-none border-2 border-foreground font-mono text-[11px] font-bold uppercase tracking-wider shadow-[2px_2px_0_0_var(--neo-ink)]",
              view === v ? "bg-neo-yellow text-white" : "bg-background hover:bg-neo-cream",
            )}
            onClick={() => setView(v)}
          >
            {v === "routine" ? "Weekly routine" : "Scrim board"}
          </Button>
        ))}
        <span className="ml-auto font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {view === "routine" ? `${hub.blocks.length} blocks · live` : `${hub.scrims.length} scrims · live`}
        </span>
      </div>

      {view === "routine" ? (
        hub.blocks.length === 0 ? (
          <EmptyState
            title="No routine blocks yet"
            description="Build the weekly template — practice, VOD review, physical and content blocks. Players instantly see the days that apply to their team and game."
            action={
              <Button className={btnYellow} onClick={openCreateBlock}>
                <Plus className="size-4" />
                New routine block
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-6">
            {DAY_NAMES.map((dayName, dow) => {
              const dayBlocks = hub.blocks.filter((b) => b.dayOfWeek === dow);
              if (dayBlocks.length === 0) return null;
              return (
                <NeoCard key={dayName} className="gap-0 p-0">
                  <div className="flex items-center justify-between border-b-2 border-foreground bg-neo-cream px-5 py-3">
                    <h2 className="font-bold">{dayName}</h2>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {dayBlocks.length} block{dayBlocks.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="divide-y-2 divide-foreground/10">
                    {dayBlocks.map((b) => {
                      const att = b.attendance[0];
                      return (
                        <div key={b._id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-foreground bg-neo-yellow font-mono text-[10px] font-bold">
                              {fmt12(b.startHour, b.startMinute)}
                            </span>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-bold">{b.title}</p>
                                <StatusBadge status={b.type} />
                                {b.required ? <StatusBadge status="urgent">required</StatusBadge> : null}
                              </div>
                              <p className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                                {b.game} · {b.teamId ? "Assigned team" : "All teams"} · {b.durationMin} min{b.location ? ` · ${b.location}` : ""}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              {att
                                ? `${att.confirmed} confirmed · ${att.declined} out · ${att.maybe} maybe`
                                : "No confirmations yet"}
                            </span>
                            <Button size="sm" variant="outline" className={btnGhost} onClick={() => openEditBlock(b)}>
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="neo-press rounded-none border-2 border-foreground bg-neo-red text-white shadow-[2px_2px_0_0_var(--neo-ink)]"
                              onClick={() => setDeleteBlockTarget(b)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </NeoCard>
              );
            })}
          </div>
        )
      ) : (
        <div className="flex flex-col gap-6">
          {hub.scrims.length === 0 ? (
            <EmptyState
              title="No scrims yet"
              description="Propose scrim slots vs other organizations. Confirmations fire email + SMS + Discord to the roster and schedule a 3-hour reminder automatically."
              action={
                <Button className={btnYellow} onClick={openCreateScrim}>
                  <Swords className="size-4" />
                  New scrim
                </Button>
              }
            />
          ) : (
            <NeoCard className="gap-0 p-0">
              <div className="flex items-center justify-between border-b-2 border-foreground px-5 py-4">
                <h2 className="flex items-center gap-2 font-bold">
                  <Swords className="size-4" />
                  Scrim board
                </h2>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  proposed → confirmed → completed
                </span>
              </div>
              <div className="divide-y-2 divide-foreground/10">
                {hub.scrims.map((s) => (
                  <div key={s._id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold">{s.title}</p>
                          <StatusBadge status={s.status} />
                          {s.status === "completed" && s.result ? <StatusBadge status={s.result} /> : null}
                        </div>
                        <p className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          {s.opponentName} · {s.game} · {s.teamName ?? "All teams"} · {s.format ?? "TBD"} ·{" "}
                          {new Date(s.scheduledAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                        </p>
                        {s.status === "completed" && (s.scoreUs !== undefined || s.scoreThem !== undefined) ? (
                          <p className="mt-0.5 font-mono text-[11px] font-bold">
                            {s.scoreUs ?? "–"}–{s.scoreThem ?? "–"}
                            {s.vodUrl ? (
                              <>
                                {" "}
                                · <a href={s.vodUrl} target="_blank" rel="noreferrer" className="underline hover:text-muted-foreground">VOD</a>
                              </>
                            ) : null}
                          </p>
                        ) : null}
                        {s.opponentContact ? (
                          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            Contact: {s.opponentContact}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {s.status === "proposed" ? (
                        <Button size="sm" className="neo-press rounded-none border-2 border-foreground bg-neo-green text-white shadow-[2px_2px_0_0_var(--neo-ink)]" onClick={() => confirmScrim(s)}>
                          <Check className="size-3.5" />
                          Confirm
                        </Button>
                      ) : null}
                      {s.status === "confirmed" ? (
                        <Button size="sm" className={btnYellow} onClick={() => openResult(s)}>
                          <Flag className="size-3.5" />
                          Log result
                        </Button>
                      ) : null}
                      {(s.status === "proposed" || s.status === "confirmed") ? (
                        <Button size="sm" variant="outline" className={btnGhost} onClick={() => cancelScrim(s)}>
                          <X className="size-3.5" />
                          Cancel
                        </Button>
                      ) : null}
                      <Button size="sm" variant="outline" className={btnGhost} onClick={() => openEditScrim(s)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="neo-press rounded-none border-2 border-foreground bg-neo-red text-white shadow-[2px_2px_0_0_var(--neo-ink)]"
                        onClick={() => setDeleteScrimTarget(s)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </NeoCard>
          )}

          {history.length > 0 ? (
            <NeoCard className="gap-0 p-0">
              <div className="flex items-center justify-between border-b-2 border-foreground px-5 py-4">
                <h2 className="font-bold">Scrim history</h2>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  record {hub.record.wins}W–{hub.record.losses}L–{hub.record.draws}D
                </span>
              </div>
              <div className="divide-y-2 divide-foreground/10">
                {history.map((s) => (
                  <div key={s._id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">
                        {s.opponentName} <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{s.game}</span>
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {new Date(s.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        {s.vodUrl ? (
                          <>
                            {" "}
                            · <a href={s.vodUrl} target="_blank" rel="noreferrer" className="underline">VOD</a>
                          </>
                        ) : null}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-mono text-xs font-bold tabular-nums">
                        {s.scoreUs ?? "–"}–{s.scoreThem ?? "–"}
                      </span>
                      <StatusBadge status={s.result ?? "completed"} />
                    </div>
                  </div>
                ))}
              </div>
            </NeoCard>
          ) : null}
        </div>
      )}

      {/* Routine block create/edit */}
      <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none border-2 border-foreground bg-card shadow-[6px_6px_0_0_var(--neo-ink)]">
          <DialogHeader>
            <DialogTitle className="text-left text-2xl font-bold">
              {editingBlock ? `Edit ${editingBlock.title}` : "New routine block"}
            </DialogTitle>
          </DialogHeader>
          {blockError ? (
            <p className="border-2 border-foreground bg-neo-red px-3 py-2 text-sm font-bold text-white">{blockError}</p>
          ) : null}
          <div className="grid gap-4">
            <div className="flex flex-col gap-1.5">
              <span className={label}>Title</span>
              <Input className={input} value={blockForm.title} onChange={(e) => setBlockForm({ ...blockForm, title: e.target.value })} placeholder="Scrim block A" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <span className={label}>Type</span>
                <Select value={blockForm.type} onValueChange={(type) => setBlockForm({ ...blockForm, type })}>
                  <SelectTrigger className={cn(select, "w-full")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2 border-foreground">
                    {ROUTINE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className={label}>Day</span>
                <Select value={String(blockForm.dayOfWeek)} onValueChange={(d) => setBlockForm({ ...blockForm, dayOfWeek: Number(d) })}>
                  <SelectTrigger className={cn(select, "w-full")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2 border-foreground">
                    {DAY_SHORT.map((d, i) => (
                      <SelectItem key={d} value={String(i)}>{DAY_NAMES[i]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <span className={label}>Start time</span>
                <Input className={input} type="time" value={blockForm.startTime} onChange={(e) => setBlockForm({ ...blockForm, startTime: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className={label}>Duration (min)</span>
                <Input className={input} type="number" min={15} step={15} value={blockForm.durationMin} onChange={(e) => setBlockForm({ ...blockForm, durationMin: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className={label}>Game</span>
                <Select value={blockForm.game} onValueChange={(game) => setBlockForm({ ...blockForm, game })}>
                  <SelectTrigger className={cn(select, "w-full")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2 border-foreground">
                    <SelectItem value="all">All titles</SelectItem>
                    {GAMES.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <span className={label}>Team</span>
                <Select value={blockForm.teamId} onValueChange={(teamId) => setBlockForm({ ...blockForm, teamId })}>
                  <SelectTrigger className={cn(select, "w-full")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2 border-foreground">
                    <SelectItem value="all">All teams</SelectItem>
                    {teamOptions.map((t) => (
                      <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className={label}>Location</span>
                <Input className={input} value={blockForm.location} onChange={(e) => setBlockForm({ ...blockForm, location: e.target.value })} placeholder="Discord: Scrims VC" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setBlockForm({ ...blockForm, required: !blockForm.required })}
              className={cn(
                "neo-press flex items-center justify-between border-2 border-foreground px-4 py-3 text-left font-mono text-[11px] font-bold uppercase tracking-wider shadow-[2px_2px_0_0_var(--neo-ink)]",
                blockForm.required ? "bg-neo-yellow text-white" : "bg-background",
              )}
            >
              Required attendance
              {blockForm.required ? <CheckCircle2 className="size-4" /> : <X className="size-4" />}
            </button>
            <div className="flex justify-end gap-2">
              <Button variant="outline" className={btnGhost} onClick={() => setBlockOpen(false)}>Cancel</Button>
              <Button className={btnYellow} onClick={handleSaveBlock} disabled={blockSaving || !blockForm.title.trim()}>
                {blockSaving ? "Saving…" : editingBlock ? "Save changes" : "Create block"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Scrim create/edit */}
      <Dialog open={scrimOpen} onOpenChange={setScrimOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none border-2 border-foreground bg-card shadow-[6px_6px_0_0_var(--neo-ink)]">
          <DialogHeader>
            <DialogTitle className="text-left text-2xl font-bold">
              {editingScrim ? `Edit scrim — ${editingScrim.opponentName}` : "New scrim"}
            </DialogTitle>
          </DialogHeader>
          {scrimError ? (
            <p className="border-2 border-foreground bg-neo-red px-3 py-2 text-sm font-bold text-white">{scrimError}</p>
          ) : null}
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <span className={label}>Title</span>
                <Input className={input} value={scrimForm.title} onChange={(e) => setScrimForm({ ...scrimForm, title: e.target.value })} placeholder="Practice scrim" />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className={label}>Game</span>
                <Select value={scrimForm.game} onValueChange={(game) => setScrimForm({ ...scrimForm, game })}>
                  <SelectTrigger className={cn(select, "w-full")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2 border-foreground">
                    {GAMES.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <span className={label}>Opponent *</span>
                <Input className={input} value={scrimForm.opponentName} onChange={(e) => setScrimForm({ ...scrimForm, opponentName: e.target.value })} placeholder="Faze Clan" />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className={label}>Opponent contact</span>
                <Input className={input} value={scrimForm.opponentContact} onChange={(e) => setScrimForm({ ...scrimForm, opponentContact: e.target.value })} placeholder="Discord / email" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <span className={label}>Team</span>
                <Select value={scrimForm.teamId} onValueChange={(teamId) => setScrimForm({ ...scrimForm, teamId })}>
                  <SelectTrigger className={cn(select, "w-full")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2 border-foreground">
                    <SelectItem value="none">All teams</SelectItem>
                    {teamOptions.map((t) => (
                      <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className={label}>Format</span>
                <Select value={scrimForm.format} onValueChange={(format) => setScrimForm({ ...scrimForm, format })}>
                  <SelectTrigger className={cn(select, "w-full")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2 border-foreground">
                    {SCRIM_FORMATS.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="flex flex-col gap-1.5">
                <span className={label}>Date</span>
                <Input className={input} type="date" value={scrimForm.date} onChange={(e) => setScrimForm({ ...scrimForm, date: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className={label}>Time</span>
                <Input className={input} type="time" value={scrimForm.time} onChange={(e) => setScrimForm({ ...scrimForm, time: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className={label}>Duration (min)</span>
                <Input className={input} type="number" min={15} step={15} value={scrimForm.durationMin} onChange={(e) => setScrimForm({ ...scrimForm, durationMin: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className={label}>Timezone</span>
                <div className="flex h-9 items-center border-2 border-foreground bg-neo-cream px-3 font-mono text-[10px] font-bold uppercase">
                  {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={label}>Notes</span>
              <Textarea className="rounded-none border-2 border-foreground bg-background" value={scrimForm.notes} onChange={(e) => setScrimForm({ ...scrimForm, notes: e.target.value })} placeholder="Map pool, rules, VOD review plan…" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" className={btnGhost} onClick={() => setScrimOpen(false)}>Cancel</Button>
              <Button className={btnYellow} onClick={handleSaveScrim} disabled={scrimSaving || !scrimForm.title.trim() || !scrimForm.opponentName.trim()}>
                {scrimSaving ? "Saving…" : editingScrim ? "Save changes" : "Propose scrim"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Log result */}
      <Dialog open={!!resultScrim} onOpenChange={(o) => !o && setResultScrim(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none border-2 border-foreground bg-card shadow-[6px_6px_0_0_var(--neo-ink)]">
          <DialogHeader>
            <DialogTitle className="text-left text-2xl font-bold">
              Log result — {resultScrim?.opponentName}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="flex flex-col gap-1.5">
              <span className={label}>Result</span>
              <Select value={resultForm.result} onValueChange={(result) => setResultForm({ ...resultForm, result })}>
                <SelectTrigger className={cn(select, "w-full")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none border-2 border-foreground">
                  <SelectItem value="win">Win</SelectItem>
                  <SelectItem value="loss">Loss</SelectItem>
                  <SelectItem value="draw">Draw</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <span className={label}>Our score</span>
                <Input className={input} type="number" min={0} value={resultForm.scoreUs} onChange={(e) => setResultForm({ ...resultForm, scoreUs: e.target.value })} placeholder="2" />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className={label}>Their score</span>
                <Input className={input} type="number" min={0} value={resultForm.scoreThem} onChange={(e) => setResultForm({ ...resultForm, scoreThem: e.target.value })} placeholder="1" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={label}>VOD link</span>
              <Input className={input} value={resultForm.vodUrl} onChange={(e) => setResultForm({ ...resultForm, vodUrl: e.target.value })} placeholder="https://youtube.com/…" />
            </div>
            <p className="border-2 border-foreground bg-neo-cream px-3 py-2 text-xs text-muted-foreground">
              Logging the result updates the org record, notifies the roster and publishes it on the public schedule page — in real time.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" className={btnGhost} onClick={() => setResultScrim(null)}>Cancel</Button>
              <Button className={btnYellow} onClick={handleLogResult} disabled={!resultForm.result}>
                <Flag className="size-4" />
                Log result
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete block */}
      <AlertDialog open={!!deleteBlockTarget} onOpenChange={(o) => !o && setDeleteBlockTarget(null)}>
        <AlertDialogContent className="rounded-none border-2 border-foreground bg-card shadow-[6px_6px_0_0_var(--neo-ink)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Delete "{deleteBlockTarget?.title}"?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              The block is removed from every player's schedule and its confirmations are cleared.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none border-2 border-foreground bg-card shadow-[2px_2px_0_0_var(--neo-ink)]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="neo-press rounded-none border-2 border-foreground bg-neo-red text-white shadow-[3px_3px_0_0_var(--neo-ink)]"
              onClick={async () => {
                if (deleteBlockTarget) await deleteBlock({ blockId: deleteBlockTarget._id });
                setDeleteBlockTarget(null);
              }}
            >
              <Trash2 className="size-4" />
              Delete block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete scrim */}
      <AlertDialog open={!!deleteScrimTarget} onOpenChange={(o) => !o && setDeleteScrimTarget(null)}>
        <AlertDialogContent className="rounded-none border-2 border-foreground bg-card shadow-[6px_6px_0_0_var(--neo-ink)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Delete scrim vs {deleteScrimTarget?.opponentName}?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This removes the scrim completely. Use Cancel instead if it simply fell through.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none border-2 border-foreground bg-card shadow-[2px_2px_0_0_var(--neo-ink)]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="neo-press rounded-none border-2 border-foreground bg-neo-red text-white shadow-[3px_3px_0_0_var(--neo-ink)]"
              onClick={async () => {
                if (deleteScrimTarget) await deleteScrim({ scrimId: deleteScrimTarget._id });
                setDeleteScrimTarget(null);
              }}
            >
              <Trash2 className="size-4" />
              Delete scrim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
