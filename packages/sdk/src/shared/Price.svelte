<script lang="ts">
	import { createClasses } from '../appearance.svelte';
	import type { AppearanceInput } from '../appearance';
	let {
		minor,
		currency = 'ZAR',
		class: className = '',
		appearance
	}: { minor: number; currency?: string; class?: string; appearance?: AppearanceInput } = $props();
	const cx = createClasses(() => appearance);
	const price = $derived.by(() => {
		if (!Number.isSafeInteger(minor)) throw new Error('Price expects an integer number of cents.');
		return new Intl.NumberFormat('en-ZA', { style: 'currency', currency }).format(minor / 100);
	});
</script>

<span class={cx('price.value', `tabular-nums ${className}`)}>{price}</span>
