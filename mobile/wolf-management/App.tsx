import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ConvexAuthProvider, useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "./convex/_generated/api";
import { convex, tokenStorage } from "./src/auth";
import { Button, Card, Loading, Screen, TabBar } from "./src/components";
import { COLORS, s } from "./src/theme";
import { Login } from "./src/screens/Login";
import { Overview } from "./src/screens/Overview";
import { Players } from "./src/screens/Players";
import { Attendance } from "./src/screens/Attendance";
import { Reports } from "./src/screens/Reports";

function Main() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.currentUser);
  const [tab, setTab] = useState("overview");

  if (isLoading || user === undefined) return <Loading label="Checking access…" />;

  if (!isAuthenticated) return <Login />;

  const isManager = user?.role === "admin" || user?.role === "superadmin";

  if (!isManager) {
    return (
      <Screen scroll={false}>
        <View style={{ marginTop: 32, gap: 8 }}>
          <Text style={s.title}>Players use The Pack</Text>
          <Text style={s.body}>
            This app is the management portal (The Den). Your account is a player account — download the
            Wolf Pack players app instead, or ask a Super Admin for management credentials.
          </Text>
          <Card style={{ marginTop: 8 }}>
            <Button title="Sign out" variant="ghost" onPress={signOut} />
          </Card>
        </View>
      </Screen>
    );
  }

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "players", label: "Players" },
    { key: "attendance", label: "Attendance" },
    { key: "reports", label: "Reports" },
  ];

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {tab === "overview" ? <Overview /> : null}
        {tab === "players" ? <Players /> : null}
        {tab === "attendance" ? <Attendance /> : null}
        {tab === "reports" ? <Reports /> : null}
      </View>
      <TabBar tabs={tabs} active={tab} onChange={setTab} />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ConvexAuthProvider client={convex} storage={tokenStorage}>
        <StatusBar style="dark" />
        <Main />
      </ConvexAuthProvider>
    </SafeAreaProvider>
  );
}
