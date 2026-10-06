<script lang="ts">
	import { createClasses } from '@mywinkel/block-sdk/appearance.svelte';
	import type { AppearanceInput } from '@mywinkel/block-sdk/appearance';
	import type { CustomerAccount } from '@mywinkel/block-sdk/public/storefront/customer-account';
	import { storefrontClient } from '@mywinkel/block-sdk/public/storefront/client';
	import QuoteReview from './Review.svelte';
	import { localPartDefaults as partDefaults } from './parts';

	export type QuoteAcceptanceProps = {
		quoteId?: string;
		className?: string;
		appearance?: AppearanceInput;
	};
	let { quoteId = '', className = '', appearance }: QuoteAcceptanceProps = $props();
	const cx = createClasses(() => appearance);
	let account = $state<CustomerAccount>();
	let error = $state('');
	let selectedId = $state('');
	let loadingMore = $state(false);
	let requestGeneration = 0;

	$effect(() => {
		const generation = ++requestGeneration;
		account = undefined;
		error = '';
		storefrontClient.customerAccount(quoteId ? { recordId: quoteId } : {}).then(
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
		account?.history.find((row) => row.id === (quoteId || selectedId) && row.type === 'quotes')
	);
	async function more() {
		if (!account?.nextHistoryCursor) return;
		loadingMore = true;
		error = '';
		try {
			const next = await storefrontClient.customerAccount({
				historyCursor: account.nextHistoryCursor
			});
			account = { ...next, history: [...account.history, ...next.history] };
		} catch {
			error = 'Your quote history could not be loaded. Open your account to try again.';
		} finally {
			loadingMore = false;
		}
	}
</script>

{#if error}
	<p class={cx('quote.expired', partDefaults.expired)} role="alert">
		{error}
		<a class={cx('quote.link', partDefaults.link)} href="/account">Open your customer account</a>
	</p>
{:else if !account}
	<p class={cx('quote.summary', partDefaults.summary)} role="status">Loading your quote…</p>
{:else if !quote && !quoteId}
	<div class={cx('quote.chooser', 'grid gap-4')}>
		<label class={cx('checkout.field', 'grid gap-2 text-sm')}
			>Choose a quote from your account<select
				class={cx('checkout.control', 'min-h-11 border border-border bg-background px-3 py-2')}
				bind:value={selectedId}
				><option value="">Choose a quote</option
				>{#each account.history.filter((row) => row.type === 'quotes') as row}<option value={row.id}
						>{row.name} · {row.status}</option
					>{/each}</select
			></label
		>
		{#if !account.history.some((row) => row.type === 'quotes')}<p>
				You have no quotes on this history page. We’ll prepare one after reviewing your brief.
			</p>{/if}
		{#if account.nextHistoryCursor}<button
				class={cx('checkout.secondary', 'min-h-11 border border-border px-4 py-2')}
				type="button"
				disabled={loadingMore}
				onclick={() => void more()}>{loadingMore ? 'Loading…' : 'Look for older quotes'}</button
			>{/if}
		<a class={cx('quote.link', partDefaults.link)} href="/account">Open your customer account</a>
	</div>
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
