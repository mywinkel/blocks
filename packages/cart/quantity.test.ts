import { describe, expect, it } from 'vitest';
import { maxCartQuantity, sanitizeQuantity } from './quantity';

describe('cart quantity sanitization', () => {
	it('keeps whole quantities within the checkout range', () => {
		expect(sanitizeQuantity('2')).toBe(2);
		expect(sanitizeQuantity(1)).toBe(1);
		expect(sanitizeQuantity('1000')).toBe(maxCartQuantity);
		expect(sanitizeQuantity('0')).toBe(0);
	});
	it('rounds fractions down instead of submitting them to the server', () => {
		expect(sanitizeQuantity('2.9')).toBe(2);
		expect(sanitizeQuantity(1.5)).toBe(1);
	});
	it('maps non-numeric input to unselected instead of NaN', () => {
		expect(sanitizeQuantity('')).toBe(0);
		expect(sanitizeQuantity('abc')).toBe(0);
		expect(sanitizeQuantity(Number.NaN)).toBe(0);
		expect(sanitizeQuantity(Number.POSITIVE_INFINITY)).toBe(0);
		expect(sanitizeQuantity(undefined)).toBe(0);
	});
	it('clamps out-of-range input to the checkout bounds', () => {
		expect(sanitizeQuantity('-3')).toBe(0);
		expect(sanitizeQuantity(-1)).toBe(0);
		expect(sanitizeQuantity('1001')).toBe(maxCartQuantity);
		expect(sanitizeQuantity(999999)).toBe(maxCartQuantity);
	});
});
