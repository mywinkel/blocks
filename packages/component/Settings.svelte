<script lang="ts">
	import { NativeSelect, Input, Textarea, Checkbox } from '@mywinkel/block-sdk/editor/ui';
	import Fields from '@mywinkel/block-sdk/editor/Fields.svelte';
	import { definition } from './definition';
	import type { BlockEditorProps } from '@mywinkel/block-sdk/contract';
	let { block, host, onchange }: BlockEditorProps = $props();
</script>

<Fields {block} fields={definition.fields} {onchange} />

{#if block.type === 'component'}
	<label class="mt-4 block space-y-1 text-sm"
		>Site component<NativeSelect
			class="w-full"
			value={block.props.componentId ?? ''}
			onchange={(event) => {
				if (block.type === 'component') {
					block.props.componentId = event.currentTarget.value || undefined;
					block.props.configuration = {};
					onchange();
				}
			}}
			><option value="">Choose a registered component</option
			>{#each host.components ?? [] as item (item.id)}<option value={item.id}>{item.label}</option
				>{/each}</NativeSelect
		></label
	>
	{#each host.components?.find((item) => item.id === block.props.componentId)?.fields ?? [] as field (field.key)}
		<label class="mt-4 block space-y-1 text-sm"
			>{field.label}
			{#if field.type === 'checkbox'}<Checkbox
					checked={!!block.props.configuration[field.key]}
					onCheckedChange={(value) => {
						if (block.type === 'component') {
							block.props.configuration[field.key] = value;
							onchange();
						}
					}}
				/>
			{:else if field.type === 'textarea'}<Textarea
					value={String(block.props.configuration[field.key] ?? '')}
					oninput={(event) => {
						if (block.type === 'component') {
							block.props.configuration[field.key] = event.currentTarget.value;
							onchange();
						}
					}}
				/>
			{:else}<Input
					type={field.type === 'number' ? 'number' : 'text'}
					value={String(block.props.configuration[field.key] ?? '')}
					oninput={(event) => {
						if (block.type === 'component') {
							block.props.configuration[field.key] =
								field.type === 'number'
									? event.currentTarget.valueAsNumber
									: event.currentTarget.value;
							onchange();
						}
					}}
				/>{/if}
		</label>{/each}
{/if}
