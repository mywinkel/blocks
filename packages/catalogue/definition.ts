import { namedPartDefaults } from './parts';
import { z } from 'zod';
import { defineBlock } from '@mywinkel/block-sdk/contract';
import { common, sourceFields, url } from '@mywinkel/block-sdk/fields';
export const definition = defineBlock({
	id: 'catalogue',
	label: 'Catalogue',
	description:
		'Shop public products, services, menus and offers with prices, details and purchase actions.',
	schema: z
		.object({
			...common,
			...sourceFields,
			sort: z.enum(['name', 'name-desc', 'price', 'price-desc', 'start']).default('name'),
			upcomingOnly: z.boolean().default(false),
			showControls: z.boolean().default(true),
			showPrices: z.boolean().default(true),
			action: z.enum(['auto', 'cart', 'select', 'enquiry', 'none']).default('auto'),
			actionHref: url.default('#checkout')
		})
		.strict(),
	fields: [
		{ key: 'upcomingOnly', label: 'Upcoming classes only', type: 'checkbox' },
		{
			key: 'showControls',
			label: 'Search, filter and sort controls',
			type: 'checkbox'
		},
		{ key: 'showPrices', label: 'Show prices', type: 'checkbox' },
		{
			key: 'action',
			label: 'Item action',
			type: 'select',
			options: ['auto', 'cart', 'select', 'enquiry', 'none'].map((value) => ({
				value,
				label: value
			}))
		},
		{ key: 'actionHref', label: 'Checkout / enquiry section', type: 'url' },
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
				{ value: 'start', label: 'Soonest session first' },
				{ value: 'name-desc', label: 'Name Z\u2013A' },
				{ value: 'price', label: 'Price low to high' },
				{ value: 'price-desc', label: 'Price high to low' }
			]
		},
		{ key: 'limit', label: 'Display limit', type: 'number', min: 1, max: 100 },
		{ key: 'href', label: 'Item link', type: 'url' }
	],
	parts: { ...namedPartDefaults },
	interactive: true,
	children: false
});
