<script lang="ts">
	import type { ResolvedMenuItem } from '@mywinkel/block-sdk/public/website/menu';
	import { createClasses } from '@mywinkel/block-sdk/appearance.svelte';
	let { item }: { item: ResolvedMenuItem } = $props();
	const cx = createClasses();
</script>

{#snippet node(link: ResolvedMenuItem)}
	<li class={cx('menu.item', 'list-none')}>
		<div class={cx('menu.itemRow', 'relative block sm:flex sm:items-center sm:gap-1')}>
			<a
				class={cx(
					'menu.link',
					'block rounded-md px-3 py-2.5 pr-10 no-underline hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:pr-3'
				)}
				href={link.href}>{link.label}</a
			>
			{#if link.children.length}<details class={cx('menu.disclosure', 'static')}>
					<summary
						class={cx(
							'menu.toggle',
							'absolute top-0 right-0 cursor-pointer list-none p-2.5 focus-visible:outline-2 focus-visible:outline-ring sm:static [&::-webkit-details-marker]:hidden'
						)}
						aria-label={`Show ${link.label} submenu`}
					>
						<svg
							aria-hidden="true"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							class={cx('menu.icon', 'size-4')}><path d="m4 6 4 4 4-4" stroke-width="1.5" /></svg
						></summary
					>
					<ul
						class={cx(
							'menu.submenu',
							'static ml-3 border-l border-border bg-background p-1.5 text-foreground sm:absolute sm:top-full sm:left-0 sm:z-10 sm:m-0 sm:min-w-48 sm:rounded-md sm:border'
						)}
					>
						{#each link.children as child (child.id)}{@render node(child)}{/each}
					</ul>
				</details>{/if}
		</div>
	</li>
{/snippet}
{@render node(item)}
