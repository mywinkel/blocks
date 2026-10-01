import { namedPartDefaults } from './parts';
import { z } from 'zod';
import { defineBlock } from '@mywinkel/block-sdk/contract';
import { common, id } from '@mywinkel/block-sdk/fields';
export const definition = defineBlock({
	id: 'component',
	label: 'Site component',
	description: 'Site component block',
	schema: z
		.object({
			...common,
			componentId: id.optional(),
			configuration: z
				.record(id, z.union([z.string().max(50000), z.number().finite(), z.boolean()]))
				.default({})
		})
		.strict(),
	fields: [{ key: 'heading', label: 'Heading', type: 'text' }],
	parts: { ...namedPartDefaults },
	interactive: false,
	children: false
});
