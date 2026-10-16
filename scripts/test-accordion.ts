import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { chromium, expect, type Browser } from "@playwright/test";
import { compile } from "tailwindcss";
import { definition } from "../packages/accordion/definition";
import { buildSvelteEntries } from "./build";

const require = createRequire(import.meta.url);
const directory = new URL("../packages/accordion/", import.meta.url);

export async function verifyAccordion(browser: Browser) {
  const manifest = JSON.parse(
    await readFile(new URL("block-package.json", directory), "utf8"),
  );
  assert.deepEqual(manifest.blocks[0].parts, definition.parts);
  // Compile the shipped classes rather than relying on cached demo CSS or
  // duplicating the indicator's styling in the fixture. No CMS is required.
  const source = await readFile(new URL("View.svelte", directory), "utf8");
  const compiler = await compile(
    (await readFile(require.resolve("tailwindcss/theme.css"), "utf8")) +
      (await readFile(require.resolve("tailwindcss/preflight.css"), "utf8")) +
      "\n@tailwind utilities;",
  );
  const css = compiler.build([
    ...Object.values(definition.parts).flatMap((value) => value.split(/\s+/)),
    ...Array.from(source.matchAll(/class="([^"]+)"/g)).flatMap((match) =>
      match[1].split(/\s+/),
    ),
  ]);
  const inputs = [false, false, true].map((allowMultiple, i) => ({
    block: {
      id: `faq-${i}`,
      type: "accordion",
      props: definition.schema.parse({
        heading: `FAQ ${i}`,
        allowMultiple,
        openFirst: !allowMultiple,
        cards: ["one", "two"].map((id) => ({
          id,
          title: `Question ${id}`,
          text: `Answer ${id}`,
          href: "/answer",
        })),
      }),
    },
    data: {},
  }));
  const { default: renderer } = await import(
    new URL("dist/server.js", directory).href
  );
  const markup = await Promise.all(
    inputs.map(async (props) => {
      const response = await renderer.fetch(
        new Request("http://fixture/", {
          method: "POST",
          body: JSON.stringify({ props }),
        }),
        {},
      );
      assert.equal(response.status, 200);
      return (await response.json()).html;
    }),
  );
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
      '<!doctype html><html lang="en"><title>Accordion fixture</title>' +
        '<meta name="viewport" content="width=device-width,initial-scale=1">' +
        '<link rel="stylesheet" href="/style.css">' +
        markup
          .map((html, i) => `<section id="faq-${i}">${html}</section>`)
          .join("") +
        '<script type="module">import {mount} from "/browser.js";' +
        JSON.stringify(inputs).replace(/</g, "\\u003c") +
        '.forEach((props,i)=>mount(document.getElementById("faq-"+i),props));window.hydrated=true;</script></html>',
    );
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert(address && typeof address === "object");
  try {
    for (const width of [390, 1440]) {
      for (const javaScriptEnabled of [false, true]) {
        const page = await browser.newPage({
          viewport: { width, height: 844 },
          javaScriptEnabled,
          reducedMotion: width === 1440 ? "reduce" : "no-preference",
        });
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        try {
          await page.goto(`http://127.0.0.1:${address.port}`);
          if (javaScriptEnabled)
            await page.waitForFunction(() => "hydrated" in window);
          const first = page.locator("#faq-0 details");
          const second = page.locator("#faq-1 details");
          const multiple = page.locator("#faq-2 details");
          await expect(first.nth(0)).toHaveAttribute("open", "");
          await expect(second.nth(0)).toHaveAttribute("open", "");
          if (width === 1440)
            await expect(second.nth(0).locator("summary span span")).toHaveCSS(
              "transform",
              "none",
            );
          await expect(multiple.nth(0)).not.toHaveAttribute("open");
          assert.notEqual(
            await first.nth(0).getAttribute("name"),
            await second.nth(0).getAttribute("name"),
          );
          await first.nth(1).locator("summary").focus();
          await page.keyboard.press("Enter");
          await expect(first.nth(1)).toHaveAttribute("open", "");
          await expect(first.nth(0)).not.toHaveAttribute("open");
          await expect(second.nth(0)).toHaveAttribute("open", "");
          await first.nth(1).locator("summary").press("Space");
          await expect(first.nth(1)).not.toHaveAttribute("open");
          for (const detail of await multiple.all()) {
            await detail.locator("summary").click();
            await expect(detail).toHaveAttribute("open", "");
          }
          await expect(multiple.nth(0)).toHaveAttribute("open", "");
          const sizes = await page.locator("html").evaluate((el) => ({
            content: el.scrollWidth,
            viewport: el.clientWidth,
          }));
          assert.equal(
            sizes.content,
            sizes.viewport,
            "open indicators must fit the viewport",
          );
          const target = await first.nth(0).locator("summary").boundingBox();
          assert(target && target.height >= 44);
          assert.deepEqual(errors, []);
          console.log(
            `${width}px JS=${javaScriptEnabled}: no overflow, native keyboard, initial state, isolated groups and multiple-open pass.`,
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
    await verifyAccordion(browser);
  } finally {
    await browser.close();
  }
}
