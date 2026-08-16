import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, NeoCard, PageHeader, StatusBadge } from "@/components/neo";
import { btnGhost, btnYellow, input } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  BarChart3,
  BrainCircuit,
  Check,
  LineChart,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";

type Tab = "polls" | "trivia" | "predictions";

const ACCENTS = ["bg-neo-yellow", "bg-neo-blue", "bg-neo-green", "bg-neo-orange", "bg-neo-purple", "bg-neo-red"];

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 border-2 border-foreground px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest transition-colors",
        active ? "bg-neo-yellow text-white shadow-[3px_3px_0_0_var(--neo-ink)]" : "bg-card hover:bg-neo-cream",
      )}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[11px] font-bold uppercase tracking-wider">{label}</span>
      {children}
    </label>
  );
}

export default function AdminFanZone() {
  const data = useQuery(api.fanZone.adminOverview);
  const [tab, setTab] = useState<Tab>("polls");

  // Poll form
  const [pollQ, setPollQ] = useState("");
  const [pollOptions, setPollOptions] = useState("");
  const createPoll = useMutation(api.fanZone.createPoll);
  const deletePoll = useMutation(api.fanZone.deletePoll);

  // Trivia form
  const [triQ, setTriQ] = useState("");
  const [triOptions, setTriOptions] = useState("");
  const [triCorrect, setTriCorrect] = useState("0");
  const [triPoints, setTriPoints] = useState("10");
  const createTrivia = useMutation(api.fanZone.createTrivia);
  const deleteTrivia = useMutation(api.fanZone.deleteTrivia);
  const toggleTrivia = useMutation(api.fanZone.toggleTrivia);

  // Prediction form
  const [predTitle, setPredTitle] = useState("");
  const [predOptions, setPredOptions] = useState("");
  const createPrediction = useMutation(api.fanZone.createPrediction);
  const deletePrediction = useMutation(api.fanZone.deletePrediction);
  const settlePrediction = useMutation(api.fanZone.settlePrediction);

  const [busy, setBusy] = useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<{ ok: boolean }>, success: string) => {
    if (busy) return;
    setBusy(key);
    try {
      await fn();
      toast.success(success);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(null);
    }
  };

  const submitPoll = (e: React.FormEvent) => {
    e.preventDefault();
    const options = pollOptions.split("\n").map((o) => o.trim()).filter(Boolean);
    void run("poll", () => createPoll({ question: pollQ, options }), "Poll published to the Fan Zone.");
    setPollQ("");
    setPollOptions("");
  };

  const submitTrivia = (e: React.FormEvent) => {
    e.preventDefault();
    const options = triOptions.split("\n").map((o) => o.trim()).filter(Boolean);
    const correctIndex = Math.max(0, Math.min(options.length - 1, Number(triCorrect) || 0));
    void run(
      "trivia",
      () => createTrivia({ question: triQ, options, correctIndex, points: Number(triPoints) || 10 }),
      "Trivia question published.",
    );
    setTriQ("");
    setTriOptions("");
    setTriCorrect("0");
    setTriPoints("10");
  };

  const submitPrediction = (e: React.FormEvent) => {
    e.preventDefault();
    const options = predOptions.split("\n").map((o) => o.trim()).filter(Boolean);
    void run("prediction", () => createPrediction({ title: predTitle, options }), "Prediction opened to fans.");
    setPredTitle("");
    setPredOptions("");
  };

  return (
    <div>
      <PageHeader
        eyebrow="The Den · Community"
        title="Fan Zone"
        description="Publish polls, trivia and predictions for the public portal. Everything updates live for fans."
        actions={
          <div className="flex flex-wrap gap-2">
            <TabButton active={tab === "polls"} onClick={() => setTab("polls")}>
              <BarChart3 className="size-3.5" />
              Polls
            </TabButton>
            <TabButton active={tab === "trivia"} onClick={() => setTab("trivia")}>
              <BrainCircuit className="size-3.5" />
              Trivia
            </TabButton>
            <TabButton active={tab === "predictions"} onClick={() => setTab("predictions")}>
              <LineChart className="size-3.5" />
              Predictions
            </TabButton>
          </div>
        }
      />

      {!data ? (
        <div className="mt-8 h-64 animate-pulse border-2 border-foreground bg-card" />
      ) : tab === "polls" ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
          {/* Create */}
          <NeoCard className="gap-4 p-5">
            <p className="flex items-center gap-2 text-lg font-bold">
              <Plus className="size-4" />
              New poll
            </p>
            <form onSubmit={submitPoll} className="flex flex-col gap-3">
              <Field label="Question *">
                <Input
                  className={input}
                  value={pollQ}
                  onChange={(e) => setPollQ(e.target.value)}
                  placeholder="Who wins the next match?"
                  required
                />
              </Field>
              <Field label="Options — one per line (2–8) *">
                <Textarea
                  className="min-h-32 rounded-none border-2 border-foreground bg-background"
                  value={pollOptions}
                  onChange={(e) => setPollOptions(e.target.value)}
                  placeholder={"Wolf Society\nThe challengers"}
                  required
                />
              </Field>
              <Button type="submit" className={btnYellow} disabled={busy === "poll" || !pollQ.trim() || pollOptions.split("\n").filter((o) => o.trim()).length < 2}>
                {busy === "poll" ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                Publish poll
              </Button>
            </form>
          </NeoCard>

          {/* List */}
          <div className="flex flex-col gap-4">
            {data.polls.length === 0 ? (
              <EmptyState title="No polls yet" description="Publish your first poll for the fans." />
            ) : (
              data.polls.map((p) => {
                const max = Math.max(1, ...p.counts);
                return (
                  <NeoCard key={p._id} className="gap-3 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold">{p.question}</p>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={p.active ? "live" : "pending"}>{p.active ? "Live" : "Closed"}</StatusBadge>
                        <span className="font-mono text-[10px] font-bold text-muted-foreground">
                          {p.totalVotes} votes
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-none border-2 border-foreground bg-neo-red px-2 py-1 text-white hover:bg-neo-red/90"
                          onClick={() => void run(`del-poll-${p._id}`, () => deletePoll({ pollId: p._id as Id<"polls"> }), "Poll deleted.")}
                          disabled={busy === `del-poll-${p._id}`}
                        >
                          {busy === `del-poll-${p._id}` ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {p.options.map((o, oi) => (
                        <div key={oi} className="relative overflow-hidden border-2 border-foreground bg-background">
                          <span className={cn("absolute inset-y-0 left-0 opacity-25", ACCENTS[oi % ACCENTS.length])} style={{ width: `${max > 0 ? (p.counts[oi] / max) * 100 : 0}%` }} />
                          <span className="relative flex items-center justify-between px-3 py-2 text-sm">
                            <span className="font-bold">{o}</span>
                            <span className="font-mono text-[11px] font-bold tabular-nums">
                              {p.counts[oi]} ({p.totalVotes > 0 ? Math.round((p.counts[oi] / p.totalVotes) * 100) : 0}%)
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </NeoCard>
                );
              })
            )}
          </div>
        </div>
      ) : tab === "trivia" ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
          {/* Create */}
          <NeoCard className="gap-4 p-5">
            <p className="flex items-center gap-2 text-lg font-bold">
              <Plus className="size-4" />
              New trivia question
            </p>
            <form onSubmit={submitTrivia} className="flex flex-col gap-3">
              <Field label="Question *">
                <Input
                  className={input}
                  value={triQ}
                  onChange={(e) => setTriQ(e.target.value)}
                  placeholder="Which year did Wolf Society win its first title?"
                  required
                />
              </Field>
              <Field label="Options — one per line (2–6) *">
                <Textarea
                  className="min-h-28 rounded-none border-2 border-foreground bg-background"
                  value={triOptions}
                  onChange={(e) => setTriOptions(e.target.value)}
                  placeholder={"2022\n2023\n2024"}
                  required
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Correct option (0 = first)">
                  <Input
                    className={input}
                    type="number"
                    min={0}
                    value={triCorrect}
                    onChange={(e) => setTriCorrect(e.target.value)}
                    required
                  />
                </Field>
                <Field label="Points on correct">
                  <Input
                    className={input}
                    type="number"
                    min={1}
                    max={50}
                    value={triPoints}
                    onChange={(e) => setTriPoints(e.target.value)}
                    required
                  />
                </Field>
              </div>
              <Button type="submit" className={btnYellow} disabled={busy === "trivia" || !triQ.trim() || triOptions.split("\n").filter((o) => o.trim()).length < 2}>
                {busy === "trivia" ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                Publish question
              </Button>
            </form>
          </NeoCard>

          {/* List */}
          <div className="flex flex-col gap-4">
            {data.trivia.length === 0 ? (
              <EmptyState title="No trivia yet" description="Publish questions the fans can answer for XP." />
            ) : (
              data.trivia.map((q) => (
                <NeoCard key={q._id} className="gap-3 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold">{q.question}</p>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={q.active ? "live" : "pending"}>{q.active ? "Live" : "Paused"}</StatusBadge>
                      <span className="font-mono text-[10px] font-bold text-muted-foreground">
                        {q.correctCount}/{q.answeredCount} correct · {q.points} XP
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-none border-2 border-foreground bg-card px-2 py-1 text-xs font-bold"                          onClick={() =>
                            void run(`tog-${q._id}`, () => toggleTrivia({ questionId: q._id as Id<"triviaQuestions">, active: !q.active }), q.active ? "Question paused." : "Question live again.")
                          }
                        disabled={busy === `tog-${q._id}`}
                      >
                        {q.active ? "Pause" : "Activate"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-none border-2 border-foreground bg-neo-red px-2 py-1 text-white hover:bg-neo-red/90"
                        onClick={() => void run(`del-${q._id}`, () => deleteTrivia({ questionId: q._id as Id<"triviaQuestions"> }), "Question deleted.")}
                        disabled={busy === `del-${q._id}`}
                      >
                        {busy === `del-${q._id}` ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {q.options.map((o, oi) => (
                      <div
                        key={oi}
                        className={cn(
                          "flex items-center justify-between border-2 border-foreground px-3 py-1.5 text-sm",
                          oi === q.correctIndex ? "bg-neo-green text-white" : "bg-background",
                        )}
                      >
                        <span className="flex items-center gap-2 font-bold">
                          {oi === q.correctIndex && <Check className="size-3.5" />}
                          {o}
                        </span>
                        <span className="font-mono text-[10px] font-bold">
                          {oi === q.correctIndex ? "Correct" : String.fromCharCode(65 + oi)}
                        </span>
                      </div>
                    ))}
                  </div>
                </NeoCard>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
          {/* Create */}
          <NeoCard className="gap-4 p-5">
            <p className="flex items-center gap-2 text-lg font-bold">
              <Plus className="size-4" />
              New prediction
            </p>
            <form onSubmit={submitPrediction} className="flex flex-col gap-3">
              <Field label="Title *">
                <Input
                  className={input}
                  value={predTitle}
                  onChange={(e) => setPredTitle(e.target.value)}
                  placeholder="Wolf Society vs The Challengers — who wins?"
                  required
                />
              </Field>
              <Field label="Outcomes — one per line (2–8) *">
                <Textarea
                  className="min-h-28 rounded-none border-2 border-foreground bg-background"
                  value={predOptions}
                  onChange={(e) => setPredOptions(e.target.value)}
                  placeholder={"Wolf Society\n2-0\nThe challengers"}
                  required
                />
              </Field>
              <p className="text-xs text-muted-foreground">
                Fans get +2 XP for entering, +10 more when settled correctly. Settle after the result is known.
              </p>
              <Button type="submit" className={btnYellow} disabled={busy === "prediction" || !predTitle.trim() || predOptions.split("\n").filter((o) => o.trim()).length < 2}>
                {busy === "prediction" ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                Open prediction
              </Button>
            </form>
          </NeoCard>

          {/* List */}
          <div className="flex flex-col gap-4">
            {data.predictions.length === 0 ? (
              <EmptyState title="No predictions yet" description="Open a prediction before the next match." />
            ) : (
              data.predictions.map((p) => (
                <NeoCard key={p._id} className="gap-3 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold">{p.title}</p>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={p.status === "open" ? "live" : "win"}>{p.status === "open" ? "Open" : "Settled"}</StatusBadge>
                      <span className="font-mono text-[10px] font-bold text-muted-foreground">
                        {p.totalEntries} entries · {p.correctEntries} right
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-none border-2 border-foreground bg-neo-red px-2 py-1 text-white hover:bg-neo-red/90"
                        onClick={() => void run(`del-p-${p._id}`, () => deletePrediction({ predictionId: p._id as Id<"predictions"> }), "Prediction deleted.")}
                        disabled={busy === `del-p-${p._id}`}
                      >
                        {busy === `del-p-${p._id}` ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {p.options.map((o, oi) => (
                      <div
                        key={oi}
                        className={cn(
                          "flex items-center justify-between border-2 border-foreground px-3 py-2 text-sm",
                          p.status === "settled" && oi === p.correctIndex ? "bg-neo-green text-white" : "bg-background",
                        )}
                      >
                        <span className="flex items-center gap-2 font-bold">
                          {p.status === "settled" && oi === p.correctIndex && <Check className="size-3.5" />}
                          {o}
                        </span>
                        <span className="flex items-center gap-2 font-mono text-[11px] font-bold tabular-nums">
                          {p.counts[oi]} picks
                          {p.status === "open" ? (
                            <button
                              type="button"
                              className="border-2 border-foreground bg-neo-cream px-1.5 py-0.5 text-[9px] uppercase tracking-wider hover:bg-neo-yellow hover:text-white"
                              onClick={() =>
                                void run(`settle-${p._id}`, () => settlePrediction({ predictionId: p._id as Id<"predictions">, correctIndex: oi }), `Settled — option "${o}" won. Correct fans earned +10 XP.`)
                              }
                              disabled={busy === `settle-${p._id}`}
                              title="Settle with this outcome"
                            >
                              {busy === `settle-${p._id}` ? "…" : "Set as result"}
                            </button>
                          ) : null}
                        </span>
                      </div>
                    ))}
                  </div>
                </NeoCard>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
