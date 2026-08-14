import { api } from "@/convex/_generated/api";
import { OptionPicker } from "@/components/GamePicker";
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
import { LoadingScreen } from "@/components/Loading";
import { fmtKd } from "@/lib/format";
import { btnGhost, btnYellow, input, label, select } from "@/lib/neo";
import { useMutation, useQuery } from "convex/react";
import { ClipboardList, Loader2, Send, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

const GAME_OPTIONS = [
  "Valorant",
  "Counter-Strike 2",
  "Apex Legends",
  "Overwatch 2",
  "Rainbow Six Siege",
  "League of Legends",
  "Dota 2",
  "Fortnite",
  "PUBG: Battlegrounds",
  "Call of Duty: Warzone",
  "Call of Duty: Mobile",
  "Free Fire",
  "Rocket League",
  "EA Sports FC 25",
  "NBA 2K25",
  "Street Fighter 6",
  "Tekken 8",
  "Super Smash Bros. Ultimate",
  "Minecraft Championship",
  "Genshin Impact",
  "Clash Royale",
  "Other",
] as const;

export default function PlayerMatchReports() {
  const reports = useQuery(api.attendance.myMatchReports);

  const [game, setGame] = useState("Valorant");
  const [opponent, setOpponent] = useState("");
  const [result, setResult] = useState<"win" | "loss" | "draw">("win");
  const [kills, setKills] = useState("0");
  const [deaths, setDeaths] = useState("0");
  const [assists, setAssists] = useState("0");
  const [damage, setDamage] = useState("");
  const [rating, setRating] = useState("7");
  const [rolePlayed, setRolePlayed] = useState("");
  const [highlights, setHighlights] = useState("");
  const [improvement, setImprovement] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<Id<"matchReports"> | null>(null);

  const submitReport = useMutation(api.attendance.submitMatchReport);
  const removeReport = useMutation(api.attendance.removeMatchReport);

  if (reports === undefined) return <LoadingScreen label="Loading reports…" />;

  const num = (s: string) => {
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!game.trim()) {
      toast.error("Choose the game you played.");
      return;
    }
    setSubmitting(true);
    try {
      await submitReport({
        game,
        opponent: opponent.trim() || undefined,
        result,
        kills: num(kills),
        deaths: num(deaths),
        assists: num(assists),
        damage: damage ? num(damage) : undefined,
        rating: num(rating),
        rolePlayed: rolePlayed.trim() || undefined,
        highlights: highlights.trim() || undefined,
        improvement: improvement.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      toast.success("Match report submitted — management can see it live.");
      setOpponent("");
      setKills("0");
      setDeaths("0");
      setAssists("0");
      setDamage("");
      setHighlights("");
      setImprovement("");
      setNotes("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: Id<"matchReports">) => {
    if (removingId) return;
    setRemovingId(id);
    try {
      await removeReport({ reportId: id });
      toast.success("Report deleted.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Wolf Society Esports · The Pack"
        title="Match Reports"
        description="After every match or scrim, fill in exactly what happened and how you performed. The full report goes straight to management in real time — no middlemen."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Report form */}
        <NeoCard className="gap-5 p-6 lg:col-span-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center border-2 border-foreground bg-neo-yellow text-white">
              <ClipboardList className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold">New match report</h2>
              <p className="text-xs text-muted-foreground">
                Be honest and detailed — this is how coaches improve the roster.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <span className={label}>Game</span>
              <OptionPicker
                options={GAME_OPTIONS}
                value={game}
                onChange={setGame}
                placeholder="Choose your title…"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={label}>Opponent / team</span>
              <Input className={input} value={opponent} onChange={(e) => setOpponent(e.target.value)} placeholder="e.g. Team Alpha (or 'Solo queue')" />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={label}>Result</span>
              <Select value={result} onValueChange={(val) => setResult(val as typeof result)}>
                <SelectTrigger className={select}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="win">Win</SelectItem>
                  <SelectItem value="loss">Loss</SelectItem>
                  <SelectItem value="draw">Draw</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={label}>Role played</span>
              <Input className={input} value={rolePlayed} onChange={(e) => setRolePlayed(e.target.value)} placeholder="e.g. Duelist, IGL, AWPer…" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <span className={label}>Kills</span>
              <Input className={input} type="number" min={0} value={kills} onChange={(e) => setKills(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={label}>Deaths</span>
              <Input className={input} type="number" min={0} value={deaths} onChange={(e) => setDeaths(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={label}>Assists</span>
              <Input className={input} type="number" min={0} value={assists} onChange={(e) => setAssists(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={label}>Damage (optional)</span>
              <Input className={input} type="number" min={0} value={damage} onChange={(e) => setDamage(e.target.value)} placeholder="—" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className={label}>Self rating (1–10)</span>
            <Select value={rating} onValueChange={setRating}>
              <SelectTrigger className={select}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} / 10 — {n >= 9 ? "carried" : n >= 7 ? "solid" : n >= 5 ? "average" : "off day"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className={label}>Highlights — what did you do well?</span>
            <Textarea value={highlights} onChange={(e) => setHighlights(e.target.value)} rows={3} placeholder="Clutches, entries, shotcalling, utility usage, rotations…" />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className={label}>What to improve — be honest</span>
            <Textarea value={improvement} onChange={(e) => setImprovement(e.target.value)} rows={3} placeholder="Aim, positioning, comms, economy, decision-making…" />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className={label}>Notes for the coach</span>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Anything else — team coordination, map reads, your mental state…" />
          </div>

          <Button className={`${btnYellow} w-full`} onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {submitting ? "Submitting…" : "Submit match report"}
          </Button>
        </NeoCard>

        {/* My reports */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <NeoCard className="gap-0 p-0">
            <div className="flex items-center justify-between border-b-2 border-foreground px-5 py-4">
              <h2 className="font-bold">My reports</h2>
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {reports.length} submitted
              </span>
            </div>
            {reports.length === 0 ? (
              <EmptyState
                title="No reports yet"
                description="Play a match or scrim, then submit your first report — management is watching."
              />
            ) : (
              <div className="flex flex-col divide-y-2 divide-foreground/10">
                {reports.map((r) => (
                  <div key={r._id} className="flex flex-col gap-1.5 px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-bold">
                        {r.game}
                        {r.opponent ? ` vs ${r.opponent}` : ""}
                      </p>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={r.result}>{r.result}</StatusBadge>
                        <button
                          type="button"
                          onClick={() => handleRemove(r._id)}
                          disabled={removingId === r._id}
                          className="border-2 border-foreground bg-card p-1 text-foreground transition-colors hover:bg-neo-red hover:text-white disabled:opacity-50"
                          aria-label="Delete report"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {fmtKd(r.kills, r.deaths)} · {r.kills}K / {r.deaths}D / {r.assists}A
                      {r.damage ? ` · ${r.damage.toLocaleString()} dmg` : ""}
                      {r.rating ? (
                        <span className="ml-2 inline-flex items-center gap-0.5">
                          <Star className="size-3 fill-current" /> {r.rating}/10
                        </span>
                      ) : null}
                    </p>
                    {r.highlights ? <p className="text-xs text-muted-foreground"><strong className="text-foreground">Well:</strong> {r.highlights}</p> : null}
                    {r.improvement ? <p className="text-xs text-muted-foreground"><strong className="text-foreground">Improve:</strong> {r.improvement}</p> : null}
                    {r.notes ? <p className="text-xs italic text-muted-foreground">“{r.notes}”</p> : null}
                    <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">
                      {new Date(r.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · {new Date(r.submittedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </NeoCard>

          <NeoCard className="gap-2 p-5">
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              How this helps you
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>Every report reaches management instantly — email + Discord + The Den.</li>
              <li>Coaches see your consistency, self-rating and highlighted strengths.</li>
              <li>Your form feeds your player dashboard and public performance stats.</li>
            </ul>
          </NeoCard>
        </div>
      </div>
    </div>
  );
}
