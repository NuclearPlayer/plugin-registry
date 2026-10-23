import { execFileSync } from "node:child_process";
import { writeRegistry } from "./registry";
import type { Hold, Plugin, PluginRegistry, Release } from "./types";

type GitHubAsset = {
  name: string;
  label: string | null;
  browser_download_url: string;
};

type GitHubRelease = {
  tag_name: string;
  assets: GitHubAsset[];
};

function gh(args: string[]): string {
  return execFileSync("gh", args, { encoding: "utf-8" });
}

function ghJson<T>(args: string[]): T {
  return JSON.parse(gh(args));
}

function git(args: string[]): string {
  return execFileSync("git", args, { encoding: "utf-8" });
}

function holdBranch(id: string, version: string): string {
  return `held/${id}-${version}`;
}

export function getLatestRelease(repo: string): Release {
  const release = ghJson<GitHubRelease>(["api", `repos/${repo}/releases/latest`]);
  return {
    version: release.tag_name.replace(/^v/i, ""),
    downloadUrl: release.assets.find(
      (asset) => asset.name === "plugin.zip" || asset.label === "plugin.zip"
    )!.browser_download_url,
  };
}

export function readPullRequestRegistry(number: string): PluginRegistry {
  git(["fetch", "origin", `pull/${number}/head`]);
  return JSON.parse(git(["show", "FETCH_HEAD:plugins.json"]));
}

export function hasHoldPullRequest(id: string, version: string): boolean {
  return ghJson<{ number: number }[]>([
    "pr",
    "list",
    "--head",
    holdBranch(id, version),
    "--state",
    "all",
    "--json",
    "number",
  ]).length > 0;
}

export function openHoldPullRequest(
  registry: PluginRegistry,
  plugin: Plugin & Release,
  hold: Hold
): void {
  const branch = holdBranch(plugin.id, plugin.version);

  git(["switch", "-c", branch]);
  writeRegistry({
    ...registry,
    plugins: registry.plugins.map((entry) => {
      if (entry.id === plugin.id) {
        return plugin;
      }
      return entry;
    }),
  });
  git(["commit", "-am", `Update ${plugin.id} to ${plugin.version}`]);
  git(["push", "--force", "origin", branch]);
  git(["switch", "-"]);

  gh([
    "pr",
    "create",
    "--head",
    branch,
    "--title",
    `Held: ${plugin.id} ${plugin.version}`,
    "--assignee",
    "nukeop",
    "--body",
    `Repo: https://github.com/${plugin.repo}

Reason: ${hold.reason}

Findings:
${hold.findings.map((finding) => `- ${finding}`).join("\n")}

Merge to publish this release, or close to reject it.`,
  ]);
  console.log(`${plugin.id}: Held ${plugin.version}: ${hold.reason}`);
}
