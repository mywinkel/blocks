<script lang="ts">
	import { sanitizeHtml } from '@mywinkel/block-sdk/public/website/content';
	import { createClasses } from '../appearance.svelte';
	import type { AppearanceInput } from '../appearance';
	let {
		html,
		preview = false,
		appearance
	}: { html: string; preview?: boolean; appearance?: AppearanceInput } = $props();
	const cx = createClasses(() => appearance);
</script>

<div
	class={cx(
		'content.body',
		'max-w-[75ch] leading-relaxed wrap-anywhere focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring [&_a]:underline [&_a]:underline-offset-4 [&_h1]:mt-6 [&_h1]:text-3xl [&_h1]:text-balance [&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:text-balance [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:text-balance [&_img]:h-auto [&_img]:max-w-full [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&>*+*]:mt-4'
	)}
	contenteditable={preview ? 'true' : undefined}
	data-cms-field={preview ? 'html' : undefined}
	role={preview ? 'textbox' : undefined}
	aria-label={preview ? 'Edit text' : undefined}
	aria-multiline={preview ? 'true' : undefined}
>
	<!-- Only the shared allowlist sanitizer may supply rich HTML. -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html sanitizeHtml(html)}
</div>
