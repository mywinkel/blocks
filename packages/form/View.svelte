<script lang="ts">
	import { twMerge } from 'tailwind-merge';
	import { createClasses } from '@mywinkel/block-sdk/appearance.svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import type { AppearanceInput } from '@mywinkel/block-sdk/appearance';
	import {
		formFileAccept,
		formFilePolicy,
		validateFormFile,
		FORM_FILE_LEGACY_MAX_FILES
	} from '@mywinkel/block-sdk/public/website/form-upload-policy';
	import type { FormDocument, FormField } from '@mywinkel/block-sdk/public/website/form-contracts';
	import { localPartDefaults as partDefaults } from './parts';

	export type PublicForm = Pick<
		FormDocument,
		'id' | 'name' | 'fields' | 'submitLabel' | 'successMessage'
	> & {
		formLayout?: 'stacked' | 'inline';
		layout?: 'stacked' | 'inline';
		floatingLabels?: boolean;
		style?: { layout?: 'stacked' | 'inline'; floatingLabels?: boolean };
	};

	type Props = {
		form: PublicForm;
		revision: string;
		preview?: boolean;
		appearance?: AppearanceInput;
	};

	let { form, revision, preview = false, appearance }: Props = $props();
	const cx = createClasses(() => appearance);
	const floatable = (field: FormField) =>
		['text', 'textarea', 'email', 'tel', 'number', 'date', 'select'].includes(field.type);
	const formStyle = (value: PublicForm) =>
		({
			layout: value.formLayout ?? value.layout ?? value.style?.layout ?? 'stacked',
			floatingLabels: value.floatingLabels ?? value.style?.floatingLabels ?? false
		}) as const;
	const fileCountLabel = (field: FormField) => {
		const policy = formFilePolicy(field),
			maxFiles = policy.legacy ? FORM_FILE_LEGACY_MAX_FILES : policy.maxFiles;
		return `Up to ${maxFiles} file${maxFiles === 1 ? '' : 's'}, ${Math.floor(policy.maxBytes / (1024 * 1024))} MB each.`;
	};

	let ready = $state(false);
	let busy = $state(false);
	let error = $state('');
	let success = $state('');
	let uploadBatch = $state('');
	let operation: { id: string; body: string } | undefined;
	const uploads = new SvelteMap<string, { operationId: string; id?: string }>();

	$effect(() => {
		ready = true;
		uploadBatch = crypto.randomUUID();
	});

	function ensureUploadIds() {
		if (!uploadBatch) uploadBatch = crypto.randomUUID();
	}

	async function request(
		path: string,
		body: BodyInit,
		json = true
	): Promise<Record<string, unknown>> {
		const response = await fetch('/_mywinkel/api/v1/storefront' + path, {
			method: 'POST',
			credentials: 'same-origin',
			headers: json ? { 'Content-Type': 'application/json' } : undefined,
			body
		});
		const result = (await response.json()) as Record<string, unknown>;
		if (!response.ok)
			throw Object.assign(
				new Error(
					typeof result.message === 'string'
						? result.message
						: 'Your response could not be sent. Please try again.'
				),
				{ code: result.code }
			);
		return result;
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (preview || busy) return;
		const target = event.currentTarget;
		if (!(target instanceof HTMLFormElement)) return;
		// Disabled controls are omitted from FormData, so capture before entering the busy state.
		const data = new FormData(target);
		busy = true;
		error = '';
		try {
			ensureUploadIds();
			await request('/session', JSON.stringify({}));
			const answers: Record<string, string | number | boolean | string[]> = {};
			let legacyFileCount = 0;
			for (const field of form.fields) {
				if (field.type !== 'file') continue;
				const files = data
					.getAll(field.id)
					.filter((file): file is File => file instanceof File && file.size > 0);
				const policy = formFilePolicy(field);
				const maxFiles = policy.legacy ? FORM_FILE_LEGACY_MAX_FILES : policy.maxFiles;
				if (policy.legacy) legacyFileCount += files.length;
				if (files.length > maxFiles)
					throw new Error(
						`Choose no more than ${maxFiles} file${maxFiles === 1 ? '' : 's'} for ${field.label}.`
					);
				const ids: string[] = [];
				for (const file of files) {
					if (file.size > policy.maxBytes)
						throw new Error(
							`Each attachment for ${field.label} must be ${Math.floor(policy.maxBytes / (1024 * 1024))} MB or smaller.`
						);
					try {
						validateFormFile(field, file.name, new Uint8Array(await file.arrayBuffer()));
					} catch (cause) {
						throw new Error(
							cause instanceof Error
								? cause.message
								: `Choose a file matching the allowed types for ${field.label}.`,
							{ cause }
						);
					}
					const bytes = await file.arrayBuffer();
					const hash = Array.from(
						new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)),
						(byte) => byte.toString(16).padStart(2, '0')
					).join('');
					const key = `${field.id}:${hash}`;
					const upload = uploads.get(key) ?? { operationId: crypto.randomUUID() };
					uploads.set(key, upload);
					if (!upload.id) {
						const payload = new FormData();
						payload.set('file', file);
						payload.set('revision', revision);
						payload.set('fieldId', field.id);
						payload.set('batchId', uploadBatch);
						payload.set('operationId', upload.operationId);
						const result = await request(
							`/forms/${encodeURIComponent(form.id)}/uploads`,
							payload,
							false
						);
						upload.id = String(result.id);
					}
					if (upload.id) ids.push(upload.id);
				}
				answers[field.id] = ids;
			}
			if (legacyFileCount > FORM_FILE_LEGACY_MAX_FILES)
				throw new Error(`Attach no more than ${FORM_FILE_LEGACY_MAX_FILES} files.`);
			for (const field of form.fields) {
				if (field.type === 'file') continue;
				if (field.type === 'checkbox' || field.type === 'consent')
					answers[field.id] = data.has(field.id);
				else if (field.type === 'number') {
					const value = String(data.get(field.id) ?? '');
					if (value) answers[field.id] = Number(value);
				} else answers[field.id] = String(data.get(field.id) ?? '');
			}
			const body = JSON.stringify({
				revision,
				answers,
				website: String(data.get('__cms_honeypot') ?? '')
			});
			if (!operation || operation.body !== body) operation = { id: crypto.randomUUID(), body };
			const result = await request(
				`/forms/${encodeURIComponent(form.id)}/submissions`,
				JSON.stringify({ ...JSON.parse(body), operationId: operation.id })
			);
			success = typeof result.message === 'string' ? result.message : form.successMessage;
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'Your response could not be sent.';
		} finally {
			busy = false;
		}
	}

	function changed(event: Event) {
		const target = event.target;
		if (target instanceof HTMLInputElement && target.type === 'file') {
			// A new selection starts a new upload batch. Unchanged retries retain all IDs.
			uploadBatch = crypto.randomUUID();
			uploads.clear();
			operation = undefined;
		}
	}

	function inputId(field: FormField) {
		return `mw-form-${form.id}-${field.id}`;
	}

	function descriptionId(field: FormField) {
		return field.help ? `${inputId(field)}-help` : undefined;
	}

	function controlClass(field: FormField, floating = false) {
		return twMerge(
			cx(
				field.type === 'file' ? 'form.fileControl' : 'form.control',
				field.type === 'file' ? partDefaults.fileControl : partDefaults.control
			),
			field.type === 'textarea' ? cx('form.textarea', partDefaults.textarea) : '',
			floating ? cx('form.floatControl', partDefaults.floatControl) : ''
		);
	}

	function inlineFullWidth(field: FormField) {
		return style.layout === 'inline' &&
			['textarea', 'file', 'radio', 'checkbox', 'consent'].includes(field.type)
			? cx('form.inlineFullWidth', partDefaults.inlineFullWidth)
			: '';
	}

	const style = $derived(formStyle(form));
</script>

{#if success}
	<div class={cx('form.success', partDefaults.success)} role="status">
		<h3 class={cx('form.successHeading', partDefaults.successHeading)}>Response received</h3>
		<p class={cx('form.successMessage', partDefaults.successMessage)}>{success}</p>
	</div>
{:else}
	<form
		class={cx('form.root', partDefaults.root)}
		onsubmit={submit}
		onchange={changed}
		aria-label={form.name}
	>
		<fieldset
			class={cx('form.fieldset', partDefaults.fieldset)}
			disabled={!ready || busy || preview}
		>
			<legend class={cx('form.legend', partDefaults.legend)}>{form.name}</legend>
			<div
				class={[
					cx('form.fields', partDefaults.fields),
					style.layout === 'inline' ? cx('form.inlineFields', partDefaults.inlineFields) : ''
				]
					.filter(Boolean)
					.join(' ')}
			>
				{#each form.fields as field (field.id)}
					{@const id = inputId(field)}
					{@const describedBy = descriptionId(field)}
					{@const canFloat = style.floatingLabels && floatable(field)}
					{#if field.type === 'radio'}
						<fieldset
							class={[cx('form.choice', partDefaults.choice), inlineFullWidth(field)]
								.filter(Boolean)
								.join(' ')}
						>
							<legend class={cx('form.label', partDefaults.label)}
								>{field.label}{field.required ? ' *' : ''}</legend
							>
							<div class={cx('form.options', partDefaults.options)}>
								{#each field.options as option (option)}
									<label class={cx('form.option', partDefaults.option)}>
										<input
											class={cx('form.radio', partDefaults.radio)}
											type="radio"
											name={field.id}
											value={option}
											required={field.required}
										/>
										<span class={cx('form.optionLabel', partDefaults.optionLabel)}>{option}</span>
									</label>
								{/each}
							</div>
							{#if field.help}<small class={cx('form.help', partDefaults.help)} id={describedBy}
									>{field.help}</small
								>{/if}
						</fieldset>
					{:else if field.type === 'checkbox' || field.type === 'consent'}
						<div
							class={[cx('form.choice', partDefaults.choice), inlineFullWidth(field)]
								.filter(Boolean)
								.join(' ')}
						>
							<label class={cx('form.choiceLabel', partDefaults.choiceLabel)} for={id}>
								<input
									class={cx('form.checkbox', partDefaults.checkbox)}
									{id}
									name={field.id}
									type="checkbox"
									required={field.required}
								/>
								<span class={cx('form.optionLabel', partDefaults.optionLabel)}
									>{field.label}{field.required ? ' *' : ''}</span
								>
							</label>
							{#if field.help}<small class={cx('form.help', partDefaults.help)} id={describedBy}
									>{field.help}</small
								>{/if}
						</div>
					{:else if canFloat}
						<div
							class={[cx('form.floatField', partDefaults.floatField), inlineFullWidth(field)]
								.filter(Boolean)
								.join(' ')}
						>
							{#if field.type === 'textarea'}
								<textarea
									class={controlClass(field, true)}
									{id}
									name={field.id}
									required={field.required}
									maxlength="10000"
									placeholder=" "
									aria-describedby={describedBy}></textarea>
							{:else if field.type === 'select'}
								<select
									class={controlClass(field, true)}
									{id}
									name={field.id}
									required={field.required}
									aria-describedby={describedBy}
								>
									<option value="">Choose an option</option>
									{#each field.options as option (option)}<option value={option}>{option}</option
										>{/each}
								</select>
							{:else}
								<input
									class={controlClass(field, true)}
									{id}
									name={field.id}
									type={field.type}
									step={field.type === 'number' ? 'any' : undefined}
									maxlength="10000"
									placeholder=" "
									required={field.required}
									aria-describedby={describedBy}
								/>
							{/if}
							<label class={cx('form.floatLabel', partDefaults.floatLabel)} for={id}
								>{field.label}{field.required ? ' *' : ''}</label
							>
							{#if field.help}<small class={cx('form.help', partDefaults.help)} id={describedBy}
									>{field.help}</small
								>{/if}
						</div>
					{:else}
						<div
							class={[cx('form.field', partDefaults.field), inlineFullWidth(field)]
								.filter(Boolean)
								.join(' ')}
						>
							<label class={cx('form.label', partDefaults.label)} for={id}
								>{field.label}{field.required ? ' *' : ''}</label
							>
							{#if field.type === 'textarea'}
								<textarea
									class={controlClass(field)}
									{id}
									name={field.id}
									required={field.required}
									maxlength="10000"
									aria-describedby={describedBy}></textarea>
							{:else if field.type === 'select'}
								<select
									class={controlClass(field)}
									{id}
									name={field.id}
									required={field.required}
									aria-describedby={describedBy}
								>
									<option value="">Choose an option</option>
									{#each field.options as option (option)}<option value={option}>{option}</option
										>{/each}
								</select>
							{:else if field.type === 'file'}
								<input
									class={controlClass(field)}
									{id}
									name={field.id}
									type="file"
									multiple={(formFilePolicy(field).legacy
										? FORM_FILE_LEGACY_MAX_FILES
										: formFilePolicy(field).maxFiles) > 1}
									required={field.required}
									accept={formFileAccept(field)}
									aria-describedby={describedBy}
								/>
							{:else}
								<input
									class={controlClass(field)}
									{id}
									name={field.id}
									type={field.type}
									step={field.type === 'number' ? 'any' : undefined}
									maxlength="10000"
									required={field.required}
									aria-describedby={describedBy}
								/>
							{/if}
							{#if field.help}<small class={cx('form.help', partDefaults.help)} id={describedBy}
									>{field.help}</small
								>{/if}
							{#if field.type === 'file'}<small class={cx('form.fileHelp', partDefaults.fileHelp)}
									>{fileCountLabel(field)} Files stay private.</small
								>{/if}
						</div>
					{/if}
				{/each}
			</div>
			<div class={cx('form.honeypot', partDefaults.honeypot)} aria-hidden="true">
				<label>Website<input name="__cms_honeypot" tabindex="-1" autocomplete="off" /></label>
			</div>
			<button class={cx('form.submit', partDefaults.submit)} type="submit"
				>{busy ? 'Sending…' : form.submitLabel}</button
			>
		</fieldset>
		{#if error}<p class={cx('form.error', partDefaults.error)} role="alert">{error}</p>{/if}
	</form>
{/if}
