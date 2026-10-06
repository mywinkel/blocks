<script lang="ts">
	import { connectSelection } from '@mywinkel/block-sdk/shared/selection.svelte';
	import type { Catalogue } from '@mywinkel/block-sdk/public/storefront/contracts';
	import type { CustomerAccount } from '@mywinkel/block-sdk/public/storefront/customer-account';
	import { storefrontClient } from '@mywinkel/block-sdk/public/storefront/client';
	import type { AppearanceInput } from '@mywinkel/block-sdk/appearance';
	import { createClasses } from '@mywinkel/block-sdk/appearance.svelte';
	import CheckoutForm from '@mywinkel/block-sdk/shared/CheckoutForm.svelte';
	import ItemSelect from '@mywinkel/block-sdk/shared/ItemSelect.svelte';
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
	let classId = $state('');
	const cx = createClasses(() => appearance);
	const catalogue = useCatalogue(() => initial);

	let account = $state<CustomerAccount>();
	let accountError = $state('');
	let loadingAccount = $state(false);

	const data = $derived(catalogue.data);
	const classes = $derived(
		data?.items.filter(
			(item) => item.type === 'classes' && Date.parse(String(item.details.start)) > Date.now()
		) ?? []
	);
	const rootClass = $derived(
		[cx('classes.root', namedPartDefaults['classes.root']), className, legacyClass]
			.filter(Boolean)
			.join(' ')
	);
	const fieldClass = $derived(cx('classes.field', namedPartDefaults['classes.field']));
	const controlClass = $derived(cx('classes.control', namedPartDefaults['classes.control']));
	const noteClass = $derived(cx('classes.note', namedPartDefaults['classes.note']));
	const actionClass = $derived(cx('classes.action', namedPartDefaults['classes.action']));
	const accountErrorClass = $derived(
		cx('classes.account-error', namedPartDefaults['classes.account-error'])
	);

	async function usePack() {
		loadingAccount = true;
		accountError = '';
		try {
			account = await storefrontClient.customerAccount();
		} catch {
			accountError = 'Sign in to your customer account to use a pack or membership.';
		} finally {
			loadingAccount = false;
		}
	}
	connectSelection(
		() => data,
		'classes',
		(id) => (classId = id)
	);
</script>

{#if !data}
	<div class={rootClass}>
		<Loading error={catalogue.error} />
	</div>
{:else if !classes.length}
	<p
		class={`${cx('classes.empty', namedPartDefaults['classes.empty'])} ${className} ${legacyClass}`.trim()}
	>
		There are no upcoming classes yet.
	</p>
{:else}
	<CheckoutForm
		className={rootClass}
		{termsUrl}
		customer={account?.customer}
		label="Book a class"
		purchase={(form) => {
			const item = classes.find((entry) => entry.id === field(form, 'classId'))!;
			return {
				kind: 'class',
				classId: item.id,
				expectedPriceMinor: item.priceMinor,
				...(field(form, 'membershipId') ? { membershipId: field(form, 'membershipId') } : {})
			};
		}}
	>
		{#snippet summary()}{#if classes.find((item) => item.id === classId)}{@const chosen =
					classes.find((item) => item.id === classId)!}
				<p>{chosen.name} · {money(chosen.priceMinor)}</p>{/if}{/snippet}
		<ItemSelect
			items={classes.map((item) => ({
				...item,
				name: `${item.name} · ${new Date(String(item.details.start)).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg', dateStyle: 'medium', timeStyle: 'short' })}`
			}))}
			name="classId"
			bind:value={classId}
			label="Class"
			class={fieldClass}
		/>

		<p class={noteClass}>If the class is full, you can join its waitlist without a charge.</p>
		{#if account}
			<label class={fieldClass}>
				Payment option
				<select class={controlClass} name="membershipId" value="">
					<option value="">Pay for this class</option>
					{#each account.memberships.filter((membership) => membership.status === 'active' && (membership.kind === 'membership' || membership.credits > 0)) as membership (membership.id)}
						<option value={membership.id}>
							{membership.name} · {membership.kind === 'membership'
								? 'Membership access'
								: `${membership.credits} credits remaining`}
						</option>
					{/each}
				</select>
			</label>
		{:else}
			<button
				type="button"
				class={actionClass}
				disabled={loadingAccount}
				onclick={() => void usePack()}
			>
				{loadingAccount ? 'Loading your packs…' : 'Use my pack or membership'}
			</button>
		{/if}
		{#if accountError}
			<p class={accountErrorClass} role="alert">
				{accountError} <a href="/account">Open customer account</a>
			</p>
		{/if}
	</CheckoutForm>
{/if}
