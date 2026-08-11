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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, NeoCard, PageHeader } from "@/components/neo";
import { SPONSOR_TIERS } from "@/lib/constants";
import { btnYellow, input, label, select } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { Handshake, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

type Sponsor = {
  _id: Id<"sponsors">;
  name: string;
  website?: string;
  tier: "platinum" | "gold" | "silver" | "partner";
  description?: string;
  sortOrder: number;
};

const TIER_LABELS: Record<string, string> = {
  platinum: "Platinum",
  gold: "Gold",
  silver: "Silver",
  partner: "Community partner",
};

export default function AdminSponsors() {
  const sponsors = useQuery(api.sponsors.list);
  const upsert = useMutation(api.sponsors.upsert);
  const remove = useMutation(api.sponsors.remove);

  const [editing, setEditing] = useState<Sponsor | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [tier, setTier] = useState<string>("gold");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Sponsor | null>(null);

  const openNew = () => {
    setEditing(null);
    setName("");
    setWebsite("");
    setTier("gold");
    setDescription("");
    setSortOrder((sponsors ?? []).length);
    setError(null);
    setOpen(true);
  };

  const openEdit = (s: Sponsor) => {
    setEditing(s);
    setName(s.name);
    setWebsite(s.website ?? "");
    setTier(s.tier);
    setDescription(s.description ?? "");
    setSortOrder(s.sortOrder);
    setError(null);
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await upsert({
        sponsorId: editing?._id,
        name,
        website: website || undefined,
        tier: tier as Sponsor["tier"],
        description: description || undefined,
        sortOrder,
      });
      toast.success(editing ? "Sponsor updated — live on the public page." : "Sponsor added — live on the public page.");
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="The Den · Partnerships"
        title="Sponsors"
        description="Manage the brands shown on the public sponsors page — changes go live instantly."
        actions={
          <Button className={btnYellow} onClick={openNew}>
            <Plus className="size-4" />
            Add sponsor
          </Button>
        }
      />

      {!sponsors ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse border-2 border-foreground bg-card" />
          ))}
        </div>
      ) : sponsors.length === 0 ? (
        <EmptyState
          title="No sponsors yet"
          description="Add your first partner — they'll appear on the public sponsors page."
          action={
            <Button className={btnYellow} onClick={openNew}>
              <Plus className="size-4" />
              Add sponsor
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {sponsors.map((s) => (
            <NeoCard key={s._id} className="gap-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center border-2 border-foreground bg-neo-cream">
                    <Handshake className="size-5" />
                  </span>
                  <div>
                    <p className="font-bold">{s.name}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {TIER_LABELS[s.tier]} · order {s.sortOrder}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="neo-press rounded-none border-2 border-foreground bg-card shadow-[2px_2px_0_0_var(--neo-ink)]"
                    onClick={() => openEdit(s)}
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="neo-press rounded-none border-2 border-foreground bg-neo-red text-white shadow-[2px_2px_0_0_var(--neo-ink)]"
                    onClick={() => setDeleteTarget(s)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
              {s.description ? <p className="text-sm text-muted-foreground">{s.description}</p> : null}
            </NeoCard>
          ))}
        </div>
      )}

      <AlertDialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <AlertDialogContent className="rounded-none border-2 border-foreground bg-card shadow-[6px_6px_0_0_var(--neo-ink)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">
              {editing ? "Edit sponsor" : "Add sponsor"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              The sponsor appears on the public sponsors page in its tier group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error ? (
            <p className="border-2 border-foreground bg-neo-red px-3 py-2 text-xs font-bold text-white">{error}</p>
          ) : null}
          <div className="grid gap-4">
            <div className="flex flex-col gap-1.5">
              <span className={label}>Name *</span>
              <Input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="HyperX" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <span className={label}>Tier</span>
                <Select value={tier} onValueChange={setTier}>
                  <SelectTrigger className={cn(select, "w-full")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2 border-foreground">
                    {SPONSOR_TIERS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {TIER_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className={label}>Website</span>
                <Input className={input} value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={label}>Description</span>
              <Textarea
                className="min-h-16 rounded-none border-2 border-foreground bg-background"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this partner brings to the Society…"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={label}>Sort order (lower = first)</span>
              <Input
                className={input}
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none border-2 border-foreground bg-card shadow-[2px_2px_0_0_var(--neo-ink)]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="neo-press rounded-none border-2 border-foreground bg-neo-yellow text-white shadow-[3px_3px_0_0_var(--neo-ink)] hover:shadow-[4px_4px_0_0_var(--neo-ink)]"
              onClick={handleSave}
              disabled={saving || name.trim().length < 2}
            >
              {saving ? "Saving…" : editing ? "Save changes" : "Add sponsor"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-none border-2 border-foreground bg-card shadow-[6px_6px_0_0_var(--neo-ink)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Remove sponsor?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              “{deleteTarget?.name}” will be removed from the public sponsors page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none border-2 border-foreground bg-card shadow-[2px_2px_0_0_var(--neo-ink)]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="neo-press rounded-none border-2 border-foreground bg-neo-red text-white shadow-[3px_3px_0_0_var(--neo-ink)] hover:shadow-[4px_4px_0_0_var(--neo-ink)]"
              onClick={async () => {
                if (deleteTarget) await remove({ sponsorId: deleteTarget._id });
                setDeleteTarget(null);
              }}
            >
              <Trash2 className="size-4" />
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
