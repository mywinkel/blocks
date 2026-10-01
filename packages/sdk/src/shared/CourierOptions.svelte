<script lang="ts">
	import { createClasses } from '../appearance.svelte';
	import { namedPartDefaults } from './parts';
	import { failureMessage, money } from './forms';
	import { storefrontClient } from '@mywinkel/block-sdk/public/storefront/client';
	import type {
		ShippingQuote,
		ShippingQuoteInput
	} from '@mywinkel/block-sdk/public/storefront/shipping-contracts';

	type Props = {
		input: (form: FormData) => ShippingQuoteInput;
		cartKey: string;
		class?: string;
		className?: string;
	};

	let { input, cartKey, class: className = '', className: legacyClass = '' }: Props = $props();
	const cx = createClasses();
	let root = $state<HTMLFieldSetElement | undefined>();
	let quote = $state<ShippingQuote | undefined>();
	let selected = $state('');
	let pending = $state(false);
	let error = $state('');
	let generation = 0;
	let extraClass = $derived(`${className} ${legacyClass}`.trim());
	let selectedOption = $derived(quote?.options.find((option) => option.id === selected));

	function reset() {
		quote = undefined;
		selected = '';
		error = '';
		pending = false;
	}

	$effect(() => {
		const key = cartKey;
		void key;
		generation++;
		reset();
		const form = root?.form;
		if (!form) return;
		const changed = (event: Event) => {
			const target = event.target;
			if (!(
				target instanceof HTMLInputElement ||
				target instanceof HTMLSelectElement ||
				target instanceof HTMLTextAreaElement
			))
				return;
			if (
				![
					'address',
					'suburb',
					'city',
					'province',
					'postcode',
					'locationId',
					'discountCode'
				].includes(target.name)
			)
				return;
			generation++;
			reset();
		};
		form.addEventListener('input', changed);
		form.addEventListener('change', changed);
		return () => {
			generation++;
			form.removeEventListener('input', changed);
			form.removeEventListener('change', changed);
		};
	});

	async function request() {
		const fieldset = root;
		const form = fieldset?.form;
		if (!form || !fieldset) return;
		for (const field of fieldset.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
			'input:not([type=hidden]),textarea'
		))
			if (field.required && !field.reportValidity()) return;

		const started = ++generation;
		pending = true;
		error = '';
		quote = undefined;
		selected = '';
		try {
			const result = await storefrontClient.shippingQuotes(input(new FormData(form)));
			if (started === generation) quote = result;
		} catch (failure) {
			if (started === generation)
				error = failureMessage(
					failure,
					'Delivery options could not be checked. Try again shortly.'
				);
		} finally {
			if (started === generation) pending = false;
		}
	}

	function selectOption(event: Event) {
		selected = (event.currentTarget as HTMLSelectElement).value;
	}
</script>

<fieldset
	bind:this={root}
	class={`${cx('courier.root', namedPartDefaults['courier.root'])} ${extraClass}`.trim()}
>
	<legend class={cx('courier.legend', namedPartDefaults['courier.legend'])}>Courier delivery</legend
	>
	<label class={cx('checkout.field', namedPartDefaults['checkout.field'])}>
		Street address
		<textarea
			class={cx('checkout.control', namedPartDefaults['checkout.control'])}
			name="address"
			autocomplete="street-address"
			maxlength="1000"
			required></textarea>
	</label>
	<div class={cx('courier.field-group', namedPartDefaults['courier.field-group'])}>
		<label class={cx('checkout.field', namedPartDefaults['checkout.field'])}>
			Suburb
			<input
				class={cx('checkout.control', namedPartDefaults['checkout.control'])}
				name="suburb"
				autocomplete="address-level3"
				maxlength="160"
				required
			/>
		</label>
		<label class={cx('checkout.field', namedPartDefaults['checkout.field'])}>
			City
			<input
				class={cx('checkout.control', namedPartDefaults['checkout.control'])}
				name="city"
				autocomplete="address-level2"
				maxlength="160"
				required
			/>
		</label>
	</div>
	<div class={cx('courier.field-group', namedPartDefaults['courier.field-group'])}>
		<label class={cx('checkout.field', namedPartDefaults['checkout.field'])}>
			Province
			<input
				class={cx('checkout.control', namedPartDefaults['checkout.control'])}
				name="province"
				autocomplete="address-level1"
				maxlength="160"
				required
			/>
		</label>
		<label class={cx('checkout.field', namedPartDefaults['checkout.field'])}>
			Postcode
			<input
				class={cx('checkout.control', namedPartDefaults['checkout.control'])}
				name="postcode"
				autocomplete="postal-code"
				inputmode="numeric"
				pattern={'[0-9]{4}'}
				required
			/>
		</label>
	</div>
	<p class={cx('courier.note', namedPartDefaults['courier.note'])}>
		Courier delivery is available within South Africa. Rates depend on your cart and full address.
	</p>
	<button
		class={cx('courier.button', namedPartDefaults['courier.button'])}
		type="button"
		disabled={pending}
		onclick={() => void request()}
	>
		{pending ? 'Checking delivery options…' : 'Get delivery options'}
	</button>
	{#if error}
		<p class={cx('courier.error', namedPartDefaults['courier.error'])} role="alert">{error}</p>
	{/if}
	{#if quote}
		<input type="hidden" name="shippingQuoteId" value={quote.id} />
		{#if quote.simulated}
			<p class={cx('courier.notice', namedPartDefaults['courier.notice'])} role="status">
				These are simulated delivery options. No courier was contacted.
			</p>
		{/if}
		{#if quote.options.length}
			<label class={cx('checkout.field', namedPartDefaults['checkout.field'])}>
				Delivery option
				<select
					class={cx('courier.option', namedPartDefaults['courier.option'])}
					name="shippingOptionId"
					required
					value={selected}
					onchange={selectOption}
				>
					<option
						class={cx('checkout.option', namedPartDefaults['checkout.option'])}
						value=""
						disabled
					>
						Choose a delivery option
					</option>
					{#each quote.options as option (option.id)}
						<option
							class={cx('checkout.option', namedPartDefaults['checkout.option'])}
							value={option.id}
						>
							{option.name} · {money(option.amountMinor)}
						</option>
					{/each}
				</select>
			</label>
		{:else}
			<p class={cx('courier.description', namedPartDefaults['courier.description'])} role="status">
				No courier options are available for this cart and address. Check the details or choose
				collection.
			</p>
		{/if}
		{#if selectedOption}
			<p class={cx('courier.description', namedPartDefaults['courier.description'])}>
				{selectedOption.description}
			</p>
			<p class={cx('courier.total', namedPartDefaults['courier.total'])}>
				Total with delivery {money(quote.itemsTotalMinor + selectedOption.amountMinor)}
			</p>
		{/if}
		<p class={cx('courier.note', namedPartDefaults['courier.note'])}>
			Options are checked again when you place the order. Changing your cart or address requires
			fresh options.
		</p>
	{/if}
</fieldset>
