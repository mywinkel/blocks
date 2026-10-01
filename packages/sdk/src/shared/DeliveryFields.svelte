<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Catalogue } from '@mywinkel/block-sdk/public/storefront/contracts';
	import { createClasses } from '../appearance.svelte';
	import { money } from './forms';
	import { namedPartDefaults } from './parts';

	type DeliveryMethod = 'collection' | 'local-delivery' | 'courier';
	type Props = {
		catalogue: Catalogue;
		collectionOnly?: boolean;
		courier?: Snippet;
		class?: string;
		className?: string;
	};

	let {
		catalogue,
		collectionOnly = false,
		courier,
		class: className = '',
		className: legacyClass = ''
	}: Props = $props();
	const cx = createClasses();
	let method = $state<DeliveryMethod>('collection');
	let extraClass = $derived(`${className} ${legacyClass}`.trim());

	function changeMethod(event: Event) {
		method = (event.currentTarget as HTMLSelectElement).value as DeliveryMethod;
	}
</script>

<fieldset class={`${cx('delivery.root', namedPartDefaults['delivery.root'])} ${extraClass}`.trim()}>
	<legend class={cx('delivery.legend', namedPartDefaults['delivery.legend'])}>
		Collection or delivery
	</legend>
	<label class={cx('checkout.field', namedPartDefaults['checkout.field'])}>
		How would you like to receive it?
		<select
			class={cx('checkout.control', namedPartDefaults['checkout.control'])}
			name="deliveryMethod"
			value={method}
			onchange={changeMethod}
		>
			<option
				class={cx('checkout.option', namedPartDefaults['checkout.option'])}
				value="collection"
			>
				Collect from the business
			</option>
			{#if courier && catalogue.delivery.courierEnabled && !collectionOnly}
				<option class={cx('checkout.option', namedPartDefaults['checkout.option'])} value="courier">
					Courier delivery
				</option>
			{/if}
			{#if catalogue.delivery.localEnabled && !collectionOnly}
				<option
					class={cx('checkout.option', namedPartDefaults['checkout.option'])}
					value="local-delivery"
				>
					Local delivery · {money(catalogue.delivery.feeMinor)}
				</option>
			{/if}
		</select>
	</label>
	<label class={cx('checkout.field', namedPartDefaults['checkout.field'])}>
		{method === 'collection' ? 'Collection location' : 'Dispatch location'}
		<select
			class={cx('checkout.control', namedPartDefaults['checkout.control'])}
			name="locationId"
			required
		>
			{#each catalogue.locations.filter((location) => method !== 'collection' || location.pickup) as location (location.id)}
				<option
					class={cx('checkout.option', namedPartDefaults['checkout.option'])}
					value={location.id}
				>
					{location.name}
				</option>
			{/each}
		</select>
	</label>
	{#if method === 'courier'}
		{@render courier?.()}
	{:else if method === 'local-delivery'}
		<label class={cx('checkout.field', namedPartDefaults['checkout.field'])}>
			Delivery address
			<textarea
				class={cx('checkout.control', namedPartDefaults['checkout.control'])}
				name="address"
				required
				autocomplete="street-address"></textarea>
		</label>
		<label class={cx('checkout.field', namedPartDefaults['checkout.field'])}>
			Area
			<select
				class={cx('checkout.control', namedPartDefaults['checkout.control'])}
				name="area"
				required
			>
				{#each catalogue.delivery.areas as area (area)}
					<option class={cx('checkout.option', namedPartDefaults['checkout.option'])} value={area}>
						{area}
					</option>
				{/each}
			</select>
		</label>
		<label class={cx('checkout.field', namedPartDefaults['checkout.field'])}>
			Delivery time
			<input
				class={cx('checkout.control', namedPartDefaults['checkout.control'])}
				type="datetime-local"
				name="deliveryAt"
				required
			/>
		</label>
		<p class={cx('delivery.note', namedPartDefaults['delivery.note'])}>
			Times are in South African Standard Time.
		</p>
	{/if}
</fieldset>
