import { api } from "@/convex/_generated/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, NeoCard, PageHeader, StatusBadge } from "@/components/neo";
import { PhotoUpload } from "@/components/PhotoUpload";
import { csvDateTime, downloadCSV } from "@/lib/export";
import { GAMES } from "@/lib/constants";
import { btnGhost, btnYellow, input, label, select } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { Crown, Download, Pencil, Plus, Trash2, UserMinus, Users } from "lucide-react";
import { useState } from "react";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

type Team = Doc<"teams"> & { photoUrl?: string };

interface TeamForm {
  name: string;
  tag: string;
  game: string;
  description: string;
  captainId: string;
}

const emptyForm: TeamForm = { name: "", tag: "", game: GAMES[0], description: "", captainId: "none" };

export default function AdminTeams() {
  const teams = useQuery(api.teams.listTeams);
  const activePlayers = useQuery(api.players.list, { status: "active" });

  const createTeam = useMutation(api.teams.createTeam);
  const updateTeam = useMutation(api.teams.updateTeam);
  const deleteTeam = useMutation(api.teams.deleteTeam);
  const assignPlayer = useMutation(api.teams.assignPlayer);
  const removePlayer = useMutation(api.teams.removePlayer);
  const generateUploadUrl = useMutation(api.uploads.generateUploadUrl);
  const setTeamPhoto = useMutation(api.uploads.setTeamPhoto);
  const removeTeamPhoto = useMutation(api.uploads.removeTeamPhoto);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [form, setForm] = useState<TeamForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formPhoto, setFormPhoto] = useState<File | null>(null);
  const [formPhotoUrl, setFormPhotoUrl] = useState<string | null>(null);

  const [rosterTeam, setRosterTeam] = useState<Team | null>(null);
  const [addPlayer, setAddPlayer] = useState("none");
  const [deleteTarget, setDeleteTarget] = useState<Team | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormPhoto(null);
    setFormPhotoUrl(null);
    setFormOpen(true);
  };
  const openEdit = (t: Team) => {
    setEditing(t);
    setForm({
      name: t.name,
      tag: t.tag,
      game: t.game,
      description: t.description ?? "",
      captainId: t.captainId ?? "none",
    });
    setFormPhoto(null);
    setFormPhotoUrl(t.photoUrl ?? null);
    setFormOpen(true);
  };

  const uploadTeamPhoto = async (teamId: Doc<"teams">["_id"], file: File) => {
    const uploadUrl = await generateUploadUrl();
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!res.ok) throw new Error("Upload failed — try again.");
    const { storageId } = (await res.json()) as { storageId: string };
    await setTeamPhoto({ teamId, storageId: storageId as Id<"_storage"> });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const args = {
        name: form.name,
        tag: form.tag,
        game: form.game,
        description: form.description || undefined,
        captainId: form.captainId === "none" ? undefined : (form.captainId as Doc<"players">["_id"]),
      };
      if (editing) {
        await updateTeam({ teamId: editing._id, ...args });
        if (formPhoto) await uploadTeamPhoto(editing._id, formPhoto);
        toast.success("Team updated — live across all portals.");
      } else {
        const teamId = await createTeam(args);
        if (formPhoto) await uploadTeamPhoto(teamId, formPhoto);
        toast.success("Team created — live across all portals.");
      }
      setFormOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
      toast.error("Could not save the team.");
    } finally {
      setSaving(false);
    }
  };

  const roster = useQuery(
    api.teams.getTeam,
    rosterTeam ? { teamId: rosterTeam._id } : "skip",
  );

  const eligible = (activePlayers ?? []).filter(
    (p) => !roster?.players.some((rp) => rp._id === p._id),
  );

  if (!teams) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse border-2 border-foreground bg-card" />
        ))}
      </div>
    );
  }

  const exportCsv = () => {
    downloadCSV(
      `wolf-society-teams-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        ["Name", "Tag", "Game", "Members", "Captain", "Description", "Created"],
        ...teams.map((t) => [
          t.name,
          t.tag,
          t.game,
          t.memberCount,
          t.captainId ?? "—",
          t.description ?? "",
          csvDateTime(t.createdAt),
        ]),
      ],
    );
    toast.success(`Exported ${teams.length} teams to CSV.`);
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Rosters"
        title="Teams"
        description="Build and manage competitive rosters. Each player sits on exactly one team."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className={btnGhost} onClick={exportCsv} disabled={teams.length === 0}>
              <Download className="size-4" />
              Export CSV
            </Button>
            <Button className={btnYellow} onClick={openCreate}>
              <Plus className="size-4" />
              New team
            </Button>
          </div>
        }
      />

      {error ? (
        <p className="border-2 border-foreground bg-neo-red px-4 py-2 text-sm font-bold text-white">
          {error}
        </p>
      ) : null}

      {teams.length === 0 ? (
        <EmptyState
          title="No teams yet"
          description="Create your first roster to start scheduling matches and scrims."
          action={
            <Button className={btnYellow} onClick={openCreate}>
              <Plus className="size-4" />
              New team
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((t) => (
            <NeoCard key={t._id} className="gap-0 p-0">
              {t.photoUrl ? (
                <div className="h-28 overflow-hidden border-b-2 border-foreground">
                  <img src={t.photoUrl} alt={t.name} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-20 items-center justify-center border-b-2 border-foreground bg-neo-cream">
                  <Users className="size-7 text-muted-foreground" />
                </div>
              )}
              <div className="flex items-start justify-between gap-2 border-b-2 border-foreground px-4 py-3">
                <div className="min-w-0">
                  <p className="text-lg font-bold tracking-tight">{t.name}</p>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {t.tag} · {t.game}
                  </p>
                </div>
                <StatusBadge status="user">Roster {t.memberCount}</StatusBadge>
              </div>
              <div className="flex flex-1 flex-col gap-3 px-4 py-3">
                <p className="line-clamp-2 min-h-8 text-xs text-muted-foreground">
                  {t.description ?? "No description."}
                </p>
                <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  <Crown className="size-3.5" />
                  {t.captainId ? "Captain assigned" : "No captain"}
                </p>
              </div>
              <div className="flex items-center gap-2 border-t-2 border-foreground px-4 py-3">
                <Button
                  size="sm"
                  className="neo-press flex-1 rounded-none border-2 border-foreground bg-neo-yellow text-white shadow-[2px_2px_0_0_var(--neo-ink)] hover:shadow-[3px_3px_0_0_var(--neo-ink)]"
                  onClick={() => {
                    setRosterTeam(t);
                    setAddPlayer("none");
                  }}
                >
                  <Users className="size-3.5" />
                  Roster
                </Button>
                <Button size="sm" variant="outline" className={btnGhost} onClick={() => openEdit(t)}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="neo-press rounded-none border-2 border-foreground bg-neo-red text-white shadow-[2px_2px_0_0_var(--neo-ink)] hover:shadow-[3px_3px_0_0_var(--neo-ink)]"
                  onClick={() => setDeleteTarget(t)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </NeoCard>
          ))}
        </div>
      )}

      {/* Create / edit */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none border-2 border-foreground bg-card shadow-[6px_6px_0_0_var(--neo-ink)]">
          <DialogHeader>
            <DialogTitle className="text-left text-2xl font-bold">
              {editing ? `Edit ${editing.name}` : "New team"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <span className={label}>Team name</span>
                <Input
                  className={input}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Vault Esports"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className={label}>Tag</span>
                <Input
                  className={cn(input, "font-mono uppercase")}
                  value={form.tag}
                  onChange={(e) => setForm({ ...form, tag: e.target.value })}
                  placeholder="VLT"
                  maxLength={5}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <span className={label}>Game</span>
                <Select value={form.game} onValueChange={(game) => setForm({ ...form, game })}>
                  <SelectTrigger className={cn(select, "w-full")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2 border-foreground">
                    {GAMES.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className={label}>Captain</span>
                <Select
                  value={form.captainId}
                  onValueChange={(captainId) => setForm({ ...form, captainId })}
                >
                  <SelectTrigger className={cn(select, "w-full")}>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2 border-foreground">
                    <SelectItem value="none">Unassigned</SelectItem>
                    {(activePlayers ?? []).map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.gamertag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={label}>Description</span>
              <Textarea
                className="rounded-none border-2 border-foreground bg-background"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Team identity, playstyle, goals…"
              />
            </div>
            <div className="border-2 border-foreground bg-background p-4">
              <PhotoUpload
                label="Team photo"
                currentUrl={formPhotoUrl ?? undefined}
                onUpload={async (file) => {
                  setFormPhoto(file);
                  setFormPhotoUrl(URL.createObjectURL(file));
                }}
                onRemove={async () => {
                  setFormPhoto(null);
                  setFormPhotoUrl(null);
                  if (editing) await removeTeamPhoto({ teamId: editing._id });
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" className={btnGhost} onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button className={btnYellow} onClick={handleSave} disabled={saving || !form.name.trim()}>
                {saving ? "Saving…" : editing ? "Save changes" : "Create team"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Roster management */}
      <Dialog open={!!rosterTeam} onOpenChange={(o) => !o && setRosterTeam(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none border-2 border-foreground bg-card shadow-[6px_6px_0_0_var(--neo-ink)]">
          <DialogHeader>
            <DialogTitle className="text-left text-2xl font-bold">
              {rosterTeam?.name} — roster
            </DialogTitle>
          </DialogHeader>
          {roster ? (
            <div className="flex flex-col gap-4">
              <div className="divide-y-2 divide-foreground/10 border-2 border-foreground bg-background">
                {roster.players.length === 0 ? (
                  <p className="px-4 py-5 text-sm text-muted-foreground">Roster is empty.</p>
                ) : (
                  roster.players.map((p) => (
                    <div key={p._id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        {roster.captain?._id === p._id ? (
                          <Crown className="size-4 shrink-0 text-foreground" />
                        ) : null}
                        <div>
                          <p className="text-sm font-bold">{p.gamertag}</p>
                          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            {p.inGameRole ?? p.game}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="neo-press rounded-none border-2 border-foreground bg-neo-red text-white shadow-[2px_2px_0_0_var(--neo-ink)] hover:shadow-[3px_3px_0_0_var(--neo-ink)]"
                        onClick={async () => {
                          await removePlayer({ teamId: rosterTeam!._id, playerId: p._id });
                          if (roster.captain?._id === p._id) {
                            await updateTeam({
                              teamId: rosterTeam!._id,
                              name: roster.team.name,
                              tag: roster.team.tag,
                              game: roster.team.game,
                              description: roster.team.description ?? undefined,
                              captainId: undefined,
                            });
                          }
                        }}
                      >
                        <UserMinus className="size-3.5" />
                        Remove
                      </Button>
                    </div>
                  ))
                )}
              </div>

              <div className="flex flex-col gap-2 border-t-2 border-foreground pt-4">
                <span className={label}>Add player</span>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Select value={addPlayer} onValueChange={setAddPlayer}>
                    <SelectTrigger className={cn(select, "w-full sm:flex-1")}>
                      <SelectValue placeholder="Select an active player…" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-2 border-foreground">
                      {eligible.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No unassigned active players
                        </SelectItem>
                      ) : (
                        eligible.map((p) => (
                          <SelectItem key={p._id} value={p._id}>
                            {p.gamertag} — {p.game}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    className={btnYellow}
                    disabled={addPlayer === "none"}
                    onClick={async () => {
                      await assignPlayer({ teamId: rosterTeam!._id, playerId: addPlayer as Doc<"players">["_id"] });
                      setAddPlayer("none");
                    }}
                  >
                    <Plus className="size-4" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-none border-2 border-foreground bg-card shadow-[6px_6px_0_0_var(--neo-ink)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This permanently deletes the team, its roster links, all scheduled matches,
              routine blocks, attendance responses and scrim slots tied to it. This cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none border-2 border-foreground bg-card shadow-[2px_2px_0_0_var(--neo-ink)]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="neo-press rounded-none border-2 border-foreground bg-neo-red text-white shadow-[3px_3px_0_0_var(--neo-ink)] hover:shadow-[4px_4px_0_0_var(--neo-ink)]"
              onClick={async () => {
                try {
                  if (deleteTarget) await deleteTeam({ teamId: deleteTarget._id });
                  toast.success("Team deleted — roster, matches, blocks and scrims removed completely.");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Could not delete the team.");
                } finally {
                  setDeleteTarget(null);
                }
              }}
            >
              <Trash2 className="size-4" />
              Delete team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
