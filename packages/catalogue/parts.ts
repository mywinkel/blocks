export const namedPartDefaults = {
	'catalogue.root': 'py-10',
	'catalogue.controls': 'mb-8 flex flex-wrap items-end gap-4',
	'catalogue.field': 'grid min-w-0 gap-2 text-sm',
	'catalogue.control':
		'min-h-11 rounded border border-border bg-background px-3 py-2 text-foreground',
	'catalogue.image-button': 'block w-full text-left',
	'catalogue.image': 'aspect-square w-full object-cover',
	'catalogue.body': 'space-y-3 py-4',
	'catalogue.price': 'font-medium tabular-nums',
	'catalogue.meta': 'text-xs leading-relaxed text-muted-foreground',
	'catalogue.actions': 'flex flex-wrap items-center gap-4',
	'catalogue.action':
		'inline-flex min-h-11 items-center bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50',
	'catalogue.detail-link': 'min-h-11 underline underline-offset-4',
	'catalogue.status': 'mb-6 text-sm',
	'catalogue.more': 'mt-8 min-h-11 border border-border px-5 py-3',
	'catalogue.dialog':
		'fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-4xl overflow-y-auto border border-border bg-background p-6 text-foreground backdrop:bg-black/50',
	'catalogue.close': 'mb-4 ml-auto block min-h-11 px-3 py-2',
	'catalogue.detail': 'grid gap-6 md:grid-cols-2',
	'catalogue.detail-image': 'aspect-square w-full object-cover',
	'catalogue.detail-heading': 'mb-4 text-3xl font-medium',
	'cards.heading': 'mb-6 text-3xl font-medium text-balance',
	'cards.item': 'min-w-0',
	'cards.image': 'h-auto max-w-full object-cover',
	'cards.title': 'my-3 text-lg font-medium',
	'cards.link':
		'underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4',
	'cards.description': 'max-w-prose leading-relaxed',
	'cards.empty': 'text-sm text-muted-foreground',
	'catalogue.list': 'grid list-none gap-8 p-0',
	'catalogue.item': 'min-w-0',
	'catalogue.link': 'block space-y-3 focus-visible:outline-2 focus-visible:outline-offset-4',
	'catalogue.title': 'text-lg font-medium',
	'catalogue.description': 'max-w-prose text-sm text-muted-foreground',
	'cards.grid': 'grid gap-8',
	'price.value': 'tabular-nums'
} as const;
