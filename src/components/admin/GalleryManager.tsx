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
import { EmptyState } from "@/components/neo";
import { btnGhost, btnYellow, input, label, select } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { Camera, ImagePlus, Loader2, Trash2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

export const GALLERY_CATEGORIES = ["Matches", "Practice", "Events"] as const;

type Photo = {
  _id: Id<"gallery">;
  caption: string;
  category: string;
  imageUrl?: string;
  createdAt: number;
};

async function uploadGalleryImage(
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

/** Media gallery manager — upload, preview and permanently remove photos. */
export function GalleryManager() {
  const photos = useQuery(api.gallery.adminList);
  const addPhoto = useMutation(api.gallery.add);
  const removePhoto = useMutation(api.gallery.remove);
  const generateUploadUrl = useMutation(api.uploads.generateUploadUrl);

  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState<string>(GALLERY_CATEGORIES[0]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Photo | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const pickImage = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file (JPG, PNG, WEBP…).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image is too large — keep it under 8 MB.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const openUpload = () => {
    setCaption("");
    setCategory(GALLERY_CATEGORIES[0]);
    setImageFile(null);
    setImagePreview(null);
    setError(null);
    setOpen(true);
  };

  const handleUpload = async () => {
    if (!imageFile) {
      setError("Please choose an image to upload.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const storageId = await uploadGalleryImage(imageFile, () => generateUploadUrl());
      await addPhoto({ storageId, caption, category });
      toast.success("Photo added — the public gallery updates instantly.");
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removePhoto({ photoId: deleteTarget._id });
      toast.success("Photo permanently removed from the public gallery.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove the photo.");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Camera className="size-5" />
          <h2 className="font-bold">Media gallery ({photos?.length ?? 0})</h2>
        </div>
        <Button className={btnYellow} onClick={openUpload}>
          <Upload className="size-4" />
          Upload photo
        </Button>
      </div>

      {photos === undefined ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] animate-pulse border-2 border-foreground bg-card" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <EmptyState
          title="No photos in the gallery yet"
          description="Upload match, practice and event photos — they appear on the public /gallery page instantly."
          action={
            <Button className={btnYellow} onClick={openUpload}>
              <Upload className="size-4" />
              Upload photo
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <div
              key={photo._id}
              className="neo-press group relative overflow-hidden border-2 border-foreground bg-card shadow-[4px_4px_0_0_var(--neo-ink)]"
            >
              <div className="aspect-[4/3] overflow-hidden bg-neo-cream">
                {photo.imageUrl ? (
                  <img
                    src={photo.imageUrl}
                    alt={photo.caption}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <ImagePlus className="size-8" />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 border-t-2 border-foreground px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold">{photo.caption}</p>
                  <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    {photo.category}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="neo-press shrink-0 rounded-none border-2 border-foreground bg-neo-red px-2 py-1 text-white shadow-[2px_2px_0_0_var(--neo-ink)] hover:bg-neo-red/90"
                  onClick={() => setDeleteTarget(photo)}
                  aria-label={`Remove ${photo.caption}`}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload dialog */}
      <AlertDialog open={open} onOpenChange={(o) => !o && !uploading && setOpen(false)}>
        <AlertDialogContent className="max-h-[90vh] overflow-y-auto rounded-none border-2 border-foreground bg-card shadow-[6px_6px_0_0_var(--neo-ink)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Camera className="size-5" />
              Add gallery photo
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              The photo goes live on the public gallery as soon as it is saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error ? (
            <p className="border-2 border-foreground bg-neo-red px-3 py-2 text-xs font-bold text-white">{error}</p>
          ) : null}
          <div className="grid gap-4">
            <div className="flex flex-col gap-1.5">
              <span className={label}>Photo</span>
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex h-32 w-48 shrink-0 items-center justify-center overflow-hidden border-2 border-foreground bg-neo-cream">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
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
                    <Button type="button" size="sm" className={btnGhost} onClick={() => imageInputRef.current?.click()}>
                      {imagePreview ? "Choose different image" : "Choose image"}
                    </Button>
                    {imagePreview ? (
                      <Button
                        type="button"
                        size="sm"
                        className="neo-press rounded-none border-2 border-foreground bg-neo-red px-2.5 py-1.5 text-white shadow-[2px_2px_0_0_var(--neo-ink)] hover:shadow-[3px_3px_0_0_var(--neo-ink)]"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                      >
                        <X className="size-3.5" />
                        Remove
                      </Button>
                    ) : null}
                  </div>
                  <p className="text-[10px] leading-4 text-muted-foreground">
                    JPG, PNG or WEBP up to 8 MB — shown on the public /gallery page in real time.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <span className={label}>Caption</span>
                <Input
                  className={input}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Grand final — lifting the trophy"
                  maxLength={120}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className={label}>Category</span>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className={cn(select, "w-full")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2 border-foreground">
                    {GALLERY_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none border-2 border-foreground bg-card shadow-[2px_2px_0_0_var(--neo-ink)]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="neo-press rounded-none border-2 border-foreground bg-neo-yellow text-white shadow-[3px_3px_0_0_var(--neo-ink)] hover:shadow-[4px_4px_0_0_var(--neo-ink)]"
              onClick={handleUpload}
              disabled={uploading || !imageFile}
            >
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              {uploading ? "Uploading…" : "Add to gallery"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-none border-2 border-foreground bg-card shadow-[6px_6px_0_0_var(--neo-ink)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Trash2 className="size-5 text-neo-red" />
              Remove this photo?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              “{deleteTarget?.caption}” will be permanently deleted — removed from the public
              gallery and its file erased. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none border-2 border-foreground bg-card shadow-[2px_2px_0_0_var(--neo-ink)]">
              Keep photo
            </AlertDialogCancel>
            <AlertDialogAction
              className="neo-press rounded-none border-2 border-foreground bg-neo-red text-white shadow-[3px_3px_0_0_var(--neo-ink)] hover:shadow-[4px_4px_0_0_var(--neo-ink)]"
              onClick={handleDelete}
            >
              <Trash2 className="size-4" />
              Yes, delete photo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
