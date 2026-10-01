import { namedPartDefaults } from './parts';
import { z } from 'zod';
import { defineBlock } from '@mywinkel/block-sdk/contract';
import { common } from '@mywinkel/block-sdk/fields';
export const definition = defineBlock({
	id: 'page-content',
	label: 'Page content',
	description: 'Page content block',
	schema: z.object({ ...common }).strict(),
	fields: [{ key: 'heading', label: 'Heading', type: 'text' }],
	parts: { ...namedPartDefaults },
	interactive: false,
	children: false
});
