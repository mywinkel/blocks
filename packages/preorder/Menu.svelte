<script lang="ts">
	import { onMount } from 'svelte';
	import type { Catalogue } from '@mywinkel/block-sdk/public/storefront/contracts';
	import type { AppearanceInput } from '@mywinkel/block-sdk/appearance';
	import type { z } from 'zod';
	import { cardSchema } from '@mywinkel/block-sdk/fields';
	import { createClasses } from '@mywinkel/block-sdk/appearance.svelte';
	import { connectSelection } from '@mywinkel/block-sdk/shared/selection.svelte';
	import { useCatalogue } from '@mywinkel/block-sdk/shared/catalogue.svelte';
	import CheckoutForm from '@mywinkel/block-sdk/shared/CheckoutForm.svelte';
	import DeliveryFields from '@mywinkel/block-sdk/shared/DeliveryFields.svelte';
	import Loading from '@mywinkel/block-sdk/shared/Loading.svelte';
	import { delivery, field, localTime, money } from '@mywinkel/block-sdk/shared/forms';
	import { namedPartDefaults as parts } from './parts';
	type Props = {
		initial?: Catalogue;
		termsUrl?: string;
		appearance?: AppearanceInput;
		presentation?: 'menu' | 'boxes';
		cards?: z.infer<typeof cardSchema>[];
	};
	let { initial, termsUrl, appearance, presentation = 'menu', cards = [] }: Props = $props();
	const cx = createClasses(() => appearance),
		catalogue = useCatalogue(() => initial);
	const data = $derived(catalogue.data),
		menus = $derived(data?.items.filter((item) => item.type === 'menus') ?? []);
	let quantities = $state<Record<string, number>>({});
	let extras = $state<Record<string, string[]>>({});
	let basket = $state<Record<string, { quantity: number; extras: string[] }>>({});
	// Preserve native disclosure state when portion and basket changes rerender a meal.
	let expanded = $state<Record<string, boolean>>({});
	$effect(() => {
		for (const menu of menus)
			if (expanded[menu.id] === undefined) expanded[menu.id] = presentation === 'menu';
	});
	let message = $state('');
	let method = $state<'collection' | 'local-delivery' | 'courier'>('collection');
	let clock = $state(0);
	onMount(() => {
		clock = Date.now();
	});
	const selected = $derived(menus.filter((menu) => basket[menu.id]));
	const total = $derived(
		selected.reduce(
			(sum, menu) =>
				sum +
				(menu.priceMinor +
					basket[menu.id].extras.length * Number(menu.details.extraPriceMinor ?? 0)) *
					basket[menu.id].quantity,
			0
		)
	);
	const cutoff = $derived(
		Math.max(0, ...selected.map((menu) => Number(menu.details.cutoffHours ?? 0)))
	);
	const orderTotal = $derived(
		total + (method === 'local-delivery' ? (data?.delivery.feeMinor ?? 0) : 0)
	);
	const earliest = $derived(
		clock ? new Date(clock + ((cutoff || 12) + 2) * 3600000).toISOString().slice(0, 16) : undefined
	);
	function add(id: string) {
		const quantity = quantities[id] ?? 1;
		if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) {
			message = 'Choose a whole number of portions between 1 and 1000.';
			return;
		}
		basket[id] = { quantity, extras: [...(extras[id] ?? [])] };
		message = 'Dish added to your order.';
	}
	function remove(id: string) {
		delete basket[id];
		message = 'Dish removed from your order.';
	}
	function options(id: string) {
		const menu = menus.find((menu) => menu.id === id);
		return menu?.details.extrasEnabled
			? String(menu.details.modifiers ?? '')
					.split(',')
					.map((value) => value.trim())
					.filter(Boolean)
			: [];
	}
	connectSelection(
		() => data,
		'menus',
		(id) => (expanded[id] = true)
	);
</script>

{#if !data}<Loading error={catalogue.error} />
{:else if !menus.length}<p class={cx('preorder.empty', parts['preorder.empty'])}>
		Our next menu is not available yet.
	</p>
{:else}
	<CheckoutForm
		{termsUrl}
		label="Place pre-order"
		purchase={(form) => {
			if (!selected.length) throw new Error('Add at least one dish to your order.');
			const items = selected.map((menu) => ({
				menuId: menu.id,
				quantity: basket[menu.id].quantity,
				extras: basket[menu.id].extras,
				expectedPriceMinor: menu.priceMinor,
				expectedExtraPriceMinor: Number(menu.details.extraPriceMinor ?? 0)
			}));
			return {
				kind: 'preorder',
				...items[0],
				items,
				collectionAt: localTime(field(form, 'collectionAt')),
				delivery: delivery(form)
			};
		}}
	>
		<div class={cx('preorder.menu', parts['preorder.menu'])}>
			{#each menus as menu (menu.id)}
				<details class={cx('preorder.meal', parts['preorder.meal'])} bind:open={expanded[menu.id]}>
					<summary class={cx('preorder.meal-summary', parts['preorder.meal-summary'])}
						><span
							><span class={cx('preorder.meal-title', parts['preorder.meal-title'])}
								>{menu.name}</span
							><span class={cx('preorder.meal-meta', parts['preorder.meal-meta'])}
								>{money(menu.priceMinor)} per portion · {menu.details.dietary ??
									'Ask about allergens'}</span
							></span
						><span aria-hidden="true">+</span></summary
					>
					<div class={cx('preorder.meal-body', parts['preorder.meal-body'])}>
						{#if cards.find((card) => card.id === menu.id)?.image}<img
								class={cx('preorder.meal-image', parts['preorder.meal-image'])}
								src={cards.find((card) => card.id === menu.id)?.image}
								alt={cards.find((card) => card.id === menu.id)?.alt || menu.name}
								width="600"
								height="450"
								loading="lazy"
							/>{/if}
						<div class={cx('preorder.meal-details', parts['preorder.meal-details'])}>
							{#if menu.description}<p>{menu.description}</p>{/if}
							<label class={cx('preorder.field', parts['preorder.field'])}
								>Portions of {menu.name}<input
									class={cx('preorder.control', parts['preorder.control'])}
									type="number"
									min="1"
									max="1000"
									step="1"
									value={quantities[menu.id] ?? 1}
									oninput={(event) => (quantities[menu.id] = Number(event.currentTarget.value))}
								/></label
							>
							{#if options(menu.id).length}<fieldset
									class={cx('preorder.extras', parts['preorder.extras'])}
								>
									<legend class={cx('preorder.legend', parts['preorder.legend'])}
										>Extras · {money(Number(menu.details.extraPriceMinor ?? 0))} each per portion</legend
									>{#each options(menu.id) as extra}<label
											class={cx('preorder.extra', parts['preorder.extra'])}
											><input
												class={cx('preorder.extra-control', parts['preorder.extra-control'])}
												type="checkbox"
												checked={(extras[menu.id] ?? []).includes(extra)}
												onchange={(event) =>
													(extras[menu.id] = event.currentTarget.checked
														? [...(extras[menu.id] ?? []), extra]
														: (extras[menu.id] ?? []).filter((value) => value !== extra))}
											/>{extra}</label
										>{/each}
								</fieldset>{/if}
							<button
								class={cx('preorder.add', parts['preorder.add'])}
								type="button"
								onclick={() => add(menu.id)}
								>{basket[menu.id] ? 'Update dish' : 'Add dish to order'}</button
							>
						</div>
					</div>
				</details>
			{/each}
		</div>
		<section class={cx('preorder.basket', parts['preorder.basket'])} aria-label="Your food order">
			<h2 class={cx('preorder.basket-heading', parts['preorder.basket-heading'])}>
				Your kitchen order
			</h2>
			{#if message}<p role="status">{message}</p>{/if}
			{#if !selected.length}<p>Add dishes above to start your order.</p>{/if}
			<ul class={cx('preorder.basket-list', parts['preorder.basket-list'])}>
				{#each selected as menu}<li
						class={cx('preorder.basket-line', parts['preorder.basket-line'])}
					>
						<div>
							<p>{menu.name} × {basket[menu.id].quantity}</p>
							{#if basket[menu.id].extras.length}<p
									class={cx('preorder.note', parts['preorder.note'])}
								>
									{basket[menu.id].extras.join(', ')}
								</p>{/if}
							<p>
								{money(
									(menu.priceMinor +
										basket[menu.id].extras.length * Number(menu.details.extraPriceMinor ?? 0)) *
										basket[menu.id].quantity
								)}
							</p>
						</div>
						<button
							type="button"
							class={cx('preorder.remove', parts['preorder.remove'])}
							aria-label={`Remove ${menu.name}`}
							onclick={() => remove(menu.id)}>Remove</button
						>
					</li>{/each}
			</ul>
			<p class={cx('preorder.total', parts['preorder.total'])}>Dishes {money(total)}</p>
			<p class={cx('preorder.note', parts['preorder.note'])}>
				Local delivery adds {money(data.delivery.feeMinor)} once per order. Collection is free. The final
				total is confirmed with your request.
			</p>
		</section>
		<label class={cx('preorder.field', parts['preorder.field'])}
			>Collection or delivery time<input
				class={cx('preorder.control', parts['preorder.control'])}
				type="datetime-local"
				name="collectionAt"
				min={earliest}
				required
			/></label
		>
		<DeliveryFields catalogue={data} bind:method />
		<p class={cx('preorder.note', parts['preorder.note'])}>
			Order at least {cutoff || 12} hours ahead. Times are in South African Standard Time. Availability,
			extras and delivery are checked before your order is accepted.
		</p>
		{#snippet summary()}<p>
				{method === 'local-delivery' ? 'Including delivery' : 'Collection total'}
				{money(orderTotal)} · {selected.reduce(
					(count, menu) => count + basket[menu.id].quantity,
					0
				)} portions
			</p>{/snippet}
	</CheckoutForm>
{/if}
