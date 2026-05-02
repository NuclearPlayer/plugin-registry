import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const PLUGINS_PATH = resolve(PROJECT_ROOT, "plugins.json");

interface Plugin {
  id: string;
  name: string;
  description: string;
  author: string;
  repo: string;
  category: string;
  categories?: string[];
  tags?: string[];
  version?: string;
  downloadUrl?: string;
  addedAt: string;
}

interface PluginRegistry {
  $schema?: string;
  version: number;
  plugins: Plugin[];
}

const PLUGIN_ASSET_NAME = "plugin.zip";

function gh(args: string): string {
  return execSync(`gh ${args}`, { encoding: "utf-8" }).trim();
}

function getLatestRelease(repo: string): { version: string; downloadUrl: string } {
  const json = gh(
    `api repos/${repo}/releases/latest --jq '{tag: .tag_name, url: (.assets[] | select(.name == "${PLUGIN_ASSET_NAME}") | .browser_download_url)}'`
  );
  const release = JSON.parse(json);

  return {
    version: release.tag.replace(/^v/i, ""),
    downloadUrl: release.url,
  };
}

function updatePlugin(plugin: Plugin): Plugin {
  console.log(`${plugin.name} (${plugin.repo}):`);

  const release = getLatestRelease(plugin.repo);

  if (plugin.version === release.version && plugin.downloadUrl === release.downloadUrl) {
    console.log(`Already up to date (${release.version})`);
    return plugin;
  }

  console.log(`Updated: ${plugin.version ?? "none"} -> ${release.version}`);
  return { ...plugin, ...release };
}

const registry: PluginRegistry = JSON.parse(
  readFileSync(PLUGINS_PATH, "utf-8")
);

const updatedPlugins = registry.plugins.map(updatePlugin);
const updatedCount = updatedPlugins.filter(
  (plugin, index) => plugin !== registry.plugins[index]
).length;

if (updatedCount > 0) {
  const updatedRegistry: PluginRegistry = { ...registry, plugins: updatedPlugins };
  writeFileSync(PLUGINS_PATH, JSON.stringify(updatedRegistry, null, 2) + "\n");
  console.log(`\nUpdated ${updatedCount} plugin(s).`);
} else {
  console.log("\nAll plugins already up to date.");
}
