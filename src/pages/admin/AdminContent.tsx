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
import { GalleryManager } from "@/components/admin/GalleryManager";
import { EmptyState, NeoCard, PageHeader, StatusBadge } from "@/components/neo";
import { CONTENT_CATEGORIES } from "@/lib/constants";
import { fmtDate } from "@/lib/format";
import { btnGhost, btnYellow, input, label, select } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { Eye, EyeOff, FileText, ImagePlus, Loader2, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

const COVER_COLORS = ["bg-neo-yellow", "bg-neo-blue", "bg-neo-purple", "bg-neo-green", "bg-neo-orange"];

type Article = {
  _id: Id<"content">;
  title: string;
  slug: string;
  category: string;
  excerpt?: string;
  body: string;
  coverColor?: string;
  imageStorageId?: Id<"_storage">;
  imageUrl?: string;
  published: boolean;
  createdAt: number;
};

async function uploadArticleImage(
  file: File,
  generateUploadUrl: () => Promise<string>,
): Promise<Id<"_storage">> {
  const uploadUrl = await generateUploadUrl();
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) throw new Error("Image upload failed — please try again.");
  const { storageId } = (await res.json()) as { storageId: string };
  return storageId as Id<"_storage">;
}

export default function AdminContent() {
  const [tab, setTab] = useState<"articles" | "gallery">("articles");
  const articles = useQuery(api.content.adminList);
  const create = useMutation(api.content.create);
  const update = useMutation(api.content.update);
  const setPublished = useMutation(api.content.setPublished);
  const remove = useMutation(api.content.remove);
  const generateUploadUrl = useMutation(api.uploads.generateUploadUrl);
  const setContentImage = useMutation(api.uploads.setContentImage);
  const removeContentImage = useMutation(api.uploads.removeContentImage);

  const [editing, setEditing] = useState<Article | null>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("News");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [coverColor, setCoverColor] = useState<string>(COVER_COLORS[0]);
  const [publishNow, setPublishNow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);

  // Cover image state — an in-flight image is uploaded when the article saves.
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [clearRequested, setClearRequested] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);

  const openNew = () => {
    setEditing(null);
    setTitle("");
    setCategory("News");
    setExcerpt("");
    setBody("");
    setCoverColor(COVER_COLORS[0]);
    setPublishNow(false);
    setError(null);
    setImageFile(null);
    setImagePreview(null);
    setClearRequested(false);
    setOpen(true);
  };

  const openEdit = (a: Article) => {
    setEditing(a);
    setTitle(a.title);
    setCategory(a.category);
    setExcerpt(a.excerpt ?? "");
    setBody(a.body);
    setCoverColor(a.coverColor ?? COVER_COLORS[0]);
    setPublishNow(false);
    setError(null);
    setImageFile(null);
    setImagePreview(null);
    setClearRequested(false);
    setOpen(true);
  };

  const pickImage = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file (JPG, PNG, WEBP…).");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image is too large — keep it under 4 MB.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setClearRequested(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        // Save the article body first, then attach / replace the cover image.
        await update({
          articleId: editing._id,
          title,
          category,
          excerpt: excerpt || undefined,
          body,
          coverColor,
        });
        if (imageFile) {
          setImageBusy(true);
          const storageId = await uploadArticleImage(imageFile, () => generateUploadUrl());
          await setContentImage({ articleId: editing._id, storageId });
          setImageBusy(false);
        } else if (clearRequested && editing.imageStorageId) {
          // User explicitly removed the existing image.
          await removeContentImage({ articleId: editing._id });
        }
        toast.success("Article updated — the public portal refreshes instantly.");
      } else {
        let imageStorageId: Id<"_storage"> | undefined;
        if (imageFile) {
          setImageBusy(true);
          imageStorageId = await uploadArticleImage(imageFile, () => generateUploadUrl());
          setImageBusy(false);
        }
        await create({
          title,
          category,
          excerpt: excerpt || undefined,
          body,
          coverColor,
          imageStorageId,
          published: publishNow,
        });
        toast.success(publishNow ? "Article published to the public portal." : "Article saved as a draft.");
      }
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
      setImageBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="The Den · Content"
        title="Content management"
        description="Publish news, match reports, interviews and guides — and manage the public media gallery. Every change goes live on the public portal in real time."
        actions={
          tab === "articles" ? (
            <Button className={btnYellow} onClick={openNew}>
              <Plus className="size-4" />
              New article
            </Button>
          ) : undefined
        }
      />

      {/* Articles / Media gallery switch */}
      <div className="flex w-full max-w-md items-stretch border-2 border-foreground bg-card shadow-[4px_4px_0_0_var(--neo-ink)]">
        <button
          type="button"
          onClick={() => setTab("articles")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 px-3 py-3 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors",
            "border-r-2 border-foreground",
            tab === "articles" ? "bg-neo-yellow text-white" : "bg-card hover:bg-neo-cream",
          )}
        >
          <FileText className="size-4" />
          Articles
        </button>
        <button
          type="button"
          onClick={() => setTab("gallery")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 px-3 py-3 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors",
            tab === "gallery" ? "bg-neo-yellow text-white" : "bg-card hover:bg-neo-cream",
          )}
        >
          <ImagePlus className="size-4" />
          Media gallery
        </button>
      </div>

      {tab === "gallery" ? (
        <GalleryManager />
      ) : !articles ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse border-2 border-foreground bg-card" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <EmptyState
          title="No articles yet"
          description="Create your first article — drafts stay private until you publish."
          action={
            <Button className={btnYellow} onClick={openNew}>
              <Plus className="size-4" />
              New article
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {articles.map((a) => (
            <NeoCard key={a._id} className="gap-3 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 inline-block h-4 w-4 shrink-0 border-2 border-foreground ${a.coverColor ?? "bg-neo-yellow"}`} />
                  {a.imageUrl ? (
                    <img
                      src={a.imageUrl}
                      alt=""
                      className="h-12 w-20 shrink-0 border-2 border-foreground object-cover"
                    />
                  ) : null}
                  <div>
                    <p className="text-base font-bold leading-snug">{a.title}</p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      /news/{a.slug} · {a.category} · {fmtDate(a.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {a.published ? (
                    <StatusBadge status="approved">Published</StatusBadge>
                  ) : (
                    <StatusBadge status="pending">Draft</StatusBadge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="neo-press rounded-none border-2 border-foreground bg-card shadow-[2px_2px_0_0_var(--neo-ink)]"
                    onClick={async () => {
                      await setPublished({ articleId: a._id, published: !a.published });
                      toast.success(a.published ? "Unpublished." : "Published to the public portal.");
                    }}
                  >
                    {a.published ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    {a.published ? "Unpublish" : "Publish"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="neo-press rounded-none border-2 border-foreground bg-card shadow-[2px_2px_0_0_var(--neo-ink)]"
                    onClick={() => openEdit(a)}
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="neo-press rounded-none border-2 border-foreground bg-neo-red text-white shadow-[2px_2px_0_0_var(--neo-ink)]"
                    onClick={() => setDeleteTarget(a)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
              {a.excerpt ? <p className="text-sm text-muted-foreground">{a.excerpt}</p> : null}
            </NeoCard>
          ))}
        </div>
      )}

      {/* Editor dialog */}
      <AlertDialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <AlertDialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-none border-2 border-foreground bg-card shadow-[6px_6px_0_0_var(--neo-ink)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl font-bold">
              <FileText className="size-5" />
              {editing ? "Edit article" : "New article"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Drafts are private — publish when ready. Changes appear on the public portal instantly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error ? (
            <p className="border-2 border-foreground bg-neo-red px-3 py-2 text-xs font-bold text-white">{error}</p>
          ) : null}
          <div className="grid gap-4">
            <div className="flex flex-col gap-1.5">
              <span className={label}>Title *</span>
              <Input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="How we won the regional finals" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <span className={label}>Category</span>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className={cn(select, "w-full")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2 border-foreground">
                    {CONTENT_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className={label}>Cover color</span>
                <div className="flex gap-2 pt-1">
                  {COVER_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCoverColor(c)}
                      className={cn(
                        "h-8 w-8 border-2 border-foreground",
                        c,
                        coverColor === c ? "shadow-[3px_3px_0_0_var(--neo-ink)]" : "opacity-60",
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={label}>Excerpt</span>
              <Textarea
                className="min-h-16 rounded-none border-2 border-foreground bg-background"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="A one-line summary shown on the news feed…"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={label}>Cover image</span>
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex h-28 w-44 shrink-0 items-center justify-center overflow-hidden border-2 border-foreground bg-neo-cream">
                  {imagePreview || (editing && !clearRequested ? editing.imageUrl : null) ? (
                    <img
                      src={imagePreview ?? editing?.imageUrl}
                      alt="Cover preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImagePlus className="size-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col items-start gap-2">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => pickImage(e.target.files?.[0])}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className={btnGhost}
                      disabled={imageBusy}
                      onClick={() => imageInputRef.current?.click()}
                    >
                      {imageBusy ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                      {imageBusy ? "Uploading…" : imagePreview || (editing?.imageUrl && !clearRequested) ? "Replace image" : "Upload image"}
                    </Button>
                    {imagePreview || (editing?.imageUrl && !clearRequested) ? (
                      <Button
                        type="button"
                        size="sm"
                        className="neo-press rounded-none border-2 border-foreground bg-neo-red px-2.5 py-1.5 text-white shadow-[2px_2px_0_0_var(--neo-ink)] hover:shadow-[3px_3px_0_0_var(--neo-ink)]"
                        disabled={imageBusy}
                        onClick={clearImage}
                      >
                        <X className="size-3.5" />
                        Remove
                      </Button>
                    ) : null}
                  </div>
                  <p className="text-[10px] leading-4 text-muted-foreground">
                    JPG, PNG or WEBP up to 4 MB — shown on the public news feed and the article page in real time.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={label}>Body *</span>
              <Textarea
                className="min-h-40 rounded-none border-2 border-foreground bg-background"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={"Write the article here…\n\nUse blank lines between paragraphs."}
              />
            </div>
            {!editing ? (
              <label className="flex cursor-pointer items-center gap-3 border-2 border-foreground bg-neo-cream px-4 py-3">
                <input
                  type="checkbox"
                  checked={publishNow}
                  onChange={(e) => setPublishNow(e.target.checked)}
                  className="size-4 accent-[var(--neo-ink)]"
                />
                <span className="text-sm font-bold">Publish immediately</span>
                <span className="ml-auto text-xs text-muted-foreground">Otherwise saved as a draft</span>
              </label>
            ) : null}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none border-2 border-foreground bg-card shadow-[2px_2px_0_0_var(--neo-ink)]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="neo-press rounded-none border-2 border-foreground bg-neo-yellow text-white shadow-[3px_3px_0_0_var(--neo-ink)] hover:shadow-[4px_4px_0_0_var(--neo-ink)]"
              onClick={handleSave}
              disabled={saving || title.trim().length < 3 || !body.trim()}
            >
              {saving ? "Saving…" : editing ? "Save changes" : "Create article"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-none border-2 border-foreground bg-card shadow-[6px_6px_0_0_var(--neo-ink)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Delete article?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              “{deleteTarget?.title}” will be removed from the public portal immediately.
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
                  if (deleteTarget) await remove({ articleId: deleteTarget._id });
                  toast.success("Article deleted — removed from the public portal instantly.");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Could not delete the article.");
                } finally {
                  setDeleteTarget(null);
                }
              }}
            >
              <Trash2 className="size-4" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
