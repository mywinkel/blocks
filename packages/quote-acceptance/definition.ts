import { namedPartDefaults as accountParts } from '@mywinkel/block-sdk/shared/account-parts';
import { namedPartDefaults as sharedParts } from '@mywinkel/block-sdk/shared/parts';
import { namedPartDefaults } from './parts';
import { z } from 'zod';
import { defineBlock } from '@mywinkel/block-sdk/contract';
import { common } from '@mywinkel/block-sdk/fields';
export const definition = defineBlock({
	id: 'quote-acceptance',
	label: 'Quote acceptance',
	description: 'Quote acceptance block',
	schema: z.object({ ...common, quoteId: z.string().max(100).default('') }).strict(),
	fields: [
		{ key: 'heading', label: 'Heading', type: 'text' },
		{ key: 'quoteId', label: 'Quote ID', type: 'text' }
	],
	parts: { ...sharedParts, ...accountParts, ...namedPartDefaults },
	interactive: true,
	children: false
});
