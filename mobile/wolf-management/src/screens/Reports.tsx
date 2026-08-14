import React from "react";
import { Text, View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, Chip, Header, Loading, Screen } from "../components";
import { badgeColor, COLORS, s } from "../theme";

export function Reports() {
  const reports = useQuery(api.attendance.adminMatchReports, {});
  if (reports === undefined) return <Loading label="Loading reports…" />;

  return (
    <Screen>
      <Header eyebrow="The Den" title="Match reports" />

      {reports.length === 0 ? (
        <Card>
          <Text style={s.body}>
            No match reports yet. When verified players submit post-match reports they land here
            instantly — with an email + Discord alert to the organization.
          </Text>
        </Card>
      ) : (
        reports.slice(0, 60).map((r: { _id: string; gamertag: string; game: string; opponent?: string; result: string; kills: number; deaths: number; assists: number; damage?: number; rating?: number; rolePlayed?: string; highlights?: string; improvement?: string; notes?: string; submittedAt: number }) => (
          <Card key={r._id} style={{ gap: 6 }}>
            <View style={s.between}>
              <Text style={{ fontWeight: "800", color: COLORS.ink }}>{r.gamertag}</Text>
              <Chip text={r.result} color={badgeColor(r.result)} />
            </View>
            <Text style={s.label}>
              {r.game}
              {r.opponent ? ` vs ${r.opponent}` : ""}
            </Text>
            <Text style={{ fontSize: 13, fontWeight: "800", color: COLORS.ink }}>
              {r.kills}K / {r.deaths}D / {r.assists}A{r.damage ? ` · ${r.damage.toLocaleString()} dmg` : ""}
              {r.rating ? ` · ${r.rating}/10` : ""}
            </Text>
            {r.rolePlayed ? <Text style={{ fontSize: 11, color: COLORS.muted }}>Role: {r.rolePlayed}</Text> : null}
            {r.highlights ? <Text style={{ fontSize: 11, color: COLORS.muted }}>Well: {r.highlights}</Text> : null}
            {r.improvement ? <Text style={{ fontSize: 11, color: COLORS.muted }}>Improve: {r.improvement}</Text> : null}
            {r.notes ? <Text style={{ fontSize: 11, fontStyle: "italic", color: COLORS.muted }}>“{r.notes}”</Text> : null}
            <Text style={{ fontSize: 9, color: COLORS.muted, fontFamily: "monospace" }}>
              {new Date(r.submittedAt).toLocaleString()}
            </Text>
          </Card>
        ))
      )}
    </Screen>
  );
}
