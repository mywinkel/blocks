import { describe, expect, it } from 'vitest';
import type { CustomerAccount } from '@mywinkel/block-sdk/public/storefront/customer-account';
import { matchesHistory } from './history-search';

const row: CustomerAccount['history'][number] = {
	id: 'request-42',
	type: 'food-orders',
	name: 'Sunday café box',
	status: 'ready-for-collection',
	createdAt: '',
	version: 1,
	amountMinor: 5000,
	start: '',
	end: '',
	payment: '',
	hasReceipt: true
};

describe('loaded customer history lookup', () => {
	it('matches literal words across public fields regardless of case, spacing or Unicode composition', () => {
		for (const query of [
			'',
			'  ',
			'SUNDAY box',
			'food orders collection',
			'REQUEST-42',
			'cafe\u0301'
		]) {
			expect(matchesHistory(row, query), query).toBe(true);
		}
		for (const query of ['Sunday appointment', '.*', '<script>', '5000', 'version:1']) {
			expect(matchesHistory(row, query), query).toBe(false);
		}
	});
});
