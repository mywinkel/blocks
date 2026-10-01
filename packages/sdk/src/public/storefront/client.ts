import type { MembershipPaymentStatus } from '../runtime/membership-status';
import type { ShippingQuote, ShippingQuoteInput } from './shipping-contracts';
import type { Catalogue, Checkout, Receipt } from './contracts';
import type { CustomerCommand, CustomerCommandResult } from './customer-commands';
import type { AccountQuery } from './customer-pagination';
import type { CustomerAccount } from './customer-account';
import type { AvailabilityInput, AppointmentAvailability } from './availability';

export function createStorefrontClient(
	fetcher: typeof fetch = fetch,
	base = '/_mywinkel/api/v1/storefront'
) {
	let cached: Catalogue | undefined,
		etag = '',
		expires = 0,
		pending: Promise<Catalogue> | undefined;
	let guest: Promise<void> | undefined;
	let generation = 0;
	const listeners = new Set<() => void>();
	const accounts = new Map<string, { value: CustomerAccount; etag: string; expires: number }>(),
		accountReads = new Map<string, Promise<CustomerAccount>>();
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
	const slots = new Map<string, { value: AppointmentAvailability; expires: number }>(),
		slotReads = new Map<string, Promise<AppointmentAvailability>>();
	async function jsonResponse<T>(response: Response): Promise<T> {
		const body = await response.json();
		if (!response.ok)
			throw Object.assign(new Error(body.message ?? 'This request could not be confirmed.'), {
				code: body.code,
				issues: body.issues
			});
		return body as T;
	}
	function post(path: string, value: unknown) {
		if (typeof navigator !== 'undefined' && navigator.onLine === false)
			throw new Error('You are offline. Reconnect and submit again; nothing has been queued.');
		return fetcher(base + path, {
			method: 'POST',
			credentials: 'same-origin',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(value)
		});
	}
	async function ensureGuest() {
		if (!guest)
			guest = post('/session', {})
				.then(jsonResponse)
				.then(() => undefined)
				.catch((error) => {
					guest = undefined;
					throw error;
				});
		await guest;
	}
	const quoteReads = new Map<string, Promise<ShippingQuote>>();
	const quotes = new Map<string, ShippingQuote>();

	return {
		async membershipRenewal(id: string) {
			return jsonResponse<
				MembershipPaymentStatus & {
					offer: {
						amountMinor: number;
						version: number;
						start: string;
						end: string;
						interval: string;
						automaticAvailable: boolean;
					} | null;
					payment: { status: string; href: string } | null;
				}
			>(
				await fetcher(`${base}/customer/memberships/${encodeURIComponent(id)}/renewal`, {
					credentials: 'same-origin',
					cache: 'no-store',
					signal: AbortSignal.timeout(30000)
				})
			);
		},
		async renewMembership(
			id: string,
			input: {
				operationId: string;
				expectedVersion: number;
				expectedAmountMinor: number;
				expectedStart: string;
				expectedEnd: string;
				approved: true;
				autoRenew?: boolean;
				recurringApproved?: true;
			}
		) {
			const result = await jsonResponse<{ href: string }>(
				await post(`/customer/memberships/${encodeURIComponent(id)}/renewal`, input)
			);
			invalidate();
			return result;
		},
		async stopAutomaticMembership(
			id: string,
			input: { operationId: string; mandateId: string; approved: true }
		) {
			const result = await jsonResponse<{ status: 'revoked' }>(
				await post(`/customer/memberships/${encodeURIComponent(id)}/automatic/stop`, input)
			);
			invalidate();
			return result;
		},
		async download(orderId: string, lineId: string) {
			if (typeof navigator !== 'undefined' && !navigator.onLine)
				throw new Error('You are offline. Reconnect to download your file.');
			const response = await fetcher(
				`${base}/requests/${encodeURIComponent(orderId)}/downloads/${encodeURIComponent(lineId)}`,
				{ credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(30000) }
			);
			if (!response.ok) return jsonResponse<never>(response);
			if (response.headers.get('Content-Type') !== 'application/pdf')
				throw new Error('The download could not be verified. Please try again.');
			return response.blob();
		},
		availability(input: AvailabilityInput, refresh = false): Promise<AppointmentAvailability> {
			const key = new URLSearchParams(input).toString(),
				cached = slots.get(key);
			if (!refresh && cached && cached.expires > Date.now()) return Promise.resolve(cached.value);
			let pending = slotReads.get(key);
			if (!pending) {
				const started = generation;
				pending = fetcher(base + '/availability?' + key, { cache: 'no-cache' })
					.then(jsonResponse<AppointmentAvailability>)
					.then((value) => {
						if (started !== generation) return value;
						if (slots.size >= 100) slots.delete(slots.keys().next().value!);
						slots.set(key, { value, expires: Date.now() + 10000 });
						return value;
					})
					.finally(() => {
						if (slotReads.get(key) === pending) slotReads.delete(key);
					});
				slotReads.set(key, pending);
			}
			return pending;
		},
		customerAccount(query: AccountQuery = {}, refresh = false): Promise<CustomerAccount> {
			const key = new URLSearchParams(query).toString(),
				cached = accounts.get(key);
			if (!refresh && cached && cached.expires > Date.now()) return Promise.resolve(cached.value);
			let pending = accountReads.get(key);
			if (!pending) {
				const started = generation;
				pending = fetcher(base + '/customer/account?' + key, {
					credentials: 'same-origin',
					cache: 'no-store',
					headers: cached?.etag ? { 'If-None-Match': cached.etag } : {}
				})
					.then(async (response) => {
						const value =
							response.status === 304 && cached
								? cached.value
								: await jsonResponse<CustomerAccount>(response);
						if (started !== generation)
							throw new Error('Your account changed while loading. Refresh your account.');
						if (started === generation) {
							if (accounts.size >= 16) accounts.delete(accounts.keys().next().value!);
							accounts.set(key, {
								value,
								etag: response.headers.get('ETag') ?? '',
								expires: Date.now() + 10000
							});
						}
						return value;
					})
					.finally(() => {
						if (accountReads.get(key) === pending) accountReads.delete(key);
					});
				accountReads.set(key, pending);
			}
			return pending;
		},
		async customerCommand(command: CustomerCommand) {
			try {
				return await jsonResponse<CustomerCommandResult & { account: CustomerAccount }>(
					await post('/customer/commands', command)
				);
			} finally {
				invalidate();
			}
		},
		async signIn(email: string) {
			invalidate();
			return jsonResponse<{ message: string }>(await post('/customer/sign-in', { email }));
		},
		async signOut() {
			try {
				return await jsonResponse(await post('/customer/sign-out', {}));
			} finally {
				invalidate();
			}
		},
		async reconcilePayment(id: string) {
			try {
				return await jsonResponse<{ status: string; receipt: Receipt }>(
					await post('/payments/reconcile/' + encodeURIComponent(id), {})
				);
			} finally {
				invalidate();
			}
		},
		async balancePayment(id: string, command: import('./rental-balance').BalancePayment) {
			try {
				return await jsonResponse<{ url: string }>(
					await post(`/requests/${encodeURIComponent(id)}/balance-payment`, command)
				);
			} finally {
				invalidate();
			}
		},
		payment: async (id: string) =>
			jsonResponse<{ url: string }>(await post(`/requests/${encodeURIComponent(id)}/payment`, {})),
		subscribe(listener: () => void) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		async catalogue(refresh = false): Promise<Catalogue> {
			if (cached && !refresh && expires > Date.now()) return cached;
			if (!pending) {
				const started = generation,
					previous = cached;
				const read = fetcher(base + '/catalogue', {
					cache: 'no-cache',
					headers: etag ? { 'If-None-Match': etag } : {}
				})
					.then(async (response) => {
						const value =
							response.status === 304 && previous
								? previous
								: await jsonResponse<Catalogue>(response);
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
			let pending = quoteReads.get(key);
			if (!pending) {
				const started = generation;
				pending = ensureGuest()
					.then(() => post('/shipping/quotes', canonical))
					.then(jsonResponse<ShippingQuote>)
					.then((value) => {
						if (started !== generation)
							throw new Error('Your account or cart changed. Request delivery options again.');
						if (quotes.size >= 20) quotes.delete(quotes.keys().next().value!);
						quotes.set(key, value);
						return value;
					})
					.finally(() => {
						if (quoteReads.get(key) === pending) quoteReads.delete(key);
					});
				quoteReads.set(key, pending);
			}
			return pending;
		},

		async checkout(command: Checkout): Promise<Receipt> {
			await ensureGuest();
			try {
				const receipt = await jsonResponse<Receipt>(await post('/checkout', command));
				invalidate();
				return receipt;
			} catch (error) {
				invalidate();
				if (error instanceof Error && 'code' in error && error.code === 'session_required')
					guest = undefined;
				throw error;
			}
		},
		receipt: async (id: string) =>
			jsonResponse<Receipt>(
				await fetcher(`${base}/requests/${encodeURIComponent(id)}`, {
					credentials: 'same-origin',
					cache: 'no-store'
				})
			)
	};
}
const clientKey=Symbol.for('mywinkel.storefront.client.v1');
const browser=globalThis as typeof globalThis & {[clientKey]?:ReturnType<typeof createStorefrontClient>};
export const storefrontClient=typeof window==='undefined'?createStorefrontClient():(browser[clientKey]??=createStorefrontClient());
