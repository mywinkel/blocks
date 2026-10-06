import { namedPartDefaults } from './parts';
import { z } from 'zod';
import { defineBlock } from '@mywinkel/block-sdk/contract';
import { common, sourceFields } from '@mywinkel/block-sdk/fields';
export const definition = defineBlock({
	id: 'view',
	label: 'Content view',
	description: 'Publish a read-only snapshot of public catalogue records as editorial cards.',
	schema: z.object({ ...common, ...sourceFields }).strict(),
	fields: [
		{ key: 'heading', label: 'Heading', type: 'text' },
		{
			key: 'layout',
			label: 'Layout',
			type: 'select',
			options: [
				{ value: 'grid', label: 'Grid' },
				{ value: 'list', label: 'List' }
			]
		},
		{ key: 'columns', label: 'Columns', type: 'number', min: 1, max: 4 },
		{ key: 'showImages', label: 'Show images', type: 'checkbox' },
		{ key: 'showDescriptions', label: 'Show descriptions', type: 'checkbox' },
		{
			key: 'source',
			label: 'Public data source',
			type: 'select',
			options: [
				{ value: 'products', label: 'Products' },
				{ value: 'services', label: 'Services' },
				{ value: 'menus', label: 'Menu items' },
				{ value: 'classes', label: 'Classes' },
				{ value: 'rental-offer', label: 'Rental offers' },
				{ value: 'membership-offer', label: 'Membership offers' }
			]
		},
		{ key: 'search', label: 'Filter by text', type: 'text' },
		{
			key: 'sort',
			label: 'Sort',
			type: 'select',
			options: [
				{ value: 'name', label: 'Name A\u2013Z' },
				{ value: 'name-desc', label: 'Name Z\u2013A' },
				{ value: 'price', label: 'Price low to high' },
				{ value: 'price-desc', label: 'Price high to low' }
			]
		},
		{ key: 'limit', label: 'Display limit', type: 'number', min: 1, max: 100 },
		{ key: 'href', label: 'Item link', type: 'url' }
	],
	parts: { ...namedPartDefaults },
	interactive: false,
	children: false
});
