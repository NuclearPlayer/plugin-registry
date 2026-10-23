import { getLatestRelease, readPullRequestRegistry } from "./lib/github";
import { readRegistry } from "./lib/registry";
import { scanReleaseFrom } from "./lib/scan";

const masterPlugins = readRegistry().plugins;

const holds = await Promise.all(
  readPullRequestRegistry(process.env.PR_NUMBER!)
    .plugins.filter(
      (plugin) =>
        !masterPlugins.some((existing) => existing.id === plugin.id && existing.repo === plugin.repo)
    )
    .map(async (plugin) => {
      const release = getLatestRelease(plugin.repo);
      const { hold } = await scanReleaseFrom(release);

      if (hold) {
        console.log(`::error::${plugin.id} ${release.version}: ${hold.reason}`);
        hold.findings.forEach((finding) => console.log(`::error::${finding}`));
        return hold;
      }

      console.log(`${plugin.id}: Clean ${release.version}`);
      return hold;
    })
);

if (holds.some((hold) => hold !== undefined)) {
  process.exit(1);
}
