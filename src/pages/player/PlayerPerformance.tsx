import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { GamePicker } from "@/components/GamePicker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LoadingScreen } from "@/components/Loading";
import { EmptyState, NeoCard, NeoField, PageHeader, StatusBadge } from "@/components/neo";
import { GAMES, MATCH_TYPES } from "@/lib/constants";
import { fmtDateTime, fmtKd } from "@/lib/format";
import { btnYellow, input, label, select, tableCell, tableHead } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Navigate } from "react-router";
import { toast } from "sonner";

export default function PlayerPerformance() {
  const entries = useQuery(api.performance.listMy);
  const profile = useQuery(api.players.getMyProfile);
  const log = useMutation(api.performance.log);
  const remove = useMutation(api.performance.remove);

  const [matchType, setMatchType] = useState<string>("scrim");
  const [game, setGame] = useState<string>(GAMES[0]);
  const [result, setResult] = useState<string>("win");
  const [kills, setKills] = useState("");
  const [deaths, setDeaths] = useState("");
  const [assists, setAssists] = useState("");
  const [damage, setDamage] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!entries || !profile) return <LoadingScreen label="Loading…" />;
  if (profile.status === "suspended") return <Navigate to="/player" replace />;

  const handleLog = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await log({
        matchType: matchType as "scrim" | "tournament" | "ranked" | "tryout",
        game,
        result: result as "win" | "loss" | "draw",
        kills: Number(kills),
        deaths: Number(deaths),
        assists: Number(assists),
        damage: damage ? Number(damage) : undefined,
        notes: notes || undefined,
      });
      setKills("");
      setDeaths("");
      setAssists("");
      setDamage("");
      setNotes("");
      toast.success("Performance entry saved — management can see it now.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Logging failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = kills !== "" && deaths !== "" && assists !== "" && Number(kills) >= 0 && Number(deaths) >= 0 && Number(assists) >= 0;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Wolf Society Esports · The Pack"
        title="Performance log"
        description="Track every scrim, tournament and ranked session. Management in The Den sees these too."
      />

      <NeoCard className="gap-5 p-6">
        <div className="flex items-center gap-2">
          <Plus className="size-5" />
          <h2 className="font-bold">Log an entry</h2>
        </div>
        {error ? (
          <p className="border-2 border-foreground bg-neo-red px-3 py-2 text-xs font-bold text-white">
            {error}
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-3">
          <NeoField label="Match type">
            <Select value={matchType} onValueChange={setMatchType}>
              <SelectTrigger className={cn(select, "w-full")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none border-2 border-foreground">
                {MATCH_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    <StatusBadge status={t}>{t}</StatusBadge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </NeoField>
          <NeoField label="Game">
            <GamePicker value={game} onChange={setGame} />
          </NeoField>
          <NeoField label="Result">
            <Select value={result} onValueChange={setResult}>
              <SelectTrigger className={cn(select, "w-full")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none border-2 border-foreground">
                {["win", "loss", "draw"].map((r) => (
                  <SelectItem key={r} value={r}>
                    <StatusBadge status={r}>{r}</StatusBadge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </NeoField>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <NeoField label="Kills">
            <Input className={cn(input, "font-mono")} type="number" min={0} value={kills} onChange={(e) => setKills(e.target.value)} placeholder="18" />
          </NeoField>
          <NeoField label="Deaths">
            <Input className={cn(input, "font-mono")} type="number" min={0} value={deaths} onChange={(e) => setDeaths(e.target.value)} placeholder="12" />
          </NeoField>
          <NeoField label="Assists">
            <Input className={cn(input, "font-mono")} type="number" min={0} value={assists} onChange={(e) => setAssists(e.target.value)} placeholder="7" />
          </NeoField>
          <NeoField label="Damage (opt.)">
            <Input className={cn(input, "font-mono")} type="number" min={0} value={damage} onChange={(e) => setDamage(e.target.value)} placeholder="21400" />
          </NeoField>
        </div>
        <NeoField label="Notes">
          <Textarea
            className="rounded-none border-2 border-foreground bg-background"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Review VOD, highlight plays, areas to improve…"
          />
        </NeoField>
        <div className="flex justify-end">
          <Button className={btnYellow} onClick={handleLog} disabled={submitting || !canSubmit}>
            {submitting ? "Saving…" : "Log entry"}
          </Button>
        </div>
      </NeoCard>

      <div>
        <p className={cn(label, "mb-3")}>History — {entries.length} entries</p>
        {entries.length === 0 ? (
          <EmptyState
            title="No entries yet"
            description="Log your first scrim or match above. Your K/D and win rate build from these."
          />
        ) : (
          <NeoCard className="gap-0 overflow-x-auto p-0">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr>
                  <th className={tableHead}>When</th>
                  <th className={tableHead}>Type</th>
                  <th className={tableHead}>Game</th>
                  <th className={tableHead}>K / D / A</th>
                  <th className={tableHead}>K/D</th>
                  <th className={tableHead}>Result</th>
                  <th className={cn(tableHead, "text-right")}></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e._id} className="bg-card hover:bg-neo-yellow/20">
                    <td className={cn(tableCell, "text-muted-foreground")}>{fmtDateTime(e.recordedAt)}</td>
                    <td className={tableCell}>
                      <StatusBadge status={e.matchType}>{e.matchType}</StatusBadge>
                    </td>
                    <td className={tableCell}>{e.game}</td>
                    <td className={cn(tableCell, "font-mono font-bold tabular-nums")}>
                      {e.kills} / {e.deaths} / {e.assists}
                    </td>
                    <td className={cn(tableCell, "font-mono text-sm font-bold tabular-nums")}>
                      {fmtKd(e.kills, e.deaths)}
                    </td>
                    <td className={tableCell}>
                      <StatusBadge status={e.result} />
                    </td>
                    <td className={cn(tableCell, "text-right")}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="neo-press rounded-none border-2 border-foreground bg-neo-red text-white shadow-[2px_2px_0_0_var(--neo-ink)] hover:shadow-[3px_3px_0_0_var(--neo-ink)]"
                        onClick={() => remove({ entryId: e._id })}
                        title="Delete entry"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </NeoCard>
        )}
      </div>
    </div>
  );
}
