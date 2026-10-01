<script lang="ts">
	import { createClasses } from '../appearance.svelte';
	import { storefrontClient } from '@mywinkel/block-sdk/public/storefront/client';
	import { money } from './forms';
	import { accountPartDefaults } from './account-parts';

	type Review = Awaited<ReturnType<typeof storefrontClient.membershipRenewal>>;
	type Approval = Parameters<typeof storefrontClient.renewMembership>[1];

	export type MembershipRenewalProps = { id: string; name: string };
	let { id, name }: MembershipRenewalProps = $props();
	const cx = createClasses();

	let review = $state<Review>();
	let approved = $state(false);
	let automatic = $state(false);
	let stopApproved = $state(false);
	let stopping = $state(false);
	let stopUncertain = $state(false);
	let pending = $state(false);
	let error = $state('');
	let uncertain = $state(false);
	let href = $state('');
	let approval: Approval | undefined;
	let stopApproval: Parameters<typeof storefrontClient.stopAutomaticMembership>[1] | undefined;

	function isRejected(failure: unknown) {
		return (
			failure instanceof Error &&
			'code' in failure &&
			['renewal_changed', 'unauthenticated', 'validation'].includes(String(failure.code))
		);
	}

	async function load() {
		pending = true;
		error = '';
		try {
			review = await storefrontClient.membershipRenewal(id);
			approved = false;
			automatic = false;
			href = '';
			approval = undefined;
			uncertain = false;
		} catch (failure) {
			error =
				failure instanceof Error ? failure.message : 'Unable to load this renewal. Try again.';
		} finally {
			pending = false;
		}
	}

	async function confirm() {
		if (!approval && review?.offer && approved) {
			const offer = review.offer;
			approval = {
				operationId: crypto.randomUUID(),
				expectedVersion: offer.version,
				expectedAmountMinor: offer.amountMinor,
				expectedStart: offer.start,
				expectedEnd: offer.end,
				approved: true,
				...(automatic ? { autoRenew: true, recurringApproved: true } : {})
			};
		}
		if (!approval) return;
		pending = true;
		error = '';
		try {
			href = (await storefrontClient.renewMembership(id, approval)).href;
			uncertain = false;
		} catch (failure) {
			const rejected = isRejected(failure);
			uncertain = !rejected;
			if (rejected) {
				approval = undefined;
				review = undefined;
				approved = false;
			}
			error =
				failure instanceof Error
					? failure.message
					: 'The renewal response was interrupted. Check the saved request.';
		} finally {
			pending = false;
		}
	}

	async function stop() {
		if (!stopApproval && review?.mandate && stopApproved)
			stopApproval = {
				operationId: crypto.randomUUID(),
				mandateId: review.mandate.id,
				approved: true
			};
		if (!stopApproval) return;
		stopping = true;
		error = '';
		try {
			await storefrontClient.stopAutomaticMembership(id, stopApproval);
			review = review?.mandate
				? { ...review, mandate: { ...review.mandate, status: 'revoked' } }
				: review;
			stopApproval = undefined;
			stopUncertain = false;
			stopApproved = false;
		} catch (failure) {
			const rejected = isRejected(failure);
			stopUncertain = !rejected;
			if (rejected) {
				stopApproval = undefined;
				stopApproved = false;
				review = undefined;
			}
			error =
				failure instanceof Error
					? failure.message
					: 'The response was interrupted. Check the saved stop request.';
		} finally {
			stopping = false;
		}
	}

	function mandateStatus(value: NonNullable<Review['mandate']>['status']) {
		return {
			pending: 'awaiting your first payment',
			active: 'active',
			revoked: 'stopped',
			review: 'needs review'
		}[value];
	}
</script>

<section
	class={cx('account.membershipRoot', accountPartDefaults.membershipRoot)}
	aria-label={`Renew membership: ${name}`}
>
	{#if error}
		<p class={cx('account.membershipError', accountPartDefaults.membershipError)} role="alert">
			{error}
		</p>
	{/if}

	{#if review?.mandate}
		<div
			class={cx('account.membershipPayments', accountPartDefaults.membershipPayments)}
			aria-label="Automatic membership payments"
		>
			<p class={cx('account.membershipStatus', accountPartDefaults.membershipStatus)}>
				<strong>Automatic payments: {mandateStatus(review.mandate.status)}</strong>
			</p>
			<p class={cx('account.membershipDetails', accountPartDefaults.membershipDetails)}>
				{money(review.mandate.amountMinor)}
				{review.mandate.interval === 'annual' ? 'each year' : 'each month'}{review.mandate.lastFour
					? ` · ${review.mandate.brand ?? 'Card'} ending ${review.mandate.lastFour}`
					: ''}.
			</p>
			{#if review.mandate.status === 'active'}
				<p class={cx('account.membershipDetails', accountPartDefaults.membershipDetails)}>
					Next renewal day:
					{new Date(review.mandate.dueAt).toLocaleDateString('en-ZA', {
						timeZone: 'Africa/Johannesburg',
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					})}. Access extends after payment confirmation.
				</p>
			{/if}
			{#if review.mandate.status === 'review'}
				<p class={cx('account.membershipReview', accountPartDefaults.membershipReview)}>
					Further automatic charges are stopped until this is reviewed. Contact the business for
					help.
				</p>
			{/if}
			{#if review.mandate.status === 'revoked'}
				<p
					class={cx('account.membershipStatus', accountPartDefaults.membershipStatus)}
					role="status"
				>
					Automatic payments are stopped. Your paid membership period stays available. A payment
					already submitted may still finish.
				</p>
			{:else}
				<label
					class={cx('account.membershipStopConsent', accountPartDefaults.membershipStopConsent)}
				>
					<input
						class={cx('account.membershipStopCheckbox', accountPartDefaults.membershipStopCheckbox)}
						type="checkbox"
						checked={stopApproved}
						disabled={stopping || stopUncertain || pending || uncertain}
						onchange={(event) => (stopApproved = (event.currentTarget as HTMLInputElement).checked)}
					/>
					<span>Stop future automatic payments. A payment already submitted may still finish.</span>
				</label>
				<button
					class={cx('account.membershipStopButton', accountPartDefaults.membershipStopButton)}
					disabled={stopping || pending || uncertain || (!stopApproved && !stopUncertain)}
					onclick={() => void stop()}
				>
					{stopping
						? 'Checking automatic payments…'
						: stopUncertain
							? 'Check saved stop request'
							: 'Stop automatic payments'}
				</button>
			{/if}
		</div>
	{/if}

	{#if review?.collection}
		<p
			class={cx('account.membershipCollection', accountPartDefaults.membershipCollection)}
			role="status"
		>
			Latest automatic renewal:
			{review.collection.status === 'paid'
				? 'payment confirmed'
				: review.collection.status === 'pending'
					? 'awaiting collection'
					: review.collection.status === 'submitting'
						? 'checking payment confirmation'
						: 'payment needs review'} · {money(review.collection.amountMinor)} for {review
				.collection.start} to {review.collection.end}.
			{review.collection.status !== 'paid' &&
				' Access remains unchanged while payment is unresolved. Do not make another payment for this period.'}
		</p>
	{/if}

	{#if href}
		<p class={cx('account.membershipStatus', accountPartDefaults.membershipStatus)} role="status">
			Your renewal invoice is ready. Access starts after payment is confirmed.
		</p>
		<a class={cx('account.membershipLink', accountPartDefaults.membershipLink)} {href}
			>Continue to renewal payment</a
		>
	{:else if review?.payment}
		<p class={cx('account.membershipOffer', accountPartDefaults.membershipOffer)}>
			Renewal payment: {review.payment.status}. Access changes only after confirmation.
		</p>
		<a
			class={cx('account.membershipLink', accountPartDefaults.membershipLink)}
			href={review.payment.href}>Check renewal payment</a
		>
	{:else if review?.offer}
		<p class={cx('account.membershipOffer', accountPartDefaults.membershipOffer)}>
			<strong>{money(review.offer.amountMinor)}</strong> for {review.offer.start} to {review.offer
				.end}.
		</p>
		<p class={cx('account.membershipOffer', accountPartDefaults.membershipOffer)}>
			This invoice renews one period. Your current access stays unchanged until the business
			receives payment confirmation.
		</p>
		{#if review.offer.automaticAvailable && review.mandate?.status !== 'active'}
			<label class={cx('account.membershipConsent', accountPartDefaults.membershipConsent)}>
				<input
					class={cx('account.membershipCheckbox', accountPartDefaults.membershipCheckbox)}
					type="checkbox"
					checked={automatic}
					disabled={pending || uncertain || stopping || stopUncertain}
					onchange={(event) => (automatic = (event.currentTarget as HTMLInputElement).checked)}
				/>
				<span
					>Also save my card and automatically pay {money(review.offer.amountMinor)}
					{review.offer.interval === 'annual' ? 'each year' : 'each month'} from the next renewal day
					until I stop. I can stop future payments in my account; access extends only after payment confirmation.</span
				>
			</label>
		{/if}
		<label class={cx('account.membershipConsent', accountPartDefaults.membershipConsent)}>
			<input
				class={cx('account.membershipCheckbox', accountPartDefaults.membershipCheckbox)}
				type="checkbox"
				checked={approved}
				disabled={pending || uncertain || stopping || stopUncertain}
				onchange={(event) => (approved = (event.currentTarget as HTMLInputElement).checked)}
			/>
			<span>I agree to this renewal price and period.</span>
		</label>
		<button
			class={cx('account.membershipButton', accountPartDefaults.membershipButton)}
			disabled={pending || stopping || stopUncertain || (!approved && !uncertain)}
			onclick={() => void confirm()}
		>
			{pending
				? 'Checking renewal…'
				: uncertain
					? 'Check saved renewal request'
					: 'Create renewal invoice'}
		</button>
	{:else if review && !review.collection}
		<p class={cx('account.membershipOffer', accountPartDefaults.membershipOffer)}>
			This membership cannot renew online now. Contact the business for help.
		</p>
	{:else if !review}
		<button
			class={cx('account.membershipStopButton', accountPartDefaults.membershipStopButton)}
			disabled={pending}
			onclick={() => void load()}
		>
			{pending ? 'Loading renewal…' : 'Review membership renewal'}
		</button>
	{/if}
</section>
