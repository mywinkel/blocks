/**
 * Base utilities for the booking block's named visual parts.
 *
 * The view uses these exact names when calling `cx`. Keeping the defaults next
 * to the view gives the block registry and the editor one source of truth for
 * the parts an agent may customise.
 */
export const namedPartDefaults = {
	'booking.root':
		'grid min-w-0 gap-6 text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_input]:caret-primary',
	'booking.empty': 'text-sm leading-6 text-muted-foreground',
	'booking.field': 'grid min-w-0 gap-2 text-sm',
	'booking.control':
		'min-h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-base text-foreground shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm',
	'booking.status': 'text-sm leading-6 text-muted-foreground',
	'booking.error': 'text-sm leading-6 text-destructive',
	'booking.refresh':
		'inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-transparent px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
	'booking.note': 'text-sm leading-6 text-muted-foreground'
} as const;
