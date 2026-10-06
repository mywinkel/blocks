import { namedPartDefaults } from './parts';
import { z } from 'zod';
import { defineBlock } from '@mywinkel/block-sdk/contract';
import { common } from '@mywinkel/block-sdk/fields';
export const definition = defineBlock({
	id: 'page-content',
	label: 'Page content',
	description: 'Page content block',
	schema: z.object({ ...common, showHeading: z.boolean().default(true) }).strict(),
	fields: [
		{ key: 'heading', label: 'Heading', type: 'text' },
		{ key: 'showHeading', label: 'Show page heading', type: 'checkbox' }
	],
	parts: { ...namedPartDefaults },
	interactive: false,
	children: false
});
