<script lang="ts">
	import Cards from '@mywinkel/block-sdk/shared/Cards.svelte';
	import type { BlockViewProps } from '@mywinkel/block-sdk/contract';
	let settings: BlockViewProps = $props();
</script>

<Cards {...settings} />
