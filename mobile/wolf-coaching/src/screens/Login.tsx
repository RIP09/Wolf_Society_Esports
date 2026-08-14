import React, { useState } from "react";
import { Text, View } from "react-native";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button, Card, ErrorBox, Field, Header, Screen } from "../components";
import { COLORS, s } from "../theme";

export function Login() {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signIn("email-otp", { email: email.trim().toLowerCase() });
      setStep("code");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send the code.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!code.trim()) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signIn("email-otp", { email: email.trim().toLowerCase(), code: code.trim() });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid code — try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll={false}>
      <View style={{ marginTop: 24, gap: 6 }}>
        <Text style={[s.eyebrow, { color: COLORS.purple }]}>Wolf Coach · AI Training</Text>
        <Text style={s.title}>Sign in</Text>
        <Text style={s.body}>
          Use the same email you registered with (players and management both welcome).
        </Text>
      </View>
      <Card style={{ gap: 14, marginTop: 8 }}>
        {error ? <ErrorBox message={error} /> : null}
        {step === "email" ? (
          <>
            <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" />
            <Button title="Send sign-in code" onPress={sendOtp} loading={loading} />
          </>
        ) : (
          <>
            <Field label={`Code sent to ${email}`} value={code} onChangeText={setCode} placeholder="6-digit code" keyboardType="number-pad" maxLength={6} />
            <Button title="Verify & sign in" onPress={verifyOtp} loading={loading} />
            <Button title="Change email" variant="ghost" onPress={() => { setStep("email"); setCode(""); setError(null); }} />
          </>
        )}
      </Card>
    </Screen>
  );
}
