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
import { Input } from "@/components/ui/input";
import { EmptyState, NeoCard, PageHeader, StatusBadge } from "@/components/neo";
import { useAuth } from "@/hooks/use-auth";
import { useVoterKey } from "@/hooks/use-voter-key";
import { getVisitorId } from "@/lib/visitor";
import { btnGhost, btnYellow, input } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { AlertTriangle, Crown, Loader2, Medal, Trash2, Trophy, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

export default function FanRankings() {
  const voterKey = useVoterKey();
  const { isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const data = useQuery(api.fanZone.rankings, { voterKey });
  const myProfile = useQuery(api.fanZone.myProfile);
  const claim = useMutation(api.fanZone.claimProfile);
  const purge = useMutation(api.account.purgeMyAccount);
  const [name, setName] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Choose a display name of at least 2 characters.");
      return;
    }
    setClaiming(true);
    try {
      await claim({ displayName: name.trim() });
      setName("");
      toast.success("Fan profile claimed — you're on the leaderboard!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not claim your profile.");
    } finally {
      setClaiming(false);
    }
  };

  const top = data?.top ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Fan Zone · FZ-04"
        title="Rankings"
        description="The Wolf Society Fan XP leaderboard. Poll votes, trivia answers and correct predictions all push you up."
        actions={
          data?.me ? (
            <StatusBadge status="win">
              <Crown className="size-3" />
              Your rank · #{data.me.rank}
            </StatusBadge>
          ) : undefined
        }
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Leaderboard */}
        <div>
          {!data ? (
            <div className="h-96 animate-pulse border-2 border-foreground bg-card" />
          ) : top.length === 0 ? (
            <EmptyState
              title="The leaderboard is empty"
              description="Sign in, claim your Fan profile, then vote in a poll, answer trivia or make a prediction — every play earns XP."
              action={
                <Link
                  to="/register?path=fan"
                  className={cn(btnYellow, "inline-flex h-10 items-center gap-2 px-5 text-xs font-bold")}
                >
                  <UserRound className="size-4" />
                  Sign in & claim
                </Link>
              }
            />
          ) : (
            <div className="border-2 border-foreground bg-card shadow-[5px_5px_0_0_var(--neo-ink)]">
              <div className="flex items-center justify-between border-b-2 border-foreground bg-foreground px-5 py-3">
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-background">
                  Fan XP · All time
                </p>
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-background">
                  {data.totalFans.toLocaleString()} fans
                </p>
              </div>
              <ul className="flex flex-col divide-y-2 divide-foreground/10">
                {top.map((f, i) => {
                  const medal = i === 0 ? "bg-neo-gold" : i === 1 ? "bg-neo-blue" : i === 2 ? "bg-neo-orange" : "bg-foreground/15 text-foreground";
                  return (
                    <motion.li
                      key={f.rank}
                      initial={{ opacity: 0, x: -16 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: Math.min(i * 0.04, 0.6), type: "spring", stiffness: 140, damping: 18 }}
                      className={cn(
                        "flex items-center justify-between gap-3 px-4 py-3",
                        data.me && f.rank === data.me.rank && "bg-neo-cream",
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center border-2 border-foreground font-mono text-sm font-bold text-white",
                            medal,
                          )}
                        >
                          {f.rank <= 3 ? <Medal className="size-4" /> : f.rank}
                        </span>
                        <p className="truncate font-bold">{f.name}</p>
                        {data.me && f.rank === data.me.rank ? (
                          <span className="shrink-0 border-2 border-foreground bg-neo-yellow px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-white">
                            You
                          </span>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-4">
                        <span className="hidden font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground sm:block">
                          {f.answers} plays
                        </span>
                        <span className="w-20 text-right font-mono text-sm font-bold tabular-nums">
                          {f.xp.toLocaleString()} XP
                        </span>
                      </div>
                    </motion.li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Claim / status card */}
        <div className="flex flex-col gap-4">
          <NeoCard className="gap-3 p-5">
            <p className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <Trophy className="size-3.5" />
              Your Fan profile
            </p>
            {!isAuthenticated ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm leading-6 text-muted-foreground">
                  You're playing as a guest — votes and answers count, but only
                  signed-in fans earn XP and appear here.
                </p>
                <div className="flex flex-col gap-2">
                  <Link
                    to="/signin"
                    className={cn(btnYellow, "inline-flex h-10 items-center justify-center gap-2 text-xs font-bold")}
                  >
                    <UserRound className="size-4" />
                    Sign in · Earn XP
                  </Link>
                  <Link
                    to="/register?path=fan"
                    className={cn(btnGhost, "inline-flex h-10 items-center justify-center gap-2 text-xs font-bold")}
                  >
                    Create a fan account
                  </Link>
                </div>
              </div>
            ) : myProfile === undefined ? (
              <div className="h-24 animate-pulse" />
            ) : myProfile ? (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="border-2 border-foreground bg-neo-cream px-3 py-2">
                    <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      Fan XP
                    </p>
                    <p className="text-2xl font-bold tabular-nums">{myProfile.xp.toLocaleString()}</p>
                  </div>
                  <div className="border-2 border-foreground bg-neo-cream px-3 py-2">
                    <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      Plays
                    </p>
                    <p className="text-2xl font-bold tabular-nums">{myProfile.answers}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Ranked as <span className="font-bold text-foreground">{myProfile.displayName || "Unnamed fan"}</span>
                  {data?.me ? <> · <span className="font-bold text-foreground">#{data.me.rank}</span> on the leaderboard</> : null}
                </p>
                <form onSubmit={handleClaim} className="flex flex-col gap-2">
                  <Input
                    className={cn(input, "h-10 px-3")}
                    placeholder="Change your display name…"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={40}
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    className={cn(btnGhost, "h-10 text-xs font-bold")}
                    disabled={claiming}
                  >
                    {claiming ? <Loader2 className="size-4 animate-spin" /> : <UserRound className="size-4" />}
                    Update name
                  </Button>
                </form>
              </div>
            ) : (
              <form onSubmit={handleClaim} className="flex flex-col gap-3">
                <p className="text-sm leading-6 text-muted-foreground">
                  You're signed in — claim your Fan profile with a display name to
                  start earning XP and climbing the rankings.
                </p>
                <Input
                  className={cn(input, "h-10 px-3")}
                  placeholder="Your fan name (e.g. WolfpackAlex)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={40}
                  required
                />
                <Button type="submit" className={cn(btnYellow, "h-10 text-xs font-bold")} disabled={claiming}>
                  {claiming ? <Loader2 className="size-4 animate-spin" /> : <Crown className="size-4" />}
                  Claim my fan profile
                </Button>
              </form>
            )}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="mt-1 flex items-center justify-center gap-1.5 border-2 border-neo-red/60 bg-neo-red/10 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-neo-red transition-colors hover:bg-neo-red hover:text-white"
              >
                <Trash2 className="size-3.5" />
                Delete my fan data
              </button>
            )}
          </NeoCard>

          <NeoCard className="gap-2 p-5">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              How XP works
            </p>
            <ul className="flex flex-col gap-1.5 text-xs leading-5 text-muted-foreground">
              <li><span className="font-bold text-foreground">+5 XP</span> — every poll vote</li>
              <li><span className="font-bold text-foreground">+10 XP</span> — correct trivia answer</li>
              <li><span className="font-bold text-foreground">+2 XP</span> — every prediction entry</li>
              <li><span className="font-bold text-foreground">+10 XP</span> — correct settled prediction</li>
            </ul>
          </NeoCard>

          <AlertDialog open={deleteOpen} onOpenChange={(o) => !o && !deleting && setDeleteOpen(false)}>
            <AlertDialogContent className="rounded-none border-2 border-foreground bg-card shadow-[6px_6px_0_0_var(--neo-ink)]">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-xl font-bold">
                  <AlertTriangle className="size-5 text-neo-red" />
                  Delete your Fan data forever?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm leading-6 text-muted-foreground">
                  This permanently deletes your Fan profile, all earned XP, every poll
                  vote, trivia answer and prediction entry, plus your login account —
                  you'll disappear from the leaderboard instantly. There is no undo.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  className="rounded-none border-2 border-foreground bg-card shadow-[2px_2px_0_0_var(--neo-ink)]"
                  disabled={deleting}
                >
                  Keep my profile
                </AlertDialogCancel>
                <AlertDialogAction
                  className="neo-press rounded-none border-2 border-foreground bg-neo-red text-white shadow-[3px_3px_0_0_var(--neo-ink)] hover:shadow-[4px_4px_0_0_var(--neo-ink)]"
                  disabled={deleting}
                  onClick={(e) => {
                    e.preventDefault();
                    void (async () => {
                      setDeleting(true);
                      try {
                        await purge({ visitorId: getVisitorId() });
                        toast.success("Your Fan data was permanently deleted.");
                        setDeleteOpen(false);
                        await signOut().catch(() => {
                          // account already gone — redirect below is enough
                        });
                        navigate("/fan-zone", { replace: true });
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Could not delete your data.");
                        setDeleting(false);
                      }
                    })();
                  }}
                >
                  {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  {deleting ? "Deleting…" : "Delete everything"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
