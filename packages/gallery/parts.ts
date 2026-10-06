export const namedPartDefaults = {
	'gallery.root': 'py-10',
	'gallery.slide': 'min-w-0',
	'gallery.image': 'aspect-[4/3] w-full object-cover',
	'gallery.controls': 'mt-4 flex items-center justify-between gap-4',
	'gallery.button':
		'min-h-11 border border-border px-4 py-2 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-4',
	'gallery.status': 'text-sm tabular-nums',
	'cards.heading': 'mb-6 text-3xl font-medium text-balance',
	'cards.item': 'min-w-0',
	'cards.image': 'h-auto max-w-full object-cover',
	'cards.title': 'my-3 text-lg font-medium',
	'cards.link':
		'underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4',
	'cards.description': 'max-w-prose leading-relaxed',
	'cards.empty': 'text-sm text-muted-foreground',
	'cards.grid': 'grid gap-8'
} as const;
