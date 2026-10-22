import { downloadZip } from "./lib/download.js";
import { hasHoldPullRequest, openHoldPullRequest } from "./lib/github.js";
import { readRegistry, writeRegistry } from "./lib/registry.js";
import { scanRelease } from "./lib/scan.js";
import type { Plugin, PluginRegistry } from "./lib/types.js";

async function backfillPlugin(registry: PluginRegistry, plugin: Plugin): Promise<Plugin> {
  const { version, downloadUrl } = plugin;
  if (!version || !downloadUrl || plugin.sha256) {
    return plugin;
  }

  try {
    if (hasHoldPullRequest(plugin.id, version)) {
      console.log(`${plugin.id}: Held ${version}`);
      return plugin;
    }

    const { zip, sha256 } = await downloadZip(downloadUrl);
    const hold = scanRelease(version, zip);

    if (hold) {
      openHoldPullRequest(registry, { ...plugin, version, downloadUrl, sha256 }, hold);
      return plugin;
    }

    console.log(`${plugin.id}: Backfilled sha256 for ${version}`);
    return { ...plugin, sha256 };
  } catch (err) {
    console.error(`${plugin.id}: Failed: ${(err as Error).message}`);
    return plugin;
  }
}

const registry = readRegistry();

const plugins = await Promise.all(
  registry.plugins.map((plugin) => backfillPlugin(registry, plugin))
);

if (plugins.some((plugin, index) => plugin !== registry.plugins[index])) {
  writeRegistry({ ...registry, plugins });
}
