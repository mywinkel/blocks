<script lang="ts">
	import {
		cartQuantities,
		writeSelection,
		subscribeSelection
	} from '@mywinkel/block-sdk/shared/selection';
	import { onMount } from 'svelte';
	import type { Catalogue, CatalogueItem } from '@mywinkel/block-sdk/public/storefront/contracts';
	import type { ShippingQuoteInput } from '@mywinkel/block-sdk/public/storefront/shipping-contracts';
	import { createClasses } from '@mywinkel/block-sdk/appearance.svelte';
	import type { AppearanceInput } from '@mywinkel/block-sdk/appearance';
	import CheckoutForm from '@mywinkel/block-sdk/shared/CheckoutForm.svelte';
	import CourierOptions from '@mywinkel/block-sdk/shared/CourierOptions.svelte';
	import DeliveryFields from '@mywinkel/block-sdk/shared/DeliveryFields.svelte';
	import Loading from '@mywinkel/block-sdk/shared/Loading.svelte';
	import { useCatalogue } from '@mywinkel/block-sdk/shared/catalogue.svelte';
	import { delivery, field, money } from '@mywinkel/block-sdk/shared/forms';
	import { namedPartDefaults } from './parts';
	import { sanitizeQuantity } from './quantity';

	type Props = {
		initial?: Catalogue;
		layout?: 'full' | 'summary';
		class?: string;
		className?: string;
		termsUrl?: string;
		appearance?: AppearanceInput;
	};

	let {
		initial,
		layout = 'full',
		class: className = '',
		className: legacyClass = '',
		termsUrl,
		appearance
	}: Props = $props();

	const cx = createClasses(() => appearance);
	const catalogue = useCatalogue(() => initial);
	let hydrated = $state(false);
	let checkoutLocked = $state(false);
	let submitted = $state(false);
	let quantities = $state<Record<string, number>>({});
	let search = $state('');
	let page = $state(0);
	let extraClass = $derived(`${className} ${legacyClass}`.trim());
	let data = $derived(catalogue.data);
	let error = $derived(catalogue.error);
	let products = $derived(data?.items.filter((item) => item.type === 'products') ?? []);
	let selected = $derived(products.filter((item) => (quantities[item.id] ?? 0) > 0));
	let matches = $derived(
		products.filter((item) =>
			`${item.name} ${item.description}`
				.toLocaleLowerCase()
				.includes(search.trim().toLocaleLowerCase())
		)
	);
	let pageCount = $derived(Math.max(1, Math.ceil(matches.length / 8)));
	let currentPage = $derived(Math.min(page, pageCount - 1));
	let visible = $derived(matches.slice(currentPage * 8, currentPage * 8 + 8));
	let digitalOnly = $derived(
		selected.length > 0 && selected.every((item) => item.details.deliveryKind === 'digital')
	);
	let count = $derived(selected.reduce((total, item) => total + (quantities[item.id] ?? 0), 0));
	let total = $derived(
		selected.reduce((sum, item) => sum + item.priceMinor * (quantities[item.id] ?? 0), 0)
	);
	let cartKey = $derived(
		JSON.stringify(selected.map((item) => [item.id, quantities[item.id], item.priceMinor]))
	);
	const orderId = $props.id();

	onMount(() => {
		hydrated = true;
	});

	$effect(() => {
		if (!hydrated || !data) return;
		return subscribeSelection(data.tenantId, 'cart', (value) => {
			if (!checkoutLocked && !submitted) quantities = cartQuantities(value);
		});
	});
	function saveCart() {
		if (data) writeSelection(data.tenantId, 'cart', quantities);
	}
	function updateSearch(event: Event) {
		search = (event.currentTarget as HTMLInputElement).value;
		page = 0;
	}

	function updateQuantity(item: CatalogueItem, event: Event) {
		quantities[item.id] = sanitizeQuantity((event.currentTarget as HTMLInputElement).value);
		saveCart();
	}

	function checkoutInput(form: FormData): ShippingQuoteInput {
		const current = data;
		if (!current) throw new Error('The catalogue is still loading. Try again shortly.');
		return {
			kind: 'cart',
			lines: selected.map((item) => ({
				productId: item.id,
				quantity: quantities[item.id],
				expectedPriceMinor: item.priceMinor
			})),
			// The server derives digital fulfilment from current product records.
			delivery: digitalOnly
				? {
						method: 'collection',
						locationId: current.locations[0]?.id ?? '',
						address: '',
						area: ''
					}
				: delivery(form),
			discountCode: field(form, 'discountCode')
		};
	}

	function clearSearch() {
		search = '';
		page = 0;
	}

	function removeItem(item: CatalogueItem) {
		quantities[item.id] = 0;
		saveCart();
	}
</script>

<div class={`${cx('cart.root', namedPartDefaults['cart.root'])} ${extraClass}`.trim()}>
	{#if !data}
		<div class={cx('cart.loading', namedPartDefaults['cart.loading'])}>
			<Loading {error} />
		</div>
	{:else if !products.length}
		<p class={cx('cart.empty-products', namedPartDefaults['cart.empty-products'])}>
			There are no products available right now. Please check back soon.
		</p>
	{:else}
		{#if selected.length > 0}
			<div class={cx('cart.summary', namedPartDefaults['cart.summary'])}>
				<p
					class={cx('cart.summary-status', namedPartDefaults['cart.summary-status'])}
					role="status"
				>
					{count}
					{count === 1 ? 'item' : 'items'} · {money(total)}
				</p>
				<a
					class={cx('cart.summary-link', namedPartDefaults['cart.summary-link'])}
					href={`#${orderId}`}
				>
					View your order
				</a>
			</div>
		{/if}

		{#if layout === 'full'}
			<label class={cx('cart.search-field', namedPartDefaults['cart.search-field'])}>
				Search products
				<input
					class={cx('cart.search-control', namedPartDefaults['cart.search-control'])}
					type="search"
					disabled={!hydrated || checkoutLocked || submitted}
					value={search}
					oninput={updateSearch}
				/>
			</label>

			{#if !matches.length}
				<div class={cx('cart.no-results', namedPartDefaults['cart.no-results'])} role="status">
					<p>No products match “{search}”. Your selected items are kept.</p>
					<button
						class={cx('cart.clear-search', namedPartDefaults['cart.clear-search'])}
						type="button"
						onclick={clearSearch}
					>
						Clear search
					</button>
				</div>
			{/if}

			<ul class={cx('cart.list', namedPartDefaults['cart.list'])}>
				{#each visible as item (item.id)}
					<li class={cx('cart.item', namedPartDefaults['cart.item'])}>
						<div class={cx('cart.item-body', namedPartDefaults['cart.item-body'])}>
							<h3 class={cx('cart.item-title', namedPartDefaults['cart.item-title'])}>
								{item.name}
							</h3>
							<p class={cx('cart.item-description', namedPartDefaults['cart.item-description'])}>
								{item.description}
							</p>
							<p class={cx('cart.item-price', namedPartDefaults['cart.item-price'])}>
								{money(item.priceMinor)}
							</p>
						</div>
						<label class={cx('cart.quantity-field', namedPartDefaults['cart.quantity-field'])}>
							Quantity for {item.name}
							<input
								class={cx('cart.quantity-input', namedPartDefaults['cart.quantity-input'])}
								type="number"
								disabled={!hydrated || checkoutLocked || submitted}
								min="0"
								max="1000"
								step="1"
								value={quantities[item.id] ?? 0}
								oninput={(event) => updateQuantity(item, event)}
							/>
						</label>
					</li>
				{/each}
			</ul>

			{#if pageCount > 1}
				<nav
					class={cx('cart.pagination', namedPartDefaults['cart.pagination'])}
					aria-label="Product pages"
				>
					<button
						class={cx('cart.pagination-button', namedPartDefaults['cart.pagination-button'])}
						type="button"
						disabled={!hydrated || currentPage === 0}
						onclick={() => (page = currentPage - 1)}
					>
						Previous products
					</button>
					<p
						class={cx('cart.pagination-status', namedPartDefaults['cart.pagination-status'])}
						role="status"
					>
						Page {currentPage + 1} of {pageCount} · {matches.length} products
					</p>
					<button
						class={cx('cart.pagination-button', namedPartDefaults['cart.pagination-button'])}
						type="button"
						disabled={!hydrated || currentPage + 1 === pageCount}
						onclick={() => (page = currentPage + 1)}
					>
						Next products
					</button>
				</nav>
			{/if}
		{/if}
		{#if selected.length}
			<CheckoutForm
				{termsUrl}
				label="Place order"
				purchase={checkoutInput}
				onLockChange={(locked) => (checkoutLocked = locked)}
				afterSubmit={() => {
					submitted = true;
					if (data) writeSelection(data.tenantId, 'cart', {});
				}}
			>
				{#snippet summary()}
					<p class={cx('cart.total', namedPartDefaults['cart.total'])}>Items {money(total)}</p>
				{/snippet}
				<h2
					class={cx('cart.order-heading', namedPartDefaults['cart.order-heading'])}
					id={orderId}
					tabindex="-1"
				>
					Your order
				</h2>
				<ul
					class={cx('cart.selected-list', namedPartDefaults['cart.selected-list'])}
					aria-label="Selected products"
				>
					{#each selected as item (item.id)}
						<li class={cx('cart.selected-item', namedPartDefaults['cart.selected-item'])}>
							<div
								class={cx('cart.selected-item-body', namedPartDefaults['cart.selected-item-body'])}
							>
								<p
									class={cx(
										'cart.selected-item-name',
										namedPartDefaults['cart.selected-item-name']
									)}
								>
									{item.name} × {quantities[item.id]}
								</p>
								<p
									class={cx(
										'cart.selected-item-total',
										namedPartDefaults['cart.selected-item-total']
									)}
								>
									{money(item.priceMinor * quantities[item.id])}
								</p>
							</div>
							<label class={cx('cart.quantity-field', namedPartDefaults['cart.quantity-field'])}>
								Quantity for {item.name}
								<input
									class={cx('cart.quantity-input', namedPartDefaults['cart.quantity-input'])}
									type="number"
									min="1"
									max="1000"
									step="1"
									disabled={checkoutLocked || submitted}
									value={quantities[item.id]}
									oninput={(event) => updateQuantity(item, event)}
								/>
							</label>
							<button
								class={cx('cart.remove', namedPartDefaults['cart.remove'])}
								type="button"
								disabled={checkoutLocked || submitted}
								aria-label={`Remove ${item.name} from order`}
								onclick={() => removeItem(item)}
							>
								Remove
							</button>
						</li>
					{/each}
				</ul>
				{#if digitalOnly}
					<p class={cx('cart.digital-notice', namedPartDefaults['cart.digital-notice'])}>
						Your PDFs will be available to download after payment.
					</p>
				{:else}
					<DeliveryFields catalogue={data}>
						{#snippet courier()}
							<CourierOptions input={checkoutInput} {cartKey} />
						{/snippet}
					</DeliveryFields>
				{/if}
				<label class={cx('cart.discount-field', namedPartDefaults['cart.discount-field'])}>
					Promotion code
					<input
						class={cx('cart.discount-control', namedPartDefaults['cart.discount-control'])}
						name="discountCode"
						autocomplete="off"
					/>
				</label>
			</CheckoutForm>
		{:else}
			<p class={cx('cart.empty', namedPartDefaults['cart.empty'])} role="status">
				Your bag is empty. Add goods from the shop to start an order.
			</p>
		{/if}
	{/if}
</div>
