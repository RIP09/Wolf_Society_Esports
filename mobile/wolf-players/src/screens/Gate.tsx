import React from "react";
import { Text, View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button, Card, Screen } from "../components";
import { COLORS, s } from "../theme";

export function Gate({ onSignOut }: { onSignOut: () => void }) {
  const profile = useQuery(api.players.getMyProfile);

  if (profile === undefined) return null;

  return (
    <Screen scroll={false}>
      <View style={{ marginTop: 32, gap: 6 }}>
        <Text style={[s.eyebrow, { color: COLORS.blue }]}>Wolf Society Esports · The Pack</Text>
        <Text style={s.title}>
          {!profile
            ? "No player profile yet"
            : profile.status === "pending"
              ? "Registration under review"
              : profile.status === "suspended"
                ? "Account suspended"
                : "Player hub"}
        </Text>
      </View>

      <Card style={{ gap: 12 }}>
        {!profile ? (
          <>
            <Text style={s.body}>
              You're signed in, but you haven't registered as a player yet. Registration happens on
              the website — after management approves your profile it unlocks here too.
            </Text>
            <Button title="Open website to register" onPress={() => {}} disabled style={{ opacity: 0.5 }} />
            <Text style={{ fontSize: 10, color: COLORS.muted, fontFamily: "monospace" }}>
              (Visit wolfsocietygg.vercel.app → Sign in → The Pack → Register)
            </Text>
          </>
        ) : profile.status === "pending" ? (
          <>
            <Text style={s.body}>
              Your registration is with the Wolf Society management team. Once your profile is
              verified and approved, your full player hub unlocks here automatically — attendance,
              match reports, badges and everything else.
            </Text>
            <View style={[s.chip, { alignSelf: "flex-start", backgroundColor: COLORS.orange }]}>
              <Text style={[s.chipText, { color: "#fff" }]}>Pending approval</Text>
            </View>
          </>
        ) : profile.status === "suspended" ? (
          <>
            <Text style={s.body}>
              Your player account has been suspended by management. The portal is locked until the
              organization reactivates you. Contact management through the website contact page.
            </Text>
            <View style={[s.chip, { alignSelf: "flex-start", backgroundColor: COLORS.red }]}>
              <Text style={[s.chipText, { color: "#fff" }]}>Suspended</Text>
            </View>
          </>
        ) : (
          <Text style={s.body}>Verified player — the hub is loading…</Text>
        )}

        <Button title="Sign out" variant="ghost" onPress={onSignOut} />
      </Card>
    </Screen>
  );
}
