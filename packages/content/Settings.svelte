<script lang="ts">
	import { escapeHtml } from '@mywinkel/block-sdk/public/website/content';
	import Fields from '@mywinkel/block-sdk/editor/Fields.svelte';
	import { definition } from './definition';
	import type { BlockEditorProps } from '@mywinkel/block-sdk/contract';
	let { block, host, onchange }: BlockEditorProps = $props();
</script>

<Fields {block} fields={definition.fields} {onchange} />

<p class="mt-2 text-xs text-muted-foreground">
	Scripts, inline styles and unsafe markup are removed when saving.
</p>
<details class="mt-4">
	<summary class="cursor-pointer text-sm">Insert an image</summary>
	<div class="mt-3">
		<host.MediaPicker
			onselect={(media) => {
				if ('html' in block.props) {
					block.props.html += `<figure><img data-media-id="${escapeHtml(media.id)}" src="${escapeHtml(media.url)}" alt="${escapeHtml(media.alt)}"/></figure>`;
					onchange();
				}
			}}
		/>
	</div>
</details>
