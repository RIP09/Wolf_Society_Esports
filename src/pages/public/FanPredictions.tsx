import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { EmptyState, PageHeader, StatusBadge } from "@/components/neo";
import { useVoterKey } from "@/hooks/use-voter-key";
import { fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Check, Loader2, LineChart, Trophy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const ACCENTS = ["bg-neo-yellow", "bg-neo-blue", "bg-neo-green", "bg-neo-orange", "bg-neo-purple", "bg-neo-red"];

export default function FanPredictions() {
  const voterKey = useVoterKey();
  const predictions = useQuery(api.fanZone.listPredictions, { voterKey });
  const cast = useMutation(api.fanZone.castPrediction);
  const [busy, setBusy] = useState<string | null>(null);

  const handleCast = async (predictionId: string, choiceIndex: number) => {
    if (busy) return;
    setBusy(predictionId);
    try {
      const res = await cast({ predictionId: predictionId as Id<"predictions">, choiceIndex });
      toast.success(
        res.xp > 0
          ? `Prediction locked in — +${res.xp} XP. Win it for +10 more when it settles.`
          : "Prediction locked in. Sign in to earn XP.",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place your prediction.");
    } finally {
      setBusy(null);
    }
  };

  const open = predictions?.filter((p) => p.status === "open") ?? [];
  const settled = predictions?.filter((p) => p.status === "settled") ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Fan Zone · FZ-03"
        title="Predictions"
        description="Call the outcome before the match. +2 XP for every entry, +10 more when your call is right."
        actions={
          <StatusBadge status="live">
            <LineChart className="size-3" />
            {open.length} open
          </StatusBadge>
        }
      />

      <div className="mt-8 flex flex-col gap-8">
        {!predictions ? (
          <div className="grid gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse border-2 border-foreground bg-card" />
            ))}
          </div>
        ) : (
          <>
            {/* Open predictions */}
            <section>
              <h2 className="mb-4 text-xl font-bold tracking-tight">Open — place your call</h2>
              {open.length === 0 ? (
                <EmptyState
                  title="No open predictions"
                  description="When a big match is announced, management opens predictions here. You'll get +2 XP just for entering."
                />
              ) : (
                <div className="flex flex-col gap-6">
                  {open.map((p, pi) => {
                    const total = p.totalEntries;
                    return (
                      <motion.div
                        key={p._id}
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-40px" }}
                        transition={{ type: "spring", stiffness: 130, damping: 18 }}
                      >
                        <div className="border-2 border-foreground bg-card shadow-[5px_5px_0_0_var(--neo-ink)]">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-foreground bg-neo-cream px-5 py-3">
                            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                              Prediction {String(pi + 1).padStart(2, "0")}
                            </p>
                            {p.endsAt ? (
                              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                Closes {fmtDateTime(p.endsAt)}
                              </p>
                            ) : (
                              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                {total.toLocaleString()} {total === 1 ? "fan" : "fans"} in
                              </p>
                            )}
                          </div>
                          <div className="p-5">
                            <h3 className="text-xl font-bold leading-snug tracking-tight">{p.title}</h3>
                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                              {p.options.map((option, oi) => {
                                const isMine = p.myEntry?.choiceIndex === oi;
                                return (
                                  <button
                                    key={oi}
                                    type="button"
                                    disabled={p.myEntry !== null || busy === p._id}
                                    onClick={() => void handleCast(p._id, oi)}
                                    className={cn(
                                      "group flex items-center justify-between gap-3 border-2 border-foreground bg-background px-4 py-3 text-left font-bold transition-all",
                                      p.myEntry === null &&
                                        "hover:translate-x-1 hover:shadow-[3px_3px_0_0_var(--neo-ink)]",
                                      p.myEntry !== null && "cursor-default",
                                      isMine && "bg-neo-green text-white",
                                      p.myEntry !== null && !isMine && "opacity-50",
                                    )}
                                  >
                                    <span className="flex items-center gap-2">
                                      {isMine && <Check className="size-4" />}
                                      {option}
                                    </span>
                                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground">
                                      {p.myEntry === null ? (busy === p._id ? <Loader2 className="size-3.5 animate-spin" /> : "Pick ▸") : "+2 XP"}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                            {p.myEntry ? (
                              <p className="mt-4 border-2 border-foreground bg-neo-green px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-white">
                                Locked in — +2 XP banked. +10 more if you're right.
                              </p>
                            ) : (
                              <p className="mt-4 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                Pick an outcome to lock your prediction
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Settled predictions */}
            {settled.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold tracking-tight">
                  <Trophy className="size-5" />
                  Settled — results are in
                </h2>
                <div className="flex flex-col gap-4">
                  {settled.map((p) => (
                    <div key={p._id} className="border-2 border-foreground bg-card shadow-[4px_4px_0_0_var(--neo-ink)]">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-foreground bg-neo-cream px-5 py-3">
                        <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          {p.settledAt ? `Settled ${fmtDateTime(p.settledAt)}` : "Settled"}
                        </p>
                        <StatusBadge status="win">
                          <Trophy className="size-3" />
                          {p.totalEntries.toLocaleString()} entries
                        </StatusBadge>
                      </div>
                      <div className="p-5">
                        <h3 className="text-lg font-bold leading-snug tracking-tight">{p.title}</h3>
                        <div className="mt-4 flex flex-col gap-2">
                          {p.options.map((option, oi) => {
                            const isCorrect = p.correctIndex === oi;
                            const isMine = p.myEntry?.choiceIndex === oi;
                            const pct = p.totalEntries > 0 ? Math.round(((p.counts[oi] ?? 0) / p.totalEntries) * 100) : 0;
                            return (
                              <div
                                key={oi}
                                className={cn(
                                  "relative overflow-hidden border-2 border-foreground",
                                  isCorrect ? "bg-neo-green" : "bg-background",
                                  isMine && !isCorrect && "bg-neo-red",
                                )}
                              >
                                <span
                                  className={cn(
                                    "absolute inset-y-0 left-0 opacity-20",
                                    ACCENTS[oi % ACCENTS.length],
                                  )}
                                  style={{ width: `${pct}%` }}
                                />
                                <span className="relative flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-bold">
                                  <span className="flex items-center gap-2">
                                    {isCorrect && <Check className="size-4" />}
                                    {option}
                                    {isMine && (
                                      <span className="border border-foreground px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest">
                                        Your pick
                                      </span>
                                    )}
                                  </span>
                                  <span className="font-mono text-[11px] font-bold tabular-nums">
                                    {pct}% · {p.counts[oi] ?? 0}
                                  </span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        {p.myEntry ? (
                          <p
                            className={cn(
                              "mt-4 flex items-center gap-2 border-2 border-foreground px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest",
                              p.myEntry.correct ? "bg-neo-green text-white" : "bg-neo-red text-white",
                            )}
                          >
                            {p.myEntry.correct ? (
                              <>
                                <Check className="size-3.5" />
                                You called it — {p.myEntry.pointsEarned} XP total
                              </>
                            ) : (
                              <>
                                <Trophy className="size-3.5" />
                                Not this time — entry XP kept ({p.myEntry.pointsEarned} XP)
                              </>
                            )}
                          </p>
                        ) : (
                          <p className="mt-4 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            You didn't enter this one
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
