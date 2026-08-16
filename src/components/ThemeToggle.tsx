import { Button } from "@/components/ui/button";
import { btnGhost } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

/**
 * Neobrutal light/dark toggle. Persists the choice (localStorage via
 * next-themes) and swaps the `light` / `dark` class on <html>, which drives
 * the theme tokens in index.css.
 */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // next-themes needs a mounted check to avoid hydration mismatch.
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme !== "light";
  const toggle = () => setTheme(isDark ? "light" : "dark");

  return (
    <Button
      variant="outline"
      size={compact ? "icon" : "sm"}
      className={cn(btnGhost, compact ? "size-9 shrink-0" : "gap-2")}
      onClick={toggle}
      title={mounted && isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-label={mounted && isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {mounted && isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      {!compact && (mounted && isDark ? "Light" : "Dark")}
    </Button>
  );
}
