---
title: Visual blocks and settings
description: Define a block, render it with Svelte, and expose editable fields.
---

The starter keeps block metadata, display markup and settings UI in separate
files. Its full source is available in
[`examples/starter`](https://github.com/mywinkel/blocks/tree/main/examples/starter).

## Define the block

Use `defineBlock` from `@mywinkel/block-sdk/contract`. The Zod schema describes
saved configuration and defaults; `fields` tells the editor which controls to
show. Keep the field keys aligned with schema properties.

```ts
import { z } from "zod";
import { defineBlock } from "@mywinkel/block-sdk/contract";

export const definition = defineBlock({
  id: "example/starter-card",
  label: "Starter card",
  description: "An editable card.",
  schema: z.object({
    heading: z.string().max(100).default("Hello from a block"),
    body: z.string().max(500).default("Change this text in settings."),
  }).strict(),
  fields: [
    { key: "heading", label: "Heading", type: "text" },
    { key: "body", label: "Body", type: "textarea" },
  ],
  parts: { "starter.root": "rounded-xl border p-6" },
  interactive: false,
});
```

Supported field types are `text`, `textarea`, `number`, `checkbox`, `select`
and `url`. Select fields provide `{ value, label }` options. Use numeric `min`
and `max` only when they match validation in the configuration schema.

## Render the block

The `View.svelte` component receives a block, render data and appearance from
the host. Use `createClasses` to apply named package parts with fallback classes:

```svelte
<script lang="ts">
  import { createClasses } from "@mywinkel/block-sdk/appearance.svelte";
  import type { BlockViewProps } from "@mywinkel/block-sdk/contract";

  let { block, appearance }: BlockViewProps = $props();
  const cx = createClasses(() => appearance);
  const content = $derived(block.props as { heading: string; body: string });
</script>

<article class={cx("starter.root", "rounded-xl border p-6")}>
  <h2>{content.heading}</h2>
  <p>{content.body}</p>
</article>
```

Keep classes in the fallback so the block has sensible styling when no custom
appearance is set. Named parts are package-owned keys; saved appearance values
can replace or extend their classes.

## Build the settings editor

For standard field controls, render the SDK's `Fields.svelte` component:

```svelte
<script lang="ts">
  import Fields from "@mywinkel/block-sdk/editor/Fields.svelte";
  import type { BlockEditorProps } from "@mywinkel/block-sdk/contract";
  import { definition } from "./definition";

  let { block, onchange }: BlockEditorProps = $props();
</script>

<Fields {block} fields={definition.fields} {onchange} />
```

The editor runs in a sandboxed frame and communicates changes through the host
editor protocol. Do not rely on host internals or direct access to the CMS
document. A custom settings entry must use the same serializable block-change
protocol.

## Interactive browser code

Set `interactive: true` and provide a browser entry only when a block needs
client-side behavior. Browser code runs in the storefront page and has that
page's browser privileges. Treat it as trusted code: validate input, avoid
exposing secrets, and keep server-only work out of browser bundles.

When rendering Svelte islands separately, give each render a unique `idPrefix`.
Svelte preserves that namespace during hydration. Reusing a fixed prefix creates
duplicate form and anchor IDs when two instances appear on one page, causing
labels or links to target another instance. The maintained build uses the block
ID when present and a unique render namespace for view props without metadata.

Continue with the [manifest reference](/blocks/authoring/package-manifest/).

## Maintained composition examples

The coordinated system set includes Hero and Accordion alongside existing block
identities. Hero supports photographic split, wide and stacked arrangements,
media-side placement and primary/secondary links. Accordion uses native
`details`/`summary` with multiple-open or exclusive behavior. Gallery keeps its
original grid and adds a manual slideshow with buttons, swipe and slide status.
Expose these choices as validated properties and named appearance parts.

Catalogue is a commerce listing over the public projection: search, category
filters, price/name/session sorting, show-more, details and purchase/selection
links. Public record IDs associate authored photographs with items. Authored
cards cannot supply authoritative prices or permissions. Its settings expose the
public item ID so photographs can be attached to new records. Grid remains for
authored cards, and View for read-only projected collections.

The SDK's `shared/selection` module exposes `readSelection`, `writeSelection`,
`subscribeSelection`, `cartQuantities` and `addToCart`. Keys include tenant and
selection kind. A DOM event synchronizes independently compiled bundles, with
storage events for other tabs. Treat values as untrusted customer hints; receiving
blocks match IDs to public catalogue data, and backend commands validate current
prices, ownership and availability. This protocol carries no authorization.

Cart retains `full` and supports `summary` and native modal `drawer` layouts.
Enquiry exposes labels, guidance, preselection and optional staged brief/contact
steps. With a service source, `serviceFirst` starts with a compact service choice;
changing that choice keeps the mounted brief and contact draft. Mixed Preorder
`menu`/`boxes` presentations retain the compatible `select`
default and legacy first-line fields while adding bounded `items`. The host owns
atomic pricing, capacity, preparation and payments; do not duplicate these rules
inside frontend or settings code.
