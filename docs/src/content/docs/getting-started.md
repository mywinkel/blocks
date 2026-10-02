---
title: Getting started
description: Build the visual starter package and make it your own.
---

## Requirements

- Bun `1.4.2` or later
- A My Winkel block SDK release compatible with the package you are building

The package format and SDK are early, versioned APIs. This guide documents
manifest format `1` and SDK API `0.1`; use matching versions and check release
notes before upgrading.

## Build the starter

Clone this repository, then install and build the sample:

```sh
git clone https://github.com/mywinkel/blocks.git
cd blocks/examples/starter
bun install
bun run build
```

The build writes `block-package.json` and the precompiled files under `dist/`.
The starter demonstrates a configuration schema, a visual view, settings fields
and named appearance parts. Start with [the view and settings walkthrough](/blocks/authoring/visual-blocks/).

For a real package, copy the starter into your own repository and change its
package name, block id, version, and SDK dependency to the matching released
SDK version. Keep the `@example/*` identity for local experiments only; choose
your own package scope before distribution.

## What the host consumes

The host reads `block-package.json`, validates the declared metadata, and loads
the compiled entries named there. It does not compile Svelte at install time.
The sample build is therefore part of your package workflow, and its output
must be included in the release archive.

Read [the package manifest reference](/blocks/authoring/package-manifest/) next.
