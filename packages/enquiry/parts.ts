/** Base utilities for the enquiry block's named visual parts. */
export const namedPartDefaults = {
	'enquiry.root':
		'grid min-w-0 gap-6 text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_input]:caret-primary',
	'enquiry.heading': 'text-2xl font-semibold tracking-tight text-foreground',
	'enquiry.field': 'grid min-w-0 gap-2 text-sm',
	'enquiry.control':
		'min-h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-base text-foreground shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm',
	'enquiry.message': 'min-h-32 resize-y'
} as const;
