import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button, Card, Chip, Field, Header, Loading, Screen } from "../components";
import { badgeColor, COLORS, s } from "../theme";

const TYPES = ["practice", "match", "other"] as const;
const ON_TIME = ["present", "late"] as const;

export function Attendance() {
  const status = useQuery(api.attendance.myStatus);
  const history = useQuery(api.attendance.myHistory);
  const checkIn = useMutation(api.attendance.checkIn);
  const requestLeave = useMutation(api.attendance.requestLeave);

  const [type, setType] = useState<(typeof TYPES)[number]>("practice");
  const [onTime, setOnTime] = useState<(typeof ON_TIME)[number]>("present");
  const [remarks, setRemarks] = useState("");
  const [leaveDate, setLeaveDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!status || history === undefined) return <Loading label="Loading attendance…" />;

  const doCheckIn = async () => {
    setBusy(true);
    setError(null);
    try {
      await checkIn({ type, status: onTime, remarks: remarks.trim() || undefined });
      setRemarks("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check-in failed.");
    } finally {
      setBusy(false);
    }
  };

  const doLeave = async () => {
    if (!leaveDate) {
      setError("Pick the date you need leave for.");
      return;
    }
    if (leaveReason.trim().length < 2) {
      setError("Add a short reason for your leave.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await requestLeave({ date: leaveDate, reason: leaveReason.trim() });
      setLeaveDate("");
      setLeaveReason("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Leave request failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Header eyebrow="The Pack" title="Daily Attendance" />

      <Card>
        <View style={s.between}>
          <View style={{ gap: 4 }}>
            <Text style={s.label}>Today</Text>
            <Text style={{ fontSize: 20, fontWeight: "800", color: COLORS.ink }}>
              {status.today ? status.today.status : "Not checked in"}
            </Text>
            <Text style={{ fontSize: 11, color: COLORS.muted }}>
              Streak {status.streaks.currentStreak}d · best {status.streaks.bestStreak}d · {status.streaks.missedDays} auto-missed
            </Text>
          </View>
          {status.today ? <Chip text={status.today.status} color={badgeColor(status.today.status)} /> : null}
        </View>
        <Text style={{ fontSize: 10, color: COLORS.muted, fontFamily: "monospace" }}>
          The AI attendance system auto-marks you absent if you don't check in within 24 hours.
        </Text>
      </Card>

      <Card style={{ gap: 12 }}>
        <Text style={s.h2}>{status.today ? "Update today's check-in" : "Check in for today"}</Text>
        {error ? (
          <View style={{ borderWidth: 2, borderColor: COLORS.ink, backgroundColor: COLORS.red, padding: 10 }}>
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>{error}</Text>
          </View>
        ) : null}

        <View>
          <Text style={s.label}>What did you attend?</Text>
          <View style={[s.row, { marginTop: 6, flexWrap: "wrap" }]}>
            {TYPES.map((t) => (
              <PressableChip key={t} label={t} active={type === t} onPress={() => setType(t)} />
            ))}
          </View>
        </View>

        <View>
          <Text style={s.label}>On time?</Text>
          <View style={[s.row, { marginTop: 6, flexWrap: "wrap" }]}>
            {ON_TIME.map((t) => (
              <PressableChip key={t} label={t} active={onTime === t} onPress={() => setOnTime(t)} />
            ))}
          </View>
        </View>

        <Field label="Remarks (optional)" value={remarks} onChangeText={setRemarks} placeholder="What did you work on today?" multiline />
        <Button title={status.today ? "Update my check-in" : "Check in now"} onPress={doCheckIn} loading={busy} />
      </Card>

      <Card style={{ gap: 12 }}>
        <Text style={s.h2}>Request a leave day</Text>
        <Field label="Date (YYYY-MM-DD)" value={leaveDate} onChangeText={setLeaveDate} placeholder="e.g. 2026-08-15" autoCapitalize="none" />
        <Field label="Reason" value={leaveReason} onChangeText={setLeaveReason} placeholder="Sick, exams, emergency…" multiline />
        <Button title="Request leave" variant="ghost" onPress={doLeave} loading={busy} />
      </Card>

      <Card style={{ gap: 10 }}>
        <Text style={s.h2}>History</Text>
        {history.length === 0 ? (
          <Text style={s.body}>No attendance yet — check in today to start your record.</Text>
        ) : (
          history.slice(0, 20).map((r: { _id: string; dateKey: string; status: string; type: string; remarks?: string; source: string }) => (
            <View key={r._id} style={{ gap: 4, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: "rgba(23,24,26,0.08)" }}>
              <View style={s.between}>
                <Text style={{ fontWeight: "800", color: COLORS.ink }}>{r.dateKey}</Text>
                <View style={s.row}>
                  <Chip text={r.status} color={badgeColor(r.status)} />
                  <Chip text={r.source === "auto" ? "AI" : "manual"} color={r.source === "auto" ? COLORS.red : COLORS.green} />
                </View>
              </View>
              <Text style={{ fontSize: 11, color: COLORS.muted }}>
                {r.type} · {r.remarks ?? (r.source === "auto" ? "Auto-marked absent" : "No remarks")}
              </Text>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}

function PressableChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[s.chip, active ? { backgroundColor: COLORS.yellow } : { backgroundColor: COLORS.card }]}
    >
      <Text style={[s.chipText, { color: COLORS.ink }]}>{label}</Text>
    </Pressable>
  );
}
