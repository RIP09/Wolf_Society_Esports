import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ConvexAuthProvider, useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "./convex/_generated/api";
import { convex, tokenStorage } from "./src/auth";
import { Loading, TabBar } from "./src/components";
import { Login } from "./src/screens/Login";
import { Gate } from "./src/screens/Gate";
import { Dashboard } from "./src/screens/Dashboard";
import { Attendance } from "./src/screens/Attendance";
import { Reports } from "./src/screens/Reports";
import { Profile } from "./src/screens/Profile";
import { View } from "react-native";

function Main() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const profile = useQuery(api.players.getMyProfile);
  const [tab, setTab] = useState("dashboard");

  if (isLoading) return <Loading label="Checking sign-in…" />;

  if (!isAuthenticated) return <Login />;

  const verified =
    !!profile && profile.status !== undefined && profile.status !== "pending" && profile.status !== "suspended";

  if (!verified) return <Gate onSignOut={signOut} />;

  const tabs = [
    { key: "dashboard", label: "Home" },
    { key: "attendance", label: "Attendance" },
    { key: "reports", label: "Reports" },
    { key: "profile", label: "Profile" },
  ];

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {tab === "dashboard" ? <Dashboard /> : null}
        {tab === "attendance" ? <Attendance /> : null}
        {tab === "reports" ? <Reports /> : null}
        {tab === "profile" ? <Profile onSignOut={signOut} /> : null}
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
