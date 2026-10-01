const localPartDefaults = {
	root: 'grid gap-5',
	heading: 'text-2xl font-semibold tracking-tight',
	error: 'text-sm leading-6 text-destructive',
	reference: 'text-sm leading-6',
	status: 'text-sm leading-6',
	total: 'text-xl font-semibold tabular-nums',
	calendar: 'text-sm leading-6',
	payment: 'text-sm leading-6',
	section: 'grid gap-3',
	sectionHeading: 'text-lg font-semibold tracking-tight',
	downloadList: 'grid gap-3',
	downloadItem: 'grid gap-2',
	downloadButton:
		'inline-flex min-h-11 w-fit items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
	muted: 'text-sm leading-6 text-muted-foreground',
	balance: 'grid gap-3',
	balanceText: 'text-sm leading-6',
	balanceButton:
		'inline-flex min-h-11 w-fit items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
	refund: 'text-sm leading-6',
	refunded: 'text-sm leading-6',
	paymentButton:
		'inline-flex min-h-11 w-fit items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
	reconcileButton:
		'inline-flex min-h-11 w-fit items-center justify-center rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
	refreshButton:
		'inline-flex min-h-11 w-fit items-center justify-center rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60'
} as const;

export const namedPartDefaults = Object.fromEntries(
	Object.entries(localPartDefaults).map(([part, classes]) => [`request.${part}`, classes])
) as Record<`request.${keyof typeof localPartDefaults & string}`, string>;

export { localPartDefaults };
export type RequestStatusPart = keyof typeof localPartDefaults;
