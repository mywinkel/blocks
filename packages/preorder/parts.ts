/** Base utilities for the pre-order block's named visual parts. */
export const namedPartDefaults = {
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
