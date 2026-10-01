<script lang="ts">
	import { createClasses } from '../appearance.svelte';
	import type { CustomerAccount } from '@mywinkel/block-sdk/public/storefront/customer-account';
	import type { CustomerCommand } from '@mywinkel/block-sdk/public/storefront/customer-commands';
	import type { AppointmentAvailability } from '@mywinkel/block-sdk/public/storefront/availability';
	import { storefrontClient } from '@mywinkel/block-sdk/public/storefront/client';
	import { accountPartDefaults } from './account-parts';

	type Booking = CustomerAccount['history'][number];

	export type BookingManagementProps = {
		record: Booking;
		disabled: boolean;
		onSubmit: (command: CustomerCommand) => Promise<boolean>;
	};

	let { record, disabled, onSubmit }: BookingManagementProps = $props();
	const cx = createClasses();
	const booking = $derived(record.booking);
	let action = $state<'cancel' | 'reschedule'>();
	let reason = $state('');
	let date = $state('');
	let start = $state('');
	let availability = $state<{ date: string; value: AppointmentAvailability }>();
	let error = $state('');
	let retry = $state<CustomerCommand>();
	let availabilityGeneration = 0;

	$effect(() => {
		const selectedAction = action;
		const selectedDate = date;
		const serviceId = booking?.serviceId;
		const resourceId = booking?.resourceId;
		if (selectedAction !== 'reschedule' || !selectedDate || !serviceId || !resourceId) {
			if (selectedAction !== 'reschedule') availability = undefined;
			return;
		}
		const generation = ++availabilityGeneration;
		availability = undefined;
		storefrontClient.availability({ serviceId, resourceId, date: selectedDate }).then(
			(value) => {
				if (generation === availabilityGeneration) availability = { date: selectedDate, value };
			},
			(failure: unknown) => {
				if (generation === availabilityGeneration)
					error = failure instanceof Error ? failure.message : 'Unable to load available times.';
			}
		);
		return () => {
			++availabilityGeneration;
		};
	});

	function selectAction(next: 'cancel' | 'reschedule') {
		action = next;
		error = '';
		if (next !== 'reschedule') {
			availability = undefined;
			date = '';
			start = '';
		}
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!action) return;
		const draft = {
			recordId: record.id,
			expectedVersion: record.version,
			action,
			reason,
			...(action === 'reschedule' ? { start } : {})
		} satisfies Omit<CustomerCommand, 'operationId'>;
		const command =
			retry && JSON.stringify({ ...retry, operationId: undefined }) === JSON.stringify(draft)
				? retry
				: { ...draft, operationId: crypto.randomUUID() };
		retry = command;
		if (await onSubmit(command)) {
			action = undefined;
			retry = undefined;
			reason = '';
			date = '';
			start = '';
			availability = undefined;
		}
	}

	function keepBooking() {
		action = undefined;
		retry = undefined;
		reason = '';
		date = '';
		start = '';
		availability = undefined;
		error = '';
	}
</script>

{#if booking}
	<div class={cx('account.bookingRoot', accountPartDefaults.bookingRoot)}>
		{#if booking.calendarStatus === 'pending'}
			<p class={cx('account.bookingStatus', accountPartDefaults.bookingStatus)} role="status">
				Calendar confirmation is pending. Refresh your account to check the outcome.
			</p>
		{/if}
		{#if booking.calendarError}
			<p class={cx('account.bookingError', accountPartDefaults.bookingError)} role="alert">
				{booking.calendarError}
			</p>
		{/if}
		{#if booking.refundStatus === 'review'}
			<p class={cx('account.bookingStatus', accountPartDefaults.bookingStatus)}>
				Any refund needs review by the business. No refund has been confirmed.
			</p>
		{/if}

		{#if action}
			<form class={cx('account.bookingForm', accountPartDefaults.bookingForm)} onsubmit={submit}>
				<fieldset
					class={cx('account.bookingFieldset', accountPartDefaults.bookingFieldset)}
					{disabled}
				>
					<legend class={cx('account.bookingLegend', accountPartDefaults.bookingLegend)}>
						{action === 'cancel' ? 'Review cancellation' : 'Choose a new time'}
					</legend>
					<p class={cx('account.bookingCopy', accountPartDefaults.bookingCopy)}>
						{action === 'cancel'
							? 'This releases your booking. Any payment or refund is handled separately.'
							: 'Your new time is provisional until any connected calendar confirms it. Your price and team member stay the same.'}
					</p>
					{#if action === 'reschedule'}
						<label class={cx('account.bookingLabel', accountPartDefaults.bookingLabel)}>
							<span>New appointment date</span>
							<input
								class={cx('account.bookingInput', accountPartDefaults.bookingInput)}
								type="date"
								value={date}
								required
								onchange={(event) => {
									date = (event.currentTarget as HTMLInputElement).value;
									start = '';
									error = '';
								}}
							/>
						</label>
						<label class={cx('account.bookingLabel', accountPartDefaults.bookingLabel)}>
							<span>New appointment time</span>
							<select
								class={cx('account.bookingInput', accountPartDefaults.bookingInput)}
								value={start}
								required
								onchange={(event) => (start = (event.currentTarget as HTMLSelectElement).value)}
							>
								<option value="">Choose an available time</option>
								{#if availability?.date === date}
									{#each availability.value.slots as slot (slot.start)}
										<option value={slot.start}>
											{new Date(slot.start).toLocaleTimeString('en-ZA', {
												timeZone: 'Africa/Johannesburg',
												hour: '2-digit',
												minute: '2-digit',
												hour12: false
											})}
										</option>
									{/each}
								{/if}
							</select>
						</label>
						{#if date && availability?.date === date && !availability.value.slots.length}
							<p
								class={cx('account.bookingStatus', accountPartDefaults.bookingStatus)}
								role="status"
							>
								No times are available. Choose another date.
							</p>
						{/if}
						{#if error}
							<p class={cx('account.bookingError', accountPartDefaults.bookingError)} role="alert">
								{error}
							</p>
						{/if}
						<p class={cx('account.bookingMuted', accountPartDefaults.bookingMuted)}>
							Times are in South African Standard Time.
						</p>
					{/if}
					<label class={cx('account.bookingLabel', accountPartDefaults.bookingLabel)}>
						<span>Reason</span>
						<textarea
							class={cx('account.bookingInput', accountPartDefaults.bookingInput)}
							required
							maxlength="1000"
							value={reason}
							oninput={(event) => (reason = (event.currentTarget as HTMLTextAreaElement).value)}
						></textarea>
					</label>
					<button
						class={cx('account.bookingSubmit', accountPartDefaults.bookingSubmit)}
						type="submit"
					>
						{action === 'cancel' ? 'Confirm cancellation' : 'Request new time'}
					</button>
					<button
						class={cx('account.bookingKeep', accountPartDefaults.bookingKeep)}
						type="button"
						onclick={keepBooking}
					>
						Keep current booking
					</button>
				</fieldset>
			</form>
		{:else}
			<div class={cx('account.bookingActions', accountPartDefaults.bookingActions)}>
				{#if booking.cancel}
					<button
						class={cx('account.bookingCancel', accountPartDefaults.bookingCancel)}
						{disabled}
						onclick={() => selectAction('cancel')}
					>
						Cancel booking
					</button>
				{/if}
				{#if booking.reschedule}
					<button
						class={cx('account.bookingReschedule', accountPartDefaults.bookingReschedule)}
						{disabled}
						onclick={() => selectAction('reschedule')}
					>
						Change appointment time
					</button>
				{/if}
				{#if !booking.cancel && record.status !== 'cancelled' && booking.calendarStatus !== 'pending'}
					<p class={cx('account.bookingMuted', accountPartDefaults.bookingMuted)}>
						Contact the business to change this booking.
					</p>
				{/if}
			</div>
		{/if}
	</div>
{/if}
