import React from "react";
import { Text, View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, Header, Loading, Screen } from "../components";
import { COLORS, s } from "../theme";

export function Performance() {
  const data = useQuery(api.stats.getMyDashboard);
  const attendance = useQuery(api.attendance.myStatus);

  if (!data || !attendance) return <Loading label="Loading analytics…" />;

  const { profile, stats, kdTrend } = data;

  return (
    <Screen>
      <Header eyebrow="Wolf Coach · Analytics" title="Your performance" />

      {!profile ? (
        <Card>
          <Text style={s.body}>Register a player profile on the website to see your analytics here.</Text>
        </Card>
      ) : (
        <>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Card style={{ flex: 1 }}>
              <Text style={s.label}>Win rate</Text>
              <Text style={{ fontSize: 24, fontWeight: "800", color: COLORS.ink }}>{stats.winRate}%</Text>
            </Card>
            <Card style={{ flex: 1 }}>
              <Text style={s.label}>K/D</Text>
              <Text style={{ fontSize: 24, fontWeight: "800", color: COLORS.ink }}>{stats.kd}</Text>
            </Card>
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Card style={{ flex: 1 }}>
              <Text style={s.label}>Matches</Text>
              <Text style={{ fontSize: 24, fontWeight: "800", color: COLORS.ink }}>{stats.total}</Text>
            </Card>
            <Card style={{ flex: 1 }}>
              <Text style={s.label}>Attendance</Text>
              <Text style={{ fontSize: 24, fontWeight: "800", color: COLORS.ink }}>
                {attendance.streaks.currentStreak}d
              </Text>
            </Card>
          </View>

          <Card style={{ gap: 8 }}>
            <Text style={s.h2}>Coach's read</Text>
            <Text style={s.body}>
              {stats.winRate >= 60
                ? "Strong win rate — you're converting practice into results. Keep logging detailed match reports so the coach can tune your role play."
                : stats.winRate >= 40
                  ? "Solid foundation. The next level is consistency: attendance every day + one focused fix per match report."
                  : "Results will come — focus on the process. Consistent attendance and honest match reports are how your coach builds your plan."}
            </Text>
            {kdTrend.length > 1 ? (
              <Text style={{ fontSize: 11, color: COLORS.muted, fontFamily: "monospace" }}>
                Last {kdTrend.length} entries tracked — ask the AI coach for a training plan based on this form.
              </Text>
            ) : null}
          </Card>
        </>
      )}
    </Screen>
  );
}
