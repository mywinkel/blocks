/** Default Tailwind classes for the cart block's named appearance parts. */
export const namedPartDefaults = {
	'cart.drawer-trigger': 'min-h-11 border border-border px-4 py-2 text-sm',
	'cart.drawer':
		'fixed inset-0 ml-auto h-dvh max-h-dvh w-full max-w-lg overflow-y-auto border-l border-border bg-background p-5 text-foreground backdrop:bg-black/50 md:p-8',
	'cart.drawer-close': 'mb-6 ml-auto block min-h-11 px-3 py-2 text-sm',
	'cart.root': 'grid min-w-0 gap-8 text-foreground',
	'cart.loading': 'grid min-w-0 gap-4 text-foreground',
	'cart.empty-products': 'text-sm leading-relaxed text-muted-foreground',
	'cart.summary':
		'sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background py-3 text-foreground',
	'cart.summary-status': 'text-sm font-medium tabular-nums text-foreground',
	'cart.summary-link':
		'inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground outline-none transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
	'cart.search-field': 'grid gap-2 text-sm font-medium text-foreground',
	'cart.search-control':
		'min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-base text-foreground shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60',
	'cart.no-results': 'grid gap-3 text-sm leading-relaxed text-muted-foreground',
	'cart.clear-search':
		'inline-flex min-h-11 w-fit items-center justify-center rounded-lg border border-border bg-background px-4 py-2 font-semibold text-foreground outline-none transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
	'cart.list': 'm-0 grid list-none gap-4 p-0',
	'cart.item':
		'flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border p-4 sm:p-5',
	'cart.item-body': 'grid min-w-0 gap-2',
	'cart.item-title': 'text-base font-semibold text-foreground',
	'cart.item-description': 'max-w-prose text-sm leading-relaxed text-muted-foreground',
	'cart.item-price': 'text-sm font-semibold tabular-nums text-foreground',
	'cart.quantity-field': 'grid min-w-32 gap-2 text-sm font-medium text-foreground',
	'cart.quantity-input':
		'min-h-11 w-32 rounded-lg border border-border bg-background px-3 py-2 text-base tabular-nums text-foreground shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60',
	'cart.pagination': 'flex flex-wrap items-start justify-between gap-4 text-sm text-foreground',
	'cart.pagination-button':
		'inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-background px-4 py-2 font-semibold text-foreground outline-none transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
	'cart.pagination-status': 'text-sm tabular-nums text-muted-foreground',
	'cart.order-heading': 'scroll-mt-28 text-2xl font-semibold tracking-tight text-foreground',
	'cart.selected-list': 'm-0 grid list-none gap-3 p-0',
	'cart.selected-item':
		'flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border p-3',
	'cart.selected-item-body': 'grid min-w-0 gap-1',
	'cart.selected-item-name': 'text-sm font-medium text-foreground',
	'cart.selected-item-total': 'text-sm font-semibold tabular-nums text-foreground',
	'cart.remove':
		'inline-flex min-h-10 items-center justify-center rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground outline-none transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
	'cart.digital-notice':
		'rounded-xl border border-border bg-muted/40 p-4 text-sm leading-relaxed text-foreground',
	'cart.empty':
		'rounded-xl border border-border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground',
	'cart.discount-field': 'grid gap-2 text-sm font-medium text-foreground',
	'cart.discount-control':
		'min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-base text-foreground shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60',
	'cart.total': 'text-sm font-semibold tabular-nums text-foreground'
} as const;

export type CartPartName = keyof typeof namedPartDefaults;
