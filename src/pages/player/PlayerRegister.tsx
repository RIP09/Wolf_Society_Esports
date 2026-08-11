import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { GamePicker, OptionPicker } from "@/components/GamePicker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LoadingScreen } from "@/components/Loading";
import { NeoCard, NeoField } from "@/components/neo";
import { GAMES, IN_GAME_ROLES, REGIONS } from "@/lib/constants";
import { btnYellow, input } from "@/lib/neo";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "convex/react";
import { ArrowRight, Gamepad2 } from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { toast } from "sonner";

export default function PlayerRegister() {
  const { user, isLoading } = useAuth();
  const profile = useQuery(api.players.getMyProfile);
  const register = useMutation(api.players.register);
  const navigate = useNavigate();

  const [gamertag, setGamertag] = useState("");
  const [realName, setRealName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [game, setGame] = useState<string>(GAMES[0]);
  const [inGameRole, setInGameRole] = useState("none");
  const [region, setRegion] = useState("none");
  const [rank, setRank] = useState("");
  const [discord, setDiscord] = useState("");
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading || profile === undefined) return <LoadingScreen label="Loading…" />;
  if (profile) return <Navigate to="/player" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await register({
        gamertag,
        realName,
        email,
        game,
        inGameRole: inGameRole === "none" ? undefined : inGameRole,
        region: region === "none" ? undefined : region,
        rank: rank || undefined,
        discord: discord || undefined,
        bio: bio || undefined,
      });
      toast.success("Registration submitted — management has been notified!");
      navigate("/player", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
      setSubmitting(false);
    }
  };

  return (
    <div className="neo-grid-bg flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center border-2 border-foreground bg-neo-yellow text-white shadow-[4px_4px_0_0_var(--neo-ink)]">
            <Gamepad2 className="size-6" />
          </span>
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Wolf Society Esports · The Pack
            </p>
            <h1 className="text-3xl font-bold tracking-tight">Join the Pack</h1>
          </div>
        </div>

        <NeoCard className="gap-6 p-6 sm:p-8">
          <p className="border-2 border-foreground bg-neo-yellow px-4 py-3 text-sm leading-6 text-white">
            Your registration goes straight into the Society's shared system. The
            management team in The Den reviews every profile before approving it — you'll
            see the status on your dashboard.
          </p>

          {error ? (
            <p className="border-2 border-foreground bg-neo-red px-3 py-2 text-sm font-bold text-white">
              {error}
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <NeoField label="Gamertag *">
                <Input
                  className={input}
                  value={gamertag}
                  onChange={(e) => setGamertag(e.target.value)}
                  placeholder="xViPeRzz"
                  required
                />
              </NeoField>
              <NeoField label="Real name *">
                <Input
                  className={input}
                  value={realName}
                  onChange={(e) => setRealName(e.target.value)}
                  placeholder="Alex Rivera"
                  required
                />
              </NeoField>
            </div>

            <NeoField label="Email *">
              <Input
                className={input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </NeoField>

            <div className="grid gap-5 sm:grid-cols-2">
              <NeoField label="Primary game *" hint="60+ worldwide esports titles">
                <GamePicker value={game} onChange={setGame} />
              </NeoField>
              <NeoField label="In-game role" hint="Searchable — FPS, MOBA, fighting, racing and more">
                <OptionPicker
                  options={IN_GAME_ROLES}
                  value={inGameRole}
                  onChange={setInGameRole}
                  placeholder="Select a role…"
                  searchPlaceholder="Search roles…"
                  notSureLabel="Not sure yet"
                />
              </NeoField>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <NeoField label="Region" hint="All worldwide competitive regions">
                <OptionPicker
                  options={REGIONS}
                  value={region}
                  onChange={setRegion}
                  placeholder="Select a region…"
                  searchPlaceholder="Search regions…"
                  notSureLabel="Worldwide"
                />
              </NeoField>
              <NeoField label="Current rank">
                <Input
                  className={input}
                  value={rank}
                  onChange={(e) => setRank(e.target.value)}
                  placeholder="Immortal 2"
                />
              </NeoField>
              <NeoField label="Discord">
                <Input
                  className={input}
                  value={discord}
                  onChange={(e) => setDiscord(e.target.value)}
                  placeholder="viper#0001"
                />
              </NeoField>
            </div>

            <NeoField label="About you">
              <Textarea
                className="rounded-none border-2 border-foreground bg-background"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Experience, previous teams, availability, strengths…"
              />
            </NeoField>

            <div className="flex flex-col gap-4 border-t-2 border-foreground pt-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Shared system — management in The Den sees everything you submit instantly.
                </p>
                <Button type="submit" className={btnYellow} disabled={submitting || !gamertag.trim() || !realName.trim() || !email.trim()}>
                  {submitting ? "Registering…" : "Submit registration"}
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          </form>
        </NeoCard>
      </div>
    </div>
  );
}
