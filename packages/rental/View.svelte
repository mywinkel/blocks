<script lang="ts">
	import { connectSelection } from '@mywinkel/block-sdk/shared/selection.svelte';
	import type { Catalogue } from '@mywinkel/block-sdk/public/storefront/contracts';
	import type { AppearanceInput } from '@mywinkel/block-sdk/appearance';
	import { createClasses } from '@mywinkel/block-sdk/appearance.svelte';
	import CheckoutForm from '@mywinkel/block-sdk/shared/CheckoutForm.svelte';
	import ItemSelect from '@mywinkel/block-sdk/shared/ItemSelect.svelte';
	import Loading from '@mywinkel/block-sdk/shared/Loading.svelte';
	import { useCatalogue } from '@mywinkel/block-sdk/shared/catalogue.svelte';
	import { field, localTime, money } from '@mywinkel/block-sdk/shared/forms';
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
	let offerId = $state('');
	let start = $state(''),
		end = $state(''),
		quantity = $state(1);
	const cx = createClasses(() => appearance);
	const catalogue = useCatalogue(() => initial);
	const data = $derived(catalogue.data);
	const chosen = $derived(
		data?.items.find((item) => item.type === 'rental-offer' && item.id === offerId)
	);
	const units = $derived(
		start && end && chosen
			? Math.ceil(
					(Date.parse(localTime(end)) - Date.parse(localTime(start))) /
						(chosen.details.rateUnit === 'hour' ? 3600000 : 86400000)
				)
			: 0
	);
	const hireMinor = $derived(
		chosen && units > 0 && quantity > 0 ? chosen.priceMinor * units * quantity : 0
	);
	const offers = $derived(data?.items.filter((item) => item.type === 'rental-offer') ?? []);
	const rootClass = $derived(
		[cx('rental.root', namedPartDefaults['rental.root']), className, legacyClass]
			.filter(Boolean)
			.join(' ')
	);
	const fieldClass = $derived(cx('rental.field', namedPartDefaults['rental.field']));
	const controlClass = $derived(cx('rental.control', namedPartDefaults['rental.control']));
	const fieldsClass = $derived(cx('rental.fields', namedPartDefaults['rental.fields']));
	const noteClass = $derived(cx('rental.note', namedPartDefaults['rental.note']));
	connectSelection(
		() => data,
		'rental-offer',
		(id) => (offerId = id)
	);
</script>

{#if !data}
	<div class={rootClass}>
		<Loading error={catalogue.error} />
	</div>
{:else if !offers.length}
	<p
		class={`${cx('rental.empty', namedPartDefaults['rental.empty'])} ${className} ${legacyClass}`.trim()}
	>
		No equipment is available to reserve right now.
	</p>
{:else}
	<CheckoutForm
		className={rootClass}
		{termsUrl}
		label="Reserve equipment"
		purchase={(form) => {
			if (!start || !end || Date.parse(localTime(end)) <= Date.parse(localTime(start)))
				throw new Error('Return must be after collection.');
			const offer = offers.find((item) => item.id === field(form, 'offerId'))!;
			return {
				kind: 'rental',
				offerId: offer.id,
				start: localTime(field(form, 'start')),
				end: localTime(field(form, 'end')),
				quantity: Number(field(form, 'quantity')),
				expectedRateMinor: offer.priceMinor,
				expectedDepositMinor: Number(offer.details.depositMinor),
				expectedRateUnit: offer.details.rateUnit as 'hour' | 'day'
			};
		}}
	>
		{#snippet summary()}{#if chosen}<div
					class={cx('rental.summary', 'grid gap-2 border-t border-border pt-5')}
				>
					<p>{chosen.name} · {money(chosen.priceMinor)} per started {chosen.details.rateUnit}</p>
					{#if units > 0}<p>
							{quantity} × {units} started {chosen.details.rateUnit}{units === 1 ? '' : 's'} · Hire {money(
								hireMinor
							)}
						</p>
						<p>
							Total including security deposit {money(
								hireMinor + Number(chosen.details.depositMinor)
							)}
						</p>{/if}
					<p>Deposit due now {money(Number(chosen.details.depositMinor))}</p>
					{#if units > 0}<p>Hire balance after deposit {money(hireMinor)}</p>{/if}
				</div>{/if}{/snippet}
		<ItemSelect
			items={offers.map((offer) => ({
				...offer,
				name: `${offer.name} · per started ${offer.details.rateUnit} · ${money(Number(offer.details.depositMinor))} deposit`
			}))}
			name="offerId"
			bind:value={offerId}
			label="Equipment"
			class={fieldClass}
		/>

		<div class={fieldsClass}>
			<label class={fieldClass}>
				Collect
				<input
					class={controlClass}
					type="datetime-local"
					name="start"
					bind:value={start}
					required
				/>
			</label>
			<label class={fieldClass}>
				Return
				<input
					class={controlClass}
					type="datetime-local"
					name="end"
					bind:value={end}
					min={start || undefined}
					required
				/>
			</label>
		</div>

		<label class={fieldClass}>
			Quantity
			<input
				class={controlClass}
				type="number"
				name="quantity"
				min="1"
				max="1000"
				step="1"
				bind:value={quantity}
				required
			/>
		</label>

		<p class={noteClass}>
			Times are in South African Standard Time. Availability and the security deposit are checked
			before confirmation.
		</p>
	</CheckoutForm>
{/if}
