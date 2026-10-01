<script lang="ts">
	import { twMerge } from 'tailwind-merge';
	import { onMount, type Snippet } from 'svelte';
	import type { Checkout, Receipt } from '@mywinkel/block-sdk/public/storefront/contracts';
	import { storefrontClient } from '@mywinkel/block-sdk/public/storefront/client';
	import { createClasses } from '../appearance.svelte';
	import {
		failureMessage,
		field,
		isUncertainCheckoutFailure,
		money,
		type CheckoutCustomer,
		type PurchaseBuilder
	} from './forms';
	import { namedPartDefaults } from './parts';
	import PaymentHold from './PaymentHold.svelte';

	type Props = {
		children?: Snippet;
		customer?: CheckoutCustomer;
		purchase: PurchaseBuilder;
		label: string;
		termsUrl?: string;
		class?: string;
		className?: string;
		afterSubmit?: (receipt: Receipt) => void;
		summary?: Snippet;
		paymentHold?: boolean;
	};

	let {
		children,
		customer,
		purchase,
		label,
		termsUrl = '/terms',
		class: className = '',
		className: legacyClass = '',
		afterSubmit,
		summary,
		paymentHold = true
	}: Props = $props();

	const cx = createClasses();
	let hydrated = $state(false);
	let pending = $state(false);
	let error = $state('');
	let receipt = $state<Receipt | undefined>();
	let uncertain = $state(false);
	let status = $state<HTMLDivElement | undefined>();
	let id = $state('');
	let previous: { serialized: string; command: Checkout } | undefined;
	let extraClass = $derived(`${className} ${legacyClass}`.trim());

	onMount(() => {
		hydrated = true;
		id = `checkout-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
	});

	async function submit(form: HTMLFormElement) {
		const values = new FormData(form);
		let command: Checkout;
		try {
			if (uncertain && previous) command = previous.command;
			else {
				if (values.get('terms') !== 'on' && !uncertain)
					throw new Error('Accept the terms before submitting.');
				const input = {
					customer: {
						name: field(values, 'customerName'),
						email: field(values, 'email'),
						phone: field(values, 'phone')
					},
					purchase: purchase(values),
					termsAccepted: true as const
				};
				const serialized = JSON.stringify(input);
				command =
					previous && (uncertain || previous.serialized === serialized)
						? previous.command
						: { ...input, operationId: crypto.randomUUID() };
				previous = { serialized, command };
			}
		} catch (failure) {
			error = failureMessage(failure, 'Check the selected options.');
			return;
		}

		pending = true;
		error = '';
		try {
			const result = await storefrontClient.checkout(command);
			receipt = result;
			uncertain = false;
			afterSubmit?.(result);
			requestAnimationFrame(() => status?.focus());
		} catch (failure) {
			uncertain = isUncertainCheckoutFailure(failure);
			error = failureMessage(failure, 'Your request could not be confirmed.');
		} finally {
			pending = false;
		}
	}

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		void submit(event.currentTarget as HTMLFormElement);
	}
</script>

{#if receipt}
	<div
		bind:this={status}
		class={twMerge(cx('checkout.receipt', namedPartDefaults['checkout.receipt']), extraClass)}
		tabindex="-1"
	>
		<h2 class={cx('checkout.receipt-heading', namedPartDefaults['checkout.receipt-heading'])}>
			Request received
		</h2>
		<p class={cx('checkout.status', namedPartDefaults['checkout.status'])}>
			{receipt.payment === 'pending'
				? 'Your request is saved. Payment is pending; confirmation follows the payment result.'
				: 'Your request is saved. Keep this reference for your records.'}
		</p>
		<p class={cx('checkout.receipt-reference', namedPartDefaults['checkout.receipt-reference'])}>
			Reference: <strong>{receipt.id}</strong>
		</p>
		{#if receipt.totalMinor > 0}
			<p class={cx('checkout.receipt-total', namedPartDefaults['checkout.receipt-total'])}>
				Total {money(receipt.totalMinor)}
			</p>
		{/if}
		<PaymentHold {receipt} />
		<a
			class={cx('checkout.receipt-view', namedPartDefaults['checkout.receipt-view'])}
			href={`/request?id=${encodeURIComponent(receipt.id)}`}
		>
			View request
		</a>
	</div>
{:else}
	<form
		class={twMerge(cx('checkout.form', namedPartDefaults['checkout.form']), extraClass)}
		aria-describedby={error && id ? `${id}-error` : undefined}
		onsubmit={handleSubmit}
	>
		<fieldset
			class={cx('checkout.fieldset', namedPartDefaults['checkout.fieldset'])}
			disabled={!hydrated || pending || uncertain}
		>
			{@render children?.()}
			<fieldset class={cx('checkout.details', namedPartDefaults['checkout.details'])}>
				<legend class={cx('checkout.legend', namedPartDefaults['checkout.legend'])}
					>Your details</legend
				>
				<label class={cx('checkout.field', namedPartDefaults['checkout.field'])}>
					Full name
					<input
						class={cx('checkout.control', namedPartDefaults['checkout.control'])}
						name="customerName"
						autocomplete="name"
						required
						maxlength="160"
						value={customer?.name ?? ''}
					/>
				</label>
				<div class={cx('checkout.field-group', namedPartDefaults['checkout.field-group'])}>
					<label class={cx('checkout.field', namedPartDefaults['checkout.field'])}>
						Email
						{#key customer?.id ?? 'guest-email'}
							<input
								class={cx('checkout.control', namedPartDefaults['checkout.control'])}
								type="email"
								name="email"
								autocomplete="email"
								required
								value={customer?.email ?? ''}
								readonly={!!customer}
							/>
						{/key}
					</label>
					<div class={cx('checkout.field-stack', namedPartDefaults['checkout.field-stack'])}>
						<label class={cx('checkout.field', namedPartDefaults['checkout.field'])}>
							Mobile number
							<input
								class={cx('checkout.control', namedPartDefaults['checkout.control'])}
								type="tel"
								name="phone"
								autocomplete="tel"
								required
								placeholder="+27821234567"
								pattern={'\\+[1-9][0-9]{7,14}'}
								aria-describedby={hydrated && id ? `${id}-phone` : undefined}
							/>
						</label>
						<span
							class={cx('checkout.hint', namedPartDefaults['checkout.hint'])}
							id={hydrated && id ? `${id}-phone` : undefined}
						>
							Include the country code, without spaces.
						</span>
					</div>
				</div>
			</fieldset>
			{#if summary}
				<div class={cx('checkout.summary', namedPartDefaults['checkout.summary'])}>
					{@render summary()}
				</div>
			{/if}
			{#if paymentHold}
				<p class={cx('checkout.hold', namedPartDefaults['checkout.hold'])}>
					If payment is required, your unpaid reservation is held for 30 minutes after you submit.
				</p>
			{/if}
			<label class={cx('checkout.consent', namedPartDefaults['checkout.consent'])}>
				<input
					class={cx('checkout.consent-input', namedPartDefaults['checkout.consent-input'])}
					type="checkbox"
					name="terms"
					required
				/>
				<span class={cx('checkout.consent-copy', namedPartDefaults['checkout.consent-copy'])}>
					I agree to the
					<a
						class={cx('checkout.terms-link', namedPartDefaults['checkout.terms-link'])}
						href={termsUrl}
						target="_blank"
						rel="noreferrer"
					>
						terms and cancellation policy
					</a>
					.
				</span>
			</label>
		</fieldset>
		{#if error}
			<div
				class={cx('checkout.error', namedPartDefaults['checkout.error'])}
				id={id ? `${id}-error` : undefined}
				role="alert"
			>
				<p class={cx('checkout.error-copy', namedPartDefaults['checkout.error-copy'])}>{error}</p>
				{#if uncertain}
					<p class={cx('checkout.error-retry', namedPartDefaults['checkout.error-retry'])}>
						Your submitted details are kept below. Retry to safely check the same request.
					</p>
				{/if}
			</div>
		{/if}
		{#if pending}
			<p class={cx('checkout.status', namedPartDefaults['checkout.status'])} role="status">
				Saving your request…
			</p>
		{/if}
		<button
			class={cx('checkout.submit', namedPartDefaults['checkout.submit'])}
			type="submit"
			disabled={pending || !hydrated}
		>
			{pending ? 'Saving…' : uncertain ? 'Retry this request' : label}
		</button>
	</form>
{/if}
