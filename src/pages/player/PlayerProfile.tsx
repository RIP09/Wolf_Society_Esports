import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { GamePicker, OptionPicker } from "@/components/GamePicker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LoadingScreen } from "@/components/Loading";
import { NeoCard, NeoField, PageHeader, StatusBadge } from "@/components/neo";
import { GAMES, IN_GAME_ROLES, REGIONS } from "@/lib/constants";
import { fmtDate } from "@/lib/format";
import { btnYellow, input } from "@/lib/neo";
import { useMutation, useQuery } from "convex/react";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function PlayerProfile() {
  const profile = useQuery(api.players.getMyProfile);
  const updateProfile = useMutation(api.players.updateProfile);

  const [gamertag, setGamertag] = useState("");
  const [realName, setRealName] = useState("");
  const [game, setGame] = useState<string>(GAMES[0]);
  const [inGameRole, setInGameRole] = useState("none");
  const [region, setRegion] = useState("none");
  const [rank, setRank] = useState("");
  const [discord, setDiscord] = useState("");
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
      setBio(profile.bio ?? "");
    }
  }, [profile]);  if (!profile) return <LoadingScreen label="Loading…" />;

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await updateProfile({
        gamertag,
        realName,
        game,
        inGameRole: inGameRole === "none" ? undefined : inGameRole,
        region: region === "none" ? undefined : region,
        rank: rank || undefined,
        discord: discord || undefined,
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
              ["Discord", profile.discord ?? "—"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {k}
                </span>
                <span className="font-medium">{v}</span>
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
          <div className="grid gap-4 sm:grid-cols-2">
            <NeoField label="Gamertag">
              <Input className={input} value={gamertag} onChange={(e) => setGamertag(e.target.value)} />
            </NeoField>
            <NeoField label="Real name">
              <Input className={input} value={realName} onChange={(e) => setRealName(e.target.value)} />
            </NeoField>
            <NeoField label="Primary game">
              <GamePicker value={game} onChange={setGame} />
            </NeoField>
            <NeoField label="In-game role">
              <OptionPicker
                options={IN_GAME_ROLES}
                value={inGameRole}
                onChange={setInGameRole}
                placeholder="Select a role…"
                searchPlaceholder="Search roles…"
                notSureLabel="Not sure yet"
              />
            </NeoField>
            <NeoField label="Region">
              <OptionPicker
                options={REGIONS}
                value={region}
                onChange={setRegion}
                placeholder="Select a region…"
                searchPlaceholder="Search regions…"
                notSureLabel="Worldwide"
              />
            </NeoField>
            <NeoField label="Rank">
              <Input className={input} value={rank} onChange={(e) => setRank(e.target.value)} placeholder="Immortal 2" />
            </NeoField>
            <NeoField label="Discord">
              <Input className={input} value={discord} onChange={(e) => setDiscord(e.target.value)} placeholder="viper#0001" />
            </NeoField>
          </div>
          <NeoField label="About you">
            <Textarea
              className="rounded-none border-2 border-foreground bg-background"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </NeoField>
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
