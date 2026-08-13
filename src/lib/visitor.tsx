import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { btnGhost } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { useAction } from "convex/react";
import { Bot, Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

const STORAGE_KEY = "wse_ai_chat_v1";

const QUICK_PROMPTS = [
  "How do I join the organization?",
  "When are the next tryouts?",
  "How can I donate?",
  "How do I register as a player?",
];

const GREETING =
  "Hey, I'm Wolf — the Society's AI assistant. Ask me about joining the org, tryouts, teams, schedules, donations or anything else. I'm connected to the team's automation hub, so your question goes to a real AI workflow.";

export default function AIAssistant() {
  const ask = useAction(api.automation.askAssistant);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as ChatMessage[]) : [];
      return Array.isArray(parsed) ? parsed.slice(-40) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    } catch {
      // storage unavailable — keep chatting
    }
  }, [messages]);

  useEffect(() => {
    if (open) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open, messages, busy]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    setInput("");
    setBusy(true);
    try {
      const res = await ask({ message: trimmed });
      setMessages((m) => [...m, { role: "assistant", text: res.reply }]);
      if (res.configured !== undefined) setLive(res.configured);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: "The assistant hit a snag — try again in a moment, or use the contact form and the team will reply personally.",
        },
      ]);
      setLive(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {open && (
        <div className="mb-3 flex w-[20rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden border-2 border-foreground bg-background shadow-[6px_6px_0_0_var(--neo-ink)] sm:w-[24rem]">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b-2 border-foreground bg-neo-yellow px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center border-2 border-foreground bg-background text-foreground">
                <Bot className="size-4" />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-bold">Ask Wolf · AI assistant</p>
                <p className="flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-widest text-white/70">
                  <span className="relative flex h-1.5 w-1.5">
                    <span
                      className={cn(
                        "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                        live === false ? "bg-neo-red" : "bg-white",
                      )}
                    />
                    <span
                      className={cn(
                        "relative inline-flex h-1.5 w-1.5 rounded-full",
                        live === false ? "bg-neo-red" : "bg-white",
                      )}
                    />
                  </span>
                  {live === false ? "setup pending" : "realtime · n8n automation"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center border-2 border-foreground bg-background text-foreground hover:bg-neo-cream"
              aria-label="Close assistant"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex max-h-[22rem] min-h-[12rem] flex-col gap-3 overflow-y-auto bg-neo-cream p-4">
            {messages.length === 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center border-2 border-foreground bg-neo-blue text-white">
                    <Bot className="size-3.5" />
                  </span>
                  <div className="flex-1 border-2 border-foreground bg-background px-3 py-2 text-xs leading-5">
                    {GREETING}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {QUICK_PROMPTS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => void send(q)}
                      className="border-2 border-foreground bg-background px-2.5 py-1.5 text-left font-mono text-[10px] font-bold uppercase tracking-wider transition-colors hover:bg-neo-yellow hover:text-white"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-2",
                  m.role === "user" ? "flex-row-reverse" : "",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center border-2 border-foreground text-white",
                    m.role === "user" ? "bg-neo-orange" : "bg-neo-blue",
                  )}
                >
                  {m.role === "user" ? <Send className="size-3" /> : <Bot className="size-3" />}
                </span>
                <div
                  className={cn(
                    "flex-1 whitespace-pre-wrap border-2 border-foreground px-3 py-2 text-xs leading-5",
                    m.role === "user" ? "bg-neo-yellow text-white" : "bg-background",
                  )}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center border-2 border-foreground bg-neo-blue text-white">
                  <Bot className="size-3" />
                </span>
                <div className="flex items-center gap-1 border-2 border-foreground bg-background px-3 py-2.5">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground"
                      style={{ animationDelay: `${d * 120}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
            {live === false && messages.length > 0 && (
              <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                AI not connected yet — replies are generic until the n8n webhook is added.
              </p>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex items-center gap-2 border-t-2 border-foreground bg-background p-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about the Society…"
              className="h-10 flex-1 rounded-none border-2 border-foreground bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:bg-neo-cream"
              maxLength={500}
            />
            <Button
              type="submit"
              size="icon"
              className="neo-press h-10 w-10 shrink-0 rounded-none border-2 border-foreground bg-neo-yellow text-white shadow-[3px_3px_0_0_var(--neo-ink)] hover:shadow-[4px_4px_0_0_var(--neo-ink)]"
              disabled={busy || !input.trim()}
              aria-label="Send message"
            >
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      )}

      <Button
        className={cn(
          btnGhost,
          "neo-press group flex items-center gap-2 rounded-none border-2 border-foreground px-4 py-3 font-bold shadow-[4px_4px_0_0_var(--neo-ink)] hover:shadow-[5px_5px_0_0_var(--neo-ink)]",
        )}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
      >
        <span className="relative">
          <Sparkles className="size-4 text-neo-yellow" />
          <span className="absolute -right-1 -top-1 h-2 w-2 border border-foreground bg-neo-green" />
        </span>
        {open ? "Close" : "Ask Wolf"}
      </Button>
    </div>
  );
}
