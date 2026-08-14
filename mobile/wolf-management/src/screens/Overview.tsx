import React from "react";
import { Text, View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, Header, Loading, Screen, Stat } from "../components";
import { COLORS, s } from "../theme";

export function Overview() {
  const data = useQuery(api.stats.getAdminDashboard);
  if (!data) return <Loading label="Loading the org…" />;

  const { counts, live } = data;

  return (
    <Screen>
      <Header eyebrow="The Den · Management" title="Organization overview" />

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Stat label="Players" value={String(live.players.total)} sub={`${live.players.active} active`} color={COLORS.green} />
        <Stat label="Pending" value={String(live.players.pending)} sub="await approval" color={COLORS.orange} />
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Stat label="Teams" value={String(live.teams)} sub="rosters live" color={COLORS.blue} />
        <Stat label="Matches" value={String(live.matches.total)} sub={`${live.matches.live} live`} color={COLORS.yellow} />
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Stat label="Tournaments" value={String(live.tournaments.total)} sub={`${live.tournaments.upcoming} upcoming`} color={COLORS.purple} />
        <Stat label="Inquiries" value={String(live.inquiries.total)} sub={`${live.inquiries.unread} unread`} color={COLORS.red} />
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Stat label="Donations" value={String(live.donations.total)} sub={`${(live.donations.amountPaid / 100).toFixed(2)} paid`} color={COLORS.green} />
        <Stat label="Tryouts" value={String(live.tryouts.total)} sub={`${live.tryouts.pending} pending`} color={COLORS.orange} />
      </View>

      <Card>
        <Text style={s.h2}>Players by status</Text>
        <View style={{ gap: 6 }}>
          <RowBar label="Active" value={live.players.active} color={COLORS.green} />
          <RowBar label="Pending" value={live.players.pending} color={COLORS.orange} />
          <RowBar label="Suspended" value={live.players.suspended} color={COLORS.red} />
        </View>
      </Card>

      <Card>
        <Text style={s.h2}>This week</Text>
        <Text style={s.body}>
          Performance entries logged: {counts.entries} · Announcements: {counts.announcements}
        </Text>
        <Text style={{ fontSize: 10, color: COLORS.muted, fontFamily: "monospace" }}>
          Every number on this screen is a live database subscription — it updates the moment players or
          management write anything.
        </Text>
      </Card>
    </Screen>
  );
}

function RowBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={s.between}>
      <Text style={{ fontSize: 12, fontWeight: "700", color: COLORS.ink }}>{label}</Text>
      <View style={{ flex: 1, height: 10, borderWidth: 2, borderColor: COLORS.ink, backgroundColor: COLORS.bg }}>
        <View style={{ width: `${Math.min(100, value * 4)}%`, height: "100%", backgroundColor: color }} />
      </View>
      <Text style={{ fontFamily: "monospace", fontWeight: "800" }}>{value}</Text>
    </View>
  );
}
