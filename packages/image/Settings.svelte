<script lang="ts">
	import Fields from '@mywinkel/block-sdk/editor/Fields.svelte';
	import { definition } from './definition';
	import type { BlockEditorProps } from '@mywinkel/block-sdk/contract';
	let { block, host, onchange }: BlockEditorProps = $props();
</script>

<Fields {block} fields={definition.fields} {onchange} />

{#if block.type === 'image'}<div class="mt-4">
		<host.MediaPicker
			url={block.props.src}
			onselect={(media) => {
				if (block.type === 'image') {
					block.props.mediaId = media.id;
					block.props.src = media.url;
					block.props.alt = media.alt;
					onchange();
				}
			}}
		/>
	</div>{/if}
