<script lang="ts">
	import type { z } from 'zod';
	import type { BlockViewProps } from '@mywinkel/block-sdk/contract';
	import { createClasses } from '@mywinkel/block-sdk/appearance.svelte';
	import { definition } from './definition';
	import { namedPartDefaults as parts } from './parts';
	let { block, appearance }: BlockViewProps = $props();
	const cx = createClasses(() => appearance);
	const p = $derived(block.props as z.infer<typeof definition.schema>);
</script>

<section
	class={`${cx('hero.root', parts['hero.root'])} ${p.layout === 'split' ? 'md:grid-cols-2' : ''}`}
>
	<div
		class={`${cx('hero.copy', parts['hero.copy'])} ${p.layout === 'split' && p.mediaSide === 'left' ? 'md:order-2' : ''}`}
	>
		{#if p.eyebrow}<p class={cx('hero.eyebrow', parts['hero.eyebrow'])}>{p.eyebrow}</p>{/if}
		{#if p.heading}<h1 class={cx('hero.heading', parts['hero.heading'])}>{p.heading}</h1>{/if}
		{#if p.text}<p class={cx('hero.text', parts['hero.text'])}>{p.text}</p>{/if}
		{#if p.primaryHref || p.secondaryHref}<div class={cx('hero.actions', parts['hero.actions'])}>
				{#if p.primaryHref && p.primaryLabel}<a
						class={cx('hero.primary', parts['hero.primary'])}
						href={p.primaryHref}>{p.primaryLabel}</a
					>{/if}
				{#if p.secondaryHref && p.secondaryLabel}<a
						class={cx('hero.secondary', parts['hero.secondary'])}
						href={p.secondaryHref}>{p.secondaryLabel}</a
					>{/if}
			</div>{/if}
	</div>
	{#if p.src}<figure class={cx('hero.figure', parts['hero.figure'])}>
			<img
				class={cx('hero.image', parts['hero.image'])}
				src={p.src}
				alt={p.alt}
				fetchpriority="high"
				width="1200"
				height="900"
			/>{#if p.caption}<figcaption class={cx('hero.caption', parts['hero.caption'])}>
					{p.caption}
				</figcaption>{/if}
		</figure>{/if}
</section>
