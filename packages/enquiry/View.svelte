<script lang="ts">
	import type { AppearanceInput } from '@mywinkel/block-sdk/appearance';
	import { createClasses } from '@mywinkel/block-sdk/appearance.svelte';
	import CheckoutForm from '@mywinkel/block-sdk/shared/CheckoutForm.svelte';
	import { field } from '@mywinkel/block-sdk/shared/forms';
	import { namedPartDefaults } from './parts';

	type Props = {
		class?: string;
		className?: string;
		termsUrl?: string;
		heading?: string;
		appearance?: AppearanceInput;
	};

	let {
		class: className = '',
		className: legacyClass = '',
		termsUrl = '/terms',
		heading = 'Tell us what you need',
		appearance
	}: Props = $props();
	const cx = createClasses(() => appearance);
	const rootClass = $derived(
		[cx('enquiry.root', namedPartDefaults['enquiry.root']), className, legacyClass]
			.filter(Boolean)
			.join(' ')
	);
	const headingClass = $derived(cx('enquiry.heading', namedPartDefaults['enquiry.heading']));
	const fieldClass = $derived(cx('enquiry.field', namedPartDefaults['enquiry.field']));
	const controlClass = $derived(cx('enquiry.control', namedPartDefaults['enquiry.control']));
	const messageClass = $derived(cx('enquiry.message', namedPartDefaults['enquiry.message']));
</script>

<CheckoutForm
	className={rootClass}
	paymentHold={false}
	{termsUrl}
	label="Send enquiry"
	purchase={(form) => ({
		kind: 'enquiry',
		title: field(form, 'title'),
		details: field(form, 'details')
	})}
>
	<h2 class={headingClass}>{heading}</h2>
	<label class={fieldClass}>
		Subject
		<input class={controlClass} name="title" required maxlength="200" />
	</label>
	<label class={fieldClass}>
		What can we help with?
		<textarea class={`${controlClass} ${messageClass}`} name="details" required maxlength="10000"
		></textarea>
	</label>
</CheckoutForm>
