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
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
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
      // On success the auth provider flips to signed-in automatically.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid code — check your email and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll={false}>
      <View style={{ marginTop: 24, gap: 6 }}>
        <Text style={[s.eyebrow, { color: COLORS.blue }]}>Wolf Society Esports · The Pack</Text>
        <Text style={s.title}>Player sign-in</Text>
        <Text style={s.body}>
          Sign in with the email you registered with. We send a one-time code — no passwords to remember.
        </Text>
      </View>

      <Card style={{ gap: 14, marginTop: 8 }}>
        {error ? <ErrorBox message={error} /> : null}

        {step === "email" ? (
          <>
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Button title="Send me a sign-in code" onPress={sendOtp} loading={loading} />
          </>
        ) : (
          <>
            <Field
              label={`Code sent to ${email}`}
              value={code}
              onChangeText={setCode}
              placeholder="6-digit code"
              keyboardType="number-pad"
              maxLength={6}
            />
            <Button title="Verify & sign in" onPress={verifyOtp} loading={loading} />
            <Button
              title="Change email"
              variant="ghost"
              onPress={() => {
                setStep("email");
                setCode("");
                setError(null);
              }}
            />
          </>
        )}

        <Text style={{ fontSize: 10, color: COLORS.muted, fontFamily: "monospace", lineHeight: 15 }}>
          New player? Register first on the website (wolfsocietygg.vercel.app → Sign in → The Pack).
          Your profile then shows here once management approves it.
        </Text>
      </Card>
    </Screen>
  );
}
