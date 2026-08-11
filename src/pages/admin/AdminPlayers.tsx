import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, NeoCard, PageHeader, StatusBadge } from "@/components/neo";
import { GAMES } from "@/lib/constants";
import { fmtDate, fmtKd } from "@/lib/format";
import { btnGhost, btnYellow, input, label, select, tableCell, tableHead } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { Eye, ShieldCheck, ShieldX, UserCheck, UserX } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import type { Doc } from "@/convex/_generated/dataModel";

type Player = Doc<"players">;

export default function AdminPlayers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(searchParams.get("status") ?? "all");
  const [game, setGame] = useState("all");
  const [selected, setSelected] = useState<Player | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const players = useQuery(api.players.list, {
    status: status === "all" ? undefined : status,
    game: game === "all" ? undefined : game,
    search: search || undefined,
  });

  const stats = useQuery(api.stats.forPlayer, selected ? { playerId: selected._id } : "skip");
  const entries = useQuery(
    api.performance.listAll,
    selected ? { playerId: selected._id } : "skip",
  );

  const setStatusMutation = useMutation(api.players.setStatus);
  const setRole = useMutation(api.admin.setRole);

  const statuses = useMemo(() => ["all", "pending", "active", "suspended"], []);

  const openDetail = (p: Player) => {
    setSelected(p);
    setDetailOpen(true);
  };

  const handleStatus = async (p: Player, next: "active" | "suspended" | "pending") => {
    await setStatusMutation({ playerId: p._id, status: next });
    if (selected?._id === p._id) setSelected({ ...p, status: next });
  };

  const handlePromote = async (p: Player) => {
    await setRole({ userId: p.userId, role: "admin" });
  };

  const filterGames = useMemo(() => ["all", ...GAMES], []);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="The Den · Roster"
        title="Player registry"
        description="Every registration from The Pack lands here. Approve, suspend and manage access."
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Input
          className={cn(input, "md:max-w-xs")}
          placeholder="Search gamertag, name, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setStatus(s);
                setSearchParams(s === "all" ? {} : { status: s });
              }}
              className={cn(
                "border-2 border-foreground px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider",
                status === s ? "bg-neo-yellow text-white shadow-[3px_3px_0_0_var(--neo-ink)]" : "bg-card hover:bg-neo-cream",
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <Select value={game} onValueChange={setGame}>
          <SelectTrigger className={cn(select, "w-44")}>
            <SelectValue placeholder="All games" />
          </SelectTrigger>
          <SelectContent className="rounded-none border-2 border-foreground">
            {filterGames.map((g) => (
              <SelectItem key={g} value={g}>
                {g === "all" ? "All games" : g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <NeoCard className="gap-0 overflow-x-auto p-0">
        {!players ? (
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse border-2 border-foreground bg-card" />
            ))}
          </div>
        ) : players.length === 0 ? (
          <EmptyState
            title="No players found"
            description="New registrations from The Pack appear here for approval."
          />
        ) : (
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr>
                <th className={tableHead}>Player</th>
                <th className={tableHead}>Game</th>
                <th className={tableHead}>Role</th>
                <th className={tableHead}>Rank</th>
                <th className={tableHead}>Status</th>
                <th className={tableHead}>Joined</th>
                <th className={cn(tableHead, "text-right")}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p._id} className="group bg-card hover:bg-neo-yellow/20">
                  <td className={tableCell}>
                    <p className="font-bold">{p.gamertag}</p>
                    <p className="text-xs text-muted-foreground">{p.realName}</p>
                  </td>
                  <td className={tableCell}>{p.game}</td>
                  <td className={cn(tableCell, "text-muted-foreground")}>
                    {p.inGameRole ?? "—"}
                  </td>
                  <td className={cn(tableCell, "font-mono text-xs font-bold")}>{p.rank ?? "—"}</td>
                  <td className={tableCell}>
                    <StatusBadge status={p.status} />
                  </td>
                  <td className={cn(tableCell, "text-muted-foreground")}>
                    {fmtDate(p.joinedAt)}
                  </td>
                  <td className={cn(tableCell, "text-right")}>
                    <div className="flex items-center justify-end gap-1.5">
                      <Button size="sm" variant="outline" className={btnGhost} onClick={() => openDetail(p)}>
                        <Eye className="size-3.5" />
                        View
                      </Button>
                      {p.status !== "active" ? (
                        <Button
                          size="sm"
                          className="neo-press rounded-none border-2 border-foreground bg-neo-green text-white shadow-[2px_2px_0_0_var(--neo-ink)] hover:shadow-[3px_3px_0_0_var(--neo-ink)]"
                          onClick={() => handleStatus(p, "active")}
                          title="Approve"
                        >
                          <UserCheck className="size-3.5" />
                        </Button>
                      ) : null}
                      {p.status !== "suspended" ? (
                        <Button
                          size="sm"
                          className="neo-press rounded-none border-2 border-foreground bg-neo-red text-white shadow-[2px_2px_0_0_var(--neo-ink)] hover:shadow-[3px_3px_0_0_var(--neo-ink)]"
                          onClick={() => handleStatus(p, "suspended")}
                          title="Suspend"
                        >
                          <UserX className="size-3.5" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="neo-press rounded-none border-2 border-foreground bg-neo-cream text-foreground shadow-[2px_2px_0_0_var(--neo-ink)] hover:shadow-[3px_3px_0_0_var(--neo-ink)]"
                          onClick={() => handleStatus(p, "pending")}
                          title="Reinstate as pending"
                        >
                          <ShieldX className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </NeoCard>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto rounded-none border-2 border-foreground bg-card shadow-[6px_6px_0_0_var(--neo-ink)]">
          <DialogHeader>
            <DialogTitle className="text-left text-2xl font-bold">
              {selected?.gamertag}
            </DialogTitle>
          </DialogHeader>
          {selected ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={selected.status} />
                <StatusBadge status={selected.game} />
                {selected.rank ? <StatusBadge status="user">{selected.rank}</StatusBadge> : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Real name", selected.realName],
                  ["Email", selected.email],
                  ["In-game role", selected.inGameRole ?? "—"],
                  ["Region", selected.region ?? "—"],
                  ["Discord", selected.discord ?? "—"],
                  ["Joined", fmtDate(selected.joinedAt)],
                ].map(([k, v]) => (
                  <div key={k} className="border-2 border-foreground bg-background px-3 py-2">
                    <p className={label}>{k}</p>
                    <p className="mt-0.5 text-sm font-medium break-words">{v}</p>
                  </div>
                ))}
              </div>

              {selected.bio ? (
                <p className="border-2 border-foreground bg-background px-3 py-2 text-sm text-muted-foreground">
                  {selected.bio}
                </p>
              ) : null}

              <div>
                <p className={cn(label, "mb-2")}>Performance</p>
                {!stats ? (
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-16 animate-pulse border-2 border-foreground bg-card" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="border-2 border-foreground bg-neo-yellow px-3 py-2 text-white">
                      <p className={label}>K/D</p>
                      <p className="text-xl font-bold tabular-nums">{stats.kd}</p>
                    </div>
                    <div className="border-2 border-foreground bg-neo-cream px-3 py-2">
                      <p className={label}>Win rate</p>
                      <p className="text-xl font-bold tabular-nums">{stats.winRate}%</p>
                    </div>
                    <div className="border-2 border-foreground bg-neo-cream px-3 py-2">
                      <p className={label}>Matches</p>
                      <p className="text-xl font-bold tabular-nums">{stats.total}</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <p className={cn(label, "mb-2")}>Recent entries</p>
                {!entries ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : entries.length === 0 ? (
                  <p className="border-2 border-foreground bg-background px-3 py-3 text-sm text-muted-foreground">
                    No performance logged yet.
                  </p>
                ) : (
                  <div className="max-h-56 divide-y-2 divide-foreground/10 overflow-y-auto border-2 border-foreground bg-background">
                    {entries.slice(0, 8).map((e) => (
                      <div key={e._id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                        <div className="min-w-0">
                          <span className="font-bold">{e.game}</span>{" "}
                          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            {e.matchType}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="font-mono text-xs tabular-nums">
                            {e.kills}/{e.deaths}/{e.assists} · K/D {fmtKd(e.kills, e.deaths)}
                          </span>
                          <StatusBadge status={e.result} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t-2 border-foreground pt-4">
                {selected.status !== "active" ? (
                  <Button className={btnYellow} onClick={() => handleStatus(selected, "active")}>
                    <UserCheck className="size-4" />
                    Approve player
                  </Button>
                ) : (
                  <Button
                    className="neo-press rounded-none border-2 border-foreground bg-neo-red text-white shadow-[3px_3px_0_0_var(--neo-ink)] hover:shadow-[4px_4px_0_0_var(--neo-ink)]"
                    onClick={() => handleStatus(selected, "suspended")}
                  >
                    <UserX className="size-4" />
                    Suspend player
                  </Button>
                )}
                <Button
                  variant="outline"
                  className={btnGhost}
                  onClick={() => handlePromote(selected)}
                  title="Grant management access"
                >
                  <ShieldCheck className="size-4" />
                  Make manager
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
