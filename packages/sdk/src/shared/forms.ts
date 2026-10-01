import type { CatalogueItem, Purchase } from '@mywinkel/block-sdk/public/storefront/contracts';

/** Format integer minor units using the storefront's public ZAR contract. */
export const money = (minor: number) =>
	new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(minor / 100);

/** Read a form value without allowing a missing control to become `null`. */
export const field = (form: FormData, key: string) => String(form.get(key) ?? '');

/** Convert a local datetime input to the API's South African Standard Time instant. */
export const localTime = (value: string) => (value ? `${value}:00+02:00` : '');

/**
 * Convert the shared delivery controls into the checkout contract.
 *
 * Courier quote identifiers are intentionally included only when the quote
 * controls are present. The checkout endpoint revalidates both identifiers.
 */
export const delivery = (form: FormData) => ({
	method: field(form, 'deliveryMethod') as 'collection' | 'local-delivery' | 'courier',
	locationId: field(form, 'locationId'),
	address: field(form, 'address'),
	area: field(form, 'area'),
	city: field(form, 'city'),
	province: field(form, 'province'),
	postcode: field(form, 'postcode'),
	suburb: field(form, 'suburb'),
	...(field(form, 'shippingQuoteId')
		? { quoteId: field(form, 'shippingQuoteId'), optionId: field(form, 'shippingOptionId') }
		: {}),
	...(field(form, 'deliveryAt') ? { at: localTime(field(form, 'deliveryAt')) } : {})
});

/** The fields shared by a checkout's customer section. */
export type CheckoutCustomer = { id: string; name: string; email: string };

/** Type helper for functions used by `CheckoutForm`. */
export type PurchaseBuilder = (form: FormData) => Purchase;

/** Keep catalogue item mapping explicit at the component boundary. */
export type ItemOption = Pick<CatalogueItem, 'id' | 'name' | 'priceMinor'>;

/**
 * Codes where retrying the same command would not resolve a client-visible
 * validation problem. All other failures keep the operation identity so the
 * customer can safely retry the uncertain request.
 */
export const isUncertainCheckoutFailure = (failure: unknown) => {
	const code = failure instanceof Error && 'code' in failure ? String(failure.code) : '';
	return ![
		'validation',
		'price_changed',
		'origin',
		'rate_limited',
		'session_required',
		'quote_expired',
		'quote_pending',
		'shipping_unavailable'
	].includes(code);
};

export const failureMessage = (failure: unknown, fallback: string) =>
	failure instanceof Error ? failure.message : fallback;
