import { namedPartDefaults as sharedParts } from '@mywinkel/block-sdk/shared/parts';
import { namedPartDefaults } from './parts';
import { z } from 'zod';
import { defineBlock } from '@mywinkel/block-sdk/contract';
import { common, url, cardFields } from '@mywinkel/block-sdk/fields';
export const definition = defineBlock({
	id: 'preorder',
	label: 'Pre-orders',
	description: 'Pre-orders block',
	schema: z
		.object({
			...common,
			termsUrl: url.default('/terms'),
			cards: cardFields.cards,
			presentation: z.enum(['select', 'menu', 'boxes']).default('select')
		})
		.strict(),
	fields: [
		{
			key: 'presentation',
			label: 'Menu presentation',
			type: 'select',
			options: [
				{ value: 'select', label: 'Single dish' },
				{ value: 'menu', label: 'Mixed menu' },
				{ value: 'boxes', label: 'Expandable meal boxes' }
			]
		},
		{ key: 'heading', label: 'Heading', type: 'text' },
		{ key: 'termsUrl', label: 'Terms page', type: 'url' }
	],
	parts: { ...sharedParts, ...namedPartDefaults },
	interactive: true,
	children: false
});
