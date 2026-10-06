<script lang="ts">
	import Fields from '@mywinkel/block-sdk/editor/Fields.svelte';
	import CardSettings from '@mywinkel/block-sdk/editor/CardSettings.svelte';
	import type { BlockEditorProps } from '@mywinkel/block-sdk/contract';
	import { definition } from './definition';
	let { block, host, onchange }: BlockEditorProps = $props();
</script>

<Fields {block} fields={definition.fields} {onchange} />
<CardSettings {block} {host} {onchange} />
