---
title: Validate and publish
description: Build, validate, version and distribute a block package.
---

## Before release

1. Increment the package version and keep `package.json` and
   `block-package.json` aligned.
2. Build the package so every declared entry exists in `dist/`.
3. Validate configuration, manifest fields and migrations.
4. Test the block's rendered output, editor settings and backend behavior at
   each declared access level.
5. Review browser code as trusted storefront code and backend handlers as
   trusted with tenant SQL rows.

From this repository, the checks used for maintained packages are:

```sh
bun run check
bun run test
bun run build
bun run check:browser
bun run release
bun run docs:build
```

`bun run release` creates versioned tarballs and a `block-catalogue.json` with
the artifact URL, byte size and SHA-256 digest. The archive contains the
precompiled package and a `package/` root. A coordinated release keeps the SDK
and package versions aligned.

## Distribute optional examples

The starter and notes packages are named `@example/starter` and
`@example/notes`. They are built into separately named optional artifacts and
catalogue entries. They are not in the CMS default system block set. The CMS
system set is maintained separately from the optional package catalogue.

For an external package, publish its versioned archive and catalogue through
your chosen release channel. Do not overwrite an archive for an existing
version: installed releases are pinned by version and digest. Test installation
and upgrades with the exact catalogue and archive bytes you intend to publish.

## Compatibility

This guide documents manifest `format: 1` and SDK `0.1` as an early, versioned
API. Compatibility follows the versions your package declares and the host's
published compatibility checks. Rebuild against the matching SDK release and
review release notes before adopting a newer version.
