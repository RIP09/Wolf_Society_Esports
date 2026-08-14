import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button, Card, Chip, ErrorBox, Field, Header, Loading, Screen } from "../components";
import { badgeColor, COLORS, s } from "../theme";

const FILTERS = ["all", "pending", "active", "suspended"] as const;

export function Players() {
  const [filter, setFilter] = useState<string>("all");
  const players = useQuery(api.players.list, { status: filter === "all" ? undefined : filter });
  const setStatus = useMutation(api.players.setStatus);
  const removePlayer = useMutation(api.players.remove);
  const setBadges = useMutation(api.players.setBadges);

  const [badgePlayer, setBadgePlayer] = useState<string | null>(null);
  const [badgeInput, setBadgeInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (players === undefined) return <Loading label="Loading the roster…" />;

  const doStatus = async (id: string, status: "active" | "suspended" | "pending") => {
    setBusy(true);
    setError(null);
    try {
      await setStatus({ playerId: id, status });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setBusy(false);
    }
  };

  const doRemove = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      await removePlayer({ playerId: id });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Remove failed.");
    } finally {
      setBusy(false);
    }
  };

  const saveBadges = async (id: string, current: string[] | undefined) => {
    if (!badgeInput.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const next = [...(current ?? []), badgeInput.trim()];
      await setBadges({ playerId: id, badges: next });
      setBadgeInput("");
      setBadgePlayer(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save badges.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Header eyebrow="The Den · Roster" title="Player registry" />

      {error ? <ErrorBox message={error} /> : null}

      <View style={[s.row, { flexWrap: "wrap" }]}>
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[s.chip, filter === f ? { backgroundColor: COLORS.yellow } : { backgroundColor: COLORS.card }]}
          >
            <Text style={[s.chipText, { color: COLORS.ink }]}>{f}</Text>
          </Pressable>
        ))}
      </View>

      {players.length === 0 ? (
        <Card>
          <Text style={s.body}>No players in this view yet.</Text>
        </Card>
      ) : (
        players.slice(0, 60).map((p: { _id: string; gamertag: string; game: string; inGameRole?: string; rank?: string; status: string; badges?: string[] }) => (
          <Card key={p._id} style={{ gap: 8 }}>
            <View style={s.between}>
              <View style={{ gap: 2 }}>
                <Text style={{ fontWeight: "800", color: COLORS.ink, fontSize: 15 }}>{p.gamertag}</Text>
                <Text style={{ fontSize: 11, color: COLORS.muted }}>
                  {p.game} · {p.inGameRole ?? "Flex"} · {p.rank ?? "Unranked"}
                </Text>
              </View>
              <Chip text={p.status} color={badgeColor(p.status)} />
            </View>

            {p.badges && p.badges.length > 0 ? (
              <View style={[s.row, { flexWrap: "wrap" }]}>
                {p.badges.map((b) => (
                  <Chip key={b} text={b} color={COLORS.yellow} />
                ))}
              </View>
            ) : null}

            <View style={[s.row, { flexWrap: "wrap" }]}>
              {p.status !== "active" ? (
                <Button title="Approve" variant="green" style={{ flex: 1, minWidth: 110 }} onPress={() => doStatus(p._id, "active")} loading={busy} />
              ) : null}
              {p.status !== "suspended" ? (
                <Button title="Suspend" variant="danger" style={{ flex: 1, minWidth: 110 }} onPress={() => doStatus(p._id, "suspended")} loading={busy} />
              ) : (
                <Button title="Reinstate" variant="ghost" style={{ flex: 1, minWidth: 110 }} onPress={() => doStatus(p._id, "pending")} loading={busy} />
              )}
              <Button title="Delete all data" variant="danger" style={{ flex: 1, minWidth: 110 }} onPress={() => doRemove(p._id)} loading={busy} />
            </View>

            {badgePlayer === p._id ? (
              <View style={{ gap: 8 }}>
                <Field label="Add badge (MVP, IGL, Captain…)" value={badgeInput} onChangeText={setBadgeInput} autoCapitalize="words" />
                <Button title="Save badge" onPress={() => saveBadges(p._id, p.badges)} loading={busy} />
              </View>
            ) : (
              <Pressable onPress={() => setBadgePlayer(p._id)}>
                <Text style={{ fontSize: 10, fontWeight: "800", color: COLORS.blue, textTransform: "uppercase", letterSpacing: 1 }}>
                  + Assign badges
                </Text>
              </Pressable>
            )}
          </Card>
        ))
      )}

      <Text style={{ fontSize: 10, color: COLORS.muted, fontFamily: "monospace", lineHeight: 15 }}>
        Approving unlocks the player's full portal instantly. Removing deletes the profile, performance,
        attendance, match reports, teams and the login account — nothing is left behind.
      </Text>
    </Screen>
  );
}
