import { namedPartDefaults } from './parts';
import { z } from 'zod';
import { defineBlock } from '@mywinkel/block-sdk/contract';
import { common, id } from '@mywinkel/block-sdk/fields';
export const definition = defineBlock({
	id: 'form',
	label: 'Form',
	description: 'Form block',
	schema: z.object({ ...common, formId: id.optional() }).strict(),
	fields: [{ key: 'heading', label: 'Heading', type: 'text' }],
	parts: { ...namedPartDefaults },
	interactive: true,
	children: false
});
