# Nuclear Plugin Registry

The official index of plugins for [Nuclear](https://github.com/nukeop/nuclear).

## What is this?

This registry lists all the available plugins for Nuclear. Plugins themselves live in their developers' own Github repositories.

When you browse plugins in Nuclear, the player fetches this registry and displays available plugins. Installing a plugin downloads it directly from the plugin's Github releases.

## For Users

You don't need to interact with this repository. Browse and install plugins directly from within Nuclear.

## For Plugin Developers

Want to add your plugin to the registry?

1. **Build your plugin**. See the [Nuclear plugin development docs](https://nukeop.gitbook.io/nuclear/)
2. **Prepare your repository**. Ensure your `package.json` meets [the requirements](docs/requirements.md)
3. **Create a release**. Publish a Github release with a `plugin.zip` asset
4. **Submit a PR**. Add your plugin to `plugins.json` following [the submission guide](docs/submitting.md)

## Registry Format

Each plugin entry in `plugins.json` looks like this:

```json
{
  "id": "example-plugin",
  "name": "Example Plugin",
  "description": "Short description of what this plugin does",
  "author": "github-username",
  "repo": "owner/repo-name",
  "category": "metadata",
  "tags": ["optional", "tags"],
  "addedAt": "2026-01-25"
}
```

**Categories:** `streaming`, `metadata`, `lyrics`, `scrobbling`, `ui`, `other`

More categories may be added in the future.

## License

AGPL-3.0 — see [LICENSE](LICENSE)
