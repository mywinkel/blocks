<script lang="ts">
	import Items from './Items.svelte';
	import Fields from '@mywinkel/block-sdk/editor/Fields.svelte';
	import { definition } from './definition';
	import type { BlockEditorProps } from '@mywinkel/block-sdk/contract';
	let { block, host, onchange }: BlockEditorProps = $props();
</script>

<Fields {block} fields={definition.fields} {onchange} />

{#if block.type === 'menu'}<Items {block} entries={host.entries} {onchange} />{/if}
