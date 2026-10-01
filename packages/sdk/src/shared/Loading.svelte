<script lang="ts">
	import { createClasses } from '../appearance.svelte';
	import { namedPartDefaults } from './parts';

	let { error = '' }: { error?: string } = $props();
	const cx = createClasses();

	function reload() {
		if (typeof location !== 'undefined') location.reload();
	}
</script>

{#if error}
	<p class={cx('loading.error', namedPartDefaults['loading.error'])} role="alert">
		{error}
		<button
			type="button"
			class={cx('loading.reload', namedPartDefaults['loading.reload'])}
			onclick={reload}>Reload</button
		>
	</p>
{:else}
	<p class={cx('loading.status', namedPartDefaults['loading.status'])} role="status">
		Loading available options…
	</p>
{/if}
