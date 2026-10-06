import { namedPartDefaults as sharedParts } from '@mywinkel/block-sdk/shared/parts';
import { namedPartDefaults } from './parts';
import { z } from 'zod';
import { defineBlock } from '@mywinkel/block-sdk/contract';
import { common, url } from '@mywinkel/block-sdk/fields';
export const definition = defineBlock({
	id: 'enquiry',
	label: 'Enquiry',
	description: 'Enquiry block',
	schema: z
		.object({
			...common,
			termsUrl: url.default('/terms'),
			subjectLabel: z.string().max(200).default('Subject'),
			detailsLabel: z.string().max(200).default('What can we help with?'),
			detailsPlaceholder: z.string().max(500).default(''),
			submitLabel: z.string().max(100).default('Send enquiry'),
			staged: z.boolean().default(false),
			serviceFirst: z.boolean().default(false),
			source: z.enum(['none', 'services']).default('none')
		})
		.strict(),
	fields: [
		{ key: 'heading', label: 'Heading', type: 'text' },
		...['subjectLabel', 'detailsLabel', 'detailsPlaceholder', 'submitLabel'].map((key) => ({
			key,
			label: key,
			type: 'text' as const
		})),
		{ key: 'termsUrl', label: 'Terms page', type: 'url' },
		{ key: 'staged', label: 'Brief before contact details', type: 'checkbox' },
		{ key: 'serviceFirst', label: 'Start with a compact service choice', type: 'checkbox' },
		{
			key: 'source',
			label: 'Service choices',
			type: 'select',
			options: [
				{ value: 'none', label: 'None' },
				{ value: 'services', label: 'Services' }
			]
		}
	],
	parts: { ...sharedParts, ...namedPartDefaults },
	interactive: true,
	children: false
});
