import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GAMES } from "@/lib/constants";
import { select } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, PencilLine } from "lucide-react";
import { useState } from "react";

/**
 * Searchable picker over any list of options (games, roles, regions…).
 * While typing, a "Use '…' as my own" entry appears so users can write a
 * custom value when the list doesn't have what they need. Press Enter or
 * click the entry to use it. Set `allowCustom={false}` for fixed lists
 * (e.g. phone country codes).
 */
export function OptionPicker({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No options found.",
  notSureLabel = "Not sure yet",
  allowCustom = true,
}: {
  options: readonly string[];
  value: string;
  onChange: (option: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  notSureLabel?: string;
  allowCustom?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const q = query.trim();
  const filtered = options.filter((o) => o.toLowerCase().includes(q.toLowerCase()));
  const exactMatch =
    q.length > 0 && filtered.some((o) => o.toLowerCase() === q.toLowerCase());
  const showCustom = allowCustom && q.length > 0 && !exactMatch;

  const pick = (option: string) => {
    onChange(option);
    setOpen(false);
    setQuery("");
  };

  const pickCustom = () => {
    if (!q) return;
    pick(q);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(select, "h-9 w-full justify-between font-normal")}
        >
          <span className="truncate">{value === "none" ? notSureLabel : value || placeholder}</span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[--radix-popover-trigger-width] rounded-none border-2 border-foreground bg-card p-0 shadow-[4px_4px_0_0_var(--neo-ink)]"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={query}
            onValueChange={setQuery}
            onKeyDown={(e) => {
              if (e.key === "Enter" && q.length > 0) {
                e.preventDefault();
                if (exactMatch) {
                  const match = filtered.find((o) => o.toLowerCase() === q.toLowerCase());
                  if (match) pick(match);
                } else {
                  pickCustom();
                }
              }
            }}
          />
          <CommandList>
            {filtered.length === 0 && !showCustom ? (
              <CommandEmpty>{emptyText}</CommandEmpty>
            ) : null}
            <CommandGroup>
              {showCustom ? (
                <CommandItem
                  value="__custom__"
                  onSelect={pickCustom}
                  className="rounded-none border-b-2 border-foreground/10 font-semibold"
                >
                  <PencilLine className="size-4" />
                  Use "{q}" as my own
                </CommandItem>
              ) : null}
              <CommandItem
                value="__none__"
                onSelect={() => pick("none")}
                className="rounded-none"
              >
                <Check className={cn("size-4", value === "none" ? "opacity-100" : "opacity-0")} />
                {notSureLabel}
              </CommandItem>
              {filtered.map((o) => (
                <CommandItem
                  key={o}
                  value={o}
                  onSelect={() => pick(o)}
                  className="rounded-none"
                >
                  <Check className={cn("size-4", value === o ? "opacity-100" : "opacity-0")} />
                  {o}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Searchable picker over 80+ worldwide esports titles. */
export function GamePicker({
  value,
  onChange,
  placeholder = "Select a game…",
}: {
  value: string;
  onChange: (game: string) => void;
  placeholder?: string;
}) {
  return (
    <OptionPicker
      options={GAMES}
      value={value}
      onChange={(v) => onChange(v === "none" ? GAMES[0] : v)}
      placeholder={placeholder}
      searchPlaceholder="Search esports titles…"
      emptyText="No games found."
      notSureLabel={GAMES[0]}
    />
  );
}
