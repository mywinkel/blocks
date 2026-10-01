/**
 * Published website form upload policy.
 *
 * These values are deliberately separate from the media library policy. Form
 * attachments stay private and are validated again when the published form
 * revision is loaded by the upload and submission endpoints.
 */
export const FORM_FILE_MAX_BYTES = 10 * 1024 * 1024;
export const FORM_FILE_DEFAULT_MAX_FILES = 1;
export const FORM_FILE_MAX_FILES = 10;
export const FORM_FILE_LEGACY_MAX_FILES = 3;

export type FormFilePreset =
	'images' | 'documents' | 'audio' | 'video' | 'images-and-documents' | 'custom' | 'any';

export type FormFileSettings = {
	preset?: FormFilePreset;
	extensions?: string[];
	maxBytes?: number;
	maxFiles?: number;
};

/** Recognised signatures which can be safely exposed as a browser accept list. */
export const FORM_FILE_PRESETS: Record<
	Exclude<FormFilePreset, 'any' | 'custom'>,
	readonly string[]
> = {
	images: ['image/jpeg', 'image/png', 'image/webp'],
	documents: [
		'application/pdf',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		'text/plain',
		'text/csv'
	],
	audio: ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp4', 'audio/webm', 'audio/flac'],
	video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'],
	'images-and-documents': [
		'image/jpeg',
		'image/png',
		'image/webp',
		'application/pdf',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		'text/plain',
		'text/csv'
	]
};

const legacyFileTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;

const presetExtensions: Record<Exclude<FormFilePreset, 'any' | 'custom'>, readonly string[]> = {
	images: ['.jpg', '.jpeg', '.png', '.webp'],
	documents: ['.pdf', '.docx', '.xlsx', '.txt', '.csv'],
	audio: ['.mp3', '.ogg', '.oga', '.wav', '.m4a', '.m4b', '.flac', '.weba'],
	video: ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.ogv'],
	'images-and-documents': [
		'.jpg',
		'.jpeg',
		'.png',
		'.webp',
		'.pdf',
		'.docx',
		'.xlsx',
		'.txt',
		'.csv'
	]
};

export const formFileDefaultSettings = (): FormFileSettings => ({
	preset: 'images-and-documents',
	extensions: [],
	maxBytes: FORM_FILE_MAX_BYTES,
	maxFiles: FORM_FILE_DEFAULT_MAX_FILES
});

type FormFileField = {
	file?: FormFileSettings | Record<string, unknown> | null;
};

export type FormFilePolicy = {
	preset: FormFilePreset;
	extensions: string[];
	maxBytes: number;
	maxFiles: number;
	/** True when no new upload settings were persisted on this field. */
	legacy: boolean;
};

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
	value && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: undefined;

function normalisePreset(value: unknown): FormFilePreset | undefined {
	if (typeof value !== 'string') return undefined;
	const preset = value.trim().toLowerCase();
	if (preset === 'image' || preset === 'images-only') return 'images';
	if (preset === 'pdf' || preset === 'pdfs' || preset === 'document') return 'documents';
	if (preset === 'images-and-pdfs' || preset === 'images-pdfs' || preset === 'image-and-documents')
		return 'images-and-documents';
	if (preset === 'all' || preset === 'any-file' || preset === 'any-file-type' || preset === '*')
		return 'any';
	if (preset === 'custom' || preset === 'extensions' || preset === 'extension') return 'custom';
	if (
		['images', 'documents', 'audio', 'video', 'images-and-documents', 'custom', 'any'].includes(
			preset
		)
	)
		return preset as FormFilePreset;
	return undefined;
}

function normaliseExtensions(value: unknown): string[] {
	const values = Array.isArray(value)
		? value
		: typeof value === 'string'
			? value.split(/[\s,\n]+/)
			: [];
	return [
		...new Set(
			values
				.filter((item): item is string => typeof item === 'string')
				.map((item) => item.trim().toLowerCase())
				.map((item) => (item && !item.startsWith('.') ? `.${item}` : item))
				.filter((item) => /^\.[a-z0-9][a-z0-9+_-]{0,31}$/.test(item))
		)
	].slice(0, 50);
}

function boundedInteger(value: unknown, fallback: number, min: number, max: number) {
	if (typeof value !== 'number' || !Number.isInteger(value)) return fallback;
	return Math.max(min, Math.min(max, value));
}

function boundedBytes(value: unknown, fallback = FORM_FILE_MAX_BYTES) {
	if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) return fallback;
	return Math.min(FORM_FILE_MAX_BYTES, value);
}

/**
 * Read a file field's settings. A field with no new settings uses the legacy
 * aggregate protection so existing published forms keep their old contract.
 */
export function formFilePolicy(field: FormFileField): FormFilePolicy {
	const nested = asRecord(field.file),
		rawPreset = nested?.preset,
		rawExtensions = nested?.extensions,
		rawMaxBytes = nested?.maxBytes,
		rawMaxFiles = nested?.maxFiles,
		extensions = normaliseExtensions(rawExtensions),
		preset = normalisePreset(rawPreset) ?? (extensions.length ? 'custom' : undefined),
		configured =
			rawPreset !== undefined ||
			rawExtensions !== undefined ||
			rawMaxBytes !== undefined ||
			rawMaxFiles !== undefined;
	return {
		preset: preset ?? 'images-and-documents',
		extensions,
		maxBytes: boundedBytes(rawMaxBytes),
		maxFiles: boundedInteger(rawMaxFiles, FORM_FILE_DEFAULT_MAX_FILES, 1, FORM_FILE_MAX_FILES),
		legacy: !configured
	};
}

/** Return MIME types and extensions for the native browser accept attribute. */
export function formFileAccept(field: FormFileField): string | undefined {
	const policy = formFilePolicy(field);
	if (policy.preset === 'any') return undefined;
	if (policy.legacy) return legacyFileTypes.join(',');
	const values = [
		...(policy.preset === 'custom' ? [] : FORM_FILE_PRESETS[policy.preset]),
		...(policy.preset === 'custom' ? [] : presetExtensions[policy.preset]),
		...policy.extensions
	];
	return [...new Set(values)].join(',');
}

export function fileExtension(name: string): string {
	const match = /(?:^|\/)[^/]*\.([a-z0-9][a-z0-9+_-]{0,31})$/i.exec(name);
	return match ? `.${match[1].toLowerCase()}` : '';
}

type KnownFileType = {
	contentType: string;
	requiresSignature?: boolean;
};

const recognisedExtensionTypes: Record<string, KnownFileType> = {
	'.jpg': { contentType: 'image/jpeg', requiresSignature: true },
	'.jpeg': { contentType: 'image/jpeg', requiresSignature: true },
	'.png': { contentType: 'image/png', requiresSignature: true },
	'.webp': { contentType: 'image/webp', requiresSignature: true },
	'.pdf': { contentType: 'application/pdf', requiresSignature: true },
	'.docx': {
		contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		requiresSignature: true
	},
	'.xlsx': {
		contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		requiresSignature: true
	},
	'.txt': { contentType: 'text/plain' },
	'.csv': { contentType: 'text/csv' },
	'.mp3': { contentType: 'audio/mpeg', requiresSignature: true },
	'.ogg': { contentType: 'audio/ogg', requiresSignature: true },
	'.oga': { contentType: 'audio/ogg', requiresSignature: true },
	'.wav': { contentType: 'audio/wav', requiresSignature: true },
	'.m4a': { contentType: 'audio/mp4', requiresSignature: true },
	'.m4b': { contentType: 'audio/mp4', requiresSignature: true },
	'.flac': { contentType: 'audio/flac', requiresSignature: true },
	'.weba': { contentType: 'audio/webm', requiresSignature: true },
	'.mp4': { contentType: 'video/mp4', requiresSignature: true },
	'.webm': { contentType: 'video/webm', requiresSignature: true },
	'.mov': { contentType: 'video/quicktime', requiresSignature: true },
	'.avi': { contentType: 'video/x-msvideo', requiresSignature: true },
	'.mkv': { contentType: 'video/x-matroska', requiresSignature: true },
	'.ogv': { contentType: 'video/ogg', requiresSignature: true }
};

const starts = (bytes: Uint8Array, values: number[]) =>
	values.every((value, index) => bytes[index] === value);

function asciiIncludes(bytes: Uint8Array, value: string) {
	const target = Array.from(value, (character) => character.charCodeAt(0));
	outer: for (let offset = 0; offset <= bytes.length - target.length; offset++) {
		for (let index = 0; index < target.length; index++)
			if (bytes[offset + index] !== target[index]) continue outer;
		return true;
	}
	return false;
}

/** MIME signatures used by the private form attachment store. */
export function sniffFormFileType(bytes: Uint8Array, extension = ''): string | undefined {
	if (starts(bytes, [137, 80, 78, 71, 13, 10, 26, 10])) return 'image/png';
	if (starts(bytes, [255, 216, 255])) return 'image/jpeg';
	if (starts(bytes, [0x49, 0x44, 0x33]) || (bytes[0] === 0xff && (bytes[1]! & 0xe0) === 0xe0))
		return 'audio/mpeg';
	const text = new TextDecoder().decode(bytes.slice(0, 32));
	if (text.startsWith('RIFF') && text.slice(8, 12) === 'WEBP') return 'image/webp';
	if (text.startsWith('%PDF-')) return 'application/pdf';
	if (text.startsWith('RIFF') && text.slice(8, 12) === 'WAVE') return 'audio/wav';
	if (text.startsWith('RIFF') && text.slice(8, 12) === 'AVI ') return 'video/x-msvideo';
	if (text.startsWith('OggS')) return extension === '.ogv' ? 'video/ogg' : 'audio/ogg';
	if (starts(bytes, [0x66, 0x4c, 0x61, 0x43])) return 'audio/flac';
	if (starts(bytes, [0x1a, 0x45, 0xdf, 0xa3]))
		return extension === '.weba'
			? 'audio/webm'
			: extension === '.mkv'
				? 'video/x-matroska'
				: 'video/webm';
	if (bytes.length >= 12 && text.slice(4, 8) === 'ftyp') {
		if (extension === '.m4a' || extension === '.m4b' || asciiIncludes(bytes.slice(8, 16), 'M4A'))
			return 'audio/mp4';
		if (extension === '.mov') return 'video/quicktime';
		return 'video/mp4';
	}
	if (
		(starts(bytes, [0x50, 0x4b, 0x03, 0x04]) || starts(bytes, [0x50, 0x4b, 0x05, 0x06])) &&
		asciiIncludes(bytes, 'word/')
	)
		return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
	if (
		(starts(bytes, [0x50, 0x4b, 0x03, 0x04]) || starts(bytes, [0x50, 0x4b, 0x05, 0x06])) &&
		asciiIncludes(bytes, 'xl/')
	)
		return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
	return undefined;
}

function knownTypeForExtension(extension: string) {
	return recognisedExtensionTypes[extension];
}

function presetMatches(policy: FormFilePolicy, contentType: string | undefined) {
	if (policy.preset === 'any') return true;
	if (!contentType || policy.preset === 'custom') return false;
	return FORM_FILE_PRESETS[policy.preset].includes(contentType);
}

/**
 * Validate bytes and filename against a field's policy. Unknown signatures
 * are allowed for arbitrary custom extensions; known signatures cannot be
 * smuggled through a mismatched recognised extension or preset.
 */
export function validateFormFile(
	field: FormFileField,
	name: string,
	bytes: Uint8Array
): { contentType: string; policy: FormFilePolicy } {
	const policy = formFilePolicy(field),
		extension = fileExtension(name),
		extensionType = knownTypeForExtension(extension),
		detectedType = sniffFormFileType(bytes, extension),
		contentType = detectedType ?? extensionType?.contentType,
		allowedExtensions = new Set(policy.extensions);
	if (detectedType && extensionType && detectedType !== extensionType.contentType)
		throw new Error('This file does not match its filename extension.');
	if (policy.legacy) {
		if (!detectedType || !(legacyFileTypes as readonly string[]).includes(detectedType))
			throw new Error('Choose a JPEG, PNG, WebP image or PDF.');
		return { contentType: detectedType, policy };
	}
	if (policy.preset === 'custom') {
		if (!extension || !allowedExtensions.has(extension))
			throw new Error(
				`Choose a file with one of these extensions: ${policy.extensions.join(', ')}.`
			);
		return { contentType: contentType ?? 'application/octet-stream', policy };
	}
	if (policy.preset === 'any')
		return { contentType: contentType ?? 'application/octet-stream', policy };
	if (extensionType?.requiresSignature && !detectedType)
		throw new Error('This file does not match its filename extension.');
	if (!contentType || !presetMatches(policy, contentType))
		throw new Error('Choose a file matching the selected type preset.');
	return { contentType, policy };
}

/** Check a persisted upload's inferred MIME and filename against a policy. */
export function formContentTypeAllowed(field: FormFileField, contentType: string, name?: string) {
	const policy = formFilePolicy(field);
	if (policy.legacy) return (legacyFileTypes as readonly string[]).includes(contentType);
	if (policy.preset === 'any') return true;
	if (policy.preset === 'custom') {
		if (name && policy.extensions.includes(fileExtension(name))) return true;
		return Object.entries(recognisedExtensionTypes).some(
			([extension, value]) =>
				value.contentType === contentType && policy.extensions.includes(extension)
		);
	}
	return FORM_FILE_PRESETS[policy.preset].includes(contentType);
}
