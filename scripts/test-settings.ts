import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { once } from "node:events";
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import { buildPackages } from "./build";
await buildPackages();
const code = await readFile(
  new URL("../packages/rich-text/dist/settings.js", import.meta.url),
  "utf8",
);
const block = {
  id: "settings-fixture",
  type: "rich-text",
  props: { heading: "Original", html: "<p>Content</p>" },
};
const server = createServer((request, response) => {
  if (request.url === "/frame") {
    response.setHeader(
      "Content-Security-Policy",
      "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; frame-ancestors 'self'; connect-src 'none'",
    );
    response.setHeader("X-Frame-Options", "SAMEORIGIN");
    response.end(
      '<!doctype html><div id="settings"></div><script type="module">' +
        code.replace(/<\/script/gi, "<\\/script") +
        "</script>",
    );
    return;
  }
  response.end(
    '<!doctype html><iframe title="Settings" sandbox="allow-scripts" src="/frame"></iframe><script>let port;window.fixture=' +
      JSON.stringify(block) +
      ';document.querySelector("iframe").onload=()=>{const channel=new MessageChannel();port=channel.port1;port.onmessage=e=>{window.change=e.data;};document.querySelector("iframe").contentWindow.postMessage({type:"connect"},"*",[channel.port2]);port.postMessage({type:"configure",block:window.fixture,host:{entries:[],components:[]},css:"",theme:"light"});};window.undo=()=>port.postMessage({type:"update",block:{...window.fixture,props:{...window.fixture.props,heading:"Restored"}}});</script>',
  );
});
server.listen(0, "127.0.0.1");
await once(server, "listening");
const address = server.address();
assert(address && typeof address === "object");
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:" + address.port);
  const frame = page.frameLocator("iframe"),
    heading = frame.getByRole("textbox", { name: "Heading", exact: true });
  await heading.fill("Changed through the sandbox");
  await page.waitForFunction(
    () =>
      (
        window as unknown as {
          change?: { block: { props: { heading: string } } };
        }
      ).change?.block.props.heading === "Changed through the sandbox",
  );
  await page.evaluate(() => (window as unknown as { undo: () => void }).undo());
  await expect(heading).toHaveValue("Restored");
  const child = page.frames().find((frame) => frame.url().endsWith("/frame"));
  assert(child);
  const isolated = await child.evaluate(() => {
    try {
      void parent.document;
      return false;
    } catch {
      return true;
    }
  });
  assert.equal(isolated, true);
  console.log(
    "Sandboxed settings changes, undo synchronization and parent DOM isolation pass.",
  );
} finally {
  await browser.close();
  await new Promise<void>((resolve) => server.close(() => resolve()));
}
