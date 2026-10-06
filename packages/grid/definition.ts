import { namedPartDefaults } from './parts';
import { z } from 'zod';
import { defineBlock } from '@mywinkel/block-sdk/contract';
import { common, cardFields } from '@mywinkel/block-sdk/fields';
export const definition = defineBlock({
	id: 'grid',
	label: 'Card grid',
	description: 'Arrange an authored set of cards and collection links.',
	schema: z.object({ ...common, ...cardFields }).strict(),
	fields: [
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
	interactive: false,
	children: false
});
