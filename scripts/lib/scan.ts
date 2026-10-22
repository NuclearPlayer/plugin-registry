import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { isUtf8 } from "node:buffer";
import { strFromU8, unzipSync, type Unzipped } from "fflate";
import type { Hold } from "./types.js";

type Verdict = {
  verdict: "clean" | "suspicious";
  findings: string[];
};

function buildPrompt(version: string, files: Unzipped): string {
  return readFileSync(new URL("./prompts/scan.md", import.meta.url), "utf-8")
    .replaceAll("{{boundary}}", `untrusted-data-${randomUUID()}`)
    .replace("{{data}}", () =>
      JSON.stringify({
        version,
        files: Object.fromEntries(
          Object.entries(files).map(([name, data]) => [name, strFromU8(data)])
        ),
      })
    );
}

function parseVerdict(reply: string): Hold | undefined {
  const { verdict, findings }: Verdict = JSON.parse(reply);
  if (verdict === "clean") {
    return undefined;
  }

  return { reason: "Copilot found suspicious code", findings };
}

function runCopilot(prompt: string): Hold | undefined {
  return parseVerdict(
    execFileSync(
      "copilot",
      [
        "-s",
        "--no-ask-user",
        "--no-custom-instructions",
        "--disable-builtin-mcps",
        "--available-tools=none",
      ],
      { input: prompt, encoding: "utf-8" }
    )
  );
}

export function scanRelease(version: string, zip: Uint8Array): Hold | undefined {
  const files = unzipSync(zip);

  const binaryFiles = Object.keys(files).filter((name) => !isUtf8(files[name]));
  if (binaryFiles.length > 0) {
    return { reason: "Plugin contains binary files", findings: binaryFiles };
  }

  return runCopilot(buildPrompt(version, files));
}
