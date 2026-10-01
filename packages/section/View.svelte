<script lang="ts">
	import type { BlockViewProps } from '@mywinkel/block-sdk/contract';
	import { createClasses } from '@mywinkel/block-sdk/appearance.svelte';
	let { block, data, editable = false, appearance, children }: BlockViewProps = $props();
	const cx = createClasses(() => appearance);
	const settings = $derived(block.type === 'section' ? block.props : null);
</script>

{#if settings}<svelte:element
		this={settings.role}
		class={cx('section.root', 'grid gap-8')}
		data-cms-region={editable ? block.id : undefined}
		aria-label={data.preview && settings.role !== 'section'
			? `Website preview ${settings.role}`
			: undefined}
	>
		{#if settings.showBranding}<a
				class={cx(
					'section.brand',
					'flex items-center gap-3 text-lg font-bold no-underline focus-visible:outline-2 focus-visible:outline-offset-4'
				)}
				href="/"
			>
				{#if data.catalogue.branding?.logo}<img
						class={cx('section.logo', 'h-10 w-auto max-w-40')}
						src={data.catalogue.branding.logo}
						alt=""
					/>{/if}{data.catalogue.name}</a
			>{/if}
		{#if settings.heading}<h2 class={cx('block.heading', 'mb-6 text-3xl font-medium')}>
				{settings.heading}
			</h2>{/if}
		{@render children?.()}
	</svelte:element>{/if}
