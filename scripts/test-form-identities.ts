import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { chromium, expect, type Browser } from "@playwright/test";
import { formDocumentSchema } from "../packages/sdk/src/public/website/form-contracts";
import { buildSvelteEntries } from "./build";

// The same published form may appear in both page content and a shared layout.
// Exercise independent SSR calls and hydration, as the package host does.
export async function verifyFormIdentities(browser: Browser) {
  const form = formDocumentSchema.parse({
    schemaVersion: 2,
    kind: "form",
    id: "contact",
    name: "Contact us",
    fields: [
      {
        id: "name",
        type: "text",
        label: "Your name",
        required: true,
        help: "Use your full name.",
      },
      {
        id: "message",
        type: "textarea",
        label: "Message",
        help: "Tell us more.",
      },
      {
        id: "topic",
        type: "select",
        label: "Topic",
        options: ["Booking", "Other"],
        help: "Choose a topic.",
      },
      {
        id: "consent",
        type: "consent",
        label: "Contact me",
        required: true,
        help: "Allow a reply.",
      },
      {
        id: "file",
        type: "file",
        label: "Attachment",
        help: "Optional attachment.",
      },
    ],
  });
  const inputs = [false, true].map((floatingLabels) => ({
    form: { ...form, floatingLabels },
    revision: "a".repeat(64),
  }));
  const { default: renderer } = await import("../packages/form/dist/server.js");
  const markup = await Promise.all(
    inputs.map(async (props) => {
      const response = await renderer.fetch(
        new Request("http://fixture/", {
          method: "POST",
          body: JSON.stringify({ props }),
        }),
        {},
      );
      return (await response.json()).html;
    }),
  );
  const code = await readFile(
    new URL("../packages/form/dist/browser.js", import.meta.url),
    "utf8",
  );
  const server = createServer((request, response) => {
    if (request.url === "/browser.js") {
      response.setHeader("Content-Type", "text/javascript");
      response.end(code);
      return;
    }
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.end(
      '<!doctype html><html lang="en"><title>Repeated form fixture</title>' +
        markup
          .map((html, i) => `<div id="instance-${i}">${html}</div>`)
          .join("") +
        '<script type="module">import {mount} from "/browser.js";' +
        JSON.stringify(inputs).replace(/</g, "\\u003c") +
        '.forEach((props,i)=>mount(document.getElementById("instance-"+i),props));</script></html>',
    );
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert(address && typeof address === "object");
  const url = `http://127.0.0.1:${address.port}`;
  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 844 } });
      const staticPage = await browser.newPage({ javaScriptEnabled: false });
      try {
        await staticPage.goto(url);
        const ssrIds = await staticPage
          .locator("[id]")
          .evaluateAll((elements) => elements.map((e) => e.id));
        assert.equal(
          new Set(ssrIds).size,
          ssrIds.length,
          "SSR form controls and help must have unique IDs",
        );
        for (const fieldset of await staticPage.locator("fieldset").all()) {
          await expect(fieldset).toHaveAttribute("disabled", "");
        }
        const attempts: Record<string, unknown>[] = [];
        await page.route("**/storefront/session", (route) =>
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: "{}",
          }),
        );
        await page.route(
          "**/storefront/forms/contact/submissions",
          async (route) => {
            attempts.push(route.request().postDataJSON());
            if (attempts.length === 1) await route.abort("failed");
            else
              await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ message: "Fixture received" }),
              });
          },
        );
        await page.goto(url);
        const first = page.locator("#instance-0"),
          second = page.locator("#instance-1");
        await expect(
          second.getByRole("textbox", { name: /^Your name/ }),
        ).toBeEnabled();
        assert.deepEqual(
          await page
            .locator("[id]")
            .evaluateAll((elements) => elements.map((e) => e.id)),
          ssrIds,
          "Hydration must retain the server's IDs",
        );
        assert.equal(
          await page.locator("label[for]").evaluateAll((labels) =>
            labels.every((label) => {
              const target = document.getElementById(
                label.getAttribute("for")!,
              );
              return target?.closest("form") === label.closest("form");
            }),
          ),
          true,
          "Every label must resolve within its own form",
        );
        assert.equal(
          await page.locator("[aria-describedby]").evaluateAll((controls) =>
            controls.every((control) =>
              control
                .getAttribute("aria-describedby")!
                .split(/\s+/)
                .every(
                  (id) =>
                    document.getElementById(id)?.closest("form") ===
                    control.closest("form"),
                ),
            ),
          ),
          true,
        );
        await second.locator("label").filter({ hasText: "Your name" }).click();
        const name = second.getByRole("textbox", { name: /^Your name/ });
        await expect(name).toBeFocused();
        await page.keyboard.type("Synthetic form visitor");
        await second
          .getByRole("combobox", { name: "Topic", exact: true })
          .selectOption("Booking");
        await second.locator("label").filter({ hasText: "Contact me" }).click();
        await expect(
          second.getByRole("checkbox", { name: /^Contact me/ }),
        ).toBeChecked();
        await expect(
          first.getByRole("checkbox", { name: /^Contact me/ }),
        ).not.toBeChecked();
        await second
          .getByRole("button", { name: "Send enquiry", exact: true })
          .click();
        await expect(second.getByRole("alert")).toBeVisible();
        await expect(name).toHaveValue("Synthetic form visitor");
        await second
          .getByRole("button", { name: "Send enquiry", exact: true })
          .click();
        await expect(second.getByRole("status")).toContainText(
          "Fixture received",
        );
        assert.equal(attempts.length, 2);
        assert.deepEqual(
          attempts[1],
          attempts[0],
          "An uncertain submission must retry the same payload and operation",
        );
        assert.deepEqual(attempts[0].answers, {
          name: "Synthetic form visitor",
          message: "",
          topic: "Booking",
          consent: true,
          file: [],
        });
        await expect(
          first.getByRole("textbox", { name: /^Your name/ }),
        ).toHaveValue("");
        console.log(
          `${width}px: repeated forms retain unique SSR/hydrated IDs, local labels/help, keyboard input and safe submission retry.`,
        );
      } finally {
        await page.close();
        await staticPage.close();
      }
    }
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

if (import.meta.main) {
  await buildSvelteEntries(
    new URL("../packages/form", import.meta.url).pathname,
  );
  const browser = await chromium.launch({ headless: true });
  try {
    await verifyFormIdentities(browser);
  } finally {
    await browser.close();
  }
}
