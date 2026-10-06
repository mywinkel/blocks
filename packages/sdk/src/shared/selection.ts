/** Browser-only hints shared by separately bundled islands. Prices and availability
 * remain server-owned. Nothing here authorises a checkout or crosses a tenant. */
const eventName = "mywinkel:selection:v1";
const memory = new Map<string, unknown>();
const key = (tenant: string, kind: string) =>
  `mywinkel:selection:v1:${tenant}:${kind}`;
export function readSelection(tenant: string, kind: string): unknown {
  if (typeof window === "undefined" || !tenant) return undefined;
  const name = key(tenant, kind);
  try {
    const raw = localStorage.getItem(name);
    return raw ? JSON.parse(raw) : memory.get(name);
  } catch {
    return memory.get(name);
  }
}
export function writeSelection(tenant: string, kind: string, value: unknown) {
  if (typeof window === "undefined" || !tenant) return;
  const name = key(tenant, kind);
  memory.set(name, value);
  try {
    localStorage.setItem(name, JSON.stringify(value));
  } catch {
    /* The page event still works when storage is unavailable. */
  }
  window.dispatchEvent(new CustomEvent(eventName, { detail: { name, value } }));
}
export function subscribeSelection(
  tenant: string,
  kind: string,
  receive: (value: unknown) => void,
) {
  const name = key(tenant, kind);
  const local = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    if (detail?.name === name) receive(detail.value);
  };
  const remote = (event: StorageEvent) => {
    if (event.key === name) receive(readSelection(tenant, kind));
  };
  window.addEventListener(eventName, local);
  window.addEventListener("storage", remote);
  receive(readSelection(tenant, kind));
  return () => {
    window.removeEventListener(eventName, local);
    window.removeEventListener("storage", remote);
  };
}
export function cartQuantities(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      ([id, qty]) =>
        /^[a-zA-Z0-9_-]{1,160}$/.test(id) &&
        typeof qty === "number" &&
        Number.isSafeInteger(qty) &&
        qty >= 1 &&
        qty <= 1000,
    ),
  );
}
export function addToCart(tenant: string, id: string, quantity = 1) {
  const values = cartQuantities(readSelection(tenant, "cart"));
  writeSelection(tenant, "cart", {
    ...values,
    [id]: Math.min(1000, (values[id] ?? 0) + quantity),
  });
}
