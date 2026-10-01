<script lang="ts">
	import type { Receipt } from '@mywinkel/block-sdk/public/storefront/contracts';
	import { createClasses } from '../appearance.svelte';
	import { namedPartDefaults } from './parts';

	let { receipt }: { receipt: Receipt } = $props();
	const cx = createClasses();

	const formatDeadline = (value: string) =>
		new Intl.DateTimeFormat('en-ZA', {
			dateStyle: 'medium',
			timeStyle: 'short',
			timeZone: 'Africa/Johannesburg'
		}).format(new Date(value));
</script>

{#if receipt.payment === 'expired'}
	<p class={cx('payment-hold.expired', namedPartDefaults['payment-hold.expired'])} role="status">
		The payment window ended. Start a new request to check current prices and availability. If you
		paid, contact the business before paying again.
	</p>
{:else if receipt.payment === 'pending' && receipt.paymentExpiresAt}
	<p class={cx('payment-hold.pending', namedPartDefaults['payment-hold.pending'])}>
		Complete payment by
		<time dateTime={receipt.paymentExpiresAt}>
			<span class={cx('payment-hold.time', namedPartDefaults['payment-hold.time'])}>
				{formatDeadline(receipt.paymentExpiresAt)} SAST
			</span>
		</time>
		to keep this reservation.
	</p>
{/if}
