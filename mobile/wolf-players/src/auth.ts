import AsyncStorage from "@react-native-async-storage/async-storage";
import { ConvexReactClient } from "convex/react";

/** The same Convex deployment that powers the website + management portal.
 *  Change this to your own deployment URL if it ever differs. */
export const CONVEX_URL =
  process.env.EXPO_PUBLIC_CONVEX_URL ?? "https://youthful-crab-344.convex.cloud";

export const convex = new ConvexReactClient(CONVEX_URL);

/** TokenStorage adapter backed by AsyncStorage (required for React Native). */
export const tokenStorage = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};
