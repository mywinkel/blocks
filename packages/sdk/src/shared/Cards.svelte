<script lang="ts">
	import type { BlockViewProps } from '../contract';
	import { createClasses } from '../appearance.svelte';
	let { block, appearance }: BlockViewProps = $props();
	const cx = createClasses(() => appearance);
	const settings = $derived('cards' in block.props ? block.props : null);
	const columns = ['', 'sm:grid-cols-1', 'sm:grid-cols-2', 'sm:grid-cols-3', 'sm:grid-cols-4'];
</script>

{#if settings}
	{#if settings.heading}<h2 class={cx('cards.heading', 'mb-6 text-3xl font-medium text-balance')}>
			{settings.heading}
		</h2>{/if}
	<div
		class={cx(
			'cards.grid',
			`grid gap-8 ${settings.layout === 'list' ? 'grid-cols-1' : columns[settings.columns]}`
		)}
	>
		{#each settings.cards as card (card.id)}<article class={cx('cards.item', 'min-w-0')}>
				{#if settings.showImages && card.image}<img
						class={cx('cards.image', 'h-auto max-w-full object-cover')}
						src={card.image}
						alt={card.alt}
						loading="lazy"
					/>{/if}
				<h3 class={cx('cards.title', 'my-3 text-lg font-medium')}>
					{#if card.href}<a
							class={cx(
								'cards.link',
								'underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4'
							)}
							href={card.href}>{card.title}</a
						>{:else}{card.title}{/if}
				</h3>
				{#if settings.showDescriptions && card.text}<p
						class={cx('cards.description', 'max-w-prose leading-relaxed')}
					>
						{card.text}
					</p>{/if}
			</article>{:else}<p class={cx('cards.empty', 'text-sm text-muted-foreground')}>
				No items to display yet.
			</p>{/each}
	</div>
{/if}
