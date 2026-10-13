import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { chromium, expect } from "@playwright/test";

// Exercise the example's shipped source without building unrelated packages.
const code = await readFile(
  new URL("../examples/notes/settings.js", import.meta.url),
  "utf8",
);
const original = {
  id: "notes-fixture",
  type: "example/notes",
  configured: ["heading"],
  props: { heading: "Original" },
};
const restored = { ...original, configured: [], props: { heading: "Restored" } };
const server = createServer((request, response) => {
  response.setHeader("Content-Type", "text/html; charset=utf-8");
  if (request.url === "/frame") {
    response.setHeader(
      "Content-Security-Policy",
      "default-src 'none'; script-src 'unsafe-inline'; frame-ancestors 'self'; connect-src 'none'",
    );
    response.end(
      '<!doctype html><div id="settings"></div><script>' +
        code.replace(/<\/script/gi, "<\\/script") +
        "</script>",
    );
    return;
  }
  response.end(`<!doctype html>
    <iframe title="Notes settings" sandbox="allow-scripts" src="/frame"></iframe>
    <script>
      window.changes = [];
      const frame = document.querySelector('iframe');
      frame.onload = () => {
        const channel = new MessageChannel();
        window.port = channel.port1;
        port.onmessage = event => changes.push(event.data);
        frame.contentWindow.postMessage({type:'connect'}, '*', [channel.port2]);
        port.postMessage({type:'configure', block:${JSON.stringify(original)}});
      };
      window.undo = () => port.postMessage({type:'update', block:${JSON.stringify(restored)}});
      window.redo = () => port.postMessage({type:'update', block:${JSON.stringify(original)}});
    </script>`);
});
server.listen(0, "127.0.0.1");
await once(server, "listening");
const address = server.address();
assert(address && typeof address === "object");
const browser = await chromium.launch({ headless: true });
try {
  for (const width of [1280, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    try {
      await page.goto(`http://127.0.0.1:${address.port}`);
      const frame = page.frameLocator("iframe");
      const heading = frame.getByRole("textbox", { name: "Heading", exact: true });
      await expect(heading).toHaveValue("Original");
      await heading.fill("Edited");
      await page.waitForFunction(() => window.changes.length === 1);
      await page.evaluate(() => window.undo());
      await expect(heading).toHaveValue("Restored");
      await heading.focus();
      await heading.press("ControlOrMeta+A");
      await heading.press("Backspace");
      await page.waitForFunction(() => window.changes.length === 2);
      const changes = await page.evaluate(() => window.changes);
      assert.deepEqual(changes, [
        { type: "change", block: { ...original, props: { heading: "Edited" } } },
        { type: "change", block: { ...restored, props: { heading: "" } } },
      ]);
      await page.evaluate(() => window.redo());
      await expect(heading).toHaveValue("Original");
      await heading.fill("After redo");
      await page.waitForFunction(() => window.changes.length === 3);
      assert.deepEqual(await page.evaluate(() => window.changes[2]), {
        type: "change",
        block: { ...original, props: { heading: "After redo" } },
      });
      await expect(heading).toHaveCount(1);
      const child = page.frames().find((entry) => entry.url().endsWith("/frame"));
      assert(child);
      assert.equal(await child.evaluate(() => {
        try { void parent.document; return false; } catch { return true; }
      }), true);
      console.log(`${width}px: edits, undo/redo snapshots, keyboard edits and sandbox isolation pass.`);
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
  await new Promise<void>((resolve) => server.close(() => resolve()));
}

declare global {
  interface Window {
    changes: { type: string; block: typeof original }[];
    undo: () => void;
    redo: () => void;
  }
}
