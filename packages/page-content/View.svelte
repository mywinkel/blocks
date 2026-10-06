<script lang="ts">
	import type { BlockViewProps } from '@mywinkel/block-sdk/contract';
	import { createClasses } from '@mywinkel/block-sdk/appearance.svelte';
	let { block, data, appearance, children }: BlockViewProps = $props();
	const cx = createClasses(() => appearance);
	const editable = $derived(!!data.preview && data.editingDocumentId === data.page.id);
</script>

<main
	id="content"
	class={cx('page.root', 'grid gap-8')}
	aria-label={data.preview ? 'Page preview' : undefined}
	data-cms-region={editable ? 'main' : undefined}
>
	{#if !('showHeading' in block.props) || block.props.showHeading}
		<h1 class={cx('page.heading', 'text-4xl font-semibold text-balance')}>
			{block.props.heading || data.page.title || data.page.name}
		</h1>
	{/if}
	{@render children?.()}
	{#if editable && !data.page.blocks.length}<p
			class={cx('page.empty', 'text-sm text-muted-foreground')}
		>
			Add a block to your page.
		</p>{/if}
</main>
