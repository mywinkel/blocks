<script lang="ts">
	import { onMount } from 'svelte';
	import type { ResolvedMenuItem } from '@mywinkel/block-sdk/public/website/menu';
	import type { AppearanceInput } from '@mywinkel/block-sdk/appearance';

	import { createClasses } from '@mywinkel/block-sdk/appearance.svelte';
	import MenuItem from './MenuItem.svelte';
	let {
		items,
		heading = '',
		orientation = 'horizontal',
		preview = false,
		appearance
	}: {
		items: ResolvedMenuItem[];
		heading?: string;
		orientation?: 'horizontal' | 'vertical';
		preview?: boolean;
		appearance?: AppearanceInput;
	} = $props();
	const cx = createClasses(() => appearance);
	let open = $state(true);
	onMount(() => {
		const query = matchMedia('(max-width:639px)');
		const update = () => {
			open = !query.matches;
		};
		update();
		query.addEventListener('change', update);
		return () => query.removeEventListener('change', update);
	});
	function keyboard(node: HTMLDetailsElement) {
		const keydown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				const target = event.target as Element;
				const disclosure = target.closest('details');
				if (disclosure === node && matchMedia('(min-width:640px)').matches) return;
				if (disclosure instanceof HTMLDetailsElement && disclosure.open) {
					disclosure.open = false;
					disclosure.querySelector('summary')?.focus();
				}
			}
		};
		node.addEventListener('keydown', keydown);
		return { destroy: () => node.removeEventListener('keydown', keydown) };
	}
</script>

<details class={cx('menu.root', 'min-w-0')} bind:open use:keyboard>
	<summary
		class={cx(
			'menu.summary',
			'w-fit cursor-pointer list-inside rounded-md border border-border p-3 sm:hidden'
		)}>{heading || 'Menu'}</summary
	>
	<nav
		class={cx('menu.navigation', '')}
		aria-label={`${preview ? 'Website preview: ' : ''}${heading || 'Main navigation'}`}
	>
		<ul
			class={cx(
				'menu.list',
				`m-0 flex list-none flex-col flex-wrap gap-1 p-0 pt-3 sm:pt-0 ${orientation === 'horizontal' ? 'sm:flex-row' : 'sm:items-start'}`
			)}
		>
			{#each items as item (item.id)}<MenuItem {item} />{/each}
		</ul>
		{#if preview && !items.length}<p class={cx('menu.empty', 'text-sm text-muted-foreground')}>
				Add page links in menu settings.
			</p>{/if}
	</nav>
</details>
