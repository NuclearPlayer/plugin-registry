import { readFileSync, writeFileSync } from "node:fs";
import type { PluginRegistry } from "./types";

const REGISTRY_PATH = new URL("../../plugins.json", import.meta.url);

export function readRegistry(): PluginRegistry {
  return JSON.parse(readFileSync(REGISTRY_PATH, "utf-8"));
}

export function writeRegistry(registry: PluginRegistry): void {
  writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2) + "\n");
}
