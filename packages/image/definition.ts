import { namedPartDefaults } from './parts';
import { z } from 'zod';
import { defineBlock } from '@mywinkel/block-sdk/contract';
import { common, id, url } from '@mywinkel/block-sdk/fields';
export const definition = defineBlock({
	id: 'image',
	label: 'Image',
	description: 'Image block',
	schema: z
		.object({
			...common,
			src: url.default(''),
			mediaId: id.optional(),
			alt: z.string().max(500).default(''),
			caption: z.string().max(1000).default(''),
			href: url.default(''),
			showCaption: z.boolean().default(true)
		})
		.strict(),
	fields: [
		{ key: 'heading', label: 'Heading', type: 'text' },
		{ key: 'alt', label: 'Alternative text', type: 'text' },
		{ key: 'caption', label: 'Caption', type: 'text' },
		{ key: 'showCaption', label: 'Show caption', type: 'checkbox' },
		{ key: 'href', label: 'Image link', type: 'url' }
	],
	parts: { ...namedPartDefaults },
	interactive: false,
	children: false
});
