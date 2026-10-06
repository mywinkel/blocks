<script lang="ts">
	import { tick } from 'svelte';
	import type { Catalogue } from '@mywinkel/block-sdk/public/storefront/contracts';
	import type { AppearanceInput } from '@mywinkel/block-sdk/appearance';
	import { createClasses } from '@mywinkel/block-sdk/appearance.svelte';
	import { useCatalogue } from '@mywinkel/block-sdk/shared/catalogue.svelte';
	import { cartQuantities, subscribeSelection } from '@mywinkel/block-sdk/shared/selection';
	import { money } from '@mywinkel/block-sdk/shared/forms';
	import { namedPartDefaults as parts } from './parts';
	import Panel from './Panel.svelte';
	type Props = {
		initial?: Catalogue;
		termsUrl?: string;
		appearance?: AppearanceInput;
		layout?: 'full' | 'summary' | 'drawer';
		class?: string;
		className?: string;
	};
	let { layout = 'full', ...rest }: Props = $props();
	const cx = createClasses(() => rest.appearance),
		catalogue = useCatalogue(() => rest.initial);
	let quantities = $state<Record<string, number>>({});
	let dialog = $state<HTMLDialogElement>();
	// Keep the mounted form after closing. Its idempotency key, draft and uncertain
	// submission must survive Escape/close followed by reopening the drawer.
	let mounted = $state(false);
	const items = $derived(
		catalogue.data?.items.filter((item) => item.type === 'products' && quantities[item.id]) ?? []
	);
	const count = $derived(items.reduce((sum, item) => sum + quantities[item.id], 0)),
		total = $derived(items.reduce((sum, item) => sum + quantities[item.id] * item.priceMinor, 0));
	$effect(() => {
		if (!catalogue.data) return;
		return subscribeSelection(
			catalogue.data.tenantId,
			'cart',
			(value) => (quantities = cartQuantities(value))
		);
	});
	async function show() {
		mounted = true;
		await tick();
		dialog?.showModal();
	}
</script>

{#if layout === 'drawer'}
	<button
		type="button"
		class={cx('cart.drawer-trigger', parts['cart.drawer-trigger'])}
		onclick={() => void show()}
		aria-haspopup="dialog">Bag ({count}) · {money(total)}</button
	>
	{#if mounted}<dialog
			bind:this={dialog}
			class={cx('cart.drawer', parts['cart.drawer'])}
			aria-label="Your bag"
		>
			<button
				type="button"
				class={cx('cart.drawer-close', parts['cart.drawer-close'])}
				onclick={() => dialog?.close()}
				aria-label="Close bag">Close ×</button
			>
			<Panel {...rest} initial={catalogue.data} layout="summary" />
		</dialog>{/if}
{:else}<Panel {...rest} {layout} />{/if}
