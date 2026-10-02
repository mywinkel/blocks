# My Winkel Blocks

The MIT-licensed public SDK and independently installable block packages for My Winkel.
External developers can build blocks against the released package format and
SDK.

**Start with the [block author guide](https://mywinkel.github.io/blocks/).** It
covers the early, versioned `format: 1` and SDK `0.1` contract, package examples,
backend permissions, validation and releases.

Browse the [coordinated releases](https://github.com/mywinkel/blocks/releases)
or read the [license](LICENSE).

## Examples

- [`examples/starter`](examples/starter/) is a small visual block to copy and
  adapt.
- [`examples/notes`](examples/notes/) shows a backend handler and a package
  migration.

Both are optional `@example/*` release packages. They are not part of the CMS's
default system block set.

## Development

This repository uses Bun. To check package sources and build the public guide:

```sh
bun install --frozen-lockfile
bun run check
bun run test
bun run build
bun run docs:build
```

See the guide for package validation and release steps.
