import sanitize from 'sanitize-html';
export function sanitizeHtml(html: string) {
	return sanitize(html, {
		allowedTags: [
			'p',
			'br',
			'h1',
			'h2',
			'h3',
			'h4',
			'h5',
			'h6',
			'strong',
			'em',
			'b',
			'i',
			'u',
			's',
			'ul',
			'ol',
			'li',
			'blockquote',
			'a',
			'img',
			'figure',
			'figcaption',
			'div',
			'span',
			'section',
			'article',
			'header',
			'footer',
			'hr',
			'table',
			'thead',
			'tbody',
			'tr',
			'td',
			'th',
			'code',
			'pre'
		],
		allowedAttributes: {
			a: ['href', 'title'],
			img: ['src', 'alt', 'width', 'height', 'data-media-id'],
			'*': ['class', 'role', 'aria-label'],
			td: ['colspan', 'rowspan'],
			th: ['scope', 'colspan', 'rowspan']
		},
		allowedSchemes: ['https', 'mailto', 'tel'],
		allowedSchemesByTag: { img: ['https'] },
		allowProtocolRelative: false,
		parseStyleAttributes: false
	});
}

export const escapeHtml = (value: string) =>
	value.replace(
		/[&<>"']/g,
		(character) =>
			({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!
	);

