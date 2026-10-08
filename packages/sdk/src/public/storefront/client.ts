import type { MembershipPaymentStatus } from '../runtime/membership-status';
import type { Checkout, Receipt } from './contracts';
import type { CustomerCommand, CustomerCommandResult } from './customer-commands';
import type { CustomerAccount } from './customer-account';
import { createStorefrontReads } from './client-reads';
import { createStorefrontTransport } from './client-transport';

export function createStorefrontClient(
	fetcher: typeof fetch = fetch,
	base = '/_mywinkel/api/v1/storefront'
) {
	const transport = createStorefrontTransport(fetcher, base);
	let guest: Promise<void> | undefined;
	async function ensureGuest() {
		if (!guest)
			guest = transport
				.post<unknown>('/session', {})
				.then(() => undefined)
				.catch((error) => {
					guest = undefined;
					throw error;
				});
		await guest;
	}
	const reads = createStorefrontReads(transport, ensureGuest);

	return {
		async membershipRenewal(id: string) {
			return transport.jsonResponse<
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
				await transport.request(`/customer/memberships/${encodeURIComponent(id)}/renewal`, {
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
			const result = await transport.post<{ href: string }>(
				`/customer/memberships/${encodeURIComponent(id)}/renewal`,
				input
			);
			reads.invalidate();
			return result;
		},
		async stopAutomaticMembership(
			id: string,
			input: { operationId: string; mandateId: string; approved: true }
		) {
			const result = await transport.post<{ status: 'revoked' }>(
				`/customer/memberships/${encodeURIComponent(id)}/automatic/stop`,
				input
			);
			reads.invalidate();
			return result;
		},
		async download(orderId: string, lineId: string) {
			if (typeof navigator !== 'undefined' && !navigator.onLine)
				throw new Error('You are offline. Reconnect to download your file.');
			const response = await transport.request(
				`/requests/${encodeURIComponent(orderId)}/downloads/${encodeURIComponent(lineId)}`,
				{ credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(30000) }
			);
			if (!response.ok) return transport.jsonResponse<never>(response);
			if (response.headers.get('Content-Type') !== 'application/pdf')
				throw new Error('The download could not be verified. Please try again.');
			return response.blob();
		},
		availability: reads.availability,
		customerAccount: reads.customerAccount,
		async customerCommand(command: CustomerCommand) {
			try {
				return await transport.post<CustomerCommandResult & { account: CustomerAccount }>(
					'/customer/commands',
					command
				);
			} finally {
				reads.invalidate();
			}
		},
		async signIn(email: string) {
			reads.invalidate();
			return transport.post<{ message: string }>('/customer/sign-in', { email });
		},
		async signOut() {
			try {
				return await transport.post<unknown>('/customer/sign-out', {});
			} finally {
				reads.invalidate();
			}
		},
		async reconcilePayment(id: string) {
			try {
				return await transport.post<{ status: string; receipt: Receipt }>(
					'/payments/reconcile/' + encodeURIComponent(id),
					{}
				);
			} finally {
				reads.invalidate();
			}
		},
		async balancePayment(id: string, command: import('./rental-balance').BalancePayment) {
			try {
				return await transport.post<{ url: string }>(
					`/requests/${encodeURIComponent(id)}/balance-payment`,
					command
				);
			} finally {
				reads.invalidate();
			}
		},
		payment: async (id: string) =>
			transport.post<{ url: string }>(`/requests/${encodeURIComponent(id)}/payment`, {}),
		subscribe: reads.subscribe,
		catalogue: reads.catalogue,
		shippingQuotes: reads.shippingQuotes,
		async checkout(command: Checkout): Promise<Receipt> {
			await ensureGuest();
			try {
				const receipt = await transport.post<Receipt>('/checkout', command);
				reads.invalidate();
				return receipt;
			} catch (error) {
				reads.invalidate();
				if (error instanceof Error && 'code' in error && error.code === 'session_required')
					guest = undefined;
				throw error;
			}
		},
		receipt: async (id: string) =>
			transport.jsonResponse<Receipt>(
				await transport.request(`/requests/${encodeURIComponent(id)}`, {
					credentials: 'same-origin',
					cache: 'no-store'
				})
			)
	};
}

const clientKey = Symbol.for('mywinkel.storefront.client.v1');
const browser = globalThis as typeof globalThis & {
	[clientKey]?: ReturnType<typeof createStorefrontClient>;
};
export const storefrontClient =
	typeof window === 'undefined'
		? createStorefrontClient()
		: (browser[clientKey] ??= createStorefrontClient());
