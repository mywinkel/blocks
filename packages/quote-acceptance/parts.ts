const localPartDefaults = {
	root: 'grid gap-4',
	description: 'whitespace-pre-wrap text-sm leading-7',
	summary: 'text-sm leading-6',
	expired: 'text-sm leading-6 text-muted-foreground',
	reviewButton:
		'inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
	checkout: 'grid gap-4',
	link: 'underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4'
} as const;

export const namedPartDefaults = Object.fromEntries(
	Object.entries(localPartDefaults).map(([part, classes]) => [`quote.${part}`, classes])
) as Record<`quote.${keyof typeof localPartDefaults & string}`, string>;

export { localPartDefaults };
export type QuoteAcceptancePart = keyof typeof localPartDefaults;
