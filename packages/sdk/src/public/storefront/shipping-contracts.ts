import { z } from 'zod';
import { purchaseSchema } from './contracts';
export const shippingQuoteInput = purchaseSchema.options[0];
export type ShippingQuoteInput = z.infer<typeof shippingQuoteInput>;
export type ShippingOption = {
	id: string;
	serviceCode: string;
	name: string;
	amountMinor: number;
	description: string;
	minDeliveryDate?: string;
	maxDeliveryDate?: string;
};
export type ShippingQuote = {
	id: string;
	expiresAt: number;
	itemsTotalMinor: number;
	options: ShippingOption[];
	simulated: boolean;
};
/** Constructed only by the server after checking a stored quote and current cart. */
export type ApprovedShipping = {
	quoteId: string;
	optionId: string;
	serviceCode: string;
	name: string;
	amountMinor: number;
};
