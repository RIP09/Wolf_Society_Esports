export function LoadingScreen({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <div className="h-12 w-12 animate-pulse border-2 border-foreground bg-neo-yellow shadow-[4px_4px_0_0_var(--neo-ink)]" />
      <p className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
