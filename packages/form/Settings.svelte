<script lang="ts">
	import { NativeSelect } from '@mywinkel/block-sdk/editor/ui';
	import Fields from '@mywinkel/block-sdk/editor/Fields.svelte';
	import { definition } from './definition';
	import type { BlockEditorProps } from '@mywinkel/block-sdk/contract';
	let { block, host, onchange }: BlockEditorProps = $props();
</script>

<Fields {block} fields={definition.fields} {onchange} />

{#if block.type === 'form'}<label class="mt-4 block space-y-1 text-sm"
		>Form<NativeSelect
			class="w-full"
			value={block.props.formId ?? ''}
			onchange={(event) => {
				if (block.type === 'form') {
					block.props.formId = event.currentTarget.value || undefined;
					onchange();
				}
			}}
			><option value="">Choose a form</option
			>{#each host.entries.filter((entry) => entry.document.kind === 'form') as entry (entry.document.id)}<option
					value={entry.document.id}>{entry.document.name}</option
				>{/each}</NativeSelect
		></label
	>{/if}
