import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, NeoCard, NeoField, PageHeader, StatusBadge } from "@/components/neo";
import { useAuth } from "@/hooks/use-auth";
import { btnGhost, btnYellow, input } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { fmtRelative } from "@/lib/format";
import {
  Archive,
  Copy,
  Download,
  File,
  FileArchive,
  FileAudio,
  FileImage,
  FileText,
  FileUp,
  FileVideo,
  FolderOpen,
  HardDrive,
  Loader2,
  Search,
  ShieldX,
  Trash2,
  Upload,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const CATEGORIES = ["Documents", "Media", "Contracts", "Roster", "Reports", "Financial", "Other"];

const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg", "avif", "bmp", "ico"]);
const VIDEO_EXT = new Set(["mp4", "mov", "avi", "mkv", "webm", "m4v"]);
const AUDIO_EXT = new Set(["mp3", "wav", "ogg", "flac", "m4a", "aac", "opus"]);
const ARCHIVE_EXT = new Set(["zip", "rar", "7z", "tar", "gz", "bz2", "xz"]);
const TEXT_EXT = new Set(["pdf", "doc", "docx", "txt", "md", "rtf", "odt", "xls", "xlsx", "csv", "ods", "ppt", "pptx"]);

function fileIcon(ext: string) {
  if (IMAGE_EXT.has(ext)) return FileImage;
  if (VIDEO_EXT.has(ext)) return FileVideo;
  if (AUDIO_EXT.has(ext)) return FileAudio;
  if (ARCHIVE_EXT.has(ext)) return FileArchive;
  if (TEXT_EXT.has(ext)) return FileText;
  return File;
}

function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[unit]}`;
}

export default function AdminStorage() {
  const { user } = useAuth();
  const data = useQuery(api.files.listFiles);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const recordUpload = useMutation(api.files.recordUpload);
  const deleteFile = useMutation(api.files.deleteFile);

  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("Documents");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("All");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Only the Super Admin may open the vault.
  if (user?.role !== "superadmin") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <NeoCard className="max-w-md gap-4 p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center border-2 border-foreground bg-neo-red text-white shadow-[4px_4px_0_0_var(--neo-ink)]">
            <ShieldX className="size-7" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight">Super Admin only</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            The organization file vault is restricted to the Super Admin. If you need to store
            or retrieve files, ask the Super Admin of Wolf Society Esports.
          </p>
        </NeoCard>
      </div>
    );
  }

  const pickFile = (f: File | undefined | null) => {
    if (!f) return;
    if (f.size > 250 * 1024 * 1024) {
      toast.error("File is too large — the vault accepts files up to 250 MB.");
      return;
    }
    setFile(f);
    setConfirmDelete(null);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Choose a file to upload first.");
      return;
    }
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!res.ok) throw new Error(`Upload failed (HTTP ${res.status}).`);
      const { storageId } = (await res.json()) as { storageId: string };
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      await recordUpload({
        name: file.name,
        storageId: storageId as Id<"_storage">,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        extension: ext,
        category,
        description,
      });
      toast.success(`"${file.name}" stored in the vault.`);
      setFile(null);
      setDescription("");
      if (inputRef.current) inputRef.current.value = "";
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed — try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: Id<"files">, name: string) => {
    setDeleting(id);
    try {
      await deleteFile({ fileId: id });
      toast.success(`"${name}" permanently deleted.`);
      setConfirmDelete(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete the file.");
    } finally {
      setDeleting(null);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.files ?? []).filter((f) => {
      const matchesCat = activeCat === "All" || f.category === activeCat;
      const matchesQ = !q || f.name.toLowerCase().includes(q) || (f.description ?? "").toLowerCase().includes(q);
      return matchesCat && matchesQ;
    });
  }, [data, query, activeCat]);

  if (!data) {
    return (
      <div className="flex flex-col gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse border-2 border-foreground bg-card" />
        ))}
      </div>
    );
  }

  const { totals } = data;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="The Den · Super Admin"
        title="Organization file vault"
        description="Every format and extension — documents, contracts, media, rosters, reports — stored securely and accessible only to the Super Admin. Upload anything now, keep it forever."
      />

      {/* ── Usage stats ────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NeoCard className="gap-1 p-5">
          <p className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <HardDrive className="size-3.5" /> Total files
          </p>
          <p className="text-3xl font-bold leading-none tabular-nums">{totals.count}</p>
          <p className="text-xs text-muted-foreground">stored in the vault</p>
        </NeoCard>
        <NeoCard className="gap-1 p-5">
          <p className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <Archive className="size-3.5" /> Storage used
          </p>
          <p className="text-3xl font-bold leading-none tabular-nums">{fmtBytes(totals.totalBytes)}</p>
          <p className="text-xs text-muted-foreground">across all categories</p>
        </NeoCard>
        <NeoCard className="gap-1 p-5">
          <p className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <FolderOpen className="size-3.5" /> Categories
          </p>
          <p className="text-3xl font-bold leading-none tabular-nums">
            {Object.keys(totals.byCategory).length}
          </p>
          <p className="text-xs text-muted-foreground">in use right now</p>
        </NeoCard>
        <NeoCard className="gap-1 p-5">
          <p className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <FileUp className="size-3.5" /> Largest file
          </p>
          <p className="truncate text-2xl font-bold leading-none tabular-nums">
            {data.files.length > 0 ? fmtBytes(Math.max(...data.files.map((f) => f.size))) : "—"}
          </p>
          <p className="text-xs text-muted-foreground">single-file limit: 250 MB</p>
        </NeoCard>
      </div>

      {/* ── Upload ─────────────────────────────────────────────────────── */}
      <NeoCard className="gap-5 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center border-2 border-foreground bg-neo-yellow text-white">
            <Upload className="size-5" />
          </span>
          <div>
            <p className="text-lg font-bold">Upload a file</p>
            <p className="text-sm text-muted-foreground">
              All formats and extensions are accepted — PDFs, documents, spreadsheets, images,
              video, audio, archives, fonts, anything. Files up to 250 MB each.
            </p>
          </div>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            pickFile(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed border-foreground bg-neo-cream px-4 py-10 text-center transition-colors",
            dragOver && "bg-neo-yellow/10",
          )}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0])}
          />
          {file ? (
            <>
              <span className="flex h-12 w-12 items-center justify-center border-2 border-foreground bg-neo-yellow text-white shadow-[3px_3px_0_0_var(--neo-ink)]">
                {(() => {
                  const Icon = fileIcon(file.name.split(".").pop()?.toLowerCase() ?? "");
                  return <Icon className="size-6" />;
                })()}
              </span>
              <p className="max-w-full truncate font-bold">{file.name}</p>
              <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                {fmtBytes(file.size)} · click or drop to replace
              </p>
            </>
          ) : (
            <>
              <span className="flex h-12 w-12 items-center justify-center border-2 border-foreground bg-background shadow-[3px_3px_0_0_var(--neo-ink)]">
                <FileUp className="size-6" />
              </span>
              <p className="font-bold">Drop a file here, or click to browse</p>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Any format · up to 250 MB
              </p>
            </>
          )}
        </div>

        <div className="grid items-end gap-4 sm:grid-cols-[12rem_1fr_auto]">
          <NeoField label="Category" hint="Organize the vault">
            <select
              className={cn(input, "h-10 px-3")}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </NeoField>
          <NeoField label="Description (optional)" hint="What this file is for">
            <Input
              className={input}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Signed team contracts — Spring season"
            />
          </NeoField>
          <Button className={btnYellow} onClick={() => void handleUpload()} disabled={uploading || !file}>
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {uploading ? "Uploading…" : file ? "Store in vault" : "Select a file"}
          </Button>
        </div>
      </NeoCard>

      {/* ── Vault listing ──────────────────────────────────────────────── */}
      <NeoCard className="gap-0 p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-foreground px-5 py-4">
          <h2 className="flex items-center gap-2 font-bold">
            <FolderOpen className="size-4" />
            Stored files
          </h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className={cn(input, "h-9 w-48 pl-8 text-sm sm:w-64")}
                placeholder="Search files…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-b-2 border-foreground px-5 py-3">
          {["All", ...CATEGORIES].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setActiveCat(c)}
              className={cn(
                "border-2 border-foreground px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors",
                activeCat === c ? "bg-neo-yellow text-white" : "bg-background hover:bg-neo-cream",
              )}
            >
              {c}
              {c !== "All" ? ` (${totals.byCategory[c] ?? 0})` : ""}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={totals.count === 0 ? "The vault is empty" : "No files match"}
            description={
              totals.count === 0
                ? "Drop your first file above — documents, contracts, media, everything."
                : "Try a different search or category."
            }
          />
        ) : (
          <div className="neo-shadow-none overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border-2 border-foreground bg-foreground px-3 py-2 text-left font-mono text-[10px] font-bold uppercase tracking-wider text-background">File</th>
                  <th className="border-2 border-foreground bg-foreground px-3 py-2 text-left font-mono text-[10px] font-bold uppercase tracking-wider text-background">Category</th>
                  <th className="border-2 border-foreground bg-foreground px-3 py-2 text-left font-mono text-[10px] font-bold uppercase tracking-wider text-background">Size</th>
                  <th className="border-2 border-foreground bg-foreground px-3 py-2 text-left font-mono text-[10px] font-bold uppercase tracking-wider text-background">Uploaded</th>
                  <th className="border-2 border-foreground bg-foreground px-3 py-2 text-right font-mono text-[10px] font-bold uppercase tracking-wider text-background">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => {
                  const Icon = fileIcon(f.extension);
                  return (
                    <tr key={f._id} className="bg-card hover:bg-neo-yellow/10">
                      <td className="border-2 border-foreground/20 px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-foreground bg-neo-cream">
                            <Icon className="size-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="max-w-[18rem] truncate text-sm font-bold">{f.name}</p>
                            <p className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                              .{f.extension || "?"}
                              {f.description ? ` · ${f.description}` : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="border-2 border-foreground/20 px-3 py-2.5">
                        <StatusBadge status="approved">{f.category}</StatusBadge>
                      </td>
                      <td className="border-2 border-foreground/20 px-3 py-2.5 font-mono text-xs font-bold tabular-nums">
                        {fmtBytes(f.size)}
                      </td>
                      <td className="border-2 border-foreground/20 px-3 py-2.5 font-mono text-[10px] text-muted-foreground">
                        {fmtRelative(f.createdAt)}
                      </td>
                      <td className="border-2 border-foreground/20 px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {f.url ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(btnGhost, "h-8 px-2")}
                                title="Copy link"
                                onClick={async () => {
                                  try {
                                    await navigator.clipboard.writeText(f.url!);
                                    toast.success("Link copied to clipboard.");
                                  } catch {
                                    window.open(f.url!, "_blank", "noopener,noreferrer");
                                  }
                                }}
                              >
                                <Copy className="size-3.5" />
                              </Button>
                              <a
                                href={f.url}
                                download={f.name}
                                target="_blank"
                                rel="noreferrer"
                                className={cn(btnGhost, "flex h-8 items-center gap-1.5 border-2 border-foreground px-2 font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-neo-cream")}
                              >
                                <Download className="size-3.5" />
                                Open
                              </a>
                            </>
                          ) : null}
                          {confirmDelete === f._id ? (
                            <>
                              <Button
                                size="sm"
                                className="h-8 border-2 border-foreground bg-neo-red px-2 text-[10px] font-bold uppercase text-white shadow-[2px_2px_0_0_var(--neo-ink)]"
                                onClick={() => void handleDelete(f._id, f.name)}
                                disabled={deleting === f._id}
                              >
                                {deleting === f._id ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                                Sure?
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-[10px] font-bold uppercase"
                                onClick={() => setConfirmDelete(null)}
                                disabled={deleting === f._id}
                              >
                                No
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className={cn(btnGhost, "h-8 border-neo-red px-2 text-neo-red hover:bg-neo-red hover:text-white")}
                              title="Delete permanently"
                              onClick={() => setConfirmDelete(f._id)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </NeoCard>

      <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <HardDrive className="size-3.5" />
        Files live in Convex managed storage — see the Convex dashboard → Storage for your plan's
        ceiling. Only the Super Admin can access this vault.
      </p>
    </div>
  );
}
