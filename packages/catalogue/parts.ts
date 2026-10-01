export const namedPartDefaults = {
	'cards.heading': 'mb-6 text-3xl font-medium text-balance',
	'cards.item': 'min-w-0',
	'cards.image': 'h-auto max-w-full object-cover',
	'cards.title': 'my-3 text-lg font-medium',
	'cards.link':
		'underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4',
	'cards.description': 'max-w-prose leading-relaxed',
	'cards.empty': 'text-sm text-muted-foreground',
	'catalogue.list': 'grid list-none gap-8 p-0 sm:grid-cols-2 lg:grid-cols-3',
	'catalogue.item': 'min-w-0',
	'catalogue.link': 'block space-y-3 focus-visible:outline-2 focus-visible:outline-offset-4',
	'catalogue.title': 'text-lg font-medium',
	'catalogue.description': 'max-w-prose text-sm text-muted-foreground',
	'cards.grid': 'grid gap-8',
	'price.value': 'tabular-nums'
} as const;
