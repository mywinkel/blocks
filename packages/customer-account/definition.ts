import { namedPartDefaults as quoteParts } from '@mywinkel/block-quote-acceptance/parts';
import { namedPartDefaults as accountParts } from '@mywinkel/block-sdk/shared/account-parts';
import { namedPartDefaults as sharedParts } from '@mywinkel/block-sdk/shared/parts';
import { namedPartDefaults } from './parts';
import { z } from 'zod';
import { defineBlock } from '@mywinkel/block-sdk/contract';
import { common } from '@mywinkel/block-sdk/fields';
export const definition = defineBlock({
	id: 'customer-account',
	label: 'Customer account',
	description: 'Customer account block',
	schema: z.object({ ...common }).strict(),
	fields: [{ key: 'heading', label: 'Heading', type: 'text' }],
	parts: { ...quoteParts, ...sharedParts, ...accountParts, ...namedPartDefaults },
	interactive: true,
	children: false
});
