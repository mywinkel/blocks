const localAccountPartDefaults = {
	root: 'grid gap-8',
	status: 'text-sm leading-6',
	error: 'text-sm leading-6 text-destructive',
	message: 'text-sm leading-6',
	profile: 'grid gap-2',
	profileHeading: 'text-2xl font-semibold tracking-tight',
	profileEmail: 'text-sm text-muted-foreground',
	profileActions: 'flex flex-wrap gap-3',
	refresh:
		'inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
	signout:
		'inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
	section: 'grid gap-4',
	sectionHeading: 'text-lg font-semibold tracking-tight',
	membershipList: 'grid gap-5',
	membershipItem: 'grid gap-2 border-b border-border pb-5 last:border-b-0',
	membershipName: 'font-semibold',
	membershipMeta: 'text-sm leading-6 text-muted-foreground',
	membershipRenewal: 'mt-2',
	historyList: 'grid gap-5',
	historyItem: 'grid gap-3 border-b border-border pb-5 last:border-b-0',
	historyName: 'font-semibold',
	historyMeta: 'text-sm leading-6 text-muted-foreground',
	historyStart: 'text-sm leading-6',
	booking: 'mt-2',
	quote: 'mt-2',
	receiptLink:
		'inline-flex min-h-11 items-center text-sm font-semibold text-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4',
	loadMore:
		'inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
	signin: 'grid max-w-prose gap-4',
	signinHeading: 'text-xl font-semibold tracking-tight',
	signinCopy: 'text-sm leading-6 text-muted-foreground',
	signinField: 'grid gap-2 text-sm',
	label: 'font-medium',
	input:
		'w-full min-w-0 rounded-md border border-border bg-background px-3 py-2.5 font-[inherit] text-foreground caret-primary outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60',
	submit:
		'inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2.5 font-semibold text-primary-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
	bookingRoot: 'grid gap-4',
	bookingStatus: 'text-sm leading-6',
	bookingError: 'text-sm leading-6 text-destructive',
	bookingActions: 'flex flex-wrap gap-3',
	bookingForm: 'grid gap-4',
	bookingFieldset: 'grid gap-4',
	bookingLegend: 'font-semibold tracking-tight',
	bookingCopy: 'text-sm leading-6',
	bookingLabel: 'grid gap-2 text-sm',
	bookingInput:
		'w-full min-w-0 rounded-md border border-border bg-background px-3 py-2.5 font-[inherit] text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60',
	bookingMuted: 'text-sm leading-6 text-muted-foreground',
	bookingSubmit:
		'inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2.5 font-semibold text-primary-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
	bookingKeep:
		'inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 py-2.5 font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
	bookingCancel:
		'inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
	bookingReschedule:
		'inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
	membershipRoot: 'grid gap-4',
	membershipError: 'text-sm leading-6 text-destructive',
	membershipPayments: 'grid gap-3',
	membershipStatus: 'text-sm leading-6',
	membershipDetails: 'text-sm leading-6',
	membershipReview: 'text-sm leading-6',
	membershipStopConsent: 'flex items-start gap-3 text-sm leading-6',
	membershipStopCheckbox: 'mt-1 size-4 shrink-0 accent-primary',
	membershipStopButton:
		'inline-flex min-h-11 w-fit items-center justify-center rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
	membershipCollection: 'text-sm leading-6',
	membershipOffer: 'text-sm leading-6',
	membershipConsent: 'flex items-start gap-3 text-sm leading-6',
	membershipCheckbox: 'mt-1 size-4 shrink-0 accent-primary',
	membershipButton:
		'inline-flex min-h-11 w-fit items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
	membershipLink:
		'inline-flex min-h-11 w-fit items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/60'
} as const;

export const accountPartDefaults = localAccountPartDefaults;
export const bookingPartDefaults = localAccountPartDefaults;
export const membershipPartDefaults = localAccountPartDefaults;
export const namedPartDefaults = Object.fromEntries(
	Object.entries(localAccountPartDefaults).map(([part, classes]) => [`account.${part}`, classes])
) as Record<`account.${keyof typeof localAccountPartDefaults & string}`, string>;
export { localAccountPartDefaults };

export type AccountPart = keyof typeof localAccountPartDefaults;
