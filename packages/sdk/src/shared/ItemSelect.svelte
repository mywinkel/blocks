<script lang="ts">
	import type { CatalogueItem } from '@mywinkel/block-sdk/public/storefront/contracts';
	import { createClasses } from '../appearance.svelte';
	import { money } from './forms';
	import { namedPartDefaults } from './parts';

	type Props = {
		items: CatalogueItem[];
		name: string;
		label: string;
		required?: boolean;
		class?: string;
		className?: string;
	};

	let {
		items,
		name,
		label,
		required = true,
		class: className = '',
		className: legacyClass = ''
	}: Props = $props();
	const cx = createClasses();
	let extraClass = $derived(`${className} ${legacyClass}`.trim());
</script>

<label class={`${cx('item-select.label', namedPartDefaults['item-select.label'])} ${extraClass}`}>
	{label}
	<select
		class={cx('item-select.control', namedPartDefaults['item-select.control'])}
		{name}
		{required}
		value=""
	>
		<option
			class={cx('item-select.option', namedPartDefaults['item-select.option'])}
			value=""
			disabled
		>
			Choose an option
		</option>
		{#each items as item (item.id)}
			<option
				class={cx('item-select.option', namedPartDefaults['item-select.option'])}
				value={item.id}
			>
				{item.name} · {money(item.priceMinor)}
			</option>
		{/each}
	</select>
</label>
