<script lang="ts">
	import type { Catalogue } from '@mywinkel/block-sdk/public/storefront/contracts';
	import type { AppointmentAvailability } from '@mywinkel/block-sdk/public/storefront/availability';
	import { storefrontClient } from '@mywinkel/block-sdk/public/storefront/client';
	import type { AppearanceInput } from '@mywinkel/block-sdk/appearance';
	import { createClasses } from '@mywinkel/block-sdk/appearance.svelte';
	import CheckoutForm from '@mywinkel/block-sdk/shared/CheckoutForm.svelte';
	import Loading from '@mywinkel/block-sdk/shared/Loading.svelte';
	import { useCatalogue } from '@mywinkel/block-sdk/shared/catalogue.svelte';
	import { field, money } from '@mywinkel/block-sdk/shared/forms';
	import { namedPartDefaults } from './parts';

	type Props = {
		initial?: Catalogue;
		class?: string;
		className?: string;
		termsUrl?: string;
		appearance?: AppearanceInput;
	};

	let {
		initial,
		class: className = '',
		className: legacyClass = '',
		termsUrl = '/terms',
		appearance
	}: Props = $props();
	const cx = createClasses(() => appearance);
	const catalogue = useCatalogue(() => initial);

	let serviceId = $state('');
	let resourceId = $state('');
	let date = $state('');
	let refresh = $state(0);
	let availability = $state<{ key: string; value: AppointmentAvailability }>();
	let failure = $state<{ key: string; message: string }>();

	const data = $derived(catalogue.data);
	const services = $derived(data?.items.filter((item) => item.type === 'services') ?? []);
	const hasAppointments = $derived(services.length > 0 && !!data?.staff.length);
	const selectionKey = $derived(JSON.stringify([serviceId, resourceId, date, refresh]));
	const ready = $derived(!!serviceId && !!resourceId && !!date);
	const current = $derived(availability?.key === selectionKey ? availability.value : undefined);
	const error = $derived(failure?.key === selectionKey ? failure.message : '');

	$effect(() => {
		const firstStaffId = data?.staff[0]?.id;
		if (!firstStaffId) return;
		if (!resourceId || !data?.staff.some((member) => member.id === resourceId))
			resourceId = firstStaffId;
	});

	$effect(() => {
		const requestKey = selectionKey;
		if (!serviceId || !resourceId || !date) return;
		let active = true;
		void storefrontClient.availability({ serviceId, resourceId, date }, refresh > 0).then(
			(value) => {
				if (active) availability = { key: requestKey, value };
			},
			(cause: unknown) => {
				if (active)
					failure = {
						key: requestKey,
						message: cause instanceof Error ? cause.message : 'Availability could not be loaded.'
					};
			}
		);
		return () => {
			active = false;
		};
	});

	const rootClass = $derived(
		[cx('booking.root', namedPartDefaults['booking.root']), className, legacyClass]
			.filter(Boolean)
			.join(' ')
	);
	const fieldClass = $derived(cx('booking.field', namedPartDefaults['booking.field']));
	const controlClass = $derived(cx('booking.control', namedPartDefaults['booking.control']));
	const statusClass = $derived(cx('booking.status', namedPartDefaults['booking.status']));
	const errorClass = $derived(cx('booking.error', namedPartDefaults['booking.error']));
	const refreshClass = $derived(cx('booking.refresh', namedPartDefaults['booking.refresh']));
	const noteClass = $derived(cx('booking.note', namedPartDefaults['booking.note']));

	function formatSlot(start: string) {
		return new Intl.DateTimeFormat('en-ZA', {
			timeZone: 'Africa/Johannesburg',
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		}).format(new Date(start));
	}
</script>

{#if !data}
	<div class={rootClass}>
		<Loading error={catalogue.error} />
	</div>
{:else if !hasAppointments}
	<p
		class={`${cx('booking.empty', namedPartDefaults['booking.empty'])} ${className} ${legacyClass}`.trim()}
	>
		No appointments are available right now. Please contact the business.
	</p>
{:else}
	<CheckoutForm
		className={rootClass}
		{termsUrl}
		label="Request appointment"
		purchase={(form) => ({
			kind: 'appointment',
			serviceId,
			resourceId,
			start: field(form, 'start'),
			partySize: 1,
			expectedPriceMinor: services.find((item) => item.id === serviceId)!.priceMinor
		})}
	>
		<label class={fieldClass}>
			Service
			<select
				class={controlClass}
				name="serviceId"
				required
				value={serviceId}
				onchange={(event) => (serviceId = event.currentTarget.value)}
			>
				<option value="" disabled>Choose a service</option>
				{#each services as item (item.id)}
					<option value={item.id}>{item.name} · {money(item.priceMinor)}</option>
				{/each}
			</select>
		</label>

		<label class={fieldClass}>
			Team member
			<select
				class={controlClass}
				name="resourceId"
				required
				value={resourceId}
				onchange={(event) => (resourceId = event.currentTarget.value)}
			>
				{#each data.staff as member (member.id)}
					<option value={member.id}>{member.name}</option>
				{/each}
			</select>
		</label>

		<label class={fieldClass}>
			Appointment date
			<input
				class={controlClass}
				type="date"
				name="date"
				required
				value={date}
				onchange={(event) => (date = event.currentTarget.value)}
			/>
		</label>

		{#if ready && !current && !error}
			<p class={statusClass} role="status">Checking available times…</p>
		{/if}
		{#if error}
			<p class={errorClass} role="alert">{error}</p>
		{/if}
		{#if current && !current.slots.length}
			<p class={statusClass} role="status">
				No times are available on this date. Choose another date or team member.
			</p>
		{/if}

		{#key selectionKey}
			<label class={fieldClass}>
				Appointment time
				<select class={controlClass} name="start" required>
					<option value="" disabled>
						{current?.slots.length ? 'Choose an available time' : 'Choose a service and date first'}
					</option>
					{#each current?.slots ?? [] as slot (slot.start)}
						<option value={slot.start}>{formatSlot(slot.start)}</option>
					{/each}
				</select>
			</label>
		{/key}

		{#if ready}
			<button type="button" class={refreshClass} onclick={() => (refresh += 1)}>
				Refresh available times
			</button>
		{/if}

		<p class={noteClass}>
			Times are in South African Standard Time. Availability, price and any required deposit are
			checked again when you submit.{current?.confirmationRequired
				? ' Your request also needs confirmation from the connected calendar.'
				: ''}
		</p>
	</CheckoutForm>
{/if}
