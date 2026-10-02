---
title: Build My Winkel blocks
description: A practical guide to authoring and packaging blocks for My Winkel.
---

My Winkel blocks are versioned packages. Each package declares one or more
blocks, their settings and appearance, and compiled entrypoints. The host reads
the manifest and invokes those entrypoints through the released SDK contract.

This guide covers the public **early API**: package manifest `format: 1` and SDK
`0.1`. Check the package versions in your project and the release notes before
updating; compatibility follows the published package and SDK versions.

## Choose an example

- [Starter block](/blocks/authoring/visual-blocks/) — a small editable Svelte
  card with settings fields and appearance parts.
- [Notes package](https://github.com/mywinkel/blocks/tree/main/examples/notes)
  — a backend handler, SQL access and a package-owned migration.

Both examples are optional `@example/*` packages. They are distributed as
examples and are not installed as CMS default system blocks.

## Authoring path

1. [Get started](/blocks/getting-started/) with the starter source.
2. Build a [visual block and settings editor](/blocks/authoring/visual-blocks/).
3. Define a [manifest](/blocks/authoring/package-manifest/) for the package.
4. Add server code only after reading the [backend permission model](/blocks/backend/).
5. Add [compatible migrations](/blocks/authoring/migrations/) when the package
   needs persistent data.
6. [Build, validate and publish](/blocks/publishing/) a versioned package.
