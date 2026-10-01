<script lang="ts">
	import { Input, Textarea, NativeSelect, Checkbox } from './ui';
	import type { BlockEditorProps, EditorField } from '../contract';
	let {
		block,
		fields,
		onchange
	}: Pick<BlockEditorProps, 'block' | 'onchange'> & { fields: readonly EditorField[] } = $props();
	const values = $derived(block.props as Record<string, unknown>);
	function set(key: string, value: unknown) {
		values[key] = value;
		onchange();
	}
</script>

<div class="space-y-4">
	{#each fields as field (field.key)}
		{#if field.type === 'checkbox'}<label class="flex items-center gap-2 text-sm"
				><Checkbox
					checked={!!values[field.key]}
					onCheckedChange={(value) => set(field.key, value)}
				/>{field.label}</label
			>
		{:else}<label class="block space-y-1 text-sm"
				>{field.label}
				{#if field.type === 'textarea'}<Textarea
						class="min-h-32"
						value={String(values[field.key] ?? '')}
						oninput={(event) => set(field.key, event.currentTarget.value)}
					/>
				{:else if field.type === 'select'}<NativeSelect
						class="w-full"
						value={String(values[field.key] ?? '')}
						onchange={(event) => set(field.key, event.currentTarget.value)}
						>{#each field.options ?? [] as option (option.value)}<option value={option.value}
								>{option.label}</option
							>{/each}</NativeSelect
					>
				{:else if field.type === 'number'}<Input
						type="number"
						min={field.min}
						max={field.max}
						value={Number(values[field.key] ?? 0)}
						oninput={(event) => set(field.key, event.currentTarget.valueAsNumber)}
					/>
				{:else}<Input
						value={String(values[field.key] ?? '')}
						oninput={(event) => set(field.key, event.currentTarget.value)}
					/>{/if}
			</label>{/if}
	{/each}
</div>
