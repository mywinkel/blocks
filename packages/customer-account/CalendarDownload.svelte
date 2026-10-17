<script lang="ts">
	import type { CustomerAccount } from '@mywinkel/block-sdk/public/storefront/customer-account';
	import type { AppearanceInput } from '@mywinkel/block-sdk/appearance';
	import { createClasses } from '@mywinkel/block-sdk/appearance.svelte';
	import { bookingCalendar, canDownloadBooking } from './booking-calendar';
	import { localPartDefaults as parts } from './parts';
	let {
		record,
		disabled = false,
		appearance
	}: {
		record: CustomerAccount['history'][number];
		disabled?: boolean;
		appearance?: AppearanceInput;
	} = $props();
	const cx = createClasses(() => appearance);
	let error = $state('');

	function download() {
		error = '';
		try {
			const content = bookingCalendar(record, location.origin);
			if (!content) return;
			const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }));
			const link = document.createElement('a');
			link.href = url;
			link.download = record.type === 'enrolments' ? 'class.ics' : 'appointment.ics';
			document.body.append(link);
			try {
				link.click();
			} finally {
				link.remove();
				// Give the browser time to consume the URL, then release private file data.
				setTimeout(() => URL.revokeObjectURL(url), 1000);
			}
		} catch {
			error = 'The calendar file could not be prepared. Try downloading again.';
		}
	}
</script>

{#if canDownloadBooking(record)}
	<div class={cx('account.calendar', parts.calendar)}>
		<button
			type="button"
			class={cx('account.calendarDownload', parts.calendarDownload)}
			{disabled}
			onclick={download}>Download calendar file</button
		>
		<p class={cx('account.calendarHelp', parts.calendarHelp)}>
			Import this file into your calendar. Later booking changes will not update the file; check
			your account for the latest time.
		</p>
		{#if error}<p role="alert" class={cx('account.calendarError', parts.calendarError)}>
				{error}
			</p>{/if}
	</div>
{/if}
