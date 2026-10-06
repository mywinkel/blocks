import type { Catalogue } from "../public/storefront/contracts";
import { subscribeSelection } from "./selection";
/** Listen through the DOM because each block has an independent browser bundle. */
export function connectSelection(
  source: () => Catalogue | undefined,
  kind: string,
  apply: (id: string) => void,
) {
  $effect(() => {
    const data = source();
    if (!data) return;
    return subscribeSelection(data.tenantId, kind, (value) => {
      if (
        typeof value === "string" &&
        data.items.some((item) => item.type === kind && item.id === value)
      )
        apply(value);
    });
  });
}
