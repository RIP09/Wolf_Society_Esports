/* eslint-disable */
/**
 * Runtime `api` utility for React Native — mirrors the web app's generated
 * file. Function references are resolved by name against the same deployment.
 */
import { anyApi, componentsGeneric } from "convex/server";

export const api = anyApi;
export const internal = anyApi;
export const components = componentsGeneric();
