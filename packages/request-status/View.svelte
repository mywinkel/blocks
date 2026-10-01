<script lang="ts">
	import { createClasses } from '@mywinkel/block-sdk/appearance.svelte';
	import type { AppearanceInput } from '@mywinkel/block-sdk/appearance';
	import { refundStatusMessage } from '@mywinkel/block-sdk/public/features/finance/refund-status';
	import type { BalancePayment } from '@mywinkel/block-sdk/public/storefront/rental-balance';
	import { storefrontClient } from '@mywinkel/block-sdk/public/storefront/client';
	import type { Receipt } from '@mywinkel/block-sdk/public/storefront/contracts';
	import PaymentHold from '@mywinkel/block-sdk/shared/PaymentHold.svelte';
	import { money } from '@mywinkel/block-sdk/shared/forms';
	import { localPartDefaults as partDefaults } from './parts';

	export type RequestStatusProps = { id: string; className?: string; appearance?: AppearanceInput };
	let { id, className = '', appearance }: RequestStatusProps = $props();
	const cx = createClasses(() => appearance);
	let downloading = $state('');
	let receipt = $state<Receipt>();
	let error = $state('');
	let pending = $state(false);
	let balanceAttempt: BalancePayment | undefined;
	let requestGeneration = 0;

	async function download(lineId: string, name: string) {
		if (downloading) return;
		downloading = lineId;
		error = '';
		try {
			const file = await storefrontClient.download(id, lineId);
			const url = URL.createObjectURL(file);
			const link = document.createElement('a');
			link.href = url;
			link.download = name.replace(/[/\\]/g, '-') + '.pdf';
			link.click();
			URL.revokeObjectURL(url);
		} catch (failure) {
			error =
				failure instanceof Error
					? failure.message
					: 'The file could not be downloaded. Please try again.';
		} finally {
			downloading = '';
		}
	}

	async function refresh(generation = requestGeneration) {
		pending = true;
		error = '';
		try {
			const next = await storefrontClient.receipt(id);
			if (generation === requestGeneration) receipt = next;
		} catch (failure) {
			if (generation === requestGeneration)
				error = failure instanceof Error ? failure.message : 'Unable to load this request.';
		} finally {
			if (generation === requestGeneration) pending = false;
		}
	}

	$effect(() => {
		const generation = ++requestGeneration;
		balanceAttempt = undefined;
		receipt = undefined;
		void refresh(generation);
		return () => {
			++requestGeneration;
			if (generation === requestGeneration) balanceAttempt = undefined;
		};
	});

	async function pay() {
		pending = true;
		error = '';
		try {
			const { url } = await storefrontClient.payment(id);
			window.location.assign(url);
		} catch (failure) {
			error =
				failure instanceof Error
					? failure.message
					: 'Payment is not ready. Check the request status.';
			pending = false;
		}
	}

	async function payBalance() {
		const offer = receipt?.balance;
		if (!offer) return;
		pending = true;
		error = '';
		balanceAttempt ??= {
			operationId: crypto.randomUUID(),
			expectedVersion: offer.version,
			expectedAmountMinor: offer.amountMinor
		};
		try {
			const { url } = await storefrontClient.balancePayment(id, balanceAttempt);
			window.location.assign(url);
		} catch (failure) {
			if (
				failure instanceof Error &&
				'code' in failure &&
				['balance_changed', 'payment_unavailable', 'payment_pending'].includes(String(failure.code))
			)
				balanceAttempt = undefined;
			error =
				failure instanceof Error && ('code' in failure || navigator.onLine === false)
					? failure.message
					: 'Payment could not be confirmed. Retry the same payment or check its status.';
			pending = false;
		}
	}

	async function reconcile() {
		pending = true;
		error = '';
		try {
			const result = await storefrontClient.reconcilePayment(id);
			receipt = result.receipt;
			if (result.status === 'review')
				error =
					'The payment could not be confirmed yet. Contact the business before making another payment.';
		} catch (failure) {
			error =
				failure instanceof Error
					? failure.message
					: 'Unable to check the payment. Try again shortly.';
		} finally {
			pending = false;
		}
	}

	function readable(value: string) {
		return value.replaceAll('-', ' ').replaceAll('_', ' ');
	}
</script>

<section
	class={`${cx('request.root', partDefaults.root)} ${className}`}
	aria-label="Request status"
>
	<h2 class={cx('request.heading', partDefaults.heading)}>Your request</h2>
	{#if error}<p class={cx('request.error', partDefaults.error)} role="alert">{error}</p>{/if}
	{#if receipt}
		<p class={cx('request.reference', partDefaults.reference)}>Reference: {receipt.id}</p>
		<p class={cx('request.status', partDefaults.status)} role="status">
			{readable(receipt.status)}
		</p>
		{#if receipt.totalMinor > 0}<p class={cx('request.total', partDefaults.total)}>
				{money(receipt.totalMinor)}
			</p>{/if}
		{#if receipt.calendarStatus}
			<p class={cx('request.calendar', partDefaults.calendar)} role="status">
				{receipt.calendarStatus === 'confirmed'
					? 'The connected calendar has confirmed your appointment.'
					: ['failed', 'review'].includes(receipt.calendarStatus)
						? 'Calendar confirmation needs attention. Contact the business before paying or arranging another time.'
						: receipt.calendarStatus === 'pending'
							? 'Your reserved time is waiting for calendar confirmation.'
							: ''}
			</p>
		{/if}
		<p class={cx('request.payment', partDefaults.payment)}>
			Payment: {readable(receipt.payment)}
		</p>
		<PaymentHold {receipt} />

		{#if receipt.downloads?.length}
			<section class={cx('request.section', partDefaults.section)} aria-label="Paid downloads">
				<h3 class={cx('request.sectionHeading', partDefaults.sectionHeading)}>Your downloads</h3>
				<ul class={cx('request.downloadList', partDefaults.downloadList)}>
					{#each receipt.downloads as file (file.id)}
						<li class={cx('request.downloadItem', partDefaults.downloadItem)}>
							<button
								class={cx('request.downloadButton', partDefaults.downloadButton)}
								type="button"
								disabled={Boolean(downloading)}
								onclick={() => void download(file.id, file.name)}
							>
								{downloading === file.id ? 'Preparing download…' : `Download ${file.name} (PDF)`}
							</button>
						</li>
					{/each}
				</ul>
				<p class={cx('request.muted', partDefaults.muted)}>
					Download access is checked against your current payment.
				</p>
			</section>
		{/if}

		{#if receipt.balance}
			<div class={cx('request.balance', partDefaults.balance)}>
				<p class={cx('request.balanceText', partDefaults.balanceText)}>
					Remaining rental balance: {money(receipt.balance.amountMinor)}. Your confirmed payments
					are already deducted.
				</p>
				<button
					class={cx('request.balanceButton', partDefaults.balanceButton)}
					disabled={pending}
					onclick={() => void payBalance()}
				>
					{pending
						? 'Preparing payment…'
						: `Pay remaining balance ${money(receipt.balance.amountMinor)}`}
				</button>
			</div>
		{/if}
		{#if receipt.refundStatus}<p class={cx('request.refund', partDefaults.refund)} role="status">
				{refundStatusMessage(receipt.refundStatus)}
			</p>{/if}
		{#if receipt.refundedMinor}<p class={cx('request.refunded', partDefaults.refunded)}>
				Refunded: {money(receipt.refundedMinor)}
			</p>{/if}
		{#if receipt.payment === 'pending' && receipt.dueMinor > 0 && !['failed', 'review'].includes(receipt.calendarStatus ?? '')}
			<button
				class={cx('request.paymentButton', partDefaults.paymentButton)}
				disabled={pending}
				onclick={() => void pay()}
			>
				{pending ? 'Preparing payment…' : `Pay ${money(receipt.dueMinor)}`}
			</button>
		{/if}
	{/if}
	{#if receipt && ['pending', 'review'].includes(receipt.payment)}
		<button
			class={cx('request.reconcileButton', partDefaults.reconcileButton)}
			disabled={pending}
			onclick={() => void reconcile()}
		>
			{pending ? 'Checking payment…' : 'Check payment with provider'}
		</button>
	{/if}
	<button
		class={cx('request.refreshButton', partDefaults.refreshButton)}
		disabled={pending}
		onclick={() => void refresh()}
	>
		{pending ? 'Checking…' : 'Check status'}
	</button>
</section>
