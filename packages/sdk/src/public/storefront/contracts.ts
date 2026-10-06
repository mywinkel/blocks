import { z } from 'zod';

const id = z.string().min(1).max(160);
const cents = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const instant = z.string().datetime({ offset: true });
export const storefrontSettingsSchema = z.object({
	rentalOffers: z
		.array(
			z.object({
				id,
				name: z.string().trim().min(1),
				resourceId: id,
				rateMinor: cents,
				rateUnit: z.enum(['hour', 'day']),
				depositMinor: cents,
				active: z.boolean()
			})
		)
		.max(200)
		.default([]),
	membershipOffers: z
		.array(
			z.object({
				id,
				name: z.string().trim().min(1),
				kind: z.enum(['pack', 'membership']),
				priceMinor: cents,
				credits: z.number().int().nonnegative(),
				durationDays: z.number().int().positive().max(366),
				active: z.boolean()
			})
		)
		.max(200)
		.default([])
});
export const customerInput = z.object({
	name: z.string().trim().min(1).max(160),
	email: z.email().transform((v) => v.toLowerCase()),
	phone: z.string().regex(/^\+[1-9]\d{7,14}$/)
});
const delivery = z.object({
	method: z.enum(['collection', 'local-delivery', 'courier']),
	// Empty when the catalogue has no locations (for example a digital-only
	// shop). Physical orders re-validate the location server-side via
	// validateDelivery and the courier quote asserts, so only location-free
	// orders can complete without one.
	locationId: z.string().max(160).default(''),
	address: z.string().max(1000).default(''),
	area: z.string().max(160).default(''),
	at: instant.optional(),
	quoteId: id.optional(),
	optionId: id.optional(),
	city: z.string().trim().max(160).optional(),
	province: z.string().trim().max(160).optional(),
	postcode: z.string().trim().max(10).optional(),
	suburb: z.string().trim().max(160).optional()
});
export const purchaseSchema = z.discriminatedUnion('kind', [
	z.object({
		kind: z.literal('cart'),
		lines: z
			.array(
				z.object({
					productId: id,
					quantity: z.number().int().min(1).max(1000),
					expectedPriceMinor: cents
				})
			)
			.min(1)
			.max(100),
		delivery,
		discountCode: z.string().max(100).default('')
	}),
	z.object({
		kind: z.literal('appointment'),
		serviceId: id,
		resourceId: id,
		start: instant,
		partySize: z.number().int().min(1).max(50).default(1),
		expectedPriceMinor: cents
	}),
	z.object({
		kind: z.literal('rental'),
		offerId: id,
		start: instant,
		end: instant,
		quantity: z.number().int().min(1).max(1000),
		expectedRateMinor: cents,
		expectedDepositMinor: cents,
		expectedRateUnit: z.enum(['hour', 'day'])
	}),
	z.object({
		kind: z.literal('class'),
		classId: id,
		membershipId: id.optional(),
		expectedPriceMinor: cents
	}),
	z.object({
		kind: z.literal('membership'),
		offerId: id,
		expectedPriceMinor: cents
	}),
	z.object({
		kind: z.literal('preorder'),
		items: z
			.array(
				z
					.object({
						menuId: id,
						quantity: z.number().int().min(1).max(1000),
						extras: z.array(z.string().max(100)).max(30).default([]),
						expectedPriceMinor: cents,
						expectedExtraPriceMinor: cents.optional()
					})
					.strict()
			)
			.min(1)
			.max(100)
			.optional(),
		menuId: id,
		quantity: z.number().int().min(1).max(1000),
		collectionAt: instant,
		extras: z.array(z.string().max(100)).max(30).default([]),
		expectedExtraPriceMinor: cents.optional(),
		delivery,
		expectedPriceMinor: cents
	}),
	z.object({
		kind: z.literal('enquiry'),
		title: z.string().trim().min(1).max(200),
		details: z.string().trim().min(1).max(10000)
	}),
	z.object({
		kind: z.literal('accept-quote'),
		quoteId: id,
		expectedVersion: z.number().int().positive(),
		expectedPriceMinor: cents
	})
]);
export const checkoutSchema = z.object({
	operationId: z.string().uuid(),
	customer: customerInput,
	purchase: purchaseSchema,
	termsAccepted: z.literal(true)
});
export type Checkout = z.infer<typeof checkoutSchema>;
export type Purchase = z.infer<typeof purchaseSchema>;
export type Receipt = {
	downloads?: { id: string; name: string; url: string }[];
	balance?: import('./rental-balance').BalanceOffer;
	id: string;
	kind: Purchase['kind'];
	status: string;
	totalMinor: number;
	dueMinor: number;
	paymentExpiresAt?: string;
	calendarStatus?: string;
	refundStatus?: string;
	refundedMinor?: number;
	payment:
		| 'not_required'
		| 'pending'
		| 'paid'
		| 'deposit_paid'
		| 'refunded'
		| 'cancelled'
		| 'review'
		| 'expired';
	revision: number;
};
export type CatalogueItem = {
	id: string;
	name: string;
	type: string;
	description: string;
	priceMinor: number;
	version: number;
	details: Record<string, string | number | boolean>;
};
export type Catalogue = {
	branding?: { logo: string; colour: string; summary: string };
	tenantId: string;
	revision: number;
	name: string;
	currency: 'ZAR';
	items: CatalogueItem[];
	locations: { id: string; name: string; address: string; pickup: boolean }[];
	staff: { id: string; name: string }[];
	delivery: {
		localEnabled: boolean;
		areas: string[];
		feeMinor: number;
		courierEnabled?: boolean;
	};
	capabilities: Record<string, boolean>;
};
