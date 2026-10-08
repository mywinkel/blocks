import type { ShippingQuote, ShippingQuoteInput } from './shipping-contracts';
import type { Catalogue } from './contracts';
import type { AccountQuery } from './customer-pagination';
import type { CustomerAccount } from './customer-account';
import type { AvailabilityInput, AppointmentAvailability } from './availability';
import type { StorefrontTransport } from './client-transport';

type ReadTransport = Pick<StorefrontTransport, 'jsonResponse' | 'request' | 'post'>;

export function createStorefrontReads(transport: ReadTransport, ensureGuest: () => Promise<void>) {
	let cached: Catalogue | undefined,
		etag = '',
		expires = 0,
		pending: Promise<Catalogue> | undefined;
	// Fetches may not be cancellable; stale generations cannot write into the current cache.
	let generation = 0;
	const listeners = new Set<() => void>();
	const accounts = new Map<string, { value: CustomerAccount; etag: string; expires: number }>();
	const accountReads = new Map<string, Promise<CustomerAccount>>();
	const slots = new Map<string, { value: AppointmentAvailability; expires: number }>();
	const slotReads = new Map<string, Promise<AppointmentAvailability>>();
	const quotes = new Map<string, ShippingQuote>();
	const quoteReads = new Map<string, Promise<ShippingQuote>>();

	function invalidate() {
		generation++;
		accounts.clear();
		quotes.clear();
		quoteReads.clear();
		accountReads.clear();
		expires = 0;
		pending = undefined;
		slots.clear();
		slotReads.clear();
		for (const listener of listeners) listener();
	}

	return {
		invalidate,
		subscribe(listener: () => void) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		availability(input: AvailabilityInput, refresh = false): Promise<AppointmentAvailability> {
			const key = new URLSearchParams(input).toString(),
				cached = slots.get(key);
			if (!refresh && cached && cached.expires > Date.now())
				return Promise.resolve(cached.value);
			let read = slotReads.get(key);
			if (!read) {
				const started = generation;
				read = transport
					.request('/availability?' + key, { cache: 'no-cache' })
					.then(transport.jsonResponse<AppointmentAvailability>)
					.then((value) => {
						if (started !== generation) return value;
						if (slots.size >= 100) slots.delete(slots.keys().next().value!);
						slots.set(key, { value, expires: Date.now() + 10000 });
						return value;
					})
					.finally(() => {
						if (slotReads.get(key) === read) slotReads.delete(key);
					});
				slotReads.set(key, read);
			}
			return read;
		},
		customerAccount(query: AccountQuery = {}, refresh = false): Promise<CustomerAccount> {
			const key = new URLSearchParams(query).toString(),
				cached = accounts.get(key);
			if (!refresh && cached && cached.expires > Date.now()) return Promise.resolve(cached.value);
			let read = accountReads.get(key);
			if (!read) {
				const started = generation;
				read = transport
					.request('/customer/account?' + key, {
						credentials: 'same-origin',
						cache: 'no-store',
						headers: cached?.etag ? { 'If-None-Match': cached.etag } : {}
					})
					.then(async (response) => {
						const value =
							response.status === 304 && cached
								? cached.value
								: await transport.jsonResponse<CustomerAccount>(response);
						if (started !== generation)
							throw new Error('Your account changed while loading. Refresh your account.');
						if (accounts.size >= 16) accounts.delete(accounts.keys().next().value!);
						accounts.set(key, {
							value,
							etag: response.headers.get('ETag') ?? '',
							expires: Date.now() + 10000
						});
						return value;
					})
					.finally(() => {
						if (accountReads.get(key) === read) accountReads.delete(key);
					});
				accountReads.set(key, read);
			}
			return read;
		},
		async catalogue(refresh = false): Promise<Catalogue> {
			if (cached && !refresh && expires > Date.now()) return cached;
			if (!pending) {
				const started = generation,
					previous = cached;
				const read = transport
					.request('/catalogue', {
						cache: 'no-cache',
						headers: etag ? { 'If-None-Match': etag } : {}
					})
					.then(async (response) => {
						const value =
							response.status === 304 && previous
								? previous
								: await transport.jsonResponse<Catalogue>(response);
						if (started === generation) {
							cached = value;
							etag = response.headers.get('ETag') ?? etag;
							expires = Date.now() + 30000;
						}
						return value;
					})
					.finally(() => {
						if (pending === read) pending = undefined;
					});
				pending = read;
			}
			return pending;
		},
		async shippingQuotes(input: ShippingQuoteInput) {
			const address = { ...input.delivery };
			delete address.quoteId;
			delete address.optionId;
			const canonical = { ...input, delivery: address },
				key = JSON.stringify(canonical),
				cached = quotes.get(key);
			if (cached && cached.expiresAt > Date.now() + 5000) return cached;
			let read = quoteReads.get(key);
			if (!read) {
				const started = generation;
				read = ensureGuest()
					.then(() => transport.post<ShippingQuote>('/shipping/quotes', canonical))
					.then((value) => {
						if (started !== generation)
							throw new Error('Your account or cart changed. Request delivery options again.');
						if (quotes.size >= 20) quotes.delete(quotes.keys().next().value!);
						quotes.set(key, value);
						return value;
					})
					.finally(() => {
						if (quoteReads.get(key) === read) quoteReads.delete(key);
					});
				quoteReads.set(key, read);
			}
			return read;
		}
	};
}
