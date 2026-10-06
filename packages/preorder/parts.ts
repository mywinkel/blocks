/** Base utilities for the pre-order block's named visual parts. */
export const namedPartDefaults = {
	'preorder.menu': 'grid gap-4',
	'preorder.meal': 'border border-border',
	'preorder.meal-summary':
		'flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 p-5',
	'preorder.meal-title': 'block text-2xl font-medium',
	'preorder.meal-meta': 'mt-2 block text-sm',
	'preorder.meal-body': 'grid gap-5 border-t border-border p-5',
	'preorder.meal-details': 'grid content-start gap-5',
	'preorder.meal-image': 'aspect-[4/3] w-full object-cover',
	'preorder.add': 'min-h-11 bg-primary px-5 py-3 font-medium text-primary-foreground',
	'preorder.basket': 'grid gap-4 border border-border bg-muted p-5',
	'preorder.basket-heading': 'text-2xl font-medium',
	'preorder.basket-list': 'grid gap-3',
	'preorder.basket-line': 'flex items-start justify-between gap-4 border-b border-border py-3',
	'preorder.remove': 'min-h-11 px-3 text-sm underline underline-offset-4',
	'preorder.total': 'text-lg font-semibold tabular-nums',

	'preorder.root':
		'grid min-w-0 gap-6 text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_input]:caret-primary',
	'preorder.empty': 'text-sm leading-6 text-muted-foreground',
	'preorder.field': 'grid min-w-0 gap-2 text-sm',
	'preorder.control':
		'min-h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-base text-foreground shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm',
	'preorder.fields': 'grid gap-4 sm:grid-cols-2',
	'preorder.dietary': 'text-sm leading-6 text-muted-foreground',
	'preorder.extras': 'grid gap-3',
	'preorder.legend': 'text-sm font-semibold text-foreground',
	'preorder.extra': 'flex items-start gap-3 text-sm leading-6',
	'preorder.extra-control': 'mt-1 size-4 shrink-0 accent-primary',
	'preorder.note': 'text-sm leading-6 text-muted-foreground'
} as const;
