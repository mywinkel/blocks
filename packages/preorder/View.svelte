<script lang="ts">
	import Single from './Single.svelte';
	import Menu from './Menu.svelte';
	import type { Catalogue } from '@mywinkel/block-sdk/public/storefront/contracts';
	import type { AppearanceInput } from '@mywinkel/block-sdk/appearance';
	import type { z } from 'zod';
	import { cardSchema } from '@mywinkel/block-sdk/fields';
	type Props = {
		initial?: Catalogue;
		termsUrl?: string;
		appearance?: AppearanceInput;
		presentation?: 'select' | 'menu' | 'boxes';
		cards?: z.infer<typeof cardSchema>[];
	};
	let { presentation = 'select', ...rest }: Props = $props();
</script>

{#if presentation === 'select'}<Single {...rest} />{:else}<Menu {...rest} {presentation} />{/if}
