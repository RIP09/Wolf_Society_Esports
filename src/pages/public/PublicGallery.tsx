import { api } from "@/convex/_generated/api";
import { NeoCard, PageHeader } from "@/components/neo";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { Camera, Clapperboard, Image, Megaphone, Trophy, Users } from "lucide-react";
import { useState } from "react";

type Tile = {
  label: string;
  sub: string;
  gradient: string;
  glyph: string;
};

const TILES: Record<string, Tile[]> = {
  Matches: [
    { label: "Match day", sub: "Team huddle before the first map", gradient: "from-[#7c3aed] to-[#4c1d95]", glyph: "MD" },
    { label: "Grand final", sub: "Stage lights on", gradient: "from-[#a78bfa] to-[#6d28d9]", glyph: "GF" },
    { label: "Overtime", sub: "Clutch round energy", gradient: "from-[#8b5cf6] to-[#5b21b6]", glyph: "OT" },
    { label: "Champions", sub: "Lifting the trophy", gradient: "from-[#6d28d9] to-[#2e1065]", glyph: "CH" },
  ],
  Practice: [
    { label: "Scrim block", sub: "Two squads, one server", gradient: "from-[#7c3aed] to-[#9333ea]", glyph: "SC" },
    { label: "VOD review", sub: "Breaking down the loss", gradient: "from-[#5b21b6] to-[#3b0764]", glyph: "VR" },
    { label: "Aim training", sub: "Daily routine", gradient: "from-[#a78bfa] to-[#7c3aed]", glyph: "AT" },
    { label: "Team dinner", sub: "Fuel for the grind", gradient: "from-[#8b5cf6] to-[#4c1d95]", glyph: "TD" },
  ],
  Events: [
    { label: "Community cup", sub: "Open to all players", gradient: "from-[#9333ea] to-[#6d28d9]", glyph: "CC" },
    { label: "Fan meet", sub: "Signing session", gradient: "from-[#7c3aed] to-[#a78bfa]", glyph: "FM" },
    { label: "Media day", sub: "Interviews & photos", gradient: "from-[#6d28d9] to-[#8b5cf6]", glyph: "MED" },
    { label: "Season launch", sub: "Roster reveal", gradient: "from-[#a78bfa] to-[#5b21b6]", glyph: "SL" },
  ],
};

const CATEGORIES = Object.keys(TILES);

type GalleryPhoto = {
  _id: string;
  caption: string;
  category: string;
  imageUrl?: string;
  createdAt: number;
};

export default function PublicGallery() {
  const [active, setActive] = useState<string>("Matches");
  const photos = useQuery(api.gallery.publicList);

  const photosByCategory: Record<string, GalleryPhoto[]> = { Matches: [], Practice: [], Events: [] };
  for (const p of photos ?? []) {
    if (photosByCategory[p.category]) photosByCategory[p.category].push(p);
    else photosByCategory[p.category] = [p];
  }
  const activePhotos = photosByCategory[active] ?? [];
  const totalPhotos = (photos ?? []).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader
        eyebrow="Wolf Society Esports · Media"
        title="Gallery"
        description="Moments from matches, practice and events — the pack in action. Every photo is managed live from The Den."
      />

      <div className="mt-8 flex items-center gap-2">
        <Camera className="size-5" />
        <h2 className="text-2xl font-bold tracking-tight">Media wall</h2>
        {photos !== undefined ? (
          <span className="border-2 border-foreground bg-neo-cream px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest">
            {totalPhotos} photo{totalPhotos === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>

      {/* Category switch */}
      <div className="mt-5 grid w-full max-w-xl grid-cols-3 border-2 border-foreground bg-card shadow-[4px_4px_0_0_var(--neo-ink)]">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActive(cat)}
            className={cn(
              "flex items-center justify-center gap-2 px-3 py-3 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors",
              cat !== CATEGORIES[CATEGORIES.length - 1] && "border-r-2 border-foreground",
              active === cat ? "bg-neo-yellow text-white" : "bg-card hover:bg-neo-cream",
            )}
          >
            {cat === "Matches" ? <Trophy className="size-4" /> : cat === "Practice" ? <Users className="size-4" /> : <Clapperboard className="size-4" />}
            {cat}
          </button>
        ))}
      </div>

      {photos === undefined ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] animate-pulse border-2 border-foreground bg-card" />
          ))}
        </div>
      ) : (
        <>
          {/* Real uploaded photos for this category */}
          {activePhotos.length > 0 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {activePhotos.map((photo) => (
                <figure
                  key={photo._id}
                  className="neo-press group overflow-hidden border-2 border-foreground bg-card shadow-[5px_5px_0_0_var(--neo-ink)] transition-transform hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--neo-ink)]"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-neo-cream">
                    {photo.imageUrl ? (
                      <img
                        src={photo.imageUrl}
                        alt={photo.caption}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <Image className="size-8" />
                      </div>
                    )}
                  </div>
                  <figcaption className="border-t-2 border-foreground bg-card px-3 py-2.5">
                    <p className="truncate text-sm font-bold">{photo.caption}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {TILES[active].map((tile) => (
                <div
                  key={tile.label}
                  className={cn(
                    "neo-press group relative flex aspect-[4/3] flex-col justify-between overflow-hidden border-2 border-foreground bg-gradient-to-br p-5 text-white shadow-[5px_5px_0_0_var(--neo-ink)] transition-transform hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--neo-ink)]",
                    tile.gradient,
                  )}
                >
                  <div className="absolute -right-4 -top-6 font-mono text-8xl font-bold text-white/10">
                    {tile.glyph}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="border-2 border-white/60 bg-black/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest">
                      {tile.glyph}
                    </span>
                    <Image className="size-4 text-white/70" />
                  </div>
                  <div>
                    <p className="text-lg font-bold leading-tight drop-shadow-sm">{tile.label}</p>
                    <p className="mt-1 text-xs text-white/80">{tile.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <NeoCard className="mt-8 items-start gap-3 p-6 sm:flex">
        <Megaphone className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-bold">Want to feature in the gallery?</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Team photos and event coverage are posted by the organization from The Den.
            Players can suggest moments through the player portal or the{" "}
            <a href="/contact" className="font-bold underline hover:text-neo-yellow">contact page</a>.
          </p>
        </div>
      </NeoCard>
    </div>
  );
}
