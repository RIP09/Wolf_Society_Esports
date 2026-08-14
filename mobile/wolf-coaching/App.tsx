import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ConvexAuthProvider, useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { convex, tokenStorage } from "./src/auth";
import { Button, Loading, TabBar } from "./src/components";
import { COLORS } from "./src/theme";
import { Login } from "./src/screens/Login";
import { Coach } from "./src/screens/Coach";
import { Training } from "./src/screens/Training";
import { Drills } from "./src/screens/Drills";
import { Performance } from "./src/screens/Performance";

function Main() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const [tab, setTab] = useState("coach");

  if (isLoading) return <Loading label="Checking sign-in…" />;
  if (!isAuthenticated) return <Login />;

  const tabs = [
    { key: "coach", label: "AI Coach" },
    { key: "training", label: "Training" },
    { key: "drills", label: "Drills" },
    { key: "performance", label: "Stats" },
  ];

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {tab === "coach" ? <Coach /> : null}
        {tab === "training" ? <Training /> : null}
        {tab === "drills" ? <Drills /> : null}
        {tab === "performance" ? <Performance /> : null}
      </View>
      <View style={{ flexDirection: "row", alignItems: "stretch" }}>
        <View style={{ flex: 1 }}>
          <TabBar tabs={tabs} active={tab} onChange={setTab} />
        </View>
        <View style={{ justifyContent: "center", backgroundColor: COLORS.card, borderTopWidth: 2, borderColor: COLORS.ink, paddingHorizontal: 8 }}>
          <Button title="Exit" variant="ghost" onPress={signOut} style={{ paddingVertical: 8 }} />
        </View>
      </View>
    </View>
  );
}

export default function App() {
  // Ask for notification permission on launch so updates arrive instantly.
  useEffect(() => {
    (async () => {
      try {
        const Notifications = (await import("expo-notifications")) as any;
        await Notifications.requestPermissionsAsync();
      } catch {
        // Notifications unavailable — the manifest permissions still apply.
      }
    })();
  }, []);
  return (
    <SafeAreaProvider>
      <ConvexAuthProvider client={convex} storage={tokenStorage}>
        <StatusBar style="dark" />
        <Main />
      </ConvexAuthProvider>
    </SafeAreaProvider>
  );
}
