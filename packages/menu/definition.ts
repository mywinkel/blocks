import { namedPartDefaults } from './parts';
import { z } from 'zod';
import { defineBlock } from '@mywinkel/block-sdk/contract';
import { common } from '@mywinkel/block-sdk/fields';
import { menuItemSchema } from '@mywinkel/block-sdk/public/website/menu';
export const definition = defineBlock({
	id: 'menu',
	label: 'Menu',
	description: 'Menu block',
	schema: z
		.object({
			...common,
			menuItems: z.array(menuItemSchema).max(100).default([]),
			orientation: z.enum(['horizontal', 'vertical']).default('horizontal')
		})
		.strict(),
	fields: [
		{ key: 'heading', label: 'Heading', type: 'text' },
		{
			key: 'orientation',
			label: 'Orientation',
			type: 'select',
			options: [
				{ value: 'horizontal', label: 'Horizontal' },
				{ value: 'vertical', label: 'Vertical' }
			]
		}
	],
	parts: { ...namedPartDefaults },
	interactive: true,
	children: false
});
