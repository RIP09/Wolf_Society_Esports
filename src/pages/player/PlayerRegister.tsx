import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { GamePicker, OptionPicker } from "@/components/GamePicker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LoadingScreen } from "@/components/Loading";
import { NeoCard, NeoField } from "@/components/neo";
import { PhoneField } from "@/components/PhoneField";
import {
  COUNTRY_NAMES,
  EXPERIENCE_LEVELS,
  GAMES,
  PLATFORMS,
  REGIONS,
  WEEKLY_HOURS,
  rolesForGame,
} from "@/lib/constants";
import { btnYellow, input } from "@/lib/neo";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "convex/react";
import { ArrowRight, Gamepad2 } from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { toast } from "sonner";

/** Numbered section heading, written for normal people. */
function SectionHeading({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-3 border-b-2 border-foreground pb-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-foreground bg-neo-yellow font-mono text-sm font-bold text-white">
        {step}
      </span>
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
    </div>
  );
}

export default function PlayerRegister() {
  const { user, isLoading } = useAuth();
  const profile = useQuery(api.players.getMyProfile);
  const register = useMutation(api.players.register);
  const navigate = useNavigate();

  // 1 · Basic details
  const [gamertag, setGamertag] = useState("");
  const [realName, setRealName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [age, setAge] = useState("");
  const [nationality, setNationality] = useState("none");

  // 2 · Your game
  const [game, setGame] = useState<string>(GAMES[0]);
  const [inGameRole, setInGameRole] = useState("none");
  const [platform, setPlatform] = useState("none");
  const [gameIds, setGameIds] = useState("");
  const [rank, setRank] = useState("");
  const [secondaryGame, setSecondaryGame] = useState("none");
  const [region, setRegion] = useState("none");

  // 3 · Experience & availability
  const [experienceLevel, setExperienceLevel] = useState("none");
  const [weeklyHours, setWeeklyHours] = useState("none");
  const [previousTeams, setPreviousTeams] = useState("");
  const [achievements, setAchievements] = useState("");

  // 4 · Contact
  const [dialCode, setDialCode] = useState("+1");
  const [localNumber, setLocalNumber] = useState("");
  const [discord, setDiscord] = useState("");
  const [socials, setSocials] = useState("");
  const [bio, setBio] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading || profile === undefined) return <LoadingScreen label="Loading…" />;
  if (profile) return <Navigate to="/player" replace />;

  const handleGameChange = (next: string) => {
    setGame(next);
    setInGameRole("none"); // role list changes with the game
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const fullPhone = localNumber.trim() ? `${dialCode} ${localNumber.trim()}` : "";
    const ageNum = age.trim() ? Number(age.trim()) : undefined;
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
        phone: fullPhone || undefined,
        phoneCountryCode: dialCode || undefined,
        age: ageNum && ageNum >= 5 && ageNum <= 120 ? ageNum : undefined,
        nationality: nationality === "none" ? undefined : nationality,
        platform: platform === "none" ? undefined : platform,
        secondaryGame: secondaryGame === "none" ? undefined : secondaryGame,
        gameIds: gameIds || undefined,
        experienceLevel: experienceLevel === "none" ? undefined : experienceLevel,
        weeklyHours: weeklyHours === "none" ? undefined : weeklyHours,
        previousTeams: previousTeams || undefined,
        achievements: achievements || undefined,
        socials: socials || undefined,
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
      <div className="w-full max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center border-2 border-foreground bg-neo-yellow text-white shadow-[4px_4px_0_0_var(--neo-ink)]">
            <Gamepad2 className="size-6" />
          </span>
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Wolf Society Esports · The Pack
            </p>
            <h1 className="text-3xl font-bold tracking-tight">Join the Pack</h1>
            <p className="text-sm text-muted-foreground">
              Fill in the form below — it takes about 2 minutes.
            </p>
          </div>
        </div>

        <NeoCard className="gap-6 p-6 sm:p-8">
          <p className="border-2 border-foreground bg-neo-yellow px-4 py-3 text-sm leading-6 text-white">
            Your registration goes straight into the Society's shared system. The
            management team in The Den reviews every profile before approving it — you'll
            see the status on your dashboard. The more details you give, the faster a
            coach can pick you for a team.
          </p>

          {error ? (
            <p className="border-2 border-foreground bg-neo-red px-3 py-2 text-sm font-bold text-white">
              {error}
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="grid gap-8">
            {/* ---------- 1 · Basic details ---------- */}
            <div className="grid gap-4">
              <SectionHeading step={1} title="Basic details — who you are" />
              <div className="grid gap-4 sm:grid-cols-2">
                <NeoField label="Gamertag *" hint="Your in-game name — what everyone calls you.">
                  <Input
                    className={input}
                    value={gamertag}
                    onChange={(e) => setGamertag(e.target.value)}
                    placeholder="xViPeRzz"
                    required
                  />
                </NeoField>
                <NeoField label="Real name *" hint="Only management sees this — it stays private.">
                  <Input
                    className={input}
                    value={realName}
                    onChange={(e) => setRealName(e.target.value)}
                    placeholder="Alex Rivera"
                    required
                  />
                </NeoField>
                <NeoField label="Email *" hint="We send match alerts and updates here.">
                  <Input
                    className={input}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </NeoField>
                <NeoField label="Age" hint="Some teams have age rules (e.g. 16+).">
                  <Input
                    className={input}
                    type="number"
                    min={5}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="18"
                  />
                </NeoField>
                <NeoField
                  label="Where do you live?"
                  hint="Helps us pick practice times that work in your time zone."
                >
                  <OptionPicker
                    options={COUNTRY_NAMES}
                    value={nationality}
                    onChange={setNationality}
                    placeholder="Select your country…"
                    searchPlaceholder="Search countries…"
                    notSureLabel="Prefer not to say"
                  />
                </NeoField>
              </div>
            </div>

            {/* ---------- 2 · Your game ---------- */}
            <div className="grid gap-4">
              <SectionHeading step={2} title="Your game — what and how you play" />
              <div className="grid gap-4 sm:grid-cols-2">
                <NeoField
                  label="Primary game *"
                  hint="The one game you want to compete in. 80+ worldwide titles."
                >
                  <GamePicker value={game} onChange={handleGameChange} />
                </NeoField>
                <NeoField
                  label="In-game role"
                  hint={`Your job inside ${game}. The options change to match the game you picked.`}
                >
                  <OptionPicker
                    options={rolesForGame(game)}
                    value={inGameRole}
                    onChange={setInGameRole}
                    placeholder="Select a role…"
                    searchPlaceholder="Search roles…"
                    notSureLabel="Not sure yet"
                  />
                </NeoField>
                <NeoField label="Platform" hint="Where you play — PC, console or mobile.">
                  <OptionPicker
                    options={PLATFORMS}
                    value={platform}
                    onChange={setPlatform}
                    placeholder="Select a platform…"
                    searchPlaceholder="Search platforms…"
                    notSureLabel="Not sure yet"
                  />
                </NeoField>
                <NeoField
                  label={`Your in-game ID for ${game}`}
                  hint="The exact ID you use in this game (Riot ID, Steam ID…). Coaches use it to find and add you."
                >
                  <Input
                    className={input}
                    value={gameIds}
                    onChange={(e) => setGameIds(e.target.value)}
                    placeholder="e.g. Viper#NA1 or STEAM_0:1:123"
                  />
                </NeoField>
                <NeoField label="Current rank" hint="Your rank or tier right now (e.g. Immortal 2, Radiant, Diamond).">
                  <Input
                    className={input}
                    value={rank}
                    onChange={(e) => setRank(e.target.value)}
                    placeholder="Immortal 2"
                  />
                </NeoField>
                <NeoField label="Second game (optional)" hint="A second title you play, if any.">
                  <OptionPicker
                    options={GAMES}
                    value={secondaryGame}
                    onChange={setSecondaryGame}
                    placeholder="Select a game…"
                    searchPlaceholder="Search games…"
                    notSureLabel="None"
                  />
                </NeoField>
                <NeoField label="Competitive region" hint="Your region for tournaments (e.g. Europe, North America).">
                  <OptionPicker
                    options={REGIONS}
                    value={region}
                    onChange={setRegion}
                    placeholder="Select a region…"
                    searchPlaceholder="Search regions…"
                    notSureLabel="Worldwide"
                  />
                </NeoField>
              </div>
            </div>

            {/* ---------- 3 · Experience & availability ---------- */}
            <div className="grid gap-4">
              <SectionHeading step={3} title="Experience & availability — how serious you are" />
              <div className="grid gap-4 sm:grid-cols-2">
                <NeoField label="Experience level" hint="How long have you been playing this game seriously?">
                  <OptionPicker
                    options={EXPERIENCE_LEVELS}
                    value={experienceLevel}
                    onChange={setExperienceLevel}
                    placeholder="Select…"
                    searchPlaceholder="Search…"
                    notSureLabel="Not sure yet"
                  />
                </NeoField>
                <NeoField label="Practice time per week" hint="How many hours can you really commit to practice?">
                  <OptionPicker
                    options={WEEKLY_HOURS}
                    value={weeklyHours}
                    onChange={setWeeklyHours}
                    placeholder="Select…"
                    searchPlaceholder="Search…"
                    notSureLabel="Not sure yet"
                  />
                </NeoField>
                <NeoField label="Previous teams" hint="Teams or orgs you've played for before. Write 'None' if you're new.">
                  <Input
                    className={input}
                    value={previousTeams}
                    onChange={(e) => setPreviousTeams(e.target.value)}
                    placeholder="e.g. Team Nova (2023–2024)"
                  />
                </NeoField>
                <NeoField label="Achievements" hint="Tournament wins, titles, highlight clips — brag a little!">
                  <Input
                    className={input}
                    value={achievements}
                    onChange={(e) => setAchievements(e.target.value)}
                    placeholder="e.g. 2nd place — Regional Cup 2025"
                  />
                </NeoField>
              </div>
            </div>

            {/* ---------- 4 · Contact ---------- */}
            <div className="grid gap-4">
              <SectionHeading step={4} title="Contact — how we reach you" />
              <div className="grid gap-4 sm:grid-cols-2">
                <NeoField
                  label="Phone number"
                  hint="Pick your country code first, then your number. Used only for SMS alerts about practices, scrims and tryouts."
                >
                  <PhoneField
                    dialCode={dialCode}
                    localNumber={localNumber}
                    onDialChange={setDialCode}
                    onLocalChange={setLocalNumber}
                  />
                </NeoField>
                <NeoField label="Discord" hint="Your Discord username — this is how we talk every day.">
                  <Input
                    className={input}
                    value={discord}
                    onChange={(e) => setDiscord(e.target.value)}
                    placeholder="viper#0001"
                  />
                </NeoField>
                <NeoField label="Stream / social links" hint="Twitch, YouTube or X — so we can watch your clips and streams.">
                  <Input
                    className={input}
                    value={socials}
                    onChange={(e) => setSocials(e.target.value)}
                    placeholder="twitch.tv/yourname"
                  />
                </NeoField>
              </div>
              <NeoField label="About you" hint="Experience, strengths, playstyle, what makes you a great teammate.">
                <Textarea
                  className="rounded-none border-2 border-foreground bg-background"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself…"
                />
              </NeoField>
            </div>

            <div className="flex flex-col gap-4 border-t-2 border-foreground pt-5">
              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
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
