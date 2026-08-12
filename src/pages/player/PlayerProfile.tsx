import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { GamePicker, OptionPicker } from "@/components/GamePicker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LoadingScreen } from "@/components/Loading";
import { NeoCard, NeoField, PageHeader, StatusBadge } from "@/components/neo";
import { PhoneField } from "@/components/PhoneField";
import {
  COUNTRY_NAMES,
  EXPERIENCE_LEVELS,
  GAMES,
  PLATFORMS,
  REGIONS,
  WEEKLY_HOURS,
  dialFromPhone,
  localFromPhone,
  rolesForGame,
} from "@/lib/constants";
import { fmtDate } from "@/lib/format";
import { btnYellow, input } from "@/lib/neo";
import { useMutation, useQuery } from "convex/react";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function PlayerProfile() {
  const profile = useQuery(api.players.getMyProfile);
  const updateProfile = useMutation(api.players.updateProfile);

  // 1 · Basic details
  const [gamertag, setGamertag] = useState("");
  const [realName, setRealName] = useState("");
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

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setGamertag(profile.gamertag);
      setRealName(profile.realName);
      setGame(profile.game);
      setInGameRole(profile.inGameRole ?? "none");
      setRegion(profile.region ?? "none");
      setRank(profile.rank ?? "");
      setDiscord(profile.discord ?? "");
      setAge(profile.age ? String(profile.age) : "");
      setNationality(profile.nationality ?? "none");
      setPlatform(profile.platform ?? "none");
      setSecondaryGame(profile.secondaryGame ?? "none");
      setGameIds(profile.gameIds ?? "");
      setExperienceLevel(profile.experienceLevel ?? "none");
      setWeeklyHours(profile.weeklyHours ?? "none");
      setPreviousTeams(profile.previousTeams ?? "");
      setAchievements(profile.achievements ?? "");
      setSocials(profile.socials ?? "");
      setDialCode(profile.phoneCountryCode ?? dialFromPhone(profile.phone));
      setLocalNumber(localFromPhone(profile.phone));
      setBio(profile.bio ?? "");
    }
  }, [profile]);

  if (!profile) return <LoadingScreen label="Loading…" />;

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    const fullPhone = localNumber.trim() ? `${dialCode} ${localNumber.trim()}` : "";
    const ageNum = age.trim() ? Number(age.trim()) : undefined;
    try {
      await updateProfile({
        gamertag,
        realName,
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
      setSaved(true);
      toast.success("Profile saved — management sees the update instantly.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
      toast.error("Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Wolf Society Esports · The Pack"
        title="Profile"
        description="Your esports identity — visible to management across the Society."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <NeoCard className="h-fit gap-4 p-6">
          <div className="flex h-16 w-16 items-center justify-center border-2 border-foreground bg-neo-yellow text-white shadow-[4px_4px_0_0_var(--neo-ink)]">
            <span className="text-2xl font-bold">{gamertag.slice(0, 1).toUpperCase() || "?"}</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{profile.gamertag}</h2>
            <p className="text-sm text-muted-foreground">{profile.realName}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={profile.status} />
            <StatusBadge status={profile.game} />
          </div>
          <div className="divide-y-2 divide-foreground/10 border-2 border-foreground bg-background">
            {[
              ["Email", profile.email],
              ["Joined", fmtDate(profile.joinedAt)],
              ["Role", profile.inGameRole ?? "—"],
              ["Region", profile.region ?? "—"],
              ["Rank", profile.rank ?? "—"],
              ["Platform", profile.platform ?? "—"],
              ["Age", profile.age ? String(profile.age) : "—"],
              ["Discord", profile.discord ?? "—"],
              ["Phone", profile.phone ?? "—"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {k}
                </span>
                <span className="max-w-[55%] truncate font-medium">{v}</span>
              </div>
            ))}
          </div>
        </NeoCard>

        <NeoCard className="gap-5 p-6 lg:col-span-2">
          <h2 className="font-bold">Edit profile</h2>
          {error ? (
            <p className="border-2 border-foreground bg-neo-red px-3 py-2 text-xs font-bold text-white">
              {error}
            </p>
          ) : null}
          {saved ? (
            <p className="border-2 border-foreground bg-neo-green px-3 py-2 text-xs font-bold text-white">
              Profile saved — management in The Den sees the updated version instantly.
            </p>
          ) : null}

          <div className="grid gap-6">
            <div className="grid gap-4">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                1 · Basic details
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <NeoField label="Gamertag">
                  <Input className={input} value={gamertag} onChange={(e) => setGamertag(e.target.value)} />
                </NeoField>
                <NeoField label="Real name">
                  <Input className={input} value={realName} onChange={(e) => setRealName(e.target.value)} />
                </NeoField>
                <NeoField label="Age">
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
                <NeoField label="Where do you live?">
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

            <div className="grid gap-4">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                2 · Your game
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <NeoField label="Primary game">
                  <GamePicker value={game} onChange={(g) => { setGame(g); setInGameRole("none"); }} />
                </NeoField>
                <NeoField label="In-game role" hint={`Roles for ${game}. Can't find yours? Type it and press Enter.`}>
                  <OptionPicker
                    options={rolesForGame(game)}
                    value={inGameRole}
                    onChange={setInGameRole}
                    placeholder="Select a role…"
                    searchPlaceholder="Search roles or type your own…"
                    notSureLabel="Not sure yet"
                  />
                </NeoField>
                <NeoField label="Platform">
                  <OptionPicker
                    options={PLATFORMS}
                    value={platform}
                    onChange={setPlatform}
                    placeholder="Select a platform…"
                    notSureLabel="Not sure yet"
                  />
                </NeoField>
                <NeoField label={`In-game ID (${game})`}>
                  <Input
                    className={input}
                    value={gameIds}
                    onChange={(e) => setGameIds(e.target.value)}
                    placeholder="e.g. Viper#NA1"
                  />
                </NeoField>
                <NeoField label="Current rank">
                  <Input className={input} value={rank} onChange={(e) => setRank(e.target.value)} placeholder="Immortal 2" />
                </NeoField>
                <NeoField label="Second game (optional)">
                  <OptionPicker
                    options={GAMES}
                    value={secondaryGame}
                    onChange={setSecondaryGame}
                    placeholder="Select a game…"
                    notSureLabel="None"
                  />
                </NeoField>
                <NeoField label="Competitive region">
                  <OptionPicker
                    options={REGIONS}
                    value={region}
                    onChange={setRegion}
                    placeholder="Select a region…"
                    notSureLabel="Worldwide"
                  />
                </NeoField>
              </div>
            </div>

            <div className="grid gap-4">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                3 · Experience & availability
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <NeoField label="Experience level">
                  <OptionPicker
                    options={EXPERIENCE_LEVELS}
                    value={experienceLevel}
                    onChange={setExperienceLevel}
                    placeholder="Select…"
                    notSureLabel="Not sure yet"
                  />
                </NeoField>
                <NeoField label="Practice time per week">
                  <OptionPicker
                    options={WEEKLY_HOURS}
                    value={weeklyHours}
                    onChange={setWeeklyHours}
                    placeholder="Select…"
                    notSureLabel="Not sure yet"
                  />
                </NeoField>
                <NeoField label="Previous teams">
                  <Input className={input} value={previousTeams} onChange={(e) => setPreviousTeams(e.target.value)} placeholder="e.g. Team Nova (2023–2024)" />
                </NeoField>
                <NeoField label="Achievements">
                  <Input className={input} value={achievements} onChange={(e) => setAchievements(e.target.value)} placeholder="e.g. 2nd place — Regional Cup 2025" />
                </NeoField>
              </div>
            </div>

            <div className="grid gap-4">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                4 · Contact
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <NeoField label="Phone" hint="Pick your country code first — used for SMS practice/scrim alerts.">
                  <PhoneField
                    dialCode={dialCode}
                    localNumber={localNumber}
                    onDialChange={setDialCode}
                    onLocalChange={setLocalNumber}
                  />
                </NeoField>
                <NeoField label="Discord">
                  <Input className={input} value={discord} onChange={(e) => setDiscord(e.target.value)} placeholder="viper#0001" />
                </NeoField>
                <NeoField label="Stream / social links">
                  <Input className={input} value={socials} onChange={(e) => setSocials(e.target.value)} placeholder="twitch.tv/yourname" />
                </NeoField>
              </div>
              <NeoField label="About you">
                <Textarea
                  className="rounded-none border-2 border-foreground bg-background"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </NeoField>
            </div>
          </div>

          <div className="flex justify-end">
            <Button className={btnYellow} onClick={handleSave} disabled={saving || !gamertag.trim()}>
              <Save className="size-4" />
              {saving ? "Saving…" : "Save profile"}
            </Button>
          </div>
        </NeoCard>
      </div>
    </div>
  );
}
