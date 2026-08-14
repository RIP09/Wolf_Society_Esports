import React, { useState } from "react";
import { Text, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button, Card, Chip, Field, Header, Loading, Screen } from "../components";
import { badgeColor, COLORS, s } from "../theme";

export function Profile({ onSignOut }: { onSignOut: () => void }) {
  const profile = useQuery(api.players.getMyProfile);
  const updateProfile = useMutation(api.players.updateProfile);

  const [gamertag, setGamertag] = useState("");
  const [realName, setRealName] = useState("");
  const [game, setGame] = useState("");
  const [rank, setRank] = useState("");
  const [discord, setDiscord] = useState("");
  const [bio, setBio] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate the form exactly once when the profile arrives.
  if (profile !== undefined && !hydrated) {
    setGamertag(profile.gamertag ?? "");
    setRealName(profile.realName ?? "");
    setGame(profile.game ?? "");
    setRank(profile.rank ?? "");
    setDiscord(profile.discord ?? "");
    setBio(profile.bio ?? "");
    setHydrated(true);
  }

  if (profile === undefined) return <Loading label="Loading profile…" />;

  const doSave = async () => {
    setBusy(true);
    setError(null);
    try {
      await updateProfile({
        gamertag,
        realName,
        game,
        inGameRole: profile.inGameRole,
        region: profile.region,
        rank: rank || undefined,
        bio: bio || undefined,
        discord: discord || undefined,
        phone: profile.phone,
        phoneCountryCode: profile.phoneCountryCode,
        age: profile.age,
        nationality: profile.nationality,
        platform: profile.platform,
        secondaryGame: profile.secondaryGame,
        gameIds: profile.gameIds,
        experienceLevel: profile.experienceLevel,
        weeklyHours: profile.weeklyHours,
        previousTeams: profile.previousTeams,
        achievements: profile.achievements,
        socials: profile.socials,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Header eyebrow="The Pack" title="My Profile" />

      <Card style={{ gap: 8 }}>
        <View style={s.between}>
          <View style={{ gap: 4 }}>
            <Text style={s.label}>Status</Text>
            <Chip text={profile.status} color={badgeColor(profile.status)} />
          </View>
          {profile.badges && profile.badges.length > 0 ? (
            <View style={[s.row, { flexWrap: "wrap", flex: 1, justifyContent: "flex-end" }]}>
              {profile.badges.map((b) => (
                <Chip key={b} text={b} color={COLORS.yellow} />
              ))}
            </View>
          ) : null}
        </View>
        <Text style={{ fontSize: 11, color: COLORS.muted }}>
          {profile.game} · {profile.inGameRole ?? "Flex"} · {profile.region ?? "Worldwide"}
          {profile.verifiedAt ? " · Verified by management" : ""}
        </Text>
      </Card>

      <Card style={{ gap: 12 }}>
        <Text style={s.h2}>Edit my info (players manage their own data)</Text>
        {error ? (
          <View style={{ borderWidth: 2, borderColor: COLORS.ink, backgroundColor: COLORS.red, padding: 10 }}>
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>{error}</Text>
          </View>
        ) : null}
        <Field label="Gamertag" value={gamertag} onChangeText={setGamertag} autoCapitalize="none" />
        <Field label="Real name" value={realName} onChangeText={setRealName} autoCapitalize="words" />
        <Field label="Primary game" value={game} onChangeText={setGame} autoCapitalize="words" />
        <Field label="Rank" value={rank} onChangeText={setRank} placeholder="e.g. Diamond 2" />
        <Field label="Discord" value={discord} onChangeText={setDiscord} placeholder="username#0000" autoCapitalize="none" />
        <Field label="Bio" value={bio} onChangeText={setBio} multiline placeholder="Tell the org about yourself…" />
        <Button title="Save changes" onPress={doSave} loading={busy} />
        <Button title="Sign out" variant="ghost" onPress={onSignOut} />
        <Text style={{ fontSize: 10, color: COLORS.muted, fontFamily: "monospace" }}>
          Approvals, suspensions, teams and badges are managed by the organization in The Den.
        </Text>
      </Card>
    </Screen>
  );
}
