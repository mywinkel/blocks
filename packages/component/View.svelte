<script lang="ts">
	import type { BlockViewProps } from '@mywinkel/block-sdk/contract';
	import { createClasses } from '@mywinkel/block-sdk/appearance.svelte';
	let { block, appearance, children }: BlockViewProps = $props();
	const cx = createClasses(() => appearance);
</script>

<section class={cx('component.root', 'min-w-0')}>
	{#if block.props.heading}<h2 class={cx('component.heading', 'mb-6 text-3xl font-medium')}>
			{block.props.heading}
		</h2>{/if}
	{@render children?.()}
</section>
