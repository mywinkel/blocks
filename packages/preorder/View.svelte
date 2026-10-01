<script lang="ts">
	import type { Catalogue } from '@mywinkel/block-sdk/public/storefront/contracts';
	import type { AppearanceInput } from '@mywinkel/block-sdk/appearance';
	import { createClasses } from '@mywinkel/block-sdk/appearance.svelte';
	import CheckoutForm from '@mywinkel/block-sdk/shared/CheckoutForm.svelte';
	import DeliveryFields from '@mywinkel/block-sdk/shared/DeliveryFields.svelte';
	import Loading from '@mywinkel/block-sdk/shared/Loading.svelte';
	import { useCatalogue } from '@mywinkel/block-sdk/shared/catalogue.svelte';
	import { delivery, field, localTime, money } from '@mywinkel/block-sdk/shared/forms';
	import { namedPartDefaults } from './parts';

	type Props = {
		initial?: Catalogue;
		class?: string;
		className?: string;
		termsUrl?: string;
		appearance?: AppearanceInput;
	};

	let {
		initial,
		class: className = '',
		className: legacyClass = '',
		termsUrl = '/terms',
		appearance
	}: Props = $props();
	const cx = createClasses(() => appearance);
	const catalogue = useCatalogue(() => initial);
	let menuId = $state('');

	const data = $derived(catalogue.data);
	const menus = $derived(data?.items.filter((item) => item.type === 'menus') ?? []);
	const selected = $derived(menus.find((item) => item.id === menuId));
	const extras = $derived(
		selected?.details.extrasEnabled
			? String(selected.details.modifiers ?? '')
					.split(',')
					.map((value) => value.trim())
					.filter(Boolean)
			: []
	);
	const rootClass = $derived(
		[cx('preorder.root', namedPartDefaults['preorder.root']), className, legacyClass]
			.filter(Boolean)
			.join(' ')
	);
	const fieldClass = $derived(cx('preorder.field', namedPartDefaults['preorder.field']));
	const controlClass = $derived(cx('preorder.control', namedPartDefaults['preorder.control']));
	const fieldsClass = $derived(cx('preorder.fields', namedPartDefaults['preorder.fields']));
	const dietaryClass = $derived(cx('preorder.dietary', namedPartDefaults['preorder.dietary']));
	const extrasClass = $derived(cx('preorder.extras', namedPartDefaults['preorder.extras']));
	const legendClass = $derived(cx('preorder.legend', namedPartDefaults['preorder.legend']));
	const extraClass = $derived(cx('preorder.extra', namedPartDefaults['preorder.extra']));
	const extraControlClass = $derived(
		cx('preorder.extra-control', namedPartDefaults['preorder.extra-control'])
	);
	const noteClass = $derived(cx('preorder.note', namedPartDefaults['preorder.note']));
</script>

{#if !data}
	<div class={rootClass}>
		<Loading error={catalogue.error} />
	</div>
{:else if !menus.length}
	<p
		class={`${cx('preorder.empty', namedPartDefaults['preorder.empty'])} ${className} ${legacyClass}`.trim()}
	>
		Our next menu is not available yet. Please check back soon.
	</p>
{:else}
	<CheckoutForm
		className={rootClass}
		{termsUrl}
		label="Place pre-order"
		purchase={(form) => {
			const menu = menus.find((item) => item.id === field(form, 'menuId'))!;
			return {
				kind: 'preorder',
				menuId: menu.id,
				quantity: Number(field(form, 'quantity')),
				collectionAt: localTime(field(form, 'collectionAt')),
				extras: form.getAll('extras').map(String),
				expectedExtraPriceMinor: Number(menu.details.extraPriceMinor ?? 0),
				delivery: delivery(form),
				expectedPriceMinor: menu.priceMinor
			};
		}}
	>
		<label class={fieldClass}>
			Menu item
			<select
				class={controlClass}
				name="menuId"
				required
				value={menuId}
				onchange={(event) => (menuId = event.currentTarget.value)}
			>
				<option value="" disabled>Choose a menu item</option>
				{#each menus as menu (menu.id)}
					<option value={menu.id}>{menu.name} · {money(menu.priceMinor)}</option>
				{/each}
			</select>
		</label>

		{#if selected?.details.dietary}
			<p class={dietaryClass}>{String(selected.details.dietary)}</p>
		{/if}

		{#if extras.length}
			{#key menuId}
				<fieldset class={extrasClass}>
					<legend class={legendClass}>
						Optional extras · {money(Number(selected?.details.extraPriceMinor ?? 0))} each per portion
					</legend>
					{#each extras as extra (extra)}
						<label class={extraClass}>
							<input class={extraControlClass} type="checkbox" name="extras" value={extra} />
							<span>{extra}</span>
						</label>
					{/each}
				</fieldset>
			{/key}
		{/if}

		<div class={fieldsClass}>
			<label class={fieldClass}>
				Portions
				<input
					class={controlClass}
					type="number"
					name="quantity"
					value="1"
					required
					min="1"
					max="1000"
					step="1"
				/>
			</label>
			<label class={fieldClass}>
				Collection or delivery time
				<input class={controlClass} type="datetime-local" name="collectionAt" required />
			</label>
		</div>

		<DeliveryFields catalogue={data} />
		<p class={noteClass}>
			Times are in South African Standard Time. We check the ordering cutoff and available portions
			before accepting your request.
		</p>
	</CheckoutForm>
{/if}
