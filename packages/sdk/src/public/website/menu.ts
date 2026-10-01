import { z } from 'zod';
import type { SiteDocument } from './contracts';

const id = z
	.string()
	.min(1)
	.max(200)
	.regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/);
const href = z
	.string()
	.max(2000)
	.refine(
		(value) =>
			!value ||
			/^\/(?!\/)/.test(value) ||
			/^https:\/\//.test(value) ||
			/^(?:mailto:|tel:|#)/.test(value),
		'Use a website path, anchor, mailto, tel, or HTTPS URL.'
	);

/** A menu target is a route reference or an explicitly external/local URL. */
export const menuItemSchema: z.ZodType<MenuItem> = z
	.object({
		id,
		pageId: id.optional(),
		aliasId: id.optional(),
		href: href.default(''),
		label: z.string().max(300).default(''),
		children: z.lazy(() => z.array(menuItemSchema).max(100).default([]))
	})
	.strict()
	.superRefine((item, ctx) => {
		const targets = [item.pageId, item.aliasId, item.href].filter(Boolean);
		if (targets.length !== 1)
			ctx.addIssue({
				code: 'custom',
				message: 'A menu item needs exactly one page, alias, or URL target.'
			});
		if (item.pageId && item.aliasId)
			ctx.addIssue({
				code: 'custom',
				message: 'A menu item cannot target both a page and an alias.'
			});
	});

export type MenuItem = {
	id: string;
	pageId?: string | undefined;
	/** Accepted for clients that use a separate alias target field. */
	aliasId?: string | undefined;
	href: string;
	label: string;
	children: MenuItem[];
};

export const menuOrientationSchema = z.enum(['horizontal', 'vertical']);
export const menuPropsSchema = z
	.object({
		orientation: menuOrientationSchema.default('horizontal'),
		menuItems: z.array(menuItemSchema).max(100).default([])
	})
	.strict();
export type MenuProps = z.infer<typeof menuPropsSchema>;

export type ResolvedMenuItem = MenuItem & {
	href: string;
	label: string;
	children: ResolvedMenuItem[];
};

function indexDocuments(documents: SiteDocument[]) {
	return new Map(documents.map((document) => [document.id, document]));
}

/** Resolve page and alias references only when a menu is rendered. */
export function resolveMenuItems(items: MenuItem[], documents: SiteDocument[]): ResolvedMenuItem[] {
	const byId = indexDocuments(documents);
	const seen = new Set<string>();
	function resolve(item: MenuItem, path: string): ResolvedMenuItem {
		if (seen.has(item.id))
			throw new Error(`Menu item ${item.id} is repeated or recursive at ${path}.`);
		seen.add(item.id);
		const target = item.pageId
			? byId.get(item.pageId)
			: item.aliasId
				? byId.get(item.aliasId)
				: undefined;
		let targetHref = item.href;
		let targetLabel = item.label;
		if (item.pageId) {
			if (!target || (target.kind !== 'page' && target.kind !== 'alias'))
				throw new Error(`Menu route ${item.pageId} is missing.`);
			targetHref = target.slug;
			targetLabel ||= target.name;
		} else if (item.aliasId) {
			if (!target || target.kind !== 'alias')
				throw new Error(`Menu alias ${item.aliasId} is missing.`);
			targetHref = target.slug;
			targetLabel ||= target.name;
		}
		if (!targetHref) throw new Error(`Menu item ${item.id} has no target URL.`);
		const children = item.children.map((child) => resolve(child, `${path}/${child.id}`));
		seen.delete(item.id);
		return { ...item, href: targetHref, label: targetLabel || targetHref, children };
	}
	return items.map((item) => resolve(item, item.id));
}

/** Route links are tracked separately from content dependencies. */
export function menuItemReferences(items: MenuItem[]): string[] {
	const result: string[] = [];
	function visit(item: MenuItem) {
		if (item.pageId) result.push(item.pageId);
		if (item.aliasId) result.push(item.aliasId);
		item.children.forEach(visit);
	}
	items.forEach(visit);
	return [...new Set(result)];
}

/** Find menu route references in inline blocks, without treating them as content edges. */
export function menuReferences(value: unknown): string[] {
	const result: string[] = [];
	function visit(node: unknown) {
		if (!node || typeof node !== 'object') return;
		if (Array.isArray(node)) {
			node.forEach(visit);
			return;
		}
		const record = node as Record<string, unknown>;
		if (record.type === 'menu' && record.props && typeof record.props === 'object') {
			const props = record.props as Record<string, unknown>;
			const parsed = z.array(menuItemSchema).safeParse(props.menuItems);
			if (parsed.success) result.push(...menuItemReferences(parsed.data));
		}
		for (const child of Object.values(record)) visit(child);
	}
	visit(value);
	return [...new Set(result)];
}

export function menuItemCount(items: MenuItem[]): number {
	return items.reduce((count, item) => count + 1 + menuItemCount(item.children), 0);
}
