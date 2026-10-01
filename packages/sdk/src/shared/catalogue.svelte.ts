import { storefrontClient } from '@mywinkel/block-sdk/public/storefront/client';
import type { Catalogue } from '@mywinkel/block-sdk/public/storefront/contracts';

export type CatalogueSource = Catalogue | (() => Catalogue | undefined);

const readSource = (source: CatalogueSource | undefined) =>
	typeof source === 'function' ? source() : source;

/**
 * Load the public catalogue while isolating stale responses from newer
 * refreshes. A supplied snapshot is already a reviewed publication and is
 * therefore never replaced by a client fetch.
 */
export function useCatalogue(source?: CatalogueSource) {
	let data = $state.raw<Catalogue | undefined>(readSource(source));
	let error = $state('');
	let generation = 0;

	$effect(() => {
		const supplied = readSource(source);
		if (supplied) {
			data = supplied;
			error = '';
			return;
		}

		let active = true;
		const refresh = () => {
			const started = ++generation;
			void storefrontClient.catalogue().then(
				(value) => {
					if (active && started === generation) {
						data = value;
						error = '';
					}
				},
				(failure: unknown) => {
					if (active && started === generation)
						error =
							failure instanceof Error ? failure.message : 'The catalogue could not be loaded.';
				}
			);
		};
		const unsubscribe = storefrontClient.subscribe(refresh);
		window.addEventListener('online', refresh);
		window.addEventListener('focus', refresh);
		refresh();
		return () => {
			active = false;
			generation++;
			unsubscribe();
			window.removeEventListener('online', refresh);
			window.removeEventListener('focus', refresh);
		};
	});

	return {
		get data() {
			return data;
		},
		get error() {
			return error;
		},
		refresh() {
			storefrontClient.catalogue(true).then(
				(value) => {
					data = value;
					error = '';
				},
				(failure: unknown) => {
					error = failure instanceof Error ? failure.message : 'The catalogue could not be loaded.';
				}
			);
		}
	};
}
