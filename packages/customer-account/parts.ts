const localPartDefaults = {
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
	rentalSchedule: 'grid max-w-2xl gap-3 sm:grid-cols-2 sm:gap-x-8',
	rentalScheduleItem: 'grid gap-1',
	rentalScheduleLabel: 'text-sm font-semibold leading-6',
	rentalScheduleTime: 'text-sm leading-6',
	rentalScheduleHelp: 'max-w-prose text-sm leading-6 text-muted-foreground',
	calendar: 'grid justify-items-start gap-2',
	calendarDownload:
		'inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
	calendarHelp: 'max-w-prose text-sm leading-6 text-muted-foreground',
	calendarError: 'text-sm leading-6 text-destructive',
	historySearch: 'flex flex-col items-start gap-3 sm:flex-row sm:items-end',
	historySearchField: 'grid w-full min-w-0 gap-2 text-sm sm:max-w-md',
	historySearchInput:
		'w-full min-h-11 min-w-0 rounded-md border border-border bg-background px-3 py-2.5 font-[inherit] text-foreground caret-primary outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30',
	historySearchClear:
		'inline-flex min-h-11 shrink-0 items-center justify-center rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
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
		'inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2.5 font-semibold text-primary-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60'
} as const;

export const namedPartDefaults = Object.fromEntries(
	Object.entries(localPartDefaults).map(([part, classes]) => [`account.${part}`, classes])
) as Record<`account.${keyof typeof localPartDefaults & string}`, string>;

export { localPartDefaults };
export type CustomerAccountPart = keyof typeof localPartDefaults;
