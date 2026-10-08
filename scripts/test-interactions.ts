import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { once } from "node:events";
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import { buildPackages } from "./build";
import { verifyBooking } from "./test-booking";
import { verifyQuote } from "./test-quote";

// Test the actual distributed browser/server entries. Closing the drawer must
// preserve an uncertain financial operation, rather than creating another one.
await buildPackages();
const props = {
  layout: "drawer",
  initial: {
    tenantId: "test-drawer",
    revision: 1,
    name: "Fixture shop",
    currency: "ZAR",
    branding: { logo: "", colour: "#222222", summary: "" },
    capabilities: {},
    staff: [],
    items: [
      {
        id: "product",
        type: "products",
        name: "Fixture product",
        description: "",
        priceMinor: 1000,
        version: 1,
        details: { deliveryKind: "digital" },
      },
    ],
    locations: [],
    delivery: {
      localEnabled: false,
      courierEnabled: false,
      feeMinor: 0,
      areas: [],
    },
  },
};
const { default: renderer } = await import("../packages/cart/dist/server.js");
const rendered = await (
  await renderer.fetch(
    new Request("http://fixture/", {
      method: "POST",
      body: JSON.stringify({ props }),
    }),
    {},
  )
).json();
const browserCode = await readFile(
  new URL("../packages/cart/dist/browser.js", import.meta.url),
  "utf8",
);
const summaries = await Promise.all(
  [0, 1].map(async () => {
    const input = { ...props, layout: "summary" };
    const output = await (
      await renderer.fetch(
        new Request("http://fixture/", {
          method: "POST",
          body: JSON.stringify({ props: input }),
        }),
        {},
      )
    ).json();
    return output.html;
  }),
);
const server = createServer((request, response) => {
  if (request.url === "/browser.js") {
    response.setHeader("Content-Type", "text/javascript");
    response.end(browserCode);
    return;
  }
  response.setHeader("Content-Type", "text/html");
  if (request.url === "/multiple") {
    response.end(
      '<!doctype html><html lang="en"><title>Independent carts</title>' +
        summaries
          .map((html, index) => `<div id="cart-${index}">${html}</div>`)
          .join("") +
        '<script type="module">import {mount} from "/browser.js";for(const target of document.querySelectorAll("[id^=cart-]"))mount(target,' +
        JSON.stringify({ ...props, layout: "summary" }) +
        ");</script></html>",
    );
    return;
  }
  response.end(
    '<!doctype html><html lang="en"><title>Cart interaction fixture</title><div id="cart">' +
      rendered.html +
      '</div><script type="module">import {mount} from "/browser.js";mount(document.getElementById("cart"),' +
      JSON.stringify(props) +
      ");</script></html>",
  );
});
server.listen(0, "127.0.0.1");
await once(server, "listening");
const address = server.address();
assert(address && typeof address === "object");
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.addInitScript(() =>
    localStorage.setItem(
      "mywinkel:selection:v1:test-drawer:cart",
      JSON.stringify({ product: 1 }),
    ),
  );
  await page.goto("http://127.0.0.1:" + address.port);
  await page.getByRole("button", { name: /^Bag \(1\)/ }).click();
  const dialog = page.getByRole("dialog", { name: "Your bag", exact: true });
  await dialog.getByLabel("Full name", { exact: true }).fill("Drawer customer");
  await dialog.getByLabel("Email", { exact: true }).fill("drawer@example.test");
  await dialog
    .getByLabel("Mobile number", { exact: true })
    .fill("+27821234567");
  await dialog.locator("input[name=terms]").check();
  const operations: string[] = [];
  await page.route("**/storefront/session", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
  );
  await page.route("**/storefront/checkout", async (route) => {
    operations.push(route.request().postDataJSON().operationId);
    if (operations.length === 1) await route.abort("failed");
    else
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "receipt",
          kind: "cart",
          status: "confirmed",
          totalMinor: 1000,
          dueMinor: 0,
          payment: "not_required",
          revision: 2,
        }),
      });
  });
  await dialog
    .getByRole("button", { name: "Place order", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText(
    "Retry to safely check the same request",
  );
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: /^Bag \(1\)/ }).click();
  await expect(dialog.getByLabel("Full name", { exact: true })).toHaveValue(
    "Drawer customer",
  );
  await dialog
    .getByRole("button", { name: "Retry this request", exact: true })
    .click();
  await expect(
    dialog.getByRole("heading", { name: "Request received", exact: true }),
  ).toBeVisible();
  expect(operations).toHaveLength(2);
  expect(operations[1]).toBe(operations[0]);
  await dialog.getByRole("button", { name: "Close bag", exact: true }).click();
  await page.getByRole("button", { name: /^Bag \(0\)/ }).click();
  await expect(
    dialog.getByRole("heading", { name: "Request received", exact: true }),
  ).toBeVisible();
  console.log(
    "Drawer close/reopen retains drafts, uncertain operation identity and the completed receipt.",
  );
  await page.goto("http://127.0.0.1:" + address.port + "/multiple");
  await page.evaluate(() =>
    localStorage.setItem(
      "mywinkel:selection:v1:test-drawer:cart",
      JSON.stringify({ product: 1 }),
    ),
  );
  await page.reload();
  const orders = page.getByRole("heading", { name: "Your order", exact: true });
  await expect(orders).toHaveCount(2);
  const ids = await orders.evaluateAll((elements) =>
    elements.map((element) => element.id),
  );
  expect(new Set(ids).size).toBe(2);
  for (let index = 0; index < 2; index++) {
    await page
      .locator(`#cart-${index}`)
      .getByRole("link", { name: "View your order", exact: true })
      .click();
    await expect(orders.nth(index)).toBeFocused();
  }
  console.log(
    "Independent cart instances retain unique order anchors and focus their own checkout.",
  );
  await verifyBooking(browser);
  await verifyQuote(browser);
} finally {
  await browser.close();
  await new Promise<void>((resolve) => server.close(() => resolve()));
}
