<script lang="ts">
	import type { BlockViewProps } from '@mywinkel/block-sdk/contract';
	import { createClasses } from '@mywinkel/block-sdk/appearance.svelte';
	let { block, appearance }: BlockViewProps = $props();
	const cx = createClasses(() => appearance);
	const settings = $derived(block.type === 'image' ? block.props : null);
</script>

{#if settings}
	{#if settings.heading}<h2 class={cx('image.heading', 'mb-6 text-3xl font-medium')}>
			{settings.heading}
		</h2>{/if}
	{#if settings.src}<figure class={cx('image.figure', 'min-w-0')}>
			{#snippet picture()}<img
					class={cx('image.image', 'h-auto max-w-full object-cover')}
					src={settings.src}
					alt={settings.alt}
					loading="lazy"
				/>{/snippet}
			{#if settings.href}<a
					class={cx('image.link', 'block focus-visible:outline-2 focus-visible:outline-offset-4')}
					href={settings.href}>{@render picture()}</a
				>{:else}{@render picture()}{/if}
			{#if settings.caption && settings.showCaption}<figcaption
					class={cx('image.caption', 'mt-3 text-sm text-muted-foreground')}
				>
					{settings.caption}
				</figcaption>{/if}
		</figure>{/if}
{/if}
