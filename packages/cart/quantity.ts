/** Maximum units per product line, mirroring the checkout contract. */
export const maxCartQuantity = 1000;

/**
 * Coerce a quantity input to the integer range the checkout accepts.
 * Non-numeric text becomes 0 (unselected), fractions round down, and values
 * clamp to 0..1000. Zero stays unselected client-side so the server only ever
 * receives integers in 1..1000.
 */
export function sanitizeQuantity(value: unknown): number {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return 0;
	return Math.min(maxCartQuantity, Math.max(0, Math.floor(parsed)));
}
