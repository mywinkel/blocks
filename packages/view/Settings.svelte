<script lang="ts">
	import Fields from '@mywinkel/block-sdk/editor/Fields.svelte';
	import { definition } from './definition';
	import type { BlockEditorProps } from '@mywinkel/block-sdk/contract';
	let { block, onchange }: BlockEditorProps = $props();
</script>

<Fields {block} fields={definition.fields} {onchange} />
