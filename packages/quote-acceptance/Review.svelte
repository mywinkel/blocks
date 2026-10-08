<script lang="ts">
	import { createClasses } from '@mywinkel/block-sdk/appearance.svelte';
	import type { CustomerAccount } from '@mywinkel/block-sdk/public/storefront/customer-account';
	import CheckoutForm from '@mywinkel/block-sdk/shared/CheckoutForm.svelte';
	import { money } from '@mywinkel/block-sdk/shared/forms';
	import { localPartDefaults as partDefaults } from './parts';

	export type QuoteReviewProps = {
		quote: CustomerAccount['history'][number];
		customer: CustomerAccount['customer'];
		className?: string;
	};
	let { quote, customer, className = '' }: QuoteReviewProps = $props();
	const cx = createClasses();
	let reviewing = $state(false);
	const expired = $derived(
		(quote.quote?.validUntil ?? '') < new Date(Date.now() + 7200000).toISOString().slice(0, 10)
	);
</script>

<section
	class={`${cx('quote.root', partDefaults.root)} ${className}`}
	aria-label={`Quote: ${quote.name}`}
>
	<p class={cx('quote.description', partDefaults.description)}>{quote.quote?.description}</p>
	<p class={cx('quote.summary', partDefaults.summary)}>
		Total {money(quote.amountMinor)} · Valid until {quote.quote?.validUntil}
	</p>
	{#if quote.status === 'sent'}
		{#if expired}
			<p class={cx('quote.expired', partDefaults.expired)}>
				This quote has expired. Ask the business for an updated quote.
			</p>
		{:else if reviewing}
			<div class={cx('quote.checkout', partDefaults.checkout)}>
				<CheckoutForm
					paymentHold={false}
					{customer}
					label="Accept quote"
					purchase={() => ({
						kind: 'accept-quote',
						quoteId: quote.id,
						expectedVersion: quote.version,
						expectedPriceMinor: quote.amountMinor
					})}
				>
					<p class={cx('quote.summary', partDefaults.summary)}>
						Accept the scope of work and total above. Payment will open separately after your
						acceptance is saved.
					</p>
				</CheckoutForm>
			</div>
		{:else}
			<button
				class={cx('quote.reviewButton', partDefaults.reviewButton)}
				type="button"
				onclick={() => (reviewing = true)}
			>
				Review and accept quote
			</button>
		{/if}
	{:else}
		<p class={cx('quote.summary', partDefaults.summary)} role="status">
			{quote.status === 'accepted'
				? 'Quote accepted.'
				: `Quote status: ${quote.status.replaceAll('_', ' ')}.`}
		</p>
		<a class={cx('quote.link', partDefaults.link)} href="/account">
			View your account and payment
		</a>
	{/if}
</section>
