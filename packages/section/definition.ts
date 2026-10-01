import { namedPartDefaults } from './parts';
import { z } from 'zod';
import { defineBlock } from '@mywinkel/block-sdk/contract';
import { common } from '@mywinkel/block-sdk/fields';
export const definition = defineBlock({
	id: 'section',
	label: 'Section',
	description: 'Section block',
	schema: z
		.object({
			...common,
			role: z.enum(['header', 'footer', 'section']).default('section'),
			showBranding: z.boolean().default(false)
		})
		.strict(),
	fields: [
		{ key: 'heading', label: 'Heading', type: 'text' },
		{
			key: 'role',
			label: 'Section role',
			type: 'select',
			options: [
				{ value: 'section', label: 'Section' },
				{ value: 'header', label: 'Header' },
				{ value: 'footer', label: 'Footer' }
			]
		},
		{ key: 'showBranding', label: 'Show store name and logo', type: 'checkbox' }
	],
	parts: { ...namedPartDefaults },
	interactive: false,
	children: true
});
