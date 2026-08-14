import React, { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button, Field, Header, Screen } from "../components";
import { COLORS, s } from "../theme";

type Msg = { role: "user" | "coach"; text: string };

const SUGGESTIONS = [
  "Build me a daily training routine for Valorant",
  "What should I focus on after a losing streak?",
  "Give me warmup drills before a tournament",
  "How do I improve my aim and crosshair placement?",
  "Analyze how I should review my VODs",
];

export function Coach() {
  const ask = useAction(api.automation.askAssistant);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "coach",
      text: "Hey! I'm your AI coach. Ask me anything about training, routines, drills, mentality, or match preparation — I'm wired to the Wolf Society coaching assistant.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Polls the assistantReplies table while a Huginn workflow is processing.
  const pendingReply = useQuery(
    api.automation.getAssistantReply,
    chatId ? { chatId } : "skip",
  );

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || busy) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setBusy(true);
    setChatId(null);
    try {
      const res = await ask({ message: question });
      if (res.reply) {
        setMessages((m) => [...m, { role: "coach", text: res.reply }]);
        setBusy(false);
      } else if (res.chatId) {
        setChatId(res.chatId);
        setMessages((m) => [...m, { role: "coach", text: "Thinking… (the AI coach is drafting your answer)" }]);
      } else {
        setMessages((m) => [...m, { role: "coach", text: res.reply ?? "The coach is warming up — try again in a moment." }]);
        setBusy(false);
      }
    } catch {
      setMessages((m) => [...m, { role: "coach", text: "The coach hit a snag — please try again." }]);
      setBusy(false);
    }
  };

  // When the Huginn workflow posts the real reply back, swap the placeholder.
  useEffect(() => {
    if (pendingReply && busy && chatId && pendingReply.reply) {
      setMessages((m) => {
        const next = [...m];
        const last = next[next.length - 1];
        if (last?.role === "coach" && last.text.startsWith("Thinking…")) {
          next[next.length - 1] = { role: "coach", text: pendingReply.reply };
        }
        return next;
      });
      setBusy(false);
    }
  }, [pendingReply, busy, chatId]);

  // Safety net: if the workflow never posts back within 25s, resolve politely.
  useEffect(() => {
    if (!chatId || !busy) return;
    const t = setTimeout(() => {
      setMessages((m) => {
        const next = [...m];
        const last = next[next.length - 1];
        if (last?.role === "coach" && last.text.startsWith("Thinking…")) {
          next[next.length - 1] = {
            role: "coach",
            text: "The AI coach is still drafting (the Huginn workflow is processing). Ask again in a few seconds or check back later.",
          };
        }
        return next;
      });
      setBusy(false);
    }, 25000);
    return () => clearTimeout(t);
  }, [chatId, busy]);

  return (
    <Screen scroll={false} style={{ padding: 0 }}>
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <Header eyebrow="Wolf Coach · AI" title="Your AI coach" />
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((m, i) => (
          <View
            key={i}
            style={[
              {
                maxWidth: "92%",
                padding: 12,
                borderWidth: 2,
                borderColor: COLORS.ink,
                borderRadius: 0,
              },
              m.role === "coach"
                ? { backgroundColor: COLORS.card, alignSelf: "flex-start" }
                : { backgroundColor: COLORS.yellow, alignSelf: "flex-end" },
            ]}
          >
            <Text style={[s.label, { marginBottom: 4 }]}>{m.role === "coach" ? "AI Coach" : "You"}</Text>
            <Text style={{ color: COLORS.ink, fontSize: 13, lineHeight: 19 }}>{m.text}</Text>
          </View>
        ))}
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ padding: 12, gap: 8, borderTopWidth: 2, borderColor: COLORS.ink, backgroundColor: COLORS.card }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {SUGGESTIONS.map((sug) => (
            <Button key={sug} title={sug.slice(0, 34) + "…"} variant="ghost" onPress={() => send(sug)} disabled={busy} />
          ))}
        </ScrollView>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-end" }}>
          <View style={{ flex: 1 }}>
            <Field label="Ask your coach…" value={input} onChangeText={setInput} multiline placeholder="e.g. Build me a warmup routine" />
          </View>
          <Button title="Send" onPress={() => send(input)} loading={busy} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
