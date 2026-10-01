<script lang="ts">
	import { createClasses } from '@mywinkel/block-sdk/appearance.svelte';
	import type { AppearanceInput } from '@mywinkel/block-sdk/appearance';
	let {
		sections,
		appearance
	}: { sections: { heading: string; body: string }[]; appearance?: AppearanceInput } = $props();
	const cx = createClasses(() => appearance);
</script>

{#each sections as section, index (index)}<section
		class={cx('content.section', 'my-6 max-w-prose')}
	>
		<h2 class={cx('content.sectionHeading', 'text-xl font-medium')}>{section.heading}</h2>
		<p class={cx('content.sectionBody', 'mt-3 leading-relaxed whitespace-pre-line')}>
			{section.body}
		</p>
	</section>{/each}
