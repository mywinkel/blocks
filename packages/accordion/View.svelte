<script lang="ts">
	import type { z } from 'zod';
	import type { BlockViewProps } from '@mywinkel/block-sdk/contract';
	import { createClasses } from '@mywinkel/block-sdk/appearance.svelte';
	import { definition } from './definition';
	import { namedPartDefaults as parts } from './parts';
	let { block, appearance }: BlockViewProps = $props();
	const settings = $derived(block.props as z.infer<typeof definition.schema>);
	const cx = createClasses(() => appearance);
	const group = $props.id();
</script>

<div class={cx('accordion.root', parts['accordion.root'])}>
	{#if settings.heading}<h2 class={cx('accordion.heading', parts['accordion.heading'])}>
			{settings.heading}
		</h2>{/if}
	<div class={cx('accordion.list', parts['accordion.list'])}>
		{#each settings.cards as card, index (card.id)}
			<details
				class={cx('accordion.item', parts['accordion.item'])}
				name={settings.allowMultiple ? undefined : group}
				open={settings.openFirst && index === 0}
			>
				<summary class={cx('accordion.trigger', parts['accordion.trigger'])}>
					{card.title}<span
						class={cx('accordion.indicator', parts['accordion.indicator'])}
						aria-hidden="true">+</span
					>
				</summary>
				<div class={cx('accordion.body', parts['accordion.body'])}>
					{#if card.image}<img
							class={cx('accordion.image', parts['accordion.image'])}
							src={card.image}
							alt={card.alt}
							loading="lazy"
						/>{/if}
					<p>{card.text}</p>
					{#if card.href}<a class={cx('accordion.link', parts['accordion.link'])} href={card.href}
							>Read more</a
						>{/if}
				</div>
			</details>
		{:else}<p class={cx('accordion.empty', parts['accordion.empty'])}>
				Add an answer to this accordion.
			</p>{/each}
	</div>
</div>
