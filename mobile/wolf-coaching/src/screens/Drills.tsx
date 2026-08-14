import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Card, Chip, Header, Screen } from "../components";
import { COLORS, s } from "../theme";

const DRILLS: { game: string; title: string; duration: string; steps: string[] }[] = [
  {
    game: "Valorant",
    title: "Deathmatch aim warmup",
    duration: "15 min",
    steps: [
      "Play 2 Deathmatch rounds with a Sheriff only — focus on one-taps.",
      "Then 2 rounds with Vandal, holding angles and pre-aiming head level.",
      "Finish with 100 kills tracking crosshair placement on every peek.",
    ],
  },
  {
    game: "Valorant",
    title: "Utility lineups",
    duration: "20 min",
    steps: [
      "Pick one agent and one map (e.g. Viper on Ascent).",
      "Load a custom game and place every smoke / molly lineup you know.",
      "Record the lineup reference points in your notes; repeat until muscle memory.",
    ],
  },
  {
    game: "Counter-Strike 2",
    title: "Aim botz + spray control",
    duration: "25 min",
    steps: [
      "10 min of flick and tracking on Aim Botz (1000+ kills).",
      "10 min spray transfer on a wall — learn the full AK/M4 recoil pattern.",
      "5 min prefire practice on your most played map.",
    ],
  },
  {
    game: "Apex Legends",
    title: "Firing range mechanics",
    duration: "20 min",
    steps: [
      "5 min recoil control on R-99 / Flatline at 3 distances.",
      "5 min movement — tap strafing, super glides, wall bounces.",
      "10 min 1v1s with a teammate on aim, cover usage and shield swaps.",
    ],
  },
  {
    game: "League of Legends",
    title: "CS practice (last hitting)",
    duration: "15 min",
    steps: [
      "Custom game vs no opponent — hit 8 CS/min for 10 minutes.",
      "Then 5 min with 1 bot to practice trading while farming.",
      "Track your CS@10 in every ranked game afterward.",
    ],
  },
  {
    game: "All titles",
    title: "VOD review session",
    duration: "30 min",
    steps: [
      "Watch your last match — mark every death with a reason.",
      "Categorize: aim, positioning, decision, team misplay.",
      "Pick ONE fix to work on tomorrow. Do not review more than one game.",
    ],
  },
  {
    game: "All titles",
    title: "Pre-match routine",
    duration: "10 min",
    steps: [
      "5 min light aim / mechanics warmup in your game.",
      "2 min breathing — slow inhale 4s, exhale 6s.",
      "3 min recap: your role, your 2 biggest focus points, team comms plan.",
    ],
  },
  {
    game: "All titles",
    title: "Mental reset drill",
    duration: "5 min",
    steps: [
      "After a bad round, physically reset: hands off keyboard.",
      "Name what went wrong in one sentence. Let it go.",
      "Set one micro-goal for the next round (e.g. 'stay with my duo').",
    ],
  },
];

export function Drills() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Screen>
      <Header eyebrow="Wolf Coach · Library" title="Drill library" />
      <Text style={s.body}>
        Coach-curated practice drills. Run at least one per day — consistency beats marathon sessions.
      </Text>

      {DRILLS.map((d, i) => (
        <Pressable key={i} onPress={() => setOpen(open === i ? null : i)}>
          <Card style={{ gap: 6 }}>
            <View style={s.between}>
              <Text style={{ fontWeight: "800", color: COLORS.ink, flex: 1 }}>{d.title}</Text>
              <Chip text={d.duration} color={COLORS.yellow} />
            </View>
            <Text style={[s.label, { color: COLORS.muted }]}>{d.game}</Text>
            {open === i ? (
              <View style={{ gap: 6, marginTop: 4 }}>
                {d.steps.map((step, j) => (
                  <Text key={j} style={{ fontSize: 12, color: COLORS.ink, lineHeight: 18 }}>
                    {j + 1}. {step}
                  </Text>
                ))}
              </View>
            ) : (
              <Text style={{ fontSize: 11, color: COLORS.muted }}>Tap to expand the drill…</Text>
            )}
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}
