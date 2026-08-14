import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button, Card, Chip, Field, Header, Loading, Screen } from "../components";
import { badgeColor, COLORS, s } from "../theme";

const RESULTS = ["win", "loss", "draw"] as const;

export function Reports() {
  const reports = useQuery(api.attendance.myMatchReports);
  const submitReport = useMutation(api.attendance.submitMatchReport);
  const removeReport = useMutation(api.attendance.removeMatchReport);

  const [game, setGame] = useState("Valorant");
  const [opponent, setOpponent] = useState("");
  const [result, setResult] = useState<(typeof RESULTS)[number]>("win");
  const [kills, setKills] = useState("0");
  const [deaths, setDeaths] = useState("0");
  const [assists, setAssists] = useState("0");
  const [damage, setDamage] = useState("");
  const [rating, setRating] = useState("7");
  const [rolePlayed, setRolePlayed] = useState("");
  const [highlights, setHighlights] = useState("");
  const [improvement, setImprovement] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (reports === undefined) return <Loading label="Loading reports…" />;

  const num = (x: string) => {
    const n = Number(x);
    return Number.isFinite(n) ? n : 0;
  };

  const doSubmit = async () => {
    if (!game.trim()) {
      setError("Choose the game you played.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await submitReport({
        game: game.trim(),
        opponent: opponent.trim() || undefined,
        result,
        kills: num(kills),
        deaths: num(deaths),
        assists: num(assists),
        damage: damage ? num(damage) : undefined,
        rating: num(rating),
        rolePlayed: rolePlayed.trim() || undefined,
        highlights: highlights.trim() || undefined,
        improvement: improvement.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setOpponent("");
      setKills("0");
      setDeaths("0");
      setAssists("0");
      setDamage("");
      setHighlights("");
      setImprovement("");
      setNotes("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed.");
    } finally {
      setBusy(false);
    }
  };

  const doRemove = async (id: string) => {
    try {
      await removeReport({ reportId: id });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    }
  };

  return (
    <Screen>
      <Header eyebrow="The Pack" title="Match Reports" />

      <Card style={{ gap: 12 }}>
        <Text style={s.h2}>New match report</Text>
        <Text style={s.body}>Fill this in after every match or scrim — management sees it live.</Text>
        {error ? (
          <View style={{ borderWidth: 2, borderColor: COLORS.ink, backgroundColor: COLORS.red, padding: 10 }}>
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>{error}</Text>
          </View>
        ) : null}

        <Field label="Game" value={game} onChangeText={setGame} placeholder="e.g. Valorant" autoCapitalize="words" />
        <Field label="Opponent / team" value={opponent} onChangeText={setOpponent} placeholder="e.g. Team Alpha" autoCapitalize="words" />

        <View>
          <Text style={s.label}>Result</Text>
          <View style={[s.row, { marginTop: 6, flexWrap: "wrap" }]}>
            {RESULTS.map((r) => (
              <Pressable
                key={r}
                onPress={() => setResult(r)}
                style={[s.chip, result === r ? { backgroundColor: COLORS.yellow } : { backgroundColor: COLORS.card }]}
              >
                <Text style={[s.chipText, { color: COLORS.ink }]}>{r}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label="Kills" value={kills} onChangeText={setKills} keyboardType="number-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Deaths" value={deaths} onChangeText={setDeaths} keyboardType="number-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Assists" value={assists} onChangeText={setAssists} keyboardType="number-pad" />
          </View>
        </View>

        <Field label="Damage (optional)" value={damage} onChangeText={setDamage} keyboardType="number-pad" />
        <Field label="Self rating 1–10" value={rating} onChangeText={setRating} keyboardType="number-pad" />
        <Field label="Role played" value={rolePlayed} onChangeText={setRolePlayed} placeholder="e.g. Duelist, IGL, AWPer" autoCapitalize="words" />
        <Field label="Highlights — what went well" value={highlights} onChangeText={setHighlights} placeholder="Clutches, entries, shotcalling…" multiline />
        <Field label="What to improve" value={improvement} onChangeText={setImprovement} placeholder="Aim, positioning, comms…" multiline />
        <Field label="Notes for the coach" value={notes} onChangeText={setNotes} placeholder="Anything else…" multiline />

        <Button title="Submit match report" onPress={doSubmit} loading={busy} />
      </Card>

      <Card style={{ gap: 10 }}>
        <View style={s.between}>
          <Text style={s.h2}>My reports</Text>
          <Text style={s.label}>{reports.length} submitted</Text>
        </View>
        {reports.length === 0 ? (
          <Text style={s.body}>No reports yet — play a match and submit your first one.</Text>
        ) : (
          reports.slice(0, 25).map((r: { _id: string; game: string; opponent?: string; result: string; kills: number; deaths: number; assists: number; damage?: number; rating?: number; highlights?: string; improvement?: string; notes?: string; submittedAt: number }) => (
            <View key={r._id} style={{ gap: 4, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: "rgba(23,24,26,0.08)" }}>
              <View style={s.between}>
                <Text style={{ fontWeight: "800", color: COLORS.ink }}>
                  {r.game}
                  {r.opponent ? ` vs ${r.opponent}` : ""}
                </Text>
                <Chip text={r.result} color={badgeColor(r.result)} />
              </View>
              <Text style={{ fontSize: 11, color: COLORS.muted, fontFamily: "monospace" }}>
                {r.kills}K / {r.deaths}D / {r.assists}A{r.damage ? ` · ${r.damage.toLocaleString()} dmg` : ""}
                {r.rating ? ` · ${r.rating}/10` : ""}
              </Text>
              {r.highlights ? <Text style={{ fontSize: 11, color: COLORS.muted }}>Well: {r.highlights}</Text> : null}
              {r.improvement ? <Text style={{ fontSize: 11, color: COLORS.muted }}>Improve: {r.improvement}</Text> : null}
              <Pressable onPress={() => doRemove(r._id)} style={{ alignSelf: "flex-start", marginTop: 2 }}>
                <Text style={{ fontSize: 10, fontWeight: "800", color: COLORS.red, textTransform: "uppercase", letterSpacing: 1 }}>
                  Delete
                </Text>
              </Pressable>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}
