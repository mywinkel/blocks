import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdir, readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { chromium, expect, type Browser } from "@playwright/test";
import { compile } from "tailwindcss";
import type { CustomerAccount } from "../packages/sdk/src/wire-types";
import { definition } from "../packages/customer-account/definition";
import { buildSvelteEntries } from "./build";
import { artifactPath } from "./artifacts";

const require = createRequire(import.meta.url);
const directory = new URL("../packages/customer-account/", import.meta.url);

/** Distributed SSR/hydration against synthetic authorized account responses.
 * Keep the real booking child mounted: searching must not discard its draft.
 */
export async function verifyCustomerHistory(browser: Browser) {
  const manifest = JSON.parse(
    await readFile(new URL("block-package.json", directory), "utf8"),
  );
  assert.deepEqual(manifest.blocks[0].parts, definition.parts);
  const compiler = await compile(
    (await readFile(require.resolve("tailwindcss/theme.css"), "utf8")) +
      (await readFile(require.resolve("tailwindcss/preflight.css"), "utf8")) +
      "\n@tailwind utilities;",
  );
  const css = compiler.build(
    Object.values(definition.parts).flatMap((value) => value.split(/\s+/)),
  );
  const { default: renderer } = await import(
    new URL("dist/server.js", directory).href
  );
  const rendered = await (
    await renderer.fetch(
      new Request("http://fixture/", {
        method: "POST",
        body: JSON.stringify({ props: {} }),
      }),
      {},
    )
  ).json();
  const code = await readFile(new URL("dist/browser.js", directory), "utf8");
  const server = createServer((request, response) => {
    if (request.url === "/browser.js" || request.url === "/style.css") {
      response.setHeader(
        "Content-Type",
        request.url === "/browser.js" ? "text/javascript" : "text/css",
      );
      response.end(request.url === "/browser.js" ? code : css);
      return;
    }
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.end(
      '<!doctype html><html lang="en"><title>Customer history fixture</title>' +
        '<meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css">' +
        '<div id="account">' +
        rendered.html +
        '</div><script type="module">' +
        'import {mount} from "/browser.js";mount(document.getElementById("account"),{});</script></html>',
    );
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert(address && typeof address === "object");
  const origin = `http://127.0.0.1:${address.port}`;
  const row = (
    id: string,
    name: string,
  ): CustomerAccount["history"][number] => ({
    id,
    name,
    type: "orders",
    status: "paid",
    version: 1,
    amountMinor: 5000,
    createdAt: "2026-10-01T08:00:00Z",
    start: "",
    end: "",
    payment: "paid",
    hasReceipt: true,
  });
  const appointment = {
    ...row("appointment-1", "Salon haircut"),
    type: "appointments" as const,
    status: "confirmed",
    start: "2027-01-10T08:00:00+02:00",
    end: "2027-01-10T08:30:00+02:00",
    booking: {
      serviceId: "cut",
      resourceId: "stylist",
      calendarStatus: "",
      calendarError: "",
      refundStatus: "",
      cancel: true,
      reschedule: true,
      noticeHours: 24,
    },
  };
  const initial: CustomerAccount = {
    customer: {
      id: "customer-a",
      name: "Synthetic shopper",
      email: "history@example.test",
    },
    revision: 1,
    memberships: [],
    nextMembershipCursor: null,
    nextHistoryCursor: "older",
    history: [
      appointment,
      ...Array.from({ length: 99 }, (_, i) =>
        row(`order-${i}`, `Weekly box ${i}`),
      ),
    ],
  };
  try {
    const inert = await browser.newPage({ javaScriptEnabled: false });
    try {
      await inert.goto(origin);
      await expect(inert.getByText("Loading your account…")).toBeVisible();
      await expect(inert.getByRole("searchbox")).toHaveCount(0);
      await expect(inert.getByText("Synthetic shopper")).toHaveCount(0);
    } finally {
      await inert.close();
    }
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors: string[] = [];
      const mutations: string[] = [];
      const reads: string[] = [];
      let olderAttempts = 0;
      let identity = "customer-a";
      let authenticated = true;
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("request", (request) => {
        if (request.method() !== "GET") mutations.push(request.url());
      });
      await page.route("**/storefront/customer/account?*", async (route) => {
        const url = new URL(route.request().url());
        reads.push(url.search);
        if (!authenticated) {
          await route.fulfill({
            status: 401,
            json: { code: "unauthenticated", message: "Sign in again." },
          });
        } else if (url.searchParams.has("historyCursor")) {
          olderAttempts++;
          await route.fulfill(
            olderAttempts === 1
              ? {
                  status: 503,
                  json: { message: "History unavailable. Try loading again." },
                }
              : {
                  json: {
                    ...initial,
                    history: [row("old-order-101", "Brass torch")],
                    nextHistoryCursor: null,
                  },
                },
          );
        } else {
          await route.fulfill({
            json: {
              ...initial,
              customer: { ...initial.customer, id: identity },
            },
          });
        }
      });
      await page.route("**/storefront/customer/sign-out", (route) =>
        route.fulfill({ json: {} }),
      );
      try {
        await page.goto(origin);
        const query = page.getByRole("searchbox", {
          name: "Search loaded history",
        });
        const status = page
          .getByRole("status")
          .filter({ hasText: /loaded entries match/ });
        const visibleRows = page.locator("#account li:visible");
        await expect(visibleRows).toHaveCount(100);
        await page
          .getByRole("button", { name: "Cancel booking", exact: true })
          .click();
        await page
          .getByRole("textbox", { name: "Reason", exact: true })
          .fill("Keep this unsaved reason");
        const originalReason = await page
          .getByRole("textbox", { name: "Reason", exact: true })
          .elementHandle();
        await query.fill("WEEKLY paid");
        await expect(visibleRows).toHaveCount(99);
        await expect(
          page.getByRole("textbox", { name: "Reason", exact: true }),
        ).toHaveCount(0);
        // The row remains in the DOM, with its draft and node identity intact.
        expect(
          await originalReason!.evaluate((element) => element.isConnected),
        ).toBe(true);
        expect(await originalReason!.isVisible()).toBe(false);
        await query.fill("SALON confirmed");
        await expect(visibleRows).toHaveCount(1);
        await expect(
          page.getByRole("textbox", { name: "Reason", exact: true }),
        ).toHaveValue("Keep this unsaved reason");
        await query.fill("old-order-101");
        await expect(status).toContainText("0 of 100");
        await expect(
          page.getByText("Load more history to include older entries.", {
            exact: false,
          }),
        ).toBeVisible();
        const more = page.getByRole("button", {
          name: "Load more history",
          exact: true,
        });
        await more.click();
        await expect(page.getByRole("alert")).toHaveText(
          "History unavailable. Try loading again.",
        );
        await expect(query).toHaveValue("old-order-101");
        await more.click();
        await expect(visibleRows).toHaveCount(1);
        await expect(status).toContainText("1 of 101");
        await expect(
          visibleRows.getByRole("link", { name: "View request and payment" }),
        ).toHaveAttribute("href", "/request?id=old-order-101");
        await expect(more).toHaveCount(0);
        expect(reads).toHaveLength(3);
        expect(
          reads.every(
            (search) =>
              !search.includes("old-order-101") && !search.includes("WEEKLY"),
          ),
        ).toBe(true);
        expect(mutations).toEqual([]);
        await query.focus();
        await page.keyboard.press("Tab");
        await expect(
          page.getByRole("button", { name: "Clear history search" }),
        ).toBeFocused();
        await page.keyboard.press("Enter");
        await expect(query).toBeFocused();
        await expect(query).toHaveValue("");
        await expect(visibleRows).toHaveCount(101);
        await expect(
          page.getByRole("textbox", { name: "Reason", exact: true }),
        ).toHaveValue("Keep this unsaved reason");
        await query.fill("salon");
        await page
          .getByRole("button", { name: "Refresh account", exact: true })
          .click();
        await expect(query).toHaveValue("salon");
        identity = "customer-b";
        await page
          .getByRole("button", { name: "Refresh account", exact: true })
          .click();
        await expect(query).toHaveValue("");
        await query.fill("weekly");
        authenticated = false;
        await page
          .getByRole("button", { name: "Refresh account", exact: true })
          .click();
        await expect(query).toHaveCount(0);
        await expect(
          page.getByRole("heading", {
            name: "Sign in to your customer account",
          }),
        ).toBeVisible();
        // Fresh hydration must never restore a query from storage or the URL.
        authenticated = true;
        await page.reload();
        await expect(query).toHaveValue("");
        expect(await page.evaluate(() => location.search)).toBe("");
        expect(
          await page.evaluate(() => [
            localStorage.length,
            sessionStorage.length,
          ]),
        ).toEqual([0, 0]);
        await query.fill("weekly");
        await expect(status).toContainText("99 of 100");
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        expect(
          await query.evaluate(
            (element) => element.getBoundingClientRect().height,
          ),
        ).toBeGreaterThanOrEqual(44);
        const output = artifactPath("verification", "customer-history");
        await mkdir(output, { recursive: true });
        await page.screenshot({
          path: `${output}/history-${width}.png`,
          fullPage: false,
        });
        await page
          .getByRole("button", { name: "Sign out", exact: true })
          .click();
        await expect(query).toHaveCount(0);
        expect(errors).toEqual([]);
        console.log(
          `${width}px: 100 loaded rows → 1 result; explicit older-page retry, private query, request link, retained draft, keyboard clear, identity/expiry/sign-out and styled layout passed.`,
        );
      } finally {
        await page.close();
      }
    }
  } finally {
    await new Promise<void>((done) => server.close(() => done()));
  }
}

if (import.meta.main) {
  await buildSvelteEntries(directory.pathname);
  const browser = await chromium.launch({ headless: true });
  try {
    await verifyCustomerHistory(browser);
  } finally {
    await browser.close();
  }
}
