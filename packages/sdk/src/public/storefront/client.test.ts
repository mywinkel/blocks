import { describe, expect, it } from 'vitest';
import type { Catalogue } from './contracts';
import { createStorefrontClient } from './client';

function catalogue(name: string): Catalogue {
	return {
		tenantId: 'test',
		revision: 1,
		name,
		currency: 'ZAR',
		items: [],
		locations: [],
		staff: [],
		delivery: { localEnabled: false, areas: [], feeMinor: 0 },
		capabilities: {}
	};
}

function json(value: unknown) {
	return new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } });
}

describe('storefront client reads', () => {
	it('coalesces concurrent catalogue reads and reuses the fresh result', async () => {
		let resolveResponse!: (response: Response) => void;
		const response = new Promise<Response>((resolve) => {
			resolveResponse = resolve;
		});
		let requests = 0;
		const fetcher: typeof fetch = async () => {
			requests++;
			return response;
		};
		const client = createStorefrontClient(fetcher);

		const first = client.catalogue();
		const second = client.catalogue();
		expect(requests).toBe(1);

		const current = catalogue('Current');
		resolveResponse(json(current));
		const received = await first;
		expect(received).toEqual(current);
		expect(await second).toBe(received);
		expect(await client.catalogue()).toBe(received);
		expect(requests).toBe(1);
	});

	it('does not let an old response replace data loaded after mutation invalidation', async () => {
		let resolveOldResponse!: (response: Response) => void;
		const oldResponse = new Promise<Response>((resolve) => {
			resolveOldResponse = resolve;
		});
		let catalogueRequests = 0;
		const current = catalogue('Current');
		const fetcher: typeof fetch = async (input) => {
			const url = input instanceof Request ? input.url : String(input);
			if (url.endsWith('/catalogue')) {
				catalogueRequests++;
				return catalogueRequests === 1 ? oldResponse : json(current);
			}
			if (url.endsWith('/customer/sign-in')) return json({ message: 'Check your email.' });
			throw new Error(`Unexpected request: ${url}`);
		};
		const client = createStorefrontClient(fetcher);

		const stale = client.catalogue();
		await client.signIn('owner@example.test');
		const received = await client.catalogue();
		expect(received).toEqual(current);
		resolveOldResponse(json(catalogue('Old')));
		await stale;

		expect(await client.catalogue()).toBe(received);
		expect(catalogueRequests).toBe(2);
	});
});
