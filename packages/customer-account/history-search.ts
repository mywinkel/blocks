import type { CustomerAccount } from '@mywinkel/block-sdk/public/storefront/customer-account';

type HistoryRow = CustomerAccount['history'][number];

/** Search only the authorized projection already loaded in this account.
 * Treat whitespace-separated words literally; never interpret query syntax.
 */
export function matchesHistory(row: HistoryRow, query: string): boolean {
	const text = [row.name, row.type.replaceAll('-', ' '), row.status.replaceAll('-', ' '), row.id]
		.join(' ')
		.normalize('NFKC')
		.toLocaleLowerCase('en-ZA');
	return query
		.normalize('NFKC')
		.toLocaleLowerCase('en-ZA')
		.trim()
		.split(/\s+/)
		.every((word) => text.includes(word));
}
