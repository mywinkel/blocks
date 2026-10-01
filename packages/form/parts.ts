/**
 * Form presentation defaults. The keys are part names rather than selectors so
 * a generated site can override one visual surface without changing form data
 * or upload behaviour.
 */
const localPartDefaults = {
	root: 'grid gap-6',
	success: 'grid gap-3',
	successMessage: 'leading-relaxed',
	optionLabel: 'min-w-0',
	successHeading: 'text-lg font-semibold tracking-tight',
	fieldset: 'grid gap-6 disabled:cursor-not-allowed',
	legend: 'mb-1 font-semibold tracking-tight',
	fields: 'grid min-w-0 gap-4 sm:grid-cols-1',
	inlineFields: 'sm:grid-cols-2 sm:items-start',
	inlineFullWidth: 'sm:col-span-2',
	field: 'grid min-w-0 gap-2 text-sm',
	choice: 'grid min-w-0 gap-3 text-sm',
	options: 'grid gap-2',
	option: 'flex items-start gap-3 leading-6',
	choiceLabel: 'flex items-start gap-3 leading-6',
	label: 'font-medium',
	control:
		'w-full min-w-0 rounded-md border border-border bg-background px-3 py-2.5 font-[inherit] text-foreground caret-primary outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60',
	textarea: 'min-h-28 resize-y',
	fileControl:
		'w-full min-w-0 rounded-md border border-border bg-background px-3 py-2 font-[inherit] text-sm text-foreground file:mr-3 file:border-0 file:bg-transparent file:font-medium file:text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60',
	checkbox: 'mt-1 size-4 shrink-0 accent-primary',
	radio: 'mt-1 size-4 shrink-0 accent-primary',
	floatField: 'relative grid min-w-0 gap-2 text-sm',
	floatLabel:
		'pointer-events-none absolute left-3 top-0 z-10 -translate-y-1/2 bg-background px-1 text-xs font-medium text-muted-foreground transition-[color,transform,font-size] peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs',
	floatControl: 'peer pt-4',
	help: 'text-xs leading-5 text-muted-foreground',
	fileHelp: 'text-xs leading-5 text-muted-foreground',
	honeypot: 'sr-only',
	consent: 'flex items-start gap-3 text-sm leading-6',
	terms: 'text-sm leading-6',
	submit:
		'inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2.5 font-semibold text-primary-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
	error: 'grid gap-1 text-sm text-destructive',
	pending: 'text-sm text-muted-foreground',
	buttonLink:
		'inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 py-2.5 font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/60'
} as const;

export const namedPartDefaults = Object.fromEntries(
	Object.entries(localPartDefaults).map(([part, classes]) => [`form.${part}`, classes])
) as Record<`form.${keyof typeof localPartDefaults & string}`, string>;

export { localPartDefaults };
export type FormPart = keyof typeof localPartDefaults;
