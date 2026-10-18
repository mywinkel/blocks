<script lang="ts">
	import { z } from 'zod';
	import type { CustomerAccount } from '@mywinkel/block-sdk/public/storefront/customer-account';
	import type { AppearanceInput } from '@mywinkel/block-sdk/appearance';
	import { createClasses } from '@mywinkel/block-sdk/appearance.svelte';
	import { localPartDefaults as parts } from './parts';

	let {
		record,
		appearance
	}: {
		record: CustomerAccount['history'][number];
		appearance?: AppearanceInput;
	} = $props();
	const cx = createClasses(() => appearance);
	const instant = z.iso.datetime({ offset: true });
	const formatter = new Intl.DateTimeFormat('en-ZA', {
		timeZone: 'Africa/Johannesburg',
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	});
	// Older or merchant-edited records can lack a usable interval. Never infer a
	// timezone or fabricate a return from the hire price/duration in the browser.
	const valid = $derived(
		instant.safeParse(record.start).success &&
			instant.safeParse(record.end).success &&
			Date.parse(record.end) > Date.parse(record.start)
	);
</script>

{#if valid}
	<dl class={cx('account.rentalSchedule', parts.rentalSchedule)}>
		{#each [{ label: 'Scheduled collection', value: record.start }, { label: 'Scheduled return', value: record.end }] as entry (entry.label)}
			<div class={cx('account.rentalScheduleItem', parts.rentalScheduleItem)}>
				<dt class={cx('account.rentalScheduleLabel', parts.rentalScheduleLabel)}>{entry.label}</dt>
				<dd class={cx('account.rentalScheduleTime', parts.rentalScheduleTime)}>
					<time datetime={entry.value}>{formatter.format(new Date(entry.value))}</time>
				</dd>
			</div>
		{/each}
	</dl>
	<p class={cx('account.rentalScheduleHelp', parts.rentalScheduleHelp)}>
		South African Standard Time (SAST). Refresh your account to check for changes.
	</p>
{:else}
	<p class={cx('account.rentalScheduleHelp', parts.rentalScheduleHelp)}>
		Schedule unavailable. Contact the business for collection and return times.
	</p>
{/if}
