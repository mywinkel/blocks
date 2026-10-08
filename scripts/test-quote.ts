import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { once } from "node:events";
import assert from "node:assert/strict";
import { expect, type Browser } from "@playwright/test";

/** Verify the distributed block against account history, including returning
 * customers whose accepted quote has already produced a separate invoice.
 */
export async function verifyQuote(browser: Browser) {
  const props = { quoteId: "fixture-quote" };
  const { default: renderer } =
    await import("../packages/quote-acceptance/dist/server.js");
  const rendered = await (
    await renderer.fetch(
      new Request("http://fixture/", {
        method: "POST",
        body: JSON.stringify({ props }),
      }),
      {},
    )
  ).json();
  const code = await readFile(
    new URL("../packages/quote-acceptance/dist/browser.js", import.meta.url),
    "utf8",
  );
  const server = createServer((request, response) => {
    if (request.url === "/browser.js") {
      response.setHeader("Content-Type", "text/javascript");
      response.end(code);
    } else {
      response.setHeader("Content-Type", "text/html");
      response.end(
        '<!doctype html><html lang="en"><title>Quote fixture</title><div id="quote">' +
          rendered.html +
          '</div><script type="module">import {mount} from "/browser.js";mount(document.getElementById("quote"),' +
          JSON.stringify(props) +
          ");</script></html>",
      );
    }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert(address && typeof address === "object");
  const page = await browser.newPage();
  let status = "accepted";
  await page.route("**/customer/account?*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        customer: {
          id: "fixture-customer",
          name: "Quote customer",
          email: "quote@example.test",
        },
        history: [
          {
            id: props.quoteId,
            type: "quotes",
            name: "Fixture quote",
            status,
            version: 3,
            amountMinor: 20000,
            hasReceipt: false,
            payment: "not_required",
            quote: { description: "Agreed scope", validUntil: "2099-12-31" },
          },
        ],
      }),
    }),
  );
  try {
    await page.goto("http://127.0.0.1:" + address.port);
    const review = page.getByRole("region", { name: "Quote: Fixture quote" });
    await expect(review.getByRole("status")).toHaveText("Quote accepted.");
    await expect(
      review.getByRole("link", { name: "View your account and payment" }),
    ).toHaveAttribute("href", "/account");
    await expect(review.getByRole("button")).toHaveCount(0);
    status = "declined";
    await page.reload();
    await expect(review.getByRole("status")).toHaveText(
      "Quote status: declined.",
    );
    status = "sent";
    await page.reload();
    await review
      .getByRole("button", { name: "Review and accept quote" })
      .click();
    await expect(
      review.getByRole("button", { name: "Accept quote", exact: true }),
    ).toBeEnabled();
    await expect(review.getByLabel("Full name", { exact: true })).toHaveValue(
      "Quote customer",
    );
    console.log(
      "Sent quotes retain review; accepted and declined quotes show their outcome and account link.",
    );
  } finally {
    await page.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}
