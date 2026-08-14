import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleProp,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, s } from "./theme";

export function Screen({ children, scroll = true, style }: { children: React.ReactNode; scroll?: boolean; style?: StyleProp<ViewStyle> }) {
  const content = <View style={[{ padding: 16, gap: 14 }, style]}>{children}</View>;
  return (
    <SafeAreaView style={s.screen} edges={["top", "left", "right", "bottom"]}>
      {scroll ? <ScrollView contentContainerStyle={{ paddingBottom: 96 }}>{content}</ScrollView> : content}
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Button({ title, onPress, variant = "primary", disabled, loading, style }: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const bg = variant === "ghost" ? COLORS.card : COLORS.yellow;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: bg, opacity: disabled || loading ? 0.55 : 1 },
        pressed ? { transform: [{ translateY: 2 }] } : null,
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={COLORS.ink} /> : <Text style={s.btnText}>{title}</Text>}
    </Pressable>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput placeholderTextColor={COLORS.muted} style={s.input} {...props} />
    </View>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <View style={{ borderWidth: 2, borderColor: COLORS.ink, backgroundColor: COLORS.red, padding: 12 }}>
      <Text style={{ fontSize: 12, fontWeight: "800", color: "#fff", fontFamily: "monospace" }}>{message}</Text>
    </View>
  );
}

export function Chip({ text, color }: { text: string; color?: string }) {
  return (
    <View style={[s.chip, { backgroundColor: color ?? COLORS.cream }]}>
      <Text style={[s.chipText, { color: color ? "#fff" : COLORS.ink }]}>{text}</Text>
    </View>
  );
}

export function Header({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={[s.eyebrow, { color: COLORS.purple }]}>{eyebrow}</Text>
      <Text style={s.title}>{title}</Text>
    </View>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <View style={[s.screen, { alignItems: "center", justifyContent: "center", gap: 10 }]}>
      <ActivityIndicator size="large" color={COLORS.ink} />
      <Text style={s.body}>{label}</Text>
    </View>
  );
}

export function TabBar({ tabs, active, onChange }: { tabs: { key: string; label: string }[]; active: string; onChange: (key: string) => void }) {
  return (
    <View style={{ flexDirection: "row", borderTopWidth: 2, borderColor: COLORS.ink, backgroundColor: COLORS.card, paddingTop: 6, paddingBottom: 10, paddingHorizontal: 4, gap: 4 }}>
      {tabs.map((t) => (
        <Pressable
          key={t.key}
          onPress={() => onChange(t.key)}
          style={[
            { flex: 1, alignItems: "center", paddingVertical: 8, borderWidth: 2, borderColor: COLORS.ink },
            active === t.key ? { backgroundColor: COLORS.yellow } : { backgroundColor: COLORS.card },
          ]}
        >
          <Text style={[s.chipText, { color: COLORS.ink, fontSize: 10 }]}>{t.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
