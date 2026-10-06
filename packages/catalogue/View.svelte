<script lang="ts">
	import { onMount, tick } from 'svelte';
	import type { z } from 'zod';
	import type { BlockViewProps } from '@mywinkel/block-sdk/contract';
	import type { CatalogueItem } from '@mywinkel/block-sdk/public/storefront/contracts';
	import { createClasses } from '@mywinkel/block-sdk/appearance.svelte';
	import { money } from '@mywinkel/block-sdk/shared/forms';
	import { addToCart, writeSelection } from '@mywinkel/block-sdk/shared/selection';
	import { definition } from './definition';
	import { namedPartDefaults as parts } from './parts';
	let { block, data, appearance }: BlockViewProps = $props();
	const cx = createClasses(() => appearance);
	const p = $derived(block.props as z.infer<typeof definition.schema>);
	let search = $state('');
	let category = $state('');
	let sort = $state('');
	let shown = $state(0);
	let hydrated = $state(false);
	let detail = $state<CatalogueItem>();
	let quantity = $state(1);
	let dialog = $state<HTMLDialogElement>();
	let notice = $state('');
	let now = $state(0);
	const items = $derived(data.catalogue?.items.filter((item) => item.type === p.source) ?? []);
	const categories = $derived([...new Set(items.map((item) => group(item)).filter(Boolean))]);
	function group(item: CatalogueItem) {
		return String(item.details.category || (item.type === 'classes' ? item.name : ''));
	}
	const filtered = $derived(
		items
			.filter(
				(item) =>
					(!p.upcomingOnly ||
						item.type !== 'classes' ||
						Date.parse(String(item.details.start)) > now) &&
					(!category || group(item) === category) &&
					`${item.name} ${item.description}`
						.toLowerCase()
						.includes((search || p.search).toLowerCase())
			)
			.sort((a, b) => {
				const order = sort || p.sort;
				if (order === 'start')
					return Date.parse(String(a.details.start)) - Date.parse(String(b.details.start));
				return order.startsWith('price')
					? (a.priceMinor - b.priceMinor) * (order === 'price-desc' ? -1 : 1)
					: a.name.localeCompare(b.name) * (order === 'name-desc' ? -1 : 1);
			})
	);
	const visible = $derived(filtered.slice(0, shown || p.limit));
	const action = $derived(
		p.action === 'auto' ? (p.source === 'products' ? 'cart' : 'select') : p.action
	);
	function image(item: CatalogueItem) {
		return p.cards.find((card) => card.id === item.id);
	}
	onMount(() => {
		hydrated = true;
		now = Date.now();
		const query = new URLSearchParams(location.search);
		search = query.get('search')?.slice(0, 200) ?? '';
		const group = query.get('category') ?? '';
		if (categories.includes(group)) category = group;
	});
	function choose(item: CatalogueItem, qty = 1) {
		if (action === 'cart') {
			addToCart(data.catalogue?.tenantId ?? '', item.id, qty);
			notice = `${item.name} added to your bag.`;
		} else {
			writeSelection(data.catalogue?.tenantId ?? '', p.source, item.id);
			notice = `${item.name} selected.`;
			if (p.actionHref) location.href = p.actionHref;
		}
	}
	async function open(item: CatalogueItem) {
		detail = item;
		quantity = 1;
		await tick();
		dialog?.showModal();
	}
	const columns = $derived(
		p.columns === 1
			? 'grid-cols-1'
			: p.columns === 2
				? 'grid-cols-1 sm:grid-cols-2'
				: p.columns === 4
					? 'grid-cols-2 lg:grid-cols-4'
					: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
	);
</script>

<section
	class={cx('catalogue.root', parts['catalogue.root'])}
	aria-label={p.heading || 'Catalogue'}
>
	{#if p.heading}<h2 class={cx('cards.heading', parts['cards.heading'])}>{p.heading}</h2>{/if}
	{#if p.showControls}<div class={cx('catalogue.controls', parts['catalogue.controls'])}>
			<label class={cx('catalogue.field', parts['catalogue.field'])}
				>Search {p.source === 'products' ? 'goods' : 'the catalogue'}<input
					class={cx('catalogue.control', parts['catalogue.control'])}
					type="search"
					bind:value={search}
					disabled={!hydrated}
				/></label
			>
			{#if categories.length}<label class={cx('catalogue.field', parts['catalogue.field'])}
					>{p.source === 'classes' ? 'Class type' : 'Category'}<select
						class={cx('catalogue.control', parts['catalogue.control'])}
						bind:value={category}
						disabled={!hydrated}
						><option value=""
							>{p.source === 'classes' ? 'All class types' : 'All categories'}</option
						>{#each categories as name}<option value={name}>{name}</option>{/each}</select
					></label
				>{/if}
			<label class={cx('catalogue.field', parts['catalogue.field'])}
				>Sort<select
					class={cx('catalogue.control', parts['catalogue.control'])}
					value={sort || p.sort}
					onchange={(e) => (sort = e.currentTarget.value)}
					disabled={!hydrated}
					>{#if p.source === 'classes'}<option value="start">Soonest first</option>{/if}<option
						value="name">Name A–Z</option
					><option value="name-desc">Name Z–A</option><option value="price"
						>Price low to high</option
					><option value="price-desc">Price high to low</option></select
				></label
			>
		</div>{/if}
	{#if notice}<p role="status" class={cx('catalogue.status', parts['catalogue.status'])}>
			{notice}{#if action === 'cart'}
				<a href={p.actionHref}>View bag</a>{/if}
		</p>{/if}
	<ul
		class={`${cx('catalogue.list', parts['catalogue.list'])} ${p.layout === 'list' ? 'grid-cols-1' : columns}`}
	>
		{#each visible as item (item.id)}<li
				class={`${cx('catalogue.item', parts['catalogue.item'])} ${p.layout === 'list' && p.showImages && image(item)?.image ? 'grid gap-6 md:grid-cols-[12rem_1fr]' : ''}`}
			>
				{#if p.showImages && image(item)?.image}<button
						type="button"
						class={cx('catalogue.image-button', parts['catalogue.image-button'])}
						onclick={() => open(item)}
						disabled={!hydrated}
						aria-label={`View ${item.name}`}
						><img
							class={cx('catalogue.image', parts['catalogue.image'])}
							src={image(item)?.image}
							alt={image(item)?.alt || item.name}
							width="600"
							height="600"
							loading="lazy"
						/></button
					>{/if}
				<div class={cx('catalogue.body', parts['catalogue.body'])}>
					{#if item.details.category}<p class={cx('catalogue.meta', parts['catalogue.meta'])}>
							{item.details.category}
						</p>{/if}
					<h3 class={cx('catalogue.title', parts['catalogue.title'])}>
						<button type="button" onclick={() => open(item)} disabled={!hydrated}
							>{item.name}</button
						>
					</h3>
					{#if p.showDescriptions && item.description}<p
							class={cx('catalogue.description', parts['catalogue.description'])}
						>
							{item.description}
						</p>{/if}
					{#if p.showPrices}<p class={cx('catalogue.price', parts['catalogue.price'])}>
							{money(item.priceMinor)}{item.type === 'rental-offer'
								? ` / ${item.details.rateUnit}`
								: ''}
						</p>{/if}
					{#if item.details.start}<p class={cx('catalogue.meta', parts['catalogue.meta'])}>
							{new Date(String(item.details.start)).toLocaleString('en-ZA', {
								timeZone: 'Africa/Johannesburg',
								dateStyle: 'medium',
								timeStyle: 'short'
							})}
						</p>{/if}
					{#if item.details.duration}<p class={cx('catalogue.meta', parts['catalogue.meta'])}>
							{item.details.duration} minutes
						</p>{/if}
					{#if item.details.depositMinor}<p class={cx('catalogue.meta', parts['catalogue.meta'])}>
							Security deposit {money(Number(item.details.depositMinor))}
						</p>{/if}
					{#if item.details.dietary}<p class={cx('catalogue.meta', parts['catalogue.meta'])}>
							{item.details.dietary}
						</p>{/if}
					{#if item.details.credits}<p class={cx('catalogue.meta', parts['catalogue.meta'])}>
							{item.details.credits} credits · {item.details.durationDays} days
						</p>{/if}
					<div class={cx('catalogue.actions', parts['catalogue.actions'])}>
						<button
							class={cx('catalogue.detail-link', parts['catalogue.detail-link'])}
							type="button"
							disabled={!hydrated}
							onclick={() => open(item)}>Details</button
						>{#if action !== 'none'}<button
								class={cx('catalogue.action', parts['catalogue.action'])}
								type="button"
								disabled={!hydrated}
								onclick={() => choose(item)}
								>{action === 'cart'
									? 'Add to bag'
									: action === 'enquiry'
										? 'Ask about this'
										: 'Choose'}</button
							>{/if}
					</div>
				</div>
			</li>{/each}
	</ul>
	{#if !filtered.length}<p class={cx('cards.empty', parts['cards.empty'])}>
			No items match your search. <button
				type="button"
				onclick={() => {
					search = '';
					category = '';
				}}>Clear filters</button
			>
		</p>{/if}
	{#if visible.length < filtered.length}<button
			class={cx('catalogue.more', parts['catalogue.more'])}
			type="button"
			onclick={() => (shown = visible.length + p.limit)}
			>Show more ({filtered.length - visible.length} remaining)</button
		>{/if}
	{#if detail}<dialog
			bind:this={dialog}
			aria-label={detail.name}
			class={cx('catalogue.dialog', parts['catalogue.dialog'])}
			onclose={() => (detail = undefined)}
		>
			<button
				class={cx('catalogue.close', parts['catalogue.close'])}
				type="button"
				onclick={() => dialog?.close()}
				aria-label="Close product details">Close ×</button
			>
			<div class={cx('catalogue.detail', parts['catalogue.detail'])}>
				{#if image(detail)?.image}<img
						class={cx('catalogue.detail-image', parts['catalogue.detail-image'])}
						src={image(detail)?.image}
						alt={image(detail)?.alt || detail.name}
						width="600"
						height="600"
					/>{/if}
				<div>
					<h2 class={cx('catalogue.detail-heading', parts['catalogue.detail-heading'])}>
						{detail.name}
					</h2>
					<p class={cx('catalogue.price', parts['catalogue.price'])}>{money(detail.priceMinor)}</p>
					<p class={cx('catalogue.description', parts['catalogue.description'])}>
						{detail.description}
					</p>
					{#if detail.details.variant}<p>
							Size: {detail.details.variant}
						</p>{/if}{#if detail.details.duration}<p>
							{detail.details.duration} minutes
						</p>{/if}{#if detail.details.dietary}<p>{detail.details.dietary}</p>{/if}
					{#if action === 'cart'}<label class={cx('catalogue.field', parts['catalogue.field'])}
							>Quantity<input
								class={cx('catalogue.control', parts['catalogue.control'])}
								type="number"
								min="1"
								max="1000"
								step="1"
								bind:value={quantity}
							/></label
						>{/if}
					{#if action !== 'none'}<button
							class={cx('catalogue.action', parts['catalogue.action'])}
							type="button"
							disabled={!Number.isInteger(quantity) || quantity < 1 || quantity > 1000}
							onclick={() => {
								if (detail) choose(detail, quantity);
								dialog?.close();
							}}>{action === 'cart' ? 'Add to bag' : 'Choose this option'}</button
						>{/if}
				</div>
			</div>
		</dialog>{/if}
</section>
