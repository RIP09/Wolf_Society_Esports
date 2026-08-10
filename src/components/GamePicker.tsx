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
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

/** Searchable picker over any list of options (games, roles, regions…). */
export function OptionPicker({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No options found.",
  notSureLabel = "Not sure yet",
}: {
  options: readonly string[];
  value: string;
  onChange: (option: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  notSureLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = options.filter((o) => o.toLowerCase().includes(query.toLowerCase()));

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
        <Command>
          <CommandInput placeholder={searchPlaceholder} value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__none__"
                onSelect={() => {
                  onChange("none");
                  setOpen(false);
                  setQuery("");
                }}
                className="rounded-none"
              >
                <Check className={cn("size-4", value === "none" ? "opacity-100" : "opacity-0")} />
                {notSureLabel}
              </CommandItem>
              {filtered.map((o) => (
                <CommandItem
                  key={o}
                  value={o}
                  onSelect={() => {
                    onChange(o);
                    setOpen(false);
                    setQuery("");
                  }}
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

/** Searchable picker over 60+ worldwide esports titles. */
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
