import AsyncStorage from "@react-native-async-storage/async-storage";
import { ConvexReactClient } from "convex/react";

/** The same Convex deployment that powers the website + both portals. */
export const CONVEX_URL =
  process.env.EXPO_PUBLIC_CONVEX_URL ?? "https://youthful-crab-344.convex.cloud";

export const convex = new ConvexReactClient(CONVEX_URL);

export const tokenStorage = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};
