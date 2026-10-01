<script lang="ts">
	import {
		ArrowDown,
		ArrowUp,
		CornerDownRight,
		CornerUpLeft,
		GripVertical,
		Plus,
		Trash2
	} from '@lucide/svelte';
	import { Button } from '@mywinkel/block-sdk/editor/ui';
	import { Input } from '@mywinkel/block-sdk/editor/ui';
	import { NativeSelect } from '@mywinkel/block-sdk/editor/ui';
	import type { Block, MenuItem, SiteEntry } from '@mywinkel/block-sdk/public/website/contracts';
	let {
		block,
		entries,
		onchange
	}: { block: Extract<Block, { type: 'menu' }>; entries: SiteEntry[]; onchange: () => void } =
		$props();
	let search = $state(''),
		href = $state(''),
		label = $state(''),
		error = $state(''),
		dragging = $state('');
	const pages = $derived(
		entries.filter(
			(entry) =>
				(entry.document.kind === 'page' || entry.document.kind === 'alias') &&
				`${entry.document.name} ${entry.document.kind === 'page' || entry.document.kind === 'alias' ? entry.document.slug : ''}`
					.toLowerCase()
					.includes(search.toLowerCase())
		)
	);
	function add(pageId?: string) {
		if (!pageId && (!label.trim() || !/^https:\/\/|^\/(?!\/)|^#|^mailto:|^tel:/.test(href))) {
			error = 'Add a label and a website address, section anchor, or HTTPS link.';
			return;
		}
		block.props.menuItems.push({
			id: crypto.randomUUID(),
			pageId,
			href: pageId ? '' : href,
			label: pageId ? '' : label.trim(),
			children: []
		});
		href = '';
		label = '';
		error = '';
		onchange();
	}
	function location(
		id: string,
		items = block.props.menuItems,
		parent?: MenuItem
	): { items: MenuItem[]; index: number; parent?: MenuItem } | undefined {
		for (let index = 0; index < items.length; index++) {
			if (items[index].id === id) return { items, index, parent };
			const found = location(id, items[index].children, items[index]);
			if (found) return found;
		}
	}
	function move(id: string, delta: number) {
		const found = location(id);
		if (!found) return;
		const to = found.index + delta;
		if (to < 0 || to >= found.items.length) return;
		[found.items[found.index], found.items[to]] = [found.items[to], found.items[found.index]];
		onchange();
	}
	function indent(id: string) {
		const found = location(id);
		if (!found || !found.index) return;
		const [item] = found.items.splice(found.index, 1);
		found.items[found.index - 1].children.push(item);
		onchange();
	}
	function outdent(id: string) {
		const found = location(id);
		if (!found?.parent) return;
		const parent = location(found.parent.id);
		if (!parent) return;
		const [item] = found.items.splice(found.index, 1);
		parent.items.splice(parent.index + 1, 0, item);
		onchange();
	}
	function remove(id: string) {
		const found = location(id);
		if (found) {
			found.items.splice(found.index, 1);
			onchange();
		}
	}
	function contains(item: MenuItem, id: string): boolean {
		return item.id === id || item.children.some((child) => contains(child, id));
	}
	function drop(targetId: string, event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		const from = location(dragging),
			to = location(targetId);
		dragging = '';
		if (!from || !to) return;
		const item = from.items[from.index],
			target = to.items[to.index];
		if (contains(item, targetId)) return;
		const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect(),
			nested = event.clientY - bounds.top > bounds.height * 0.3;
		from.items.splice(from.index, 1);
		if (nested) target.children.push(item);
		else {
			const next = location(targetId);
			next?.items.splice(next.index, 0, item);
		}
		onchange();
	}
</script>

<div class="space-y-4">
	<label class="block space-y-1 text-sm"
		>Menu direction<NativeSelect class="w-full" bind:value={block.props.orientation} {onchange}
			><option value="horizontal">Horizontal</option><option value="vertical">Vertical</option
			></NativeSelect
		></label
	>
	<div class="space-y-2">
		<label class="text-sm font-medium" for="menu-page-search">Add pages</label><Input
			id="menu-page-search"
			bind:value={search}
			placeholder="Search names or addresses…"
		/>
		<div class="max-h-44 overflow-y-auto rounded-md border">
			{#each pages as entry (entry.document.id)}<button
					class="flex w-full cursor-pointer items-center justify-between gap-2 border-b px-3 py-2 text-left text-xs last:border-b-0 hover:bg-muted"
					onclick={() => add(entry.document.id)}
					><span class="min-w-0 truncate"
						>{entry.document.name}{#if entry.document.kind === 'alias'}
							· Alias{/if}</span
					><Plus class="size-3.5 shrink-0" /></button
				>{:else}<p class="p-3 text-xs text-muted-foreground">No matching pages.</p>{/each}
		</div>
	</div>
	<details class="rounded-md border p-3">
		<summary class="cursor-pointer text-sm font-medium">Add a custom link</summary>
		<div class="mt-3 space-y-3">
			<label class="block space-y-1 text-xs">Label<Input bind:value={label} /></label><label
				class="block space-y-1 text-xs"
				>Destination<Input bind:value={href} placeholder="/shop, #contact, or https://…" /></label
			><Button size="sm" variant="outline" onclick={() => add()}>Add link</Button>{#if error}<p
					role="alert"
					class="text-xs text-destructive"
				>
					{error}
				</p>{/if}
		</div>
	</details>
	<div>
		<h3 class="mb-2 text-sm font-medium">Menu links</h3>
		<p class="mb-3 text-xs text-muted-foreground">
			Drag onto a link to nest it, or use the arrow controls. Empty page labels follow the page
			name.
		</p>
		{#if !block.props.menuItems.length}<p
				class="rounded-md border border-dashed p-4 text-xs text-muted-foreground"
			>
				Add a page or custom link to start this menu.
			</p>{/if}{@render items(block.props.menuItems)}
	</div>
</div>
{#snippet items(list: MenuItem[], depth = 0)}
	<ol class="space-y-2" class:ml-3={depth > 0}>
		{#each list as item, index (item.id)}
			<li>
				<!-- All drag operations have adjacent keyboard buttons. -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="rounded-md border bg-background p-2"
					ondragover={(event) => {
						event.preventDefault();
						event.stopPropagation();
					}}
					ondrop={(event) => drop(item.id, event)}
				>
					<div class="flex items-center gap-1">
						<button
							draggable
							class="cursor-grab cursor-pointer rounded p-1 text-muted-foreground"
							aria-label="Drag menu link"
							ondragstart={(event) => {
								dragging = item.id;
								event.dataTransfer?.setData('text/plain', item.id);
								event.stopPropagation();
							}}
							ondragend={() => (dragging = '')}><GripVertical class="size-4" /></button
						><Input
							aria-label="Menu link label"
							placeholder={entries.find((entry) => entry.document.id === item.pageId)?.document
								.name ?? 'Link label'}
							bind:value={item.label}
							oninput={onchange}
							class="h-8 min-w-0 flex-1"
						/><Button
							size="icon"
							variant="ghost"
							aria-label="Remove menu link"
							onclick={() => remove(item.id)}><Trash2 class="size-3.5" /></Button
						>
					</div>
					{#if !item.pageId}<Input
							class="mt-2 h-8 text-xs"
							aria-label="Menu link destination"
							bind:value={item.href}
							oninput={onchange}
						/>{/if}
					<div class="mt-1 flex gap-1">
						<Button
							size="icon"
							variant="ghost"
							disabled={index === 0}
							aria-label="Move menu link up"
							onclick={() => move(item.id, -1)}><ArrowUp class="size-3.5" /></Button
						><Button
							size="icon"
							variant="ghost"
							disabled={index === list.length - 1}
							aria-label="Move menu link down"
							onclick={() => move(item.id, 1)}><ArrowDown class="size-3.5" /></Button
						><Button
							size="icon"
							variant="ghost"
							disabled={index === 0}
							aria-label="Nest menu link"
							onclick={() => indent(item.id)}><CornerDownRight class="size-3.5" /></Button
						><Button
							size="icon"
							variant="ghost"
							disabled={!depth}
							aria-label="Unnest menu link"
							onclick={() => outdent(item.id)}><CornerUpLeft class="size-3.5" /></Button
						>
					</div>
				</div>
				{#if item.children.length}<div class="mt-2">
						{@render items(item.children, depth + 1)}
					</div>{/if}
			</li>{/each}
	</ol>
{/snippet}
