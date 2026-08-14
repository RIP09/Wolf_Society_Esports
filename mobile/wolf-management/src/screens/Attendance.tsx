import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button, Card, Chip, Field, Header, Loading, Screen } from "../components";
import { badgeColor, COLORS, s } from "../theme";

const STATUSES = ["present", "late", "absent", "leave"] as const;
const todayKey = () => new Date().toISOString().slice(0, 10);

export function Attendance() {
  const [date, setDate] = useState(todayKey());
  const day = useQuery(api.attendance.adminDay, { date });
  const summary = useQuery(api.attendance.adminSummary);
  const override = useMutation(api.attendance.adminOverride);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!day || !summary) return <Loading label="Loading attendance…" />;

  const doOverride = async (playerId: string, status: (typeof STATUSES)[number]) => {
    setBusy(true);
    setError(null);
    try {
      await override({ playerId, date, status });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setBusy(false);
    }
  };

  const flagged = summary.rows.filter((r: { flag: string | null }) => r.flag);

  return (
    <Screen>
      <Header eyebrow="The Den" title="Attendance & Reports" />

      {error ? (
        <View style={{ borderWidth: 2, borderColor: COLORS.ink, backgroundColor: COLORS.red, padding: 12 }}>
          <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>{error}</Text>
        </View>
      ) : null}

      {flagged.length > 0 ? (
        <View style={{ borderWidth: 2, borderColor: COLORS.ink, backgroundColor: COLORS.red, padding: 12 }}>
          <Text style={{ color: "#fff", fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 }}>
            ⚠ AI flags — 3+ consecutive misses
          </Text>
          <Text style={{ color: "#fff", fontSize: 12, marginTop: 4, fontFamily: "monospace" }}>
            {flagged.map((f: { player: { gamertag: string }; absent: number }) => `${f.player.gamertag} (${f.absent} absent/30d)`).join(" · ")}
          </Text>
        </View>
      ) : null}

      <Card>
        <View style={s.between}>
          <Text style={s.h2}>Day board</Text>
          <Text style={s.label}>{day.totals.marked}/{day.rows.length} marked</Text>
        </View>
        <Field label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} autoCapitalize="none" />

        <View style={[s.row, { flexWrap: "wrap" }]}>
          <Chip text={`${day.totals.present} present`} color={COLORS.green} />
          <Chip text={`${day.totals.late} late`} color={COLORS.orange} />
          <Chip text={`${day.totals.absent} absent`} color={COLORS.red} />
          <Chip text={`${day.totals.leave} leave`} color={COLORS.blue} />
          <Chip text={`${day.totals.unmarked} unmarked`} color={COLORS.cream} />
        </View>

        {day.rows.slice(0, 40).map(({ player, record }: { player: { _id: string; gamertag: string; game: string }; record: { status: string; remarks?: string; source: string } | null }) => (
          <View key={player._id} style={{ gap: 6, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: "rgba(23,24,26,0.08)" }}>
            <View style={s.between}>
              <View style={{ gap: 2 }}>
                <Text style={{ fontWeight: "800", color: COLORS.ink }}>{player.gamertag}</Text>
                <Text style={{ fontSize: 10, color: COLORS.muted }}>{player.game}</Text>
              </View>
              {record ? <Chip text={record.status} color={badgeColor(record.status)} /> : <Text style={{ fontFamily: "monospace", fontSize: 10, color: COLORS.muted }}>—</Text>}
            </View>
            {record?.remarks ? <Text style={{ fontSize: 11, color: COLORS.muted }}>{record.remarks}</Text> : null}
            <View style={[s.row, { flexWrap: "wrap" }]}>
              {STATUSES.map((st) => (
                <Pressable
                  key={st}
                  onPress={() => doOverride(player._id, st)}
                  disabled={busy}
                  style={[
                    s.chip,
                    record?.status === st ? { backgroundColor: COLORS.yellow } : { backgroundColor: COLORS.card },
                  ]}
                >
                  <Text style={[s.chipText, { color: COLORS.ink }]}>{st}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={s.h2}>30-day attendance rates</Text>
        {summary.rows.slice(0, 30).map((r: { player: { _id: string; gamertag: string }; rate: number; present: number; absent: number; leave: number; autoAbsent: number; currentStreak: number; flag: string | null }) => (
          <View key={r.player._id} style={{ gap: 4 }}>
            <View style={s.between}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: COLORS.ink }}>{r.player.gamertag}</Text>
              <Text style={{ fontFamily: "monospace", fontWeight: "800" }}>{r.rate}%</Text>
            </View>
            <View style={{ height: 10, borderWidth: 2, borderColor: COLORS.ink, backgroundColor: COLORS.bg }}>
              <View style={{ width: `${Math.min(100, r.rate)}%`, height: "100%", backgroundColor: COLORS.green }} />
            </View>
            <Text style={{ fontSize: 10, color: COLORS.muted, fontFamily: "monospace" }}>
              {r.present} present · {r.absent} absent ({r.autoAbsent} AI) · {r.leave} leave · streak {r.currentStreak}d
              {r.flag ? " · ⚠ FLAGGED" : ""}
            </Text>
          </View>
        ))}
      </Card>

      <Text style={{ fontSize: 10, color: COLORS.muted, fontFamily: "monospace", lineHeight: 15 }}>
        The AI attendance job runs every 6 hours and auto-marks absent any player without a check-in for
        a day older than 24h. Corrections here overwrite those records.
      </Text>
    </Screen>
  );
}
