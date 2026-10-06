<script lang="ts">
	import Cards from '@mywinkel/block-sdk/shared/Cards.svelte';
	import type { BlockViewProps } from '@mywinkel/block-sdk/contract';
	import { createClasses } from '@mywinkel/block-sdk/appearance.svelte';
	import { namedPartDefaults as parts } from './parts';
	let settings: BlockViewProps = $props();
	const cx = createClasses(() => settings.appearance);
	const p = $derived(settings.block.type === 'gallery' ? settings.block.props : undefined);
	let index = $state(0);
	const current = $derived(p?.cards[Math.min(index, (p?.cards.length ?? 1) - 1)]);
	let startX = 0;
	function change(step: number) {
		const count = p?.cards.length ?? 0;
		if (count) index = (index + step + count) % count;
	}
</script>

{#if p?.presentation === 'slideshow'}
	<section
		class={cx('gallery.root', parts['gallery.root'])}
		aria-roledescription="carousel"
		aria-label={p.heading || 'Gallery'}
	>
		{#if p.heading}<h2 class={cx('cards.heading', parts['cards.heading'])}>{p.heading}</h2>{/if}
		{#if current}<div
				role="group"
				aria-roledescription="slide"
				class={cx('gallery.slide', parts['gallery.slide'])}
				ontouchstart={(e) => (startX = e.changedTouches[0].clientX)}
				ontouchend={(e) => {
					const delta = e.changedTouches[0].clientX - startX;
					if (Math.abs(delta) > 50) change(delta < 0 ? 1 : -1);
				}}
			>
				{#if current.image}<img
						class={cx('gallery.image', parts['gallery.image'])}
						src={current.image}
						alt={current.alt}
						width="1200"
						height="900"
						loading="lazy"
					/>{/if}
				<h3 class={cx('cards.title', parts['cards.title'])}>{current.title}</h3>
				{#if p.showDescriptions}<p class={cx('cards.description', parts['cards.description'])}>
						{current.text}
					</p>{/if}{#if current.href}<a
						href={current.href}
						class={cx('cards.link', parts['cards.link'])}>Explore {current.title}</a
					>{/if}
			</div>
			<div class={cx('gallery.controls', parts['gallery.controls'])}>
				<button
					type="button"
					class={cx('gallery.button', parts['gallery.button'])}
					onclick={() => change(-1)}
					disabled={p.cards.length < 2}
					aria-label="Previous slide">← Previous</button
				>
				<p role="status" aria-live="polite" class={cx('gallery.status', parts['gallery.status'])}>
					{index + 1} / {p.cards.length}
				</p>
				<button
					type="button"
					class={cx('gallery.button', parts['gallery.button'])}
					onclick={() => change(1)}
					disabled={p.cards.length < 2}
					aria-label="Next slide">Next →</button
				>
			</div>
		{:else}<p class={cx('cards.empty', parts['cards.empty'])}>There are no images yet.</p>{/if}
	</section>
{:else}<Cards {...settings} />{/if}
