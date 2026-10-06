<script lang="ts">
	import { connectSelection } from '@mywinkel/block-sdk/shared/selection.svelte';
	import type { Catalogue } from '@mywinkel/block-sdk/public/storefront/contracts';
	import type { AppearanceInput } from '@mywinkel/block-sdk/appearance';
	import { createClasses } from '@mywinkel/block-sdk/appearance.svelte';
	import CheckoutForm from '@mywinkel/block-sdk/shared/CheckoutForm.svelte';
	import ItemSelect from '@mywinkel/block-sdk/shared/ItemSelect.svelte';
	import Loading from '@mywinkel/block-sdk/shared/Loading.svelte';
	import { useCatalogue } from '@mywinkel/block-sdk/shared/catalogue.svelte';
	import { field, money } from '@mywinkel/block-sdk/shared/forms';
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
	const cx = createClasses(() => appearance);
	const catalogue = useCatalogue(() => initial);
	const data = $derived(catalogue.data);
	const offers = $derived(data?.items.filter((item) => item.type === 'membership-offer') ?? []);
	const rootClass = $derived(
		[cx('membership.root', namedPartDefaults['membership.root']), className, legacyClass]
			.filter(Boolean)
			.join(' ')
	);
	const fieldClass = $derived(cx('membership.field', namedPartDefaults['membership.field']));
	const noteClass = $derived(cx('membership.note', namedPartDefaults['membership.note']));
	connectSelection(
		() => data,
		'membership-offer',
		(id) => (offerId = id)
	);
</script>

{#if !data}
	<div class={rootClass}>
		<Loading error={catalogue.error} />
	</div>
{:else if !offers.length}
	<p
		class={`${cx('membership.empty', namedPartDefaults['membership.empty'])} ${className} ${legacyClass}`.trim()}
	>
		There are no packs or memberships available right now.
	</p>
{:else}
	<CheckoutForm
		className={rootClass}
		{termsUrl}
		label="Choose this membership"
		purchase={(form) => {
			const offer = offers.find((item) => item.id === field(form, 'offerId'))!;
			return { kind: 'membership', offerId: offer.id, expectedPriceMinor: offer.priceMinor };
		}}
	>
		{#snippet summary()}{#if offers.find((item) => item.id === offerId)}{@const chosen =
					offers.find((item) => item.id === offerId)!}
				<p>{chosen.name} · {money(chosen.priceMinor)}</p>{/if}{/snippet}
		<ItemSelect
			items={offers.map((item) => ({
				...item,
				name: `${item.name} · ${item.details.durationDays} days`
			}))}
			name="offerId"
			bind:value={offerId}
			label="Pack or membership"
			class={fieldClass}
		/>
		<p class={noteClass}>Credits become available after payment confirmation.</p>
	</CheckoutForm>
{/if}
