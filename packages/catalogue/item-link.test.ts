import { expect, it } from "vitest";
import { itemLink } from "./item-link";

it("shares exact public identities without page tokens, credentials, filters or fragments", () => {
  const link = new URL(
    itemLink(
      "https://user:password@shop.example.test/shop?token=private&search=soap#checkout",
      "goods & gifts",
      "item/é?",
    ),
  );
  expect(link.origin + link.pathname).toBe("https://shop.example.test/shop");
  expect([...link.searchParams]).toEqual([
    ["catalogue", "goods & gifts"],
    ["item", "item/é?"],
  ]);
  expect(link.username + link.password + link.hash).toBe("");
});
