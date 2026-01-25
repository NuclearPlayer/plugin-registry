# Submitting a Plugin

How to add your plugin to the Nuclear registry.

## Prerequisites

Before submitting, make sure you have:

- [ ] A working Nuclear plugin in a public Github repository
- [ ] A `package.json` that meets [the requirements](requirements.md)
- [ ] At least one Github Release with a `plugin.zip` asset
- [ ] A README explaining what your plugin does

## Step 1: Prepare Your Repository

Your plugin repository needs:

**package.json** with required fields:
```json
{
  "name": "your-plugin-id",
  "version": "1.0.0",
  "description": "What your plugin does",
  "author": "Your Name",
  "main": "dist/index.js",
  "nuclear": {
    "category": "metadata"
  }
}
```

**README.md** that includes a description, feature, screenshots, etc. This is what the users will see in Nuclear.

See [requirements.md](requirements.md) for the full specification.

## Step 2: Create a Github Release

1. Go to your repository -> **Releases** -> **Create a new release**
2. Tag it with a semver version (e.g., `v1.0.0`)
3. Attach a `plugin.zip` file containing your bundled plugin
4. Publish the release
5. Highly recommended to set up a pipeline that will do this for you

The `plugin.zip` should contain your built plugin files at the root level.

## Step 3: Fork and Edit

1. [Fork this repository](https://github.com/NuclearPlayer/plugin-registry/fork)
2. Edit `plugins.json` and add your plugin to the `plugins` array:

```json
{
  "id": "your-plugin-id",
  "description": "A short description (max 200 chars)",
  "author": "your-github-username",
  "repo": "your-username/your-plugin-repo",
  "category": "metadata",
  "tags": ["optional", "searchable", "tags"],
  "addedAt": "2026-01-25"
}
```

Important:
- `id` must match the `name` field in your plugin's `package.json`
- `category` must match the `nuclear.category` in your `package.json`
- `addedAt` should be today's date in `YYYY-MM-DD` format

## Step 4: Submit a Pull Request

1. Commit your changes and push to your fork
2. Open a Pull Request to this repository
3. Fill out the PR template completely

We will review your PR and add it to the registry manually.

## Updating Your Plugin

You don't need to PR the registry to update your plugin. Create a new release with the updated code and Nuclear will fetch the latest version automatically.

Only PR the registry if you need to change the plugin's metadata.