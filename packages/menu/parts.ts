export const namedPartDefaults = {
	'menu.root': 'min-w-0',
	'menu.summary': 'w-fit cursor-pointer list-inside rounded-md border border-border p-3 sm:hidden',
	'menu.navigation': '',
	'menu.empty': 'text-sm text-muted-foreground',
	'menu.item': 'list-none',
	'menu.itemRow': 'relative block sm:flex sm:items-center sm:gap-1',
	'menu.link':
		'block rounded-md px-3 py-2.5 pr-10 no-underline hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:pr-3',
	'menu.disclosure': 'static',
	'menu.toggle':
		'absolute top-0 right-0 cursor-pointer list-none p-2.5 focus-visible:outline-2 focus-visible:outline-ring sm:static [&::-webkit-details-marker]:hidden',
	'menu.icon': 'size-4',
	'menu.submenu':
		'static ml-3 border-l border-border bg-background p-1.5 text-foreground sm:absolute sm:top-full sm:left-0 sm:z-10 sm:m-0 sm:min-w-48 sm:rounded-md sm:border',
	'menu.list': 'm-0 flex list-none flex-col flex-wrap gap-1 p-0 pt-3 sm:pt-0'
} as const;
