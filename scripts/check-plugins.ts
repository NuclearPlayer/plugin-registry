import { execSync } from "node:child_process";

const REPO_PATTERN = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;

interface Plugin {
  id: string;
  repo: string;
  version?: string;
  downloadUrl?: string;
  sha256?: string;
}

interface PluginRegistry {
  plugins: Plugin[];
  version?: number;
}

function readRegistries(baseBranch: string): { oldPlugins: PluginRegistry; newPlugins: PluginRegistry } {
  execSync(`git fetch origin ${baseBranch} --depth=1`, { stdio: "inherit" });

  const oldContent = execSync(`git show origin/${baseBranch}:plugins.json`, {
    encoding: "utf-8",
  });
  const newContent = execSync(`git show HEAD:plugins.json`, {
    encoding: "utf-8",
  });

  return { oldPlugins: JSON.parse(oldContent), newPlugins: JSON.parse(newContent) };
}

function getChangedRepos(oldPlugins: PluginRegistry, newPlugins: PluginRegistry): string[] {
  const oldRepos = new Set(oldPlugins.plugins.map((p) => p.repo));
  return newPlugins.plugins.filter((p) => !oldRepos.has(p.repo)).map((p) => p.repo);
}

function getAutomaticFieldErrors(oldPlugins: PluginRegistry, newPlugins: PluginRegistry): string[] {
  return newPlugins.plugins
    .filter((plugin) => {
      const original = oldPlugins.plugins.find((existing) => existing.id === plugin.id);
      return (
        plugin.version !== original?.version ||
        plugin.downloadUrl !== original?.downloadUrl ||
        plugin.sha256 !== original?.sha256
      );
    })
    .map(
      (plugin) =>
        `${plugin.id}: version, downloadUrl and sha256 are filled in automatically after the plugin is merged. Remove them from your entry.`
    );
}

function gh(args: string): string {
  return execSync(`gh ${args}`, { encoding: "utf-8" }).trim();
}

function checkPlugin(repo: string): string[] {
  const errors: string[] = [];

  if (!REPO_PATTERN.test(repo)) {
    return [`Invalid repo format: ${repo}`];
  }

  try {
    gh(`api repos/${repo} --jq '.id'`);
    console.log(`  ✓ Repository exists`);
  } catch (e) {
    return [`Repository ${repo} not found or not public: ${e instanceof Error ? e.message : e}`];
  }

  let packageJson: Record<string, unknown>;
  try {
    const content = gh(`api repos/${repo}/contents/package.json --jq '.content'`);
    packageJson = JSON.parse(Buffer.from(content, "base64").toString("utf-8"));
    console.log(`  ✓ package.json exists`);
  } catch (e) {
    return [`Repository ${repo} has no package.json: ${e instanceof Error ? e.message : e}`];
  }

  const nuclear = packageJson.nuclear as Record<string, unknown> | undefined;
  const categories = nuclear?.categories as string[] | undefined;
  const category = nuclear?.category as string | undefined;
  if (!categories?.length && !category) {
    errors.push(`package.json in ${repo} missing nuclear.categories field`);
  } else {
    console.log(`  ✓ nuclear.categories present`);
  }

  let releaseCount: number;
  try {
    const releases = gh(`api repos/${repo}/releases --jq 'length'`);
    releaseCount = parseInt(releases, 10);
  } catch (e) {
    return [`Could not fetch releases for ${repo}: ${e instanceof Error ? e.message : e}`];
  }

  if (releaseCount === 0) {
    return [...errors, `Repository ${repo} has no releases`];
  }
  console.log(`  ✓ Has ${releaseCount} release(s)`);

  try {
    const assets = gh(`api repos/${repo}/releases/latest --jq '.assets[].name'`);
    if (!assets.includes("plugin.zip")) {
      errors.push(`Latest release of ${repo} missing plugin.zip asset`);
    } else {
      console.log(`  ✓ Latest release has plugin.zip`);
    }
  } catch (e) {
    errors.push(`Could not fetch latest release for ${repo}: ${e instanceof Error ? e.message : e}`);
  }

  return errors;
}

const baseBranch = process.env.BASE_BRANCH;
if (!baseBranch) {
  console.error("BASE_BRANCH not set");
  process.exit(1);
}

const { oldPlugins, newPlugins } = readRegistries(baseBranch);

const fieldErrors = getAutomaticFieldErrors(oldPlugins, newPlugins);
fieldErrors.forEach((error) => console.error(`::error::${error}`));

let failed = fieldErrors.length > 0;

const changedRepos = getChangedRepos(oldPlugins, newPlugins);

if (changedRepos.length === 0) {
  console.log("No new plugins detected");
} else {
  console.log(`Checking ${changedRepos.length} plugin(s)\n`);
}

for (const repo of changedRepos) {
  console.log(`${repo}:`);
  const errors = checkPlugin(repo);

  for (const error of errors) {
    console.error(`  ::error::${error}`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log("All checks passed!");
