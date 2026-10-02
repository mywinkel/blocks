<script lang="ts">
  import Fields from "@mywinkel/block-sdk/editor/Fields.svelte";
  import type { BlockEditorProps } from "@mywinkel/block-sdk/contract";
  import { definition } from "./definition";

  let { block, onchange }: BlockEditorProps = $props();
</script>

<Fields {block} fields={definition.fields} {onchange} />
