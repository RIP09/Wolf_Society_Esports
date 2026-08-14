import React from "react";
import { Text, View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, Chip, Header, Loading, Screen, Stat } from "../components";
import { badgeColor, COLORS, s } from "../theme";

export function Dashboard() {
  const data = useQuery(api.stats.getMyDashboard);
  const attendance = useQuery(api.attendance.myStatus);

  if (!data || !attendance) return <Loading label="Loading your dashboard…" />;

  const { profile, stats, announcements } = data;

  return (
    <Screen>
      <Header eyebrow="The Pack · Player hub" title={`Welcome back, ${profile?.gamertag ?? ""}`} />

      {profile?.badges && profile.badges.length > 0 ? (
        <View style={s.row}>
          {profile.badges.map((b) => (
            <Chip key={b} text={b} color={COLORS.yellow} />
          ))}
        </View>
      ) : null}

      <Card>
        <View style={s.between}>
          <View style={{ gap: 4 }}>
            <Text style={s.label}>Today's attendance</Text>
            <Text style={{ fontSize: 16, fontWeight: "800", color: COLORS.ink }}>
              {attendance.today ? `Checked in — ${attendance.today.status}` : "Not checked in yet"}
            </Text>
            <Text style={{ fontSize: 11, color: COLORS.muted }}>
              {attendance.streaks.currentStreak > 0
                ? `${attendance.streaks.currentStreak}-day streak · ${attendance.streaks.bestStreak}-day best`
                : "No active streak — check in to start one"}
            </Text>
          </View>
          {attendance.today ? (
            <Chip text={attendance.today.status} color={badgeColor(attendance.today.status)} />
          ) : (
            <Chip text="Due today" color={COLORS.blue} />
          )}
        </View>
      </Card>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Stat label="Win rate" value={`${stats.winRate}%`} sub={`${stats.wins}W · ${stats.losses}L`} color={COLORS.green} />
        <Stat label="K/D" value={stats.kd} sub={`${stats.kills} / ${stats.deaths}`} color={COLORS.yellow} />
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Stat label="Matches" value={String(stats.total)} sub={`${stats.avgDamage.toLocaleString()} avg dmg`} color={COLORS.blue} />
        <Stat label="Assists" value={String(stats.assists)} sub="team play tracked" color={COLORS.orange} />
      </View>

      <Card>
        <Text style={s.h2}>Latest broadcasts</Text>
        {announcements.length === 0 ? (
          <Text style={s.body}>No announcements yet.</Text>
        ) : (
          announcements.slice(0, 4).map((a: { _id: string; title: string; body: string; priority: string; createdAt: number }) => (
            <View key={a._id} style={{ gap: 4 }}>
              <View style={s.row}>
                <Chip text={a.priority} color={badgeColor(a.priority)} />
                <Text style={{ fontSize: 10, color: COLORS.muted, fontFamily: "monospace" }}>
                  {new Date(a.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text style={{ fontWeight: "800", color: COLORS.ink }}>{a.title}</Text>
              <Text style={s.body}>{a.body}</Text>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}
