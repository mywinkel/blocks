/** Share only public identities, never a verification token or unrelated page state. */
export function itemLink(
  pageUrl: string,
  blockId: string,
  itemId: string,
): string {
  const url = new URL(pageUrl);
  url.username = "";
  url.password = "";
  url.search = "";
  url.hash = "";
  url.searchParams.set("catalogue", blockId);
  url.searchParams.set("item", itemId);
  return url.href;
}
