import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { Draft07 } from "json-schema-library";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const SCHEMA_PATH = resolve(PROJECT_ROOT, "schema/plugins.schema.json");
const PLUGINS_PATH = resolve(PROJECT_ROOT, "plugins.json");

interface Plugin {
  id: string;
  description: string;
  author: string;
  repo: string;
  category: string;
  tags?: string[];
  addedAt: string;
}

interface PluginRegistry {
  $schema?: string;
  plugins: Plugin[];
}

function loadJSON<T>(path: string, description: string): T {
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to load ${description} from ${path}: ${message}`);
    process.exit(1);
  }
}

function findDuplicates(ids: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      duplicates.add(id);
    }
    seen.add(id);
  }
  return [...duplicates];
}

const allErrors: string[] = [];

const schema = loadJSON<object>(SCHEMA_PATH, "schema");
const registry = loadJSON<PluginRegistry>(PLUGINS_PATH, "plugin registry");

const validator = new Draft07(schema);
const schemaErrors = validator.validate(registry);

for (const error of schemaErrors) {
  allErrors.push(`${error.message} (at ${error.data?.pointer || "/"})`);
}

const ids = registry.plugins.map((p) => p.id);
const duplicates = findDuplicates(ids);

if (duplicates.length > 0) {
  allErrors.push(`Duplicate plugin IDs: ${duplicates.join(", ")}`);
}

if (allErrors.length > 0) {
  console.error("Validation failed:\n");
  for (const error of allErrors) {
    console.error(`  - ${error}`);
  }
  console.error("");
  process.exit(1);
}

console.log(`Validated ${registry.plugins.length} plugin(s). All checks passed.`);
