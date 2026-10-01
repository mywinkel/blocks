import { namedPartDefaults as sharedParts } from '@mywinkel/block-sdk/shared/parts';
import { namedPartDefaults } from './parts';
import { z } from 'zod';
import { defineBlock } from '@mywinkel/block-sdk/contract';
import { common } from '@mywinkel/block-sdk/fields';
export const definition = defineBlock({
	id: 'enquiry',
	label: 'Enquiry',
	description: 'Enquiry block',
	schema: z.object({ ...common }).strict(),
	fields: [{ key: 'heading', label: 'Heading', type: 'text' }],
	parts: { ...sharedParts, ...namedPartDefaults },
	interactive: true,
	children: false
});
