---
title: Package manifest
description: Reference for the shipped format 1 block-package.json contract.
---

Every release archive includes a root `package/block-package.json`. The manifest
is declarative metadata: it identifies the package, blocks, compiled entries,
backend access level and migrations. The SDK's
[`packageManifestSchema`](https://github.com/mywinkel/blocks/blob/main/packages/sdk/src/manifest.ts)
defines the shipped shape.

## Versioned fields

- `format` is currently `1`.
- `sdkVersion` is currently `"0.1"`.
- `name` and `version` must match the package's `package.json`.
- Each `blocks[]` entry has an `id`, label, description, JSON Schema
  `configuration`, editor `fields`, named `parts`, `interactive`, `children`
  and a `viewMode`.
- `entries.server` is required. `entries.browser` and `entries.settings` are
  optional paths relative to the package root. Interactive blocks need a
  browser entry; editable blocks should provide settings.
- `backendAccess` is `public`, `authenticated` or `owner`; it defaults to
  `owner`. See the [backend guide](/blocks/backend/) before choosing a value.
- `migrations` is an ordered list of immutable schema/data changes.

The SDK currently supports configuration fields of type `text`, `textarea`,
`number`, `checkbox`, `select` and `url`. Defaults and validation belong in the
configuration schema; editor fields describe controls and do not replace server
validation.

`viewMode` is `block` for ordinary blocks. Other supported values are
`checkout`, `customer-account`, `request-status`, `quote-acceptance`, `menu`,
`enquiry` and `form`; these modes are for host-integrated system behavior and
are not a shortcut for custom authoring.

## Keep package and manifest versions aligned

The build should produce both the manifest and every file declared by `entries`.
The repository's starter and notes examples show one way to build entries and
validate the manifest with the SDK. Release packaging checks package name,
version and entrypoint consistency.

The contract is early and versioned. Do not assume a field, entrypoint or
compatibility guarantee beyond the manifest format and SDK version that your
package declares.
