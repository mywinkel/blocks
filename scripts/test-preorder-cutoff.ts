import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { chromium, expect, type Browser } from "@playwright/test";
import { buildSvelteEntries } from "./build";

const directory = new URL("../packages/preorder/", import.meta.url);
const now = "2026-10-18T08:00:00Z"; // 10:00 SAST, independent of browser timezone.

/** Exercise native datetime validation and the actual distributed checkout.
 * A zero cutoff is valid; missing values keep the legacy 12-hour fallback.
 */
export async function verifyPreorderCutoff(browser: Browser) {
  const initial = {
    tenantId: "test-preorder-cutoff",
    revision: 1,
    name: "Fixture kitchen",
    currency: "ZAR",
    branding: { logo: "", colour: "#222222", summary: "" },
    capabilities: { food: true },
    staff: [],
    items: [0, 3, undefined].map((cutoffHours, i) => ({
      id: `dish-${i}`,
      type: "menus",
      name: ["Same-day dish", "Slow dish", "Legacy dish"][i],
      description: "Synthetic cutoff fixture",
      priceMinor: 2500,
      version: 1,
      details: cutoffHours === undefined ? {} : { cutoffHours },
    })),
    locations: [
      {
        id: "kitchen",
        name: "Fixture kitchen",
        address: "Test road",
        pickup: true,
      },
    ],
    delivery: {
      localEnabled: false,
      courierEnabled: false,
      feeMinor: 0,
      areas: [],
    },
  };
  const { default: renderer } = await import(
    new URL("dist/server.js", directory).href
  );
  const code = await readFile(new URL("dist/browser.js", directory), "utf8");
  const fixtures = new Map<string, string>();
  for (const presentation of ["menu", "boxes"]) {
    const props = { initial, presentation };
    const response = await renderer.fetch(
      new Request("http://fixture/", {
        method: "POST",
        body: JSON.stringify({ props }),
      }),
      {},
    );
    assert.equal(response.status, 200);
    const { html } = await response.json();
    fixtures.set(
      `/${presentation}`,
      '<!doctype html><html lang="en"><title>Pre-order cutoff fixture</title>' +
        '<meta name="viewport" content="width=device-width,initial-scale=1">' +
        '<div id="preorder">' +
        html +
        '</div><script type="module">import {mount} from "/browser.js";' +
        'mount(document.getElementById("preorder"),' +
        JSON.stringify(props).replace(/</g, "\\u003c") +
        ");window.hydrated=true;</script></html>",
    );
  }
  const server = createServer((request, response) => {
    response.setHeader(
      "Content-Type",
      request.url === "/browser.js" ? "text/javascript" : "text/html",
    );
    response.end(
      request.url === "/browser.js" ? code : fixtures.get(request.url!),
    );
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert(address && typeof address === "object");
  try {
    for (const width of [390, 1440]) {
      for (const presentation of ["menu", "boxes"]) {
        const page = await browser.newPage({
          viewport: { width, height: 844 },
          timezoneId: "America/Los_Angeles",
        });
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        try {
          await page.clock.setFixedTime(new Date(now));
          await page.route("**/storefront/session", (route) =>
            route.fulfill({ json: {} }),
          );
          const commands: {
            purchase: { collectionAt: string; items: unknown[] };
          }[] = [];
          await page.route("**/storefront/checkout", async (route) => {
            commands.push(route.request().postDataJSON());
            await route.fulfill({
              json: {
                id: "synthetic-preorder",
                kind: "preorder",
                status: "accepted",
                totalMinor: 2500,
                dueMinor: 0,
                payment: "not_required",
                revision: 2,
              },
            });
          });
          await page.goto(`http://127.0.0.1:${address.port}/${presentation}`);
          await page.waitForFunction(() => "hydrated" in window);
          const time = page.getByLabel("Collection or delivery time", {
            exact: true,
          });
          await expect(time).toHaveAttribute("min", "2026-10-18T22:00");
          const dish = (name: string) =>
            page.locator("details").filter({
              has: page.locator("summary", { hasText: name }),
            });
          const add = async (name: string) => {
            const meal = dish(name);
            if (
              !(await meal.evaluate(
                (node) => (node as HTMLDetailsElement).open,
              ))
            )
              await meal.locator("summary").press("Enter");
            await meal
              .getByRole("button", { name: "Add dish to order", exact: true })
              .press("Enter");
          };
          await add("Same-day dish");
          await expect(time).toHaveAttribute("min", "2026-10-18T10:00");
          await expect(
            page.getByText(/Order at least 0 hours ahead/),
          ).toBeVisible();
          await time.fill("2026-10-18T11:00");
          assert.equal(
            await time.evaluate(
              (node) => (node as HTMLInputElement).validity.rangeUnderflow,
            ),
            false,
          );
          await add("Slow dish");
          await expect(time).toHaveAttribute("min", "2026-10-18T13:00");
          assert.equal(
            await time.evaluate(
              (node) => (node as HTMLInputElement).validity.rangeUnderflow,
            ),
            true,
          );
          await add("Legacy dish");
          await expect(time).toHaveAttribute("min", "2026-10-18T22:00");
          await page
            .getByRole("button", { name: "Remove Legacy dish", exact: true })
            .click();
          await expect(time).toHaveAttribute("min", "2026-10-18T13:00");
          await page
            .getByRole("button", { name: "Remove Slow dish", exact: true })
            .click();
          await expect(time).toHaveAttribute("min", "2026-10-18T10:00");
          await expect(time).toHaveValue("2026-10-18T11:00");
          await page
            .getByLabel("Full name", { exact: true })
            .fill("Cutoff customer");
          await page
            .getByLabel("Email", { exact: true })
            .fill("cutoff@example.test");
          await page
            .getByLabel("Mobile number", { exact: true })
            .fill("+27821234567");
          await page.locator("input[name=terms]").check();
          await page
            .getByRole("button", { name: "Place pre-order", exact: true })
            .click();
          await expect(
            page.getByRole("heading", {
              name: "Request received",
              exact: true,
            }),
          ).toBeVisible();
          assert.equal(commands.length, 1);
          assert.equal(
            commands[0].purchase.collectionAt,
            "2026-10-18T11:00:00+02:00",
          );
          assert.equal(commands[0].purchase.items.length, 1);
          assert.deepEqual(errors, []);
          console.log(
            `${width}px ${presentation}: zero cutoff, strictest dish, missing fallback, retained time and synthetic checkout pass.`,
          );
        } finally {
          await page.close();
        }
      }
    }
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

if (import.meta.main) {
  await buildSvelteEntries(directory.pathname);
  const browser = await chromium.launch({ headless: true });
  try {
    await verifyPreorderCutoff(browser);
  } finally {
    await browser.close();
  }
}
