# Plugin Requirements

Your plugin must meet these requirements to be accepted into the registry.

## package.json

Your plugin's `package.json` must include these fields:

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Plugin identifier (lowercase, hyphens allowed) |
| `version` | Yes | Semver version (e.g., `1.0.0`) |
| `description` | Yes | Short description |
| `author` | Yes | Your name or GitHub username |
| `main` | Yes | Entry point (e.g., `dist/index.js`) |
| `nuclear` | Yes | Nuclear-specific configuration (see below) |

### The `nuclear` Field

```json
{
  "nuclear": {
    "displayName": "Discogs Plugin",
    "category": "metadata",
    "icon": {
      "type": "link",
      "link": "https://example.com/icon.png"
    },
    "permissions": ["network", "storage"]
  }
}
```

| Property | Required | Description |
|----------|----------|-------------|
| `displayName` | No | Human-readable name shown to users. Falls back to `name` if not set |
| `category` | Yes | One of: `streaming`, `metadata`, `lyrics`, `scrobbling`, `ui`, `other` |
| `icon` | No | Plugin icon. Currently only `{"type": "link", "link": "url"}` is supported |
| `permissions` | No | Informational list of permissions the plugin uses |

### Example package.json

```json
{
  "name": "discogs-metadata",
  "version": "1.0.0",
  "description": "Fetch album and artist metadata from Discogs",
  "author": "nukeop",
  "license": "MIT",
  "main": "dist/index.js",
  "nuclear": {
    "displayName": "Discogs Metadata",
    "category": "metadata"
  }
}
```

## GitHub Release

Your repository must have at least one GitHub Release that:

1. Uses a semver tag (e.g., `v1.0.0`, `v2.1.3`)
2. Contains a `plugin.zip` asset

### plugin.zip Structure

The zip file should contain your built plugin at the root level:

```
plugin.zip
├── index.js        # Your main entry point
├── package.json    # Plugin metadata
└── ...             # Any other files your plugin needs
```