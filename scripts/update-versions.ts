import { getLatestRelease, hasHoldPullRequest, openHoldPullRequest } from "./lib/github";
import { readRegistry, writeRegistry } from "./lib/registry";
import { scanReleaseFrom } from "./lib/scan";
import type { Plugin, PluginRegistry } from "./lib/types";

type UpdateResult = { plugin: Plugin; failed: boolean };

async function updatePlugin(registry: PluginRegistry, plugin: Plugin): Promise<UpdateResult> {
  try {
    const release = getLatestRelease(plugin.repo);

    if (plugin.version === release.version && plugin.downloadUrl === release.downloadUrl) {
      console.log(`${plugin.id}: Already up to date (${release.version})`);
      return { plugin, failed: false };
    }

    if (hasHoldPullRequest(plugin.id, release.version)) {
      console.log(`${plugin.id}: Held ${release.version}`);
      return { plugin, failed: false };
    }

    const { sha256, hold } = await scanReleaseFrom(release);
    const updated = { ...plugin, ...release, sha256 };

    if (hold) {
      openHoldPullRequest(registry, updated, hold);
      return { plugin, failed: false };
    }

    console.log(`${plugin.id}: Updated: ${plugin.version ?? "none"} -> ${release.version}`);
    return { plugin: updated, failed: false };
  } catch (err) {
    console.error(`${plugin.id}: Failed: ${(err as Error).message}`);
    return { plugin, failed: true };
  }
}

const registry = readRegistry();

const results = await Promise.all(
  registry.plugins.map((plugin) => updatePlugin(registry, plugin))
);

const updatedPlugins = results.map((result) => result.plugin);
const updatedCount = updatedPlugins.filter(
  (plugin, index) => plugin !== registry.plugins[index]
).length;
const failedPlugins = results
  .filter((result) => result.failed)
  .map((result) => result.plugin);

if (updatedCount > 0) {
  writeRegistry({ ...registry, plugins: updatedPlugins });
  console.log(`\nUpdated ${updatedCount} plugin(s).`);
} else {
  console.log("\nAll plugins already up to date.");
}

if (failedPlugins.length > 0) {
  console.error(`\nFailed to update ${failedPlugins.length} plugin(s):`);
  failedPlugins.forEach((plugin) => console.error(`  - ${plugin.name} (${plugin.repo})`));
  process.exit(1);
}
