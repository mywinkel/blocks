import { z } from 'zod';

/**
 * Form contracts live separately from the page and block contracts so the
 * storefront upload policy can evolve without pulling the whole document
 * union into an upload request. Keep this identifier shape in step with the
 * website document contracts; form values are still checked again at the
 * document boundary by contracts.ts.
 */
const formSiteId = z
	.string()
	.min(1)
	.max(100)
	.regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/);

const formBase = {
	schemaVersion: z.literal(2, {
		error:
			'Website schema version 2 is required. Reset maintained fixtures or migrate this site before opening it.'
	}),
	id: formSiteId,
	name: z.string().trim().min(1).max(200)
};

export const formFieldTypes = [
	'text',
	'textarea',
	'email',
	'tel',
	'number',
	'date',
	'select',
	'radio',
	'checkbox',
	'consent',
	'file'
] as const;

export const formFilePresets = [
	'images',
	'documents',
	'audio',
	'video',
	'images-and-documents',
	'custom',
	'any'
] as const;

const formFileSchema = z
	.object({
		preset: z.enum(formFilePresets).optional(),
		extensions: z.array(z.string().trim().min(1).max(32)).max(50).optional(),
		maxBytes: z
			.number()
			.int()
			.min(1)
			.max(10 * 1024 * 1024)
			.optional(),
		maxFiles: z.number().int().min(1).max(10).optional()
	})
	.strict();

export const formFieldSchema = z
	.object({
		id: formSiteId,
		label: z.string().min(1).max(200),
		type: z.enum(formFieldTypes),
		required: z.boolean().default(false),
		help: z.string().max(500).default(''),
		options: z.array(z.string().min(1).max(200)).max(50).default([]),
		file: formFileSchema.optional()
	})
	.strict();

export const formDocumentSchema = z
	.object({
		...formBase,
		kind: z.literal('form'),
		fields: z.array(formFieldSchema).min(1).max(50),
		submitLabel: z.string().min(1).max(80).default('Send enquiry'),
		successMessage: z
			.string()
			.min(1)
			.max(1000)
			.default('Thank you. Your response has been received.'),
		actions: z
			.object({
				notifyStaff: z.array(z.email()).max(20).default([]),
				customer: z.boolean().default(false),
				enquiry: z.boolean().default(false),
				nameField: z.string().default(''),
				emailField: z.string().default(''),
				phoneField: z.string().default(''),
				messageField: z.string().default('')
			})
			.strict()
			.default({
				notifyStaff: [],
				customer: false,
				enquiry: false,
				nameField: '',
				emailField: '',
				phoneField: '',
				messageField: ''
			}),
		formLayout: z.enum(['stacked', 'inline']).default('stacked'),
		floatingLabels: z.boolean().default(false)
	})
	.strict()
	.superRefine((form, ctx) => {
		if (new Set(form.fields.map((field) => field.id)).size !== form.fields.length)
			ctx.addIssue({
				code: 'custom',
				message: 'Field identifiers must be unique.',
				path: ['fields']
			});
		for (const field of form.fields)
			if (['select', 'radio'].includes(field.type) && !field.options.length)
				ctx.addIssue({
					code: 'custom',
					message: 'Choice fields need at least one option.',
					path: ['fields']
				});
		for (const key of ['nameField', 'emailField', 'phoneField', 'messageField'] as const)
			if (form.actions[key] && !form.fields.some((field) => field.id === form.actions[key]))
				ctx.addIssue({
					code: 'custom',
					message: 'Choose an existing field for each action mapping.',
					path: ['actions', key]
				});
		if (
			(form.actions.customer || form.actions.enquiry) &&
			(!form.actions.nameField || !form.actions.emailField)
		)
			ctx.addIssue({
				code: 'custom',
				message: 'Customer and enquiry actions require name and email mappings.',
				path: ['actions']
			});
	});

export type FormFilePreset = (typeof formFilePresets)[number];
export type FormField = z.infer<typeof formFieldSchema>;
export type FormDocument = z.infer<typeof formDocumentSchema>;
