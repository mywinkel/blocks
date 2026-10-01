/** Base utilities for the rental block's named visual parts. */
export const namedPartDefaults = {
	'rental.root':
		'grid min-w-0 gap-6 text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_input]:caret-primary',
	'rental.empty': 'text-sm leading-6 text-muted-foreground',
	'rental.field': 'grid min-w-0 gap-2 text-sm',
	'rental.control':
		'min-h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-base text-foreground shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm',
	'rental.fields': 'grid gap-4 sm:grid-cols-2',
	'rental.note': 'text-sm leading-6 text-muted-foreground'
} as const;
