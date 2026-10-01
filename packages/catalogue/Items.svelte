<script lang="ts">
	import Price from '@mywinkel/block-sdk/shared/Price.svelte';
	import type { CatalogueItem } from '@mywinkel/block-sdk/public/storefront/contracts';
	import type { AppearanceInput } from '@mywinkel/block-sdk/appearance';
	import { createClasses } from '@mywinkel/block-sdk/appearance.svelte';
	let {
		items,
		itemHref = '/shop',
		appearance
	}: { items: CatalogueItem[]; itemHref?: string; appearance?: AppearanceInput } = $props();
	const cx = createClasses(() => appearance);
</script>

<ul class={cx('catalogue.list', 'grid list-none gap-8 p-0 sm:grid-cols-2 lg:grid-cols-3')}>
	{#each items as item (item.id)}<li class={cx('catalogue.item', 'min-w-0')}>
			<a
				class={cx(
					'catalogue.link',
					'block space-y-3 focus-visible:outline-2 focus-visible:outline-offset-4'
				)}
				href={`${itemHref}?item=${encodeURIComponent(item.id)}`}
			>
				<h3 class={cx('catalogue.title', 'text-lg font-medium')}>{item.name}</h3>
				{#if item.description}<p
						class={cx('catalogue.description', 'max-w-prose text-sm text-muted-foreground')}
					>
						{item.description}
					</p>{/if}
				<Price minor={item.priceMinor} class="font-medium" />
			</a>
		</li>{/each}
</ul>
