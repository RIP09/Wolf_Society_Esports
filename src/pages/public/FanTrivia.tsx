import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { EmptyState, PageHeader, StatusBadge } from "@/components/neo";
import { useVoterKey } from "@/hooks/use-voter-key";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { BrainCircuit, Check, Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function FanTrivia() {
  const voterKey = useVoterKey();
  const trivia = useQuery(api.fanZone.listTrivia, { voterKey });
  const answer = useMutation(api.fanZone.answerTrivia);
  const [busy, setBusy] = useState<string | null>(null);

  const handleAnswer = async (questionId: string, choiceIndex: number) => {
    if (busy) return;
    setBusy(questionId);
    try {
      const res = await answer({ questionId: questionId as Id<"triviaQuestions">, choiceIndex });
      if (res.correct) {
        toast.success(
          res.pointsEarned > 0
            ? `Correct! +${res.pointsEarned} XP`
            : "Correct! Sign in to earn XP for right answers.",
        );
      } else {
        toast.error("Not quite — 0 XP this time, but there are more questions to answer.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit your answer.");
    } finally {
      setBusy(null);
    }
  };

  const answered = trivia?.filter((q) => q.myAnswer).length ?? 0;
  const correct = trivia?.filter((q) => q.myAnswer?.correct).length ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Fan Zone · FZ-02"
        title="Trivia"
        description="Test your Wolf Society knowledge. First answer counts — right answers earn points, wrong ones teach you something."
        actions={
          trivia && trivia.length > 0 ? (
            <StatusBadge status={correct === answered && answered > 0 ? "win" : "live"}>
              <BrainCircuit className="size-3" />
              {correct}/{answered} correct
            </StatusBadge>
          ) : undefined
        }
      />

      <div className="mt-8 flex flex-col gap-6">
        {!trivia ? (
          <div className="grid gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse border-2 border-foreground bg-card" />
            ))}
          </div>
        ) : trivia.length === 0 ? (
          <EmptyState
            title="No trivia live right now"
            description="New questions drop before big matches and events. Follow the announcements to know when the next set goes live."
          />
        ) : (
          trivia.map((q, qi) => {
            const my = q.myAnswer;
            return (
              <motion.div
                key={q._id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ type: "spring", stiffness: 130, damping: 18 }}
              >
                <div className="border-2 border-foreground bg-card shadow-[5px_5px_0_0_var(--neo-ink)]">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-foreground bg-neo-cream px-5 py-3">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Question {String(qi + 1).padStart(2, "0")}
                    </p>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={my ? (my.correct ? "win" : "loss") : "pending"}>
                        {my ? (my.correct ? "Correct" : "Missed") : `${q.points} XP`}
                      </StatusBadge>
                      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {q.answeredCount.toLocaleString()} answered
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h2 className="text-xl font-bold leading-snug tracking-tight">{q.question}</h2>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {q.options.map((option, oi) => {
                        const isMyPick = my?.choiceIndex === oi;
                        return (
                          <button
                            key={oi}
                            type="button"
                            disabled={my !== null || busy === q._id}
                            onClick={() => void handleAnswer(q._id, oi)}
                            className={cn(
                              "group flex items-center justify-between gap-3 border-2 border-foreground bg-background px-4 py-3 text-left font-bold transition-all",
                              my === null &&
                                "hover:translate-x-1 hover:shadow-[3px_3px_0_0_var(--neo-ink)]",
                              my !== null && "cursor-default",
                              my !== null && isMyPick && (my.correct ? "bg-neo-green text-white" : "bg-neo-red text-white"),
                              my !== null && !isMyPick && "opacity-50",
                            )}
                          >
                            <span className="flex items-center gap-2">
                              {my !== null && isMyPick ? (
                                my.correct ? (
                                  <Check className="size-4" />
                                ) : (
                                  <X className="size-4" />
                                )
                              ) : (
                                <span className="font-mono text-[10px] font-bold text-muted-foreground">
                                  {String.fromCharCode(65 + oi)}.
                                </span>
                              )}
                              {option}
                            </span>
                            {my !== null && isMyPick ? (
                              <span className="font-mono text-[10px] font-bold uppercase tracking-widest">
                                {my.correct ? `+${my.pointsEarned} XP` : "0 XP"}
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                    {my ? (
                      <p className={cn(
                        "mt-4 flex items-center gap-2 border-2 border-foreground px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest",
                        my.correct ? "bg-neo-green text-white" : "bg-neo-red text-white",
                      )}>
                        {my.correct ? (
                          <>
                            <Check className="size-3.5" />
                            Nice — you banked {my.pointsEarned} XP
                          </>
                        ) : (
                          <>
                            <X className="size-3.5" />
                            Wrong this time — you'll get the next one
                          </>
                        )}
                      </p>
                    ) : (
                      <p className="mt-4 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Pick an answer — locked in on your first tap
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
