<script lang="ts">
	import { createClasses } from '@mywinkel/block-sdk/appearance.svelte';
	import type { AppearanceInput } from '@mywinkel/block-sdk/appearance';
	import type { CustomerAccount } from '@mywinkel/block-sdk/public/storefront/customer-account';
	import { storefrontClient } from '@mywinkel/block-sdk/public/storefront/client';
	import QuoteReview from './Review.svelte';
	import { localPartDefaults as partDefaults } from './parts';

	export type QuoteAcceptanceProps = {
		quoteId: string;
		className?: string;
		appearance?: AppearanceInput;
	};
	let { quoteId, className = '', appearance }: QuoteAcceptanceProps = $props();
	const cx = createClasses(() => appearance);
	let account = $state<CustomerAccount>();
	let error = $state('');
	let requestGeneration = 0;

	$effect(() => {
		const generation = ++requestGeneration;
		account = undefined;
		error = '';
		storefrontClient.customerAccount({ recordId: quoteId }).then(
			(value) => {
				if (generation === requestGeneration) account = value;
			},
			(failure: unknown) => {
				if (generation === requestGeneration)
					error = failure instanceof Error ? failure.message : 'Unable to load your quote.';
			}
		);
		return () => {
			++requestGeneration;
		};
	});

	const quote = $derived(
		account?.history.find((row) => row.id === quoteId && row.type === 'quotes')
	);
</script>

{#if error}
	<p class={cx('quote.expired', partDefaults.expired)} role="alert">
		{error}
		<a class={cx('quote.link', partDefaults.link)} href="/account">Open your customer account</a>
	</p>
{:else if !account}
	<p class={cx('quote.summary', partDefaults.summary)} role="status">Loading your quote…</p>
{:else if !quote}
	<p class={cx('quote.summary', partDefaults.summary)}>
		This quote is not available in your account. <a
			class={cx('quote.link', partDefaults.link)}
			href="/account">View your history</a
		>
	</p>
{:else}
	<QuoteReview {quote} customer={account.customer} {className} />
{/if}
