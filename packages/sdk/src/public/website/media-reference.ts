import { z } from 'zod';

/**
 * A website asset keeps the stable media record identifier beside the URL
 * captured by the reviewed release.  The URL is intentionally immutable for
 * a document revision; a media record may receive a later asset revision while
 * an already reviewed website keeps the URL it captured.
 */
export const mediaReferenceSchema = z
	.object({
		mediaId: z
			.string()
			.min(1)
			.max(200)
			.regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/),
		url: z
			.string()
			.max(2000)
			.refine(
				(value) => /^\/(?!\/)/.test(value) || /^https:\/\//.test(value),
				'Use a website path or HTTPS URL.'
			)
	})
	.strict();

export type MediaReference = z.infer<typeof mediaReferenceSchema>;

export const mediaReferenceListSchema = z.array(mediaReferenceSchema).max(500);

/**
 * Read stable references from an arbitrary website document.  This is kept
 * structural so media graph validation can run before a document is rendered,
 * without coupling the media module to the website block union.
 */
export function collectMediaReferences(value: unknown): MediaReference[] {
	const references: MediaReference[] = [];
	const seen = new Set<string>();
	function add(mediaId: unknown, url: unknown) {
		if (typeof mediaId !== 'string' || typeof url !== 'string') return;
		const parsed = mediaReferenceSchema.safeParse({ mediaId, url });
		if (!parsed.success) return;
		const key = parsed.data.mediaId + '\u0000' + parsed.data.url;
		if (!seen.has(key)) {
			seen.add(key);
			references.push(parsed.data);
		}
	}
	function visit(node: unknown) {
		if (typeof node === 'string') {
			// Rich text stores the stable ID beside the immutable img src. Attributes
			// can appear in either order, so capture each img tag as a small fragment.
			for (const match of node.matchAll(/<img\b[^>]*>/gi)) {
				const tag = match[0];
				const mediaId = /\bdata-media-id\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
				const url = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
				add(mediaId, url);
			}
			return;
		}
		if (!node || typeof node !== 'object') return;
		if (Array.isArray(node)) {
			for (const child of node) visit(child);
			return;
		}
		const record = node as Record<string, unknown>;
		add(record.mediaId, record.url ?? record.src ?? record.image);
		for (const child of Object.values(record)) visit(child);
		return;
	}

	visit(value);
	return references;
}

/** Resolve the URL from a stable reference map supplied by a staged release. */
export function resolveMediaReference(
	reference: MediaReference,
	staged: ReadonlyMap<string, MediaReference> | Record<string, MediaReference> = {}
) {
	const candidate =
		staged instanceof Map
			? staged.get(reference.mediaId)
			: (staged as Record<string, MediaReference>)[reference.mediaId];
	return candidate?.mediaId === reference.mediaId ? candidate : reference;
}

/** Return only references whose immutable URL changed between two revisions. */
export function changedMediaReferences(
	before: unknown,
	after: unknown
): { mediaId: string; before?: string | undefined; after?: string | undefined }[] {
	const previous = new Map(
		collectMediaReferences(before).map((value) => [value.mediaId, value.url])
	);
	const next = new Map(collectMediaReferences(after).map((value) => [value.mediaId, value.url]));
	return [...new Set([...previous.keys(), ...next.keys()])]
		.map((mediaId) => ({ mediaId, before: previous.get(mediaId), after: next.get(mediaId) }))
		.filter((value) => value.before !== value.after);
}
