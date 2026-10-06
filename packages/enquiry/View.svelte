<script lang="ts">
	import { onMount, tick } from 'svelte';
	import type { Catalogue } from '@mywinkel/block-sdk/public/storefront/contracts';
	import { connectSelection } from '@mywinkel/block-sdk/shared/selection.svelte';
	import type { AppearanceInput } from '@mywinkel/block-sdk/appearance';
	import { createClasses } from '@mywinkel/block-sdk/appearance.svelte';
	import CheckoutForm from '@mywinkel/block-sdk/shared/CheckoutForm.svelte';
	import { field } from '@mywinkel/block-sdk/shared/forms';
	import { namedPartDefaults } from './parts';
	import { namedPartDefaults as sharedParts } from '@mywinkel/block-sdk/shared/parts';

	type Props = {
		initial?: Catalogue;
		subjectLabel?: string;
		detailsLabel?: string;
		detailsPlaceholder?: string;
		submitLabel?: string;
		staged?: boolean;
		serviceFirst?: boolean;
		source?: 'none' | 'services';
		class?: string;
		className?: string;
		termsUrl?: string;
		heading?: string;
		appearance?: AppearanceInput;
	};

	let {
		initial,
		subjectLabel = 'Subject',
		detailsLabel = 'What can we help with?',
		detailsPlaceholder = '',
		submitLabel = 'Send enquiry',
		staged = false,
		serviceFirst = false,
		source = 'none',
		class: className = '',
		className: legacyClass = '',
		termsUrl = '/terms',
		heading = 'Tell us what you need',
		appearance
	}: Props = $props();
	let serviceId = $state('');
	const services = $derived(initial?.items.filter((item) => item.type === 'services') ?? []);
	const startWithService = $derived(serviceFirst && source === 'services' && services.length > 0);
	let serviceChosen = $state(false);
	let hydrated = $state(false);
	let formRegion = $state<HTMLDivElement>();
	let pickerRegion = $state<HTMLDivElement>();
	onMount(() => {
		hydrated = true;
	});
	async function continueWithService() {
		serviceChosen = true;
		await tick();
		formRegion?.querySelector<HTMLInputElement>('input[name=title]')?.focus();
	}
	async function changeService() {
		serviceChosen = false;
		await tick();
		pickerRegion?.querySelector<HTMLSelectElement>('select')?.focus();
	}
	connectSelection(
		() => initial,
		'services',
		(id) => (serviceId = id)
	);
	const cx = createClasses(() => appearance);
	const rootClass = $derived(
		[cx('enquiry.root', namedPartDefaults['enquiry.root']), className, legacyClass]
			.filter(Boolean)
			.join(' ')
	);
	const headingClass = $derived(cx('enquiry.heading', namedPartDefaults['enquiry.heading']));
	const fieldClass = $derived(cx('enquiry.field', namedPartDefaults['enquiry.field']));
	const controlClass = $derived(cx('enquiry.control', namedPartDefaults['enquiry.control']));
	const messageClass = $derived(cx('enquiry.message', namedPartDefaults['enquiry.message']));
</script>

<div bind:this={pickerRegion} hidden={!startWithService || serviceChosen} class={rootClass}>
	<h2 class={headingClass}>{heading}</h2>
	<label class={fieldClass}
		>Service<select class={controlClass} bind:value={serviceId} disabled={!hydrated}>
			<option value="">Help me choose</option>
			{#each services as item}<option value={item.id}>{item.name}</option>{/each}
		</select></label
	>
	<button
		class={cx('checkout.submit', sharedParts['checkout.submit'])}
		type="button"
		disabled={!hydrated}
		onclick={() => void continueWithService()}>Tell us more</button
	>
</div>
<!-- Keep the form mounted so changing the service preserves the entire brief and contact draft. -->
<div bind:this={formRegion} hidden={startWithService && !serviceChosen}>
	<CheckoutForm
		className={rootClass}
		paymentHold={false}
		{termsUrl}
		label={submitLabel}
		{staged}
		purchase={(form) => ({
			kind: 'enquiry',
			title: `${services.find((item) => item.id === serviceId)?.name ? services.find((item) => item.id === serviceId)?.name + ' — ' : ''}${field(form, 'title')}`,
			details: field(form, 'details')
		})}
	>
		<h2 class={headingClass}>{heading}</h2>
		{#if startWithService}<p>
				{services.find((item) => item.id === serviceId)?.name || 'Help me choose'}
				<button
					class={cx('checkout.secondary', sharedParts['checkout.secondary'])}
					type="button"
					onclick={() => void changeService()}>Change service</button
				>
			</p>
		{:else if source === 'services' && services.length}<label class={fieldClass}
				>Service<select class={controlClass} bind:value={serviceId}
					><option value="">Help me choose</option>{#each services as item}<option value={item.id}
							>{item.name}</option
						>{/each}</select
				></label
			>{/if}
		<label class={fieldClass}>
			{subjectLabel}
			<input class={controlClass} name="title" required maxlength="200" />
		</label>
		<label class={fieldClass}>
			{detailsLabel}
			<textarea
				class={`${controlClass} ${messageClass}`}
				name="details"
				required
				maxlength="10000"
				placeholder={detailsPlaceholder}></textarea>
		</label>
	</CheckoutForm>
</div>
