import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { EmptyState, PageHeader, StatusBadge } from "@/components/neo";
import { useVoterKey } from "@/hooks/use-voter-key";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { BarChart3, Check, Loader2, Vote } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const ACCENTS = ["bg-neo-yellow", "bg-neo-blue", "bg-neo-green", "bg-neo-orange", "bg-neo-purple", "bg-neo-red"];

export default function FanPolls() {
  const voterKey = useVoterKey();
  const polls = useQuery(api.fanZone.listPolls, { voterKey });
  const castVote = useMutation(api.fanZone.castPollVote);
  const [voting, setVoting] = useState<string | null>(null);

  const handleVote = async (pollId: string, optionIndex: number) => {
    if (voting) return;
    setVoting(pollId);
    try {
      const res = await castVote({ pollId: pollId as Id<"polls">, optionIndex });
      toast.success(
        res.xp > 0
          ? `Vote counted — +${res.xp} Fan XP!`
          : "Vote counted. Sign in to earn XP for your votes.",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not cast your vote.");
    } finally {
      setVoting(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Fan Zone · FZ-01"
        title="Polls"
        description="Cast your vote and shape the squad. One vote per fan per poll — results update live."
        actions={
          <StatusBadge status="live">
            <BarChart3 className="size-3" />
            Live results
          </StatusBadge>
        }
      />

      <div className="mt-8 flex flex-col gap-6">
        {!polls ? (
          <div className="grid gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse border-2 border-foreground bg-card" />
            ))}
          </div>
        ) : polls.length === 0 ? (
          <EmptyState
            title="No polls open right now"
            description="Management posts new polls here before matches, roster changes and fan events. Check back soon."
          />
        ) : (
          polls.map((poll, pi) => {
            const total = poll.totalVotes;
            const max = Math.max(1, ...poll.counts);
            return (
              <motion.div
                key={poll._id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ type: "spring", stiffness: 130, damping: 18 }}
              >
                <div className="border-2 border-foreground bg-card shadow-[5px_5px_0_0_var(--neo-ink)]">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-foreground bg-neo-cream px-5 py-3">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Poll {String(pi + 1).padStart(2, "0")}
                    </p>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {total.toLocaleString()} {total === 1 ? "vote" : "votes"}
                    </p>
                  </div>
                  <div className="p-5">
                    <h2 className="text-xl font-bold leading-snug tracking-tight">{poll.question}</h2>
                    <div className="mt-5 flex flex-col gap-3">
                      {poll.options.map((option, oi) => {
                        const count = poll.counts[oi] ?? 0;
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        const mine = poll.myVote === oi;
                        const dimmed = poll.myVote !== null && !mine;
                        return (
                          <button
                            key={oi}
                            type="button"
                            disabled={poll.myVote !== null || voting === poll._id}
                            onClick={() => void handleVote(poll._id, oi)}
                            className={cn(
                              "group relative overflow-hidden border-2 border-foreground bg-background text-left transition-all",
                              poll.myVote === null &&
                                "hover:translate-x-1 hover:shadow-[3px_3px_0_0_var(--neo-ink)]",
                              poll.myVote !== null && "cursor-default",
                              dimmed && "opacity-50",
                            )}
                          >
                            <motion.span
                              initial={{ width: 0 }}
                              whileInView={{ width: `${pct}%` }}
                              viewport={{ once: true }}
                              transition={{ type: "spring", stiffness: 60, damping: 20 }}
                              className={cn(
                                "absolute inset-y-0 left-0 border-r-2 border-foreground/40",
                                ACCENTS[oi % ACCENTS.length],
                              )}
                              style={{ opacity: 0.25 }}
                            />
                            <span className="relative flex items-center justify-between gap-3 px-4 py-3">
                              <span className="flex items-center gap-2 font-bold">
                                {mine && (
                                  <span className="flex size-5 items-center justify-center border-2 border-foreground bg-neo-green text-white">
                                    <Check className="size-3" />
                                  </span>
                                )}
                                {option}
                              </span>
                              <span className="flex shrink-0 items-center gap-3 font-mono text-xs font-bold tabular-nums">
                                {poll.myVote === null && voting === poll._id ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : poll.myVote === null ? (
                                  <Vote className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                                ) : null}
                                {count.toLocaleString()}
                                <span className="w-10 text-right">{pct}%</span>
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {poll.myVote !== null ? (
                      <p className="mt-4 flex items-center gap-2 border-2 border-foreground bg-neo-green px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-white">
                        <Check className="size-3.5" />
                        Your vote is locked in — the bar shows the live tally
                      </p>
                    ) : (
                      <p className="mt-4 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Tap an option to cast your vote
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
