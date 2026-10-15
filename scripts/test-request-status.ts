import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { once } from "node:events";
import assert from "node:assert/strict";
import { expect, type Browser } from "@playwright/test";

/** Exercise the distributed customer block with explicit provider evidence.
 * Redirect navigation alone must never change the displayed payment outcome. */
export async function verifyRequestStatus(browser: Browser) {
  const props = { id: "yoco-fixture" };
  const { default: renderer } = await import("../packages/request-status/dist/server.js");
  const rendered = await (await renderer.fetch(new Request("http://fixture/", {
    method: "POST", body: JSON.stringify({ props }),
  }), {})).json();
  const code = await readFile(new URL("../packages/request-status/dist/browser.js", import.meta.url), "utf8");
  const server = createServer((request, response) => {
    if (request.url === "/browser.js") {
      response.setHeader("Content-Type", "text/javascript"); response.end(code); return;
    }
    response.setHeader("Content-Type", "text/html");
    response.end('<!doctype html><html lang="en"><title>Payment status fixture</title><div id="request">' + rendered.html +
      '</div><script type="module">import {mount} from "/browser.js";mount(document.getElementById("request"),' + JSON.stringify(props) + ');</script></html>');
  });
  server.listen(0, "127.0.0.1"); await once(server, "listening");
  const address = server.address(); assert(address && typeof address === "object");
  const origin = `http://127.0.0.1:${address.port}`;
  const page = await browser.newPage();
  let payment = "pending", environment = "sandbox", refundStatus = "", refundedMinor = 0;
  const receipt = () => ({ id: props.id, kind: "cart", status: "confirmed", totalMinor: 300, dueMinor: 300, payment, paymentProvider: "yoco", paymentEnvironment: environment, refundStatus, refundedMinor, revision: 1 });
  await page.route("**/storefront/session", route => route.fulfill({ json: {} }));
  await page.route("**/storefront/requests/yoco-fixture", route => route.fulfill({ json: receipt() }));
  await page.route("**/storefront/requests/yoco-fixture/payment", route => route.fulfill({ json: { url: "https://c.yoco.com/fixture" } }));
  await page.route("**/storefront/payments/reconcile/yoco-fixture", route => route.fulfill({ json: { status: payment === "pending" ? "review" : payment, receipt: receipt() } }));
  let referrer = "";
  await page.route("https://c.yoco.com/fixture", route => { referrer = route.request().headers().referer ?? ""; return route.fulfill({ contentType: "text/html", body: "Hosted checkout fixture" }); });
  try {
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 844 });
      payment = "pending"; environment = "sandbox"; refundStatus = ""; refundedMinor = 0;
      await page.goto(origin);
      await expect(page.getByText("Test payment — no real money is collected.", { exact: true })).toBeVisible();
      await page.getByRole("button", { name: /^Pay R/ }).click();
      await expect(page).toHaveURL("https://c.yoco.com/fixture");
      expect(referrer).toBe(`${origin}/`);
      await page.goto(origin);
      await expect(page.getByText("Payment: pending", { exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Check payment with provider" }).click();
      await expect(page.getByRole("alert")).toContainText("Contact the business before making another payment");
      payment = "failed";
      await page.getByRole("button", { name: "Check status", exact: true }).click();
      await expect(page.getByText("Payment: failed", { exact: true })).toBeVisible();
      payment = "paid";
      await page.getByRole("button", { name: "Check status", exact: true }).click();
      await expect(page.getByText("Payment: paid", { exact: true })).toBeVisible();
      payment = "refunded"; refundStatus = "confirmed"; refundedMinor = 300;
      await page.getByRole("button", { name: "Check status", exact: true }).click();
      await expect(page.getByText("Payment: refunded", { exact: true })).toBeVisible();
      await expect(page.getByText(/Refunded: R/)).toBeVisible();
      environment = "live";
      await page.getByRole("button", { name: "Check status", exact: true }).click();
      await expect(page.getByText("Test payment — no real money is collected.", { exact: true })).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    console.log("Request status preserves test/live labels, same-origin checkout referrers, pending returns, settlement and refunds on desktop/mobile.");
  } finally { await page.close(); await new Promise<void>(resolve => server.close(() => resolve())); }
}
