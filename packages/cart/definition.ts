import { namedPartDefaults as sharedParts } from '@mywinkel/block-sdk/shared/parts';
import { namedPartDefaults } from './parts';
import { z } from 'zod';
import { defineBlock } from '@mywinkel/block-sdk/contract';
import { common, url } from '@mywinkel/block-sdk/fields';
export const definition = defineBlock({
	id: 'cart',
	label: 'Shopping cart',
	description: 'Shopping cart block',
	schema: z
		.object({
			...common,
			termsUrl: url.default('/terms'),
			layout: z.enum(['full', 'summary', 'drawer']).default('full')
		})
		.strict(),
	fields: [
		{
			key: 'layout',
			label: 'Layout',
			type: 'select',
			options: [
				{ value: 'full', label: 'Catalogue and checkout' },
				{ value: 'summary', label: 'Bag and checkout' },
				{ value: 'drawer', label: 'Modal bag drawer' }
			]
		},
		{ key: 'heading', label: 'Heading', type: 'text' },
		{ key: 'termsUrl', label: 'Terms page', type: 'url' }
	],
	parts: { ...sharedParts, ...namedPartDefaults },
	interactive: true,
	children: false
});
