import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdir, readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { chromium, expect, type Browser } from "@playwright/test";
import { definition } from "../packages/catalogue/definition";
import { buildSvelteEntries } from "./build";
import { artifactPath } from "./artifacts";

/** Actual package SSR/hydration, isolated public fixtures and no provider calls.
 * An optional compiled site stylesheet enables visual checks without coupling
 * this public repository to a private consumer or building unrelated packages.
 */
export async function verifyCatalogueLinks(browser: Browser) {
  const cssPath = process.env.MYWINKEL_CATALOGUE_TEST_CSS;
  const css = cssPath ? await readFile(cssPath, "utf8") : "";
  const catalogue = {
    tenantId: "test-item-links",
    items: [
      {
        id: "soap",
        name: "Almond soap",
        type: "products",
        priceMinor: 2500,
        description: "Handmade soap",
        details: { category: "Care" },
      },
      {
        id: "torch",
        name: "Brass torch",
        type: "products",
        priceMinor: 7800,
        description: "Rechargeable torch",
        details: { category: "Tools" },
      },
      {
        id: "consult",
        name: "Consultation",
        type: "services",
        priceMinor: 12000,
        description: "A service",
        details: { duration: 30 },
      },
      {
        id: "past-class",
        name: "Past class",
        type: "classes",
        priceMinor: 1000,
        description: "Past",
        details: { start: "2000-01-01T08:00:00Z" },
      },
    ],
  };
  const blocks = [
    {
      id: "goods",
      type: "catalogue",
      props: definition.schema.parse({ source: "products", limit: 1 }),
    },
    {
      id: "other-goods",
      type: "catalogue",
      props: definition.schema.parse({ source: "products", limit: 1 }),
    },
    {
      id: "services",
      type: "catalogue",
      props: definition.schema.parse({ source: "services", action: "select" }),
    },
    {
      id: "classes",
      type: "catalogue",
      props: definition.schema.parse({ source: "classes", upcomingOnly: true }),
    },
  ];
  const { default: renderer } =
    await import("../packages/catalogue/dist/server.js");
  const code = await readFile(
    new URL("../packages/catalogue/dist/browser.js", import.meta.url),
    "utf8",
  );
  const html = await Promise.all(
    blocks.map(async (block) => {
      const rendered = await (
        await renderer.fetch(
          new Request("http://fixture/", {
            method: "POST",
            body: JSON.stringify({ props: { block, data: { catalogue } } }),
          }),
          {},
        )
      ).json();
      return `<div id="${block.id}">${rendered.html}</div>`;
    }),
  );
  const server = createServer((request, response) => {
    if (request.url === "/browser.js") {
      response.setHeader("Content-Type", "text/javascript");
      response.end(code);
    } else if (request.url === "/site.css") {
      response.setHeader("Content-Type", "text/css");
      response.end(css);
    } else {
      response.setHeader("Content-Type", "text/html; charset=utf-8");
      response.end(
        '<!doctype html><html lang="en"><meta name="viewport" content="width=device-width, initial-scale=1">' +
          '<title>Catalogue link fixture</title><link rel="stylesheet" href="/site.css">' +
          html.join("") +
          '<script type="module">import {mount} from "/browser.js";for(const block of ' +
          JSON.stringify(blocks) +
          ")mount(document.getElementById(block.id),{block,data:{catalogue:" +
          JSON.stringify(catalogue) +
          "}});</script></html>",
      );
    }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert(address && typeof address === "object");
  const origin = `http://127.0.0.1:${address.port}`;
  try {
    // Inert SSR (including editor previews) never opens the linked modal.
    const inert = await browser.newPage({ javaScriptEnabled: false });
    try {
      await inert.goto(origin + "/shop?catalogue=goods&item=torch");
      await expect(inert.getByRole("dialog")).toHaveCount(0);
      await expect(
        inert
          .locator("#goods")
          .getByRole("button", { name: "Details", exact: true }),
      ).toBeDisabled();
    } finally {
      await inert.close();
    }

    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors: string[] = [];
      const mutations: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("request", (request) => {
        if (request.method() !== "GET") mutations.push(request.url());
      });
      // Deterministic Clipboard responses exercise success and denial without
      // depending on desktop clipboard permissions in a headless runner.
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: {
            writeText: async (text: string) => {
              (window as unknown as { copied: string }).copied = text;
            },
          },
        });
      });
      try {
        await page.goto(origin + "/shop?token=synthetic-private#checkout");
        const goods = page.locator("#goods");
        await goods.getByLabel("Search goods").fill("Brass");
        await goods
          .getByRole("button", { name: "Details", exact: true })
          .focus();
        await page.keyboard.press("Enter");
        const dialog = goods.getByRole("dialog", {
          name: "Brass torch",
          exact: true,
        });
        await expect(dialog).toBeVisible();
        await dialog
          .getByRole("button", { name: "Copy item link", exact: true })
          .click();
        await expect(dialog.getByRole("status")).toHaveText(
          "Item link copied.",
        );
        const link = await page.evaluate(
          () => (window as unknown as { copied: string }).copied,
        );
        expect(link).toBe(origin + "/shop?catalogue=goods&item=torch");
        await expect(
          dialog.getByLabel("Item link", { exact: true }),
        ).toHaveValue(link);
        await page.keyboard.press("Escape");
        await expect(
          goods.getByRole("button", { name: "Details", exact: true }),
        ).toBeFocused();

        // The recipient has no previous browser state. The linked product is
        // beyond the first display page, but current public details still open.
        await page.goto(link);
        await expect(dialog).toBeVisible();
        await expect(page.getByRole("dialog")).toHaveCount(1);
        await expect(dialog).toContainText(/78[,.]00/);
        expect(await page.evaluate(() => localStorage.length)).toBe(0);
        await expect(
          page.locator("#other-goods").getByRole("dialog"),
        ).toHaveCount(0);

        await page.evaluate(() => {
          Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: {
              writeText: async () => {
                throw new DOMException("Denied", "NotAllowedError");
              },
            },
          });
        });
        await dialog
          .getByRole("button", { name: "Copy item link", exact: true })
          .click();
        await expect(dialog.getByRole("status")).toContainText(
          "copy it manually",
        );
        const field = dialog.getByLabel("Item link", { exact: true });
        await field.focus();
        expect(
          await field.evaluate((input: HTMLInputElement) =>
            input.value.slice(
              input.selectionStart ?? 0,
              input.selectionEnd ?? 0,
            ),
          ),
        ).toBe(link);
        await expect(
          dialog.getByRole("button", { name: "Copy item link", exact: true }),
        ).toBeEnabled();
        if (css) {
          expect(
            await dialog.evaluate(
              (element) => element.scrollWidth <= element.clientWidth,
            ),
          ).toBe(true);
          expect(
            await page.evaluate(
              () =>
                document.documentElement.scrollWidth <=
                document.documentElement.clientWidth,
            ),
          ).toBe(true);
          await mkdir(artifactPath("verification", "catalogue-links"), {
            recursive: true,
          });
          await page.screenshot({
            path: artifactPath(
              "verification",
              "catalogue-links",
              `${width}.png`,
            ),
          });
        }
        await dialog.getByLabel("Quantity", { exact: true }).fill("2");
        await dialog
          .getByRole("button", { name: "Add to bag", exact: true })
          .click();
        expect(
          await page.evaluate(() =>
            JSON.parse(
              localStorage.getItem(
                "mywinkel:selection:v1:test-item-links:cart",
              ) ?? "{}",
            ),
          ),
        ).toEqual({ torch: 2 });

        for (const query of [
          "catalogue=goods&item=removed",
          "catalogue=goods&item=consult",
          "catalogue=classes&item=past-class",
        ]) {
          await page.goto(origin + "/shop?" + query);
          await expect(
            page.getByRole("status").filter({ hasText: "no longer available" }),
          ).toHaveCount(1);
          await expect(page.getByRole("dialog")).toHaveCount(0);
          await expect(
            goods.getByRole("button", { name: "Details", exact: true }),
          ).toBeEnabled();
        }
        await page.goto(origin + "/shop?catalogue=services&item=consult");
        const service = page
          .locator("#services")
          .getByRole("dialog", { name: "Consultation", exact: true });
        await expect(service).toBeVisible();
        expect(
          await page.evaluate(() =>
            localStorage.getItem(
              "mywinkel:selection:v1:test-item-links:services",
            ),
          ),
        ).toBeNull();
        await service
          .getByRole("button", { name: "Choose this option", exact: true })
          .click();
        expect(
          await page.evaluate(() =>
            JSON.parse(
              localStorage.getItem(
                "mywinkel:selection:v1:test-item-links:services",
              ) ?? "null",
            ),
          ),
        ).toBe("consult");
        expect(errors).toEqual([]);
        expect(mutations).toEqual([]);
        console.log(
          `${width}px: exact item handoff, copy/denial, inert SSR, scoped dialogs, stale/type/past guards and deliberate cart/service actions passed${css ? "; styled overflow/capture passed" : "; visual checks skipped (no stylesheet)"}.`,
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
  await buildSvelteEntries(
    resolve(import.meta.dirname, "../packages/catalogue"),
  );
  const browser = await chromium.launch({ headless: true });
  try {
    await verifyCatalogueLinks(browser);
  } finally {
    await browser.close();
  }
}
