/** Base utilities for the membership block's named visual parts. */
export const namedPartDefaults = {
	'membership.root':
		'grid min-w-0 gap-6 text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_input]:caret-primary',
	'membership.empty': 'text-sm leading-6 text-muted-foreground',
	'membership.field': 'grid min-w-0 gap-2 text-sm',
	'membership.note': 'text-sm leading-6 text-muted-foreground'
} as const;
