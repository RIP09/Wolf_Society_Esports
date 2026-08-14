import React, { useState } from "react";
import { Text, View } from "react-native";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button, Card, ErrorBox, Field, Header, Screen } from "../components";
import { COLORS, s } from "../theme";

export function Login() {
  const { signIn } = useAuthActions();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const doSignIn = async () => {
    if (!userId.trim() || !password) {
      setError("Enter your User ID and password.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signIn("password", { flow: "signIn", email: userId.trim(), password });
      // On success the auth provider flips to signed-in automatically.
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Invalid User ID or password. Use the credentials sent to you by the organization.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll={false}>
      <View style={{ marginTop: 24, gap: 6 }}>
        <Text style={[s.eyebrow, { color: COLORS.orange }]}>Wolf Society Esports · The Den</Text>
        <Text style={s.title}>Management sign-in</Text>
        <Text style={s.body}>
          Sign in with the User ID and password issued to you by the organization (e.g. WSE-001).
          Same credentials as the website management portal.
        </Text>
      </View>

      <Card style={{ gap: 14, marginTop: 8 }}>
        {error ? <ErrorBox message={error} /> : null}
        <Field label="User ID" value={userId} onChangeText={setUserId} placeholder="WSE-001" autoCapitalize="characters" autoCorrect={false} />
        <Field label="Password" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
        <Button title="Sign in to The Den" onPress={doSignIn} loading={loading} />
        <Text style={{ fontSize: 10, color: COLORS.muted, fontFamily: "monospace", lineHeight: 15 }}>
          Lost your credentials? Ask a Super Admin to resend them from The Den → Access.
        </Text>
      </Card>
    </Screen>
  );
}
