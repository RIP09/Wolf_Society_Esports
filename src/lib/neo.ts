/**
 * Shared Neobrutalism Minimalism style primitives.
 * Square corners, 2px near-black borders, flat colors, hard offset shadows.
 */

export const card =
  "rounded-none border-2 border-foreground bg-card shadow-[4px_4px_0_0_var(--neo-ink)]";

export const cardSm =
  "rounded-none border-2 border-foreground bg-card shadow-[2px_2px_0_0_var(--neo-ink)]";

export const cardFlat =
  "rounded-none border-2 border-foreground bg-card";

export const btn =
  "neo-press rounded-none border-2 border-foreground shadow-[3px_3px_0_0_var(--neo-ink)] hover:shadow-[4px_4px_0_0_var(--neo-ink)]";

export const btnPrimary =
  "neo-press rounded-none border-2 border-foreground bg-primary text-primary-foreground shadow-[3px_3px_0_0_var(--neo-ink)] hover:shadow-[4px_4px_0_0_var(--neo-ink)]";

export const btnYellow =
  "neo-press rounded-none border-2 border-foreground bg-neo-yellow text-white shadow-[3px_3px_0_0_var(--neo-ink)] hover:shadow-[4px_4px_0_0_var(--neo-ink)]";

export const btnGhost =
  "rounded-none border-2 border-foreground bg-background text-foreground shadow-[3px_3px_0_0_var(--neo-ink)] hover:bg-neo-cream hover:shadow-[4px_4px_0_0_var(--neo-ink)]";

export const input =
  "rounded-none border-2 border-foreground bg-background shadow-none focus-visible:ring-0 focus-visible:border-foreground";

export const select =
  "rounded-none border-2 border-foreground bg-background shadow-none focus-visible:ring-0 focus-visible:border-foreground";

export const label =
  "font-mono text-[11px] font-bold uppercase tracking-wider text-foreground";

export const chip = "rounded-none border-2 border-foreground";

export const tableHead =
  "border-2 border-foreground bg-foreground px-3 py-2.5 font-mono text-[11px] font-bold uppercase tracking-wider text-background";

export const tableCell = "border-2 border-foreground/30 px-3 py-2.5";

export const sectionLabel =
  "font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground";
