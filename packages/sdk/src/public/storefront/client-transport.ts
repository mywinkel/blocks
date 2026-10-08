export function createStorefrontTransport(fetcher: typeof fetch, base: string) {
	async function jsonResponse<T>(response: Response): Promise<T> {
		const body = await response.json();
		if (!response.ok)
			throw Object.assign(new Error(body.message ?? 'This request could not be confirmed.'), {
				code: body.code,
				issues: body.issues
			});
		return body as T;
	}

	function request(path: string, init?: RequestInit) {
		return fetcher(base + path, init);
	}

	function post<T>(path: string, value: unknown): Promise<T> {
		if (typeof navigator !== 'undefined' && navigator.onLine === false)
			throw new Error('You are offline. Reconnect and submit again; nothing has been queued.');
		return request(path, {
			method: 'POST',
			credentials: 'same-origin',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(value)
		}).then(jsonResponse<T>);
	}

	return { jsonResponse, request, post };
}

export type StorefrontTransport = ReturnType<typeof createStorefrontTransport>;
