import { api } from "@/convex/_generated/api";
import { EmptyState, NeoCard, PageHeader, StatCard } from "@/components/neo";
import { fmtDay } from "@/lib/format";
import { useQuery } from "convex/react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const tooltipStyle = {
  borderRadius: 0,
  border: "2px solid var(--neo-ink)",
  boxShadow: "4px 4px 0 0 var(--neo-ink)",
  fontSize: 12,
  fontFamily: "Space Mono, monospace",
  background: "var(--card)",
  color: "var(--card-foreground)",
};

export default function AdminAnalytics() {
  const data = useQuery(api.analytics.getAnalytics);

  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse border-2 border-foreground bg-card" />
        ))}
      </div>
    );
  }

  const trend = data.viewsPerDay.map((d) => ({ label: fmtDay(d.day), count: d.count }));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="The Den · Insights"
        title="Site analytics"
        description="Realtime, privacy-friendly pageview analytics for the public portal — tracked live in the organization database."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total pageviews" value={data.total} sub="all time" accent="purple" />
        <StatCard
          label="Views today"
          value={data.viewsPerDay[data.viewsPerDay.length - 1]?.count ?? 0}
          sub="last 24h"
          accent="blue"
        />
        <StatCard label="Top page" value={data.topPaths[0]?.path ?? "—"} sub={`${data.topPaths[0]?.count ?? 0} views`} accent="green" />
      </div>

      <NeoCard className="gap-0 p-0">
        <div className="flex items-center justify-between border-b-2 border-foreground px-5 py-4">
          <h2 className="font-bold">Pageviews — last 14 days</h2>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            realtime
          </span>
        </div>
        <div className="p-4">
          {data.total > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="#1b1d3a" strokeOpacity={0.12} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: "Space Mono, monospace" }} interval={2} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fontFamily: "Space Mono, monospace" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="stepAfter" dataKey="count" name="views" stroke="#1b1d3a" strokeWidth={2} fill="#7b5cf0" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              title="No pageviews yet"
              description="As visitors browse the public portal, views stream in here in real time."
            />
          )}
        </div>
      </NeoCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <NeoCard className="gap-0 p-0">
          <div className="border-b-2 border-foreground px-5 py-4">
            <h2 className="font-bold">Top pages</h2>
          </div>
          <div className="p-4">
            {data.topPaths.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.topPaths} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid stroke="#1b1d3a" strokeOpacity={0.12} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fontFamily: "Space Mono, monospace" }} />
                  <YAxis
                    type="category"
                    dataKey="path"
                    width={120}
                    tick={{ fontSize: 10, fontFamily: "Space Grotesk, sans-serif", fontWeight: 700 }}
                  />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#e8e7f5" }} />
                  <Bar dataKey="count" name="views" fill="#3d7bff" stroke="#1b1d3a" strokeWidth={2} radius={0} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">No data yet.</p>
            )}
          </div>
        </NeoCard>

        <NeoCard className="gap-0 p-0">
          <div className="border-b-2 border-foreground px-5 py-4">
            <h2 className="font-bold">Top referrers</h2>
          </div>
          <div className="flex flex-col divide-y-2 divide-foreground/10">
            {data.topReferrers.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                No external referrers yet — visits track as people share the site.
              </p>
            ) : (
              data.topReferrers.map((r) => (
                <div key={r.domain} className="flex items-center justify-between gap-2 px-5 py-3.5">
                  <p className="truncate font-mono text-sm font-bold">{r.domain}</p>
                  <span className="border-2 border-foreground bg-neo-cream px-2 py-0.5 font-mono text-[10px] font-bold tabular-nums">
                    {r.count}
                  </span>
                </div>
              ))
            )}
          </div>
        </NeoCard>
      </div>
    </div>
  );
}
