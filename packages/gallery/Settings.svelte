<script lang="ts">
	import CardSettings from '@mywinkel/block-sdk/editor/CardSettings.svelte';
	import Fields from '@mywinkel/block-sdk/editor/Fields.svelte';
	import { definition } from './definition';
	import type { BlockEditorProps } from '@mywinkel/block-sdk/contract';
	let { block, host, onchange }: BlockEditorProps = $props();
</script>

<Fields {block} fields={definition.fields} {onchange} />

<CardSettings {block} {host} {onchange} />
