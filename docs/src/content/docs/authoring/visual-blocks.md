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

Continue with the [manifest reference](/blocks/authoring/package-manifest/).
