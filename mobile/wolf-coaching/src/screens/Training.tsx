import React from "react";
import { Text, View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, Chip, Header, Loading, Screen } from "../components";
import { COLORS, s } from "../theme";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function Training() {
  const schedule = useQuery(api.schedules.mySchedule);
  const publicScrims = useQuery(api.schedules.listPublicScrims);

  if (schedule === undefined || publicScrims === undefined) {
    return <Loading label="Loading your training week…" />;
  }

  return (
    <Screen>
      <Header eyebrow="Wolf Coach · Training" title="Your training week" />

      {schedule.profile ? (
        <Card>
          <Text style={s.body}>
            {schedule.teamName ? `Training with ${schedule.teamName}` : "Free agent — follow the org-wide template"} · weekly routine from the Schedule Hub.
          </Text>
        </Card>
      ) : (
        <Card>
          <Text style={s.body}>Register a player profile on the website to unlock your personalized weekly routine.</Text>
        </Card>
      )}

      {schedule.days.length === 0 ? (
        <Card>
          <Text style={s.h2}>No routine blocks yet</Text>
          <Text style={s.body}>Management builds the weekly template in The Den → Schedule Hub. Once published, it shows here automatically.</Text>
        </Card>
      ) : (
        schedule.days.map((day: { date: number; blocks: { _id: string; title: string; type: string; startHour: number; startMinute: number; durationMin: number; location?: string; required: boolean }[] }) => (
          <Card key={day.date} style={{ gap: 8 }}>
            <Text style={s.h2}>{DAYS[new Date(day.date).getDay()] ?? "Day"}</Text>
            {day.blocks.length === 0 ? (
              <Text style={s.body}>Rest day — recover and review VODs.</Text>
            ) : (
              day.blocks.map((b) => (
                <View key={b._id} style={{ gap: 3, paddingLeft: 10, borderLeftWidth: 3, borderLeftColor: b.required ? COLORS.yellow : COLORS.blue }}>
                  <View style={s.row}>
                    <Chip text={b.type} color={b.required ? COLORS.yellow : COLORS.blue} />
                    {b.required ? <Chip text="required" color={COLORS.red} /> : null}
                  </View>
                  <Text style={{ fontWeight: "800", color: COLORS.ink }}>
                    {b.title} · {String(b.startHour).padStart(2, "0")}:{String(b.startMinute).padStart(2, "0")} ({b.durationMin} min)
                  </Text>
                  {b.location ? <Text style={{ fontSize: 11, color: COLORS.muted }}>{b.location}</Text> : null}
                </View>
              ))
            )}
          </Card>
        ))
      )}

      <Card style={{ gap: 8 }}>
        <Text style={s.h2}>Public scrims</Text>
        {publicScrims.length === 0 ? (
          <Text style={s.body}>No public scrim slots right now — management posts them here live.</Text>
        ) : (
          publicScrims.slice(0, 10).map((sc: { _id: string; title: string; opponentName: string; scheduledAt: number; game: string; status: string }) => (
            <View key={sc._id} style={{ gap: 2 }}>
              <Text style={{ fontWeight: "800", color: COLORS.ink }}>
                {sc.title} vs {sc.opponentName}
              </Text>
              <Text style={{ fontSize: 11, color: COLORS.muted, fontFamily: "monospace" }}>
                {new Date(sc.scheduledAt).toLocaleString()} · {sc.game} · {sc.status}
              </Text>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}
