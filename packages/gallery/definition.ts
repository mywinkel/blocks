import { namedPartDefaults } from './parts';
import { z } from 'zod';
import { defineBlock } from '@mywinkel/block-sdk/contract';
import { common, cardFields } from '@mywinkel/block-sdk/fields';
export const definition = defineBlock({
	id: 'gallery',
	label: 'Gallery',
	description: 'Show authored imagery as a grid or an accessible manual slideshow.',
	schema: z
		.object({
			...common,
			...cardFields,
			presentation: z.enum(['grid', 'slideshow']).default('grid')
		})
		.strict(),
	fields: [
		{
			key: 'presentation',
			label: 'Presentation',
			type: 'select',
			options: [
				{ value: 'grid', label: 'Grid' },
				{ value: 'slideshow', label: 'Manual slideshow' }
			]
		},
		{ key: 'heading', label: 'Heading', type: 'text' },
		{
			key: 'layout',
			label: 'Layout',
			type: 'select',
			options: [
				{ value: 'grid', label: 'Grid' },
				{ value: 'list', label: 'List' }
			]
		},
		{ key: 'columns', label: 'Columns', type: 'number', min: 1, max: 4 },
		{ key: 'showImages', label: 'Show images', type: 'checkbox' },
		{ key: 'showDescriptions', label: 'Show descriptions', type: 'checkbox' }
	],
	parts: { ...namedPartDefaults },
	interactive: true,
	children: false
});
