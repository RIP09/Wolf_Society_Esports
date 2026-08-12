import { Button } from "@/components/ui/button";
import { btnGhost } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { Camera, Loader2, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";

/**
 * Neo photo upload control. The parent supplies `onUpload(file)` which should
 * generate a Convex upload URL, POST the file, and persist the storage id —
 * this component only handles selection, preview and busy state.
 */
export function PhotoUpload({
  currentUrl,
  onUpload,
  onRemove,
  label = "Photo",
}: {
  currentUrl?: string;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shown = preview ?? currentUrl;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (JPG, PNG, WEBP…).");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError("Image is too large — keep it under 4 MB.");
      return;
    }
    setError(null);
    setBusy(true);
    setPreview(URL.createObjectURL(file));
    try {
      await onUpload(file);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
      setPreview(null);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-start gap-4">
      <div
        className={cn(
          "flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden border-2 border-foreground bg-background",
          !shown && "bg-neo-cream",
        )}
      >
        {shown ? (
          <img src={shown} alt={label} className="h-full w-full object-cover" />
        ) : (
          <Camera className="size-8 text-muted-foreground" />
        )}
      </div>
      <div className="flex flex-col items-start gap-2">
        <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            className={btnGhost}
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
            {busy ? "Uploading…" : shown ? "Replace" : "Upload"}
          </Button>
          {shown && onRemove ? (
            <Button
              type="button"
              size="sm"
              className="neo-press rounded-none border-2 border-foreground bg-neo-red px-2.5 py-1.5 text-white shadow-[2px_2px_0_0_var(--neo-ink)] hover:shadow-[3px_3px_0_0_var(--neo-ink)]"
              disabled={busy}
              onClick={async () => {
                setPreview(null);
                await onRemove();
              }}
            >
              <Trash2 className="size-3.5" />
              Remove
            </Button>
          ) : null}
        </div>
        {error ? (
          <p className="text-xs font-bold text-neo-red">{error}</p>
        ) : shown ? (
          <p className="text-[10px] text-muted-foreground">
            Shown live on /players, /teams and team pages.
          </p>
        ) : null}
      </div>
    </div>
  );
}
