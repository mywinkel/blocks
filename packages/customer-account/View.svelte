<script lang="ts">
	import { createClasses } from '@mywinkel/block-sdk/appearance.svelte';
	import type { AppearanceInput } from '@mywinkel/block-sdk/appearance';
	import { storefrontClient } from '@mywinkel/block-sdk/public/storefront/client';
	import type { CustomerAccount as Account } from '@mywinkel/block-sdk/public/storefront/customer-account';
	import type { CustomerCommand } from '@mywinkel/block-sdk/public/storefront/customer-commands';
	import { money } from '@mywinkel/block-sdk/shared/forms';
	import BookingManagement from '@mywinkel/block-sdk/shared/BookingManagement.svelte';
	import MembershipRenewal from '@mywinkel/block-sdk/shared/MembershipRenewal.svelte';
	import QuoteReview from '@mywinkel/block-quote-acceptance/Review.svelte';
	import { accountPartDefaults } from '@mywinkel/block-sdk/shared/account-parts';

	export type CustomerAccountProps = { className?: string; appearance?: AppearanceInput };
	let { className = '', appearance }: CustomerAccountProps = $props();
	const cx = createClasses(() => appearance);

	let account = $state<Account>();
	let loading = $state(true);
	let pending = $state(false);
	let message = $state('');
	let error = $state('');
	let loadSequence = 0;

	async function load() {
		const sequence = ++loadSequence;
		loading = true;
		error = '';
		message = '';
		try {
			const next = await storefrontClient.customerAccount({}, true);
			if (sequence === loadSequence) account = next;
		} catch (failure) {
			if (sequence !== loadSequence) return;
			if (failure instanceof Error && 'code' in failure && failure.code === 'unauthenticated')
				account = undefined;
			else error = failure instanceof Error ? failure.message : 'Unable to load your account.';
		} finally {
			if (sequence === loadSequence) loading = false;
		}
	}

	$effect(() => {
		void load();
	});

	async function signIn(event: SubmitEvent) {
		event.preventDefault();
		const target = event.currentTarget;
		if (!(target instanceof HTMLFormElement)) return;
		const email = String(new FormData(target).get('email') ?? '');
		pending = true;
		error = '';
		message = '';
		try {
			message = (await storefrontClient.signIn(email)).message;
		} catch (failure) {
			error = failure instanceof Error ? failure.message : 'Unable to send this link.';
		} finally {
			pending = false;
		}
	}

	async function signOut() {
		++loadSequence;
		pending = true;
		error = '';
		message = '';
		try {
			await storefrontClient.signOut();
			account = undefined;
			message = 'You have signed out.';
		} catch (failure) {
			error = failure instanceof Error ? failure.message : 'Unable to sign out.';
		} finally {
			pending = false;
		}
	}

	async function more(kind: 'history' | 'membership') {
		const current = account;
		if (!current || pending) return;
		const cursor = kind === 'history' ? current.nextHistoryCursor : current.nextMembershipCursor;
		if (!cursor) return;
		pending = true;
		error = '';
		try {
			const page = await storefrontClient.customerAccount(
				kind === 'history' ? { historyCursor: cursor } : { membershipCursor: cursor }
			);
			account =
				account && page.revision === account.revision
					? {
							...account,
							...(kind === 'history'
								? {
										history: [...account.history, ...page.history],
										nextHistoryCursor: page.nextHistoryCursor
									}
								: {
										memberships: [...account.memberships, ...page.memberships],
										nextMembershipCursor: page.nextMembershipCursor
									})
						}
					: account;
		} catch (failure) {
			error = failure instanceof Error ? failure.message : 'Unable to load more history.';
		} finally {
			pending = false;
		}
	}

	async function mutate(command: CustomerCommand) {
		const current = account;
		if (!current || pending) return false;
		++loadSequence;
		const previous = current.history.find((row) => row.id === command.recordId);
		if (!previous) return false;
		pending = true;
		error = '';
		message = '';
		account = {
			...current,
			history: current.history.map((row) =>
				row.id === previous.id
					? {
							...row,
							status: command.action === 'cancel' ? 'cancelling' : 'rescheduling',
							...(command.start ? { start: command.start } : {})
						}
					: row
			)
		};
		try {
			const result = await storefrontClient.customerCommand(command);
			account = result.account;
			message =
				result.calendarStatus === 'pending'
					? 'Your change is awaiting calendar confirmation.'
					: command.action === 'cancel'
						? 'Booking cancelled. Any refund requires separate confirmation.'
						: 'Appointment time updated.';
			return true;
		} catch (failure) {
			account = account
				? {
						...account,
						history: account.history.map((row) => (row.id === previous.id ? previous : row))
					}
				: account;
			error =
				failure instanceof Error
					? failure.message
					: 'Your booking could not be changed. Your draft has been kept.';
			return false;
		} finally {
			pending = false;
		}
	}
</script>

<section
	class={`${cx('account.root', accountPartDefaults.root)} ${className}`}
	aria-label="Customer account"
>
	{#if error}<p class={cx('account.error', accountPartDefaults.error)} role="alert">{error}</p>{/if}
	{#if message}<p class={cx('account.message', accountPartDefaults.message)} role="status">
			{message}
		</p>{/if}

	{#if loading && !account}
		<p class={cx('account.status', accountPartDefaults.status)} role="status">
			Loading your account…
		</p>
	{:else if account}
		<div class={cx('account.profile', accountPartDefaults.profile)}>
			<h2 class={cx('account.profileHeading', accountPartDefaults.profileHeading)}>
				{account.customer.name}
			</h2>
			<p class={cx('account.profileEmail', accountPartDefaults.profileEmail)}>
				{account.customer.email}
			</p>
			<div class={cx('account.profileActions', accountPartDefaults.profileActions)}>
				<button
					class={cx('account.refresh', accountPartDefaults.refresh)}
					disabled={pending}
					onclick={() => void load()}
				>
					Refresh account
				</button>
				<button
					class={cx('account.signout', accountPartDefaults.signout)}
					disabled={pending}
					onclick={() => void signOut()}
				>
					Sign out
				</button>
			</div>
		</div>

		<section class={cx('account.section', accountPartDefaults.section)}>
			<h2 class={cx('account.sectionHeading', accountPartDefaults.sectionHeading)}>
				Your memberships and packs
			</h2>
			{#if account.memberships.length}
				<ul class={cx('account.membershipList', accountPartDefaults.membershipList)}>
					{#each account.memberships as membership (membership.id)}
						<li class={cx('account.membershipItem', accountPartDefaults.membershipItem)}>
							<strong class={cx('account.membershipName', accountPartDefaults.membershipName)}
								>{membership.name}</strong
							>
							<p class={cx('account.membershipMeta', accountPartDefaults.membershipMeta)}>
								{membership.status} · {membership.credits} credits remaining · Expires {membership.expires}
							</p>
							{#if membership.kind === 'membership' && membership.status !== 'cancelled'}
								<div class={cx('account.membershipRenewal', accountPartDefaults.membershipRenewal)}>
									<MembershipRenewal id={membership.id} name={membership.name} />
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			{:else}
				<p class={cx('account.status', accountPartDefaults.status)}>
					You do not have a pack or membership yet.
				</p>
			{/if}
			{#if account.nextMembershipCursor}
				<button
					class={cx('account.loadMore', accountPartDefaults.loadMore)}
					disabled={pending}
					onclick={() => void more('membership')}
				>
					Load more memberships
				</button>
			{/if}
		</section>

		<section class={cx('account.section', accountPartDefaults.section)}>
			<h2 class={cx('account.sectionHeading', accountPartDefaults.sectionHeading)}>Your history</h2>
			{#if account.history.length}
				<ul class={cx('account.historyList', accountPartDefaults.historyList)}>
					{#each account.history as row (row.id)}
						<li class={cx('account.historyItem', accountPartDefaults.historyItem)}>
							<strong class={cx('account.historyName', accountPartDefaults.historyName)}
								>{row.name}</strong
							>
							<p class={cx('account.historyMeta', accountPartDefaults.historyMeta)}>
								{row.type.replaceAll('-', ' ')} · {row.status.replaceAll(
									'-',
									' '
								)}{row.amountMinor > 0 ? ` · ${money(row.amountMinor)}` : ''}
							</p>
							{#if row.start}
								<p class={cx('account.historyStart', accountPartDefaults.historyStart)}>
									{new Date(row.start).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}
								</p>
							{/if}
							<div class={cx('account.booking', accountPartDefaults.booking)}>
								<BookingManagement record={row} disabled={pending} onSubmit={mutate} />
							</div>
							{#if row.type === 'quotes' && row.quote}
								<div class={cx('account.quote', accountPartDefaults.quote)}>
									<QuoteReview quote={row} customer={account.customer} />
								</div>
							{/if}
							{#if row.hasReceipt}
								<a
									class={cx('account.receiptLink', accountPartDefaults.receiptLink)}
									href={`/request?id=${encodeURIComponent(row.id)}`}>View request and payment</a
								>
							{/if}
						</li>
					{/each}
				</ul>
			{:else}
				<p class={cx('account.status', accountPartDefaults.status)}>
					Your purchases, bookings and enquiries will appear here.
				</p>
			{/if}
			{#if account.nextHistoryCursor}
				<button
					class={cx('account.loadMore', accountPartDefaults.loadMore)}
					disabled={pending}
					onclick={() => void more('history')}
				>
					Load more history
				</button>
			{/if}
		</section>
	{:else}
		<form class={cx('account.signin', accountPartDefaults.signin)} onsubmit={signIn}>
			<h2 class={cx('account.signinHeading', accountPartDefaults.signinHeading)}>
				Sign in to your customer account
			</h2>
			<p class={cx('account.signinCopy', accountPartDefaults.signinCopy)}>
				Use the email you supplied with your purchase or enquiry.
			</p>
			<label class={cx('account.signinField', accountPartDefaults.signinField)}>
				<span class={cx('account.label', accountPartDefaults.label)}>Email</span>
				<input
					class={cx('account.input', accountPartDefaults.input)}
					name="email"
					type="email"
					autocomplete="email"
					required
					disabled={pending}
				/>
			</label>
			<button
				class={cx('account.submit', accountPartDefaults.submit)}
				type="submit"
				disabled={pending}
			>
				{pending ? 'Sending link…' : 'Email a sign-in link'}
			</button>
		</form>
	{/if}
</section>
