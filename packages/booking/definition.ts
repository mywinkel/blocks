import { namedPartDefaults as sharedParts } from '@mywinkel/block-sdk/shared/parts';
import { namedPartDefaults } from './parts';
import { z } from 'zod';
import { defineBlock } from '@mywinkel/block-sdk/contract';
import { common, url } from '@mywinkel/block-sdk/fields';
export const definition = defineBlock({
	id: 'booking',
	label: 'Appointments',
	description: 'Appointments block',
	schema: z.object({ ...common, termsUrl: url.default('/terms') }).strict(),
	fields: [
		{ key: 'heading', label: 'Heading', type: 'text' },
		{ key: 'termsUrl', label: 'Terms page', type: 'url' }
	],
	parts: { ...sharedParts, ...namedPartDefaults },
	interactive: true,
	children: false
});
