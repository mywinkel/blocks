<script lang="ts">
	import RichText from '@mywinkel/block-sdk/shared/RichText.svelte';
	import type { BlockViewProps } from '@mywinkel/block-sdk/contract';
	import { createClasses } from '@mywinkel/block-sdk/appearance.svelte';
	let { block, editable = false, appearance }: BlockViewProps = $props();
	const cx = createClasses(() => appearance);
</script>

{#if block.props.heading}<h2
		class={cx('content.heading', 'mb-6 text-3xl font-medium text-balance')}
	>
		{block.props.heading}
	</h2>{/if}
<RichText html={'html' in block.props ? block.props.html : ''} preview={editable} />
