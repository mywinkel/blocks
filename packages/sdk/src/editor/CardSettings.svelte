<script lang="ts">
	import { Input, Textarea, Button } from './ui';
	import type { BlockEditorProps } from '../contract';
	let { block, host, onchange }: BlockEditorProps = $props();
	const settings = $derived('cards' in block.props ? block.props : null);
	function move(index: number, delta: number) {
		if (!settings) return;
		const next = index + delta;
		if (next < 0 || next >= settings.cards.length) return;
		[settings.cards[index], settings.cards[next]] = [settings.cards[next], settings.cards[index]];
		onchange();
	}
</script>

{#if settings}<div class="mt-4 space-y-4">
		{#each settings.cards as card, index (card)}<fieldset class="space-y-3 border-t pt-4">
				<legend class="text-sm font-medium">Item {index + 1}</legend>
				{#if block.type === 'catalogue' || block.type === 'preorder'}
					<label class="block space-y-1 text-xs"
						>Public item ID<Input bind:value={card.id} oninput={onchange} /></label
					>
					<p class="text-xs text-muted-foreground">
						Match the product, service, menu or offer ID. Images are presentation only; prices and
						names come from the public catalogue.
					</p>
				{/if}
				<label class="block space-y-1 text-xs"
					>Title<Input bind:value={card.title} oninput={onchange} /></label
				>
				<label class="block space-y-1 text-xs"
					>Text<Textarea bind:value={card.text} oninput={onchange} /></label
				>
				<host.MediaPicker
					url={card.image}
					onselect={(media) => {
						card.mediaId = media.id;
						card.image = media.url;
						card.alt = media.alt;
						onchange();
					}}
				/>
				<label class="block space-y-1 text-xs"
					>Alternative text<Input bind:value={card.alt} oninput={onchange} /></label
				>
				<label class="block space-y-1 text-xs"
					>Link<Input bind:value={card.href} oninput={onchange} /></label
				>
				<div class="flex flex-wrap gap-2">
					<Button size="sm" variant="outline" disabled={index === 0} onclick={() => move(index, -1)}
						>Move up</Button
					><Button
						size="sm"
						variant="outline"
						disabled={index === settings.cards.length - 1}
						onclick={() => move(index, 1)}>Move down</Button
					><Button
						size="sm"
						variant="ghost"
						onclick={() => {
							settings.cards.splice(index, 1);
							onchange();
						}}>Remove item</Button
					>
				</div>
			</fieldset>{/each}
		<Button
			variant="outline"
			onclick={() => {
				settings.cards.push({
					id: crypto.randomUUID(),
					title: '',
					text: '',
					image: '',
					alt: '',
					href: ''
				});
				onchange();
			}}>Add item</Button
		>
	</div>{/if}
