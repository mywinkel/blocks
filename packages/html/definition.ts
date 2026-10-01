import { namedPartDefaults } from './parts';
import { z } from 'zod';
import { defineBlock } from '@mywinkel/block-sdk/contract';
import { common } from '@mywinkel/block-sdk/fields';
export const definition = defineBlock({
	id: 'html',
	label: 'Custom HTML',
	description: 'Custom HTML block',
	schema: z.object({ ...common, html: z.string().max(50000).default('') }).strict(),
	fields: [
		{ key: 'heading', label: 'Heading', type: 'text' },
		{ key: 'html', label: 'HTML markup', type: 'textarea' }
	],
	parts: { ...namedPartDefaults },
	interactive: false,
	children: false
});
