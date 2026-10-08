import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { once } from "node:events";
import assert from "node:assert/strict";
import { expect, type Browser, type Route } from "@playwright/test";

/** Exercise the shipped SSR/hydration entries, including delayed availability.
 * A visible placeholder must never conceal a silently selected first time.
 */
export async function verifyBooking(browser: Browser) {
  const props = {
    initial: {
      tenantId: "test-booking",
      revision: 1,
      name: "Fixture salon",
      currency: "ZAR",
      branding: { logo: "", colour: "#222222", summary: "" },
      capabilities: { appointments: true },
      staff: [{ id: "stylist", name: "Fixture stylist" }],
      items: [
        {
          id: "service",
          type: "services",
          name: "Fixture service",
          description: "",
          priceMinor: 10000,
          version: 1,
          details: { duration: 30, depositPercent: 25 },
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
  const { default: renderer } =
    await import("../packages/booking/dist/server.js");
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
    new URL("../packages/booking/dist/browser.js", import.meta.url),
    "utf8",
  );
  const server = createServer((request, response) => {
    if (request.url === "/browser.js") {
      response.setHeader("Content-Type", "text/javascript");
      response.end(code);
    } else {
      response.setHeader("Content-Type", "text/html");
      response.end(
        '<!doctype html><html lang="en"><title>Booking fixture</title><div id="booking">' +
          rendered.html +
          '</div><script type="module">import {mount} from "/browser.js";mount(document.getElementById("booking"),' +
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
  let pending: Route | undefined;
  await page.route("**/storefront/availability?*", (route) => {
    pending = route;
  });
  const answer = async () => {
    await expect.poll(() => !!pending).toBe(true);
    const route = pending!;
    pending = undefined;
    const date = new URL(route.request().url()).searchParams.get("date");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        date,
        timezone: "Africa/Johannesburg",
        confirmationRequired: false,
        slots: [
          { start: `${date}T08:00:00+02:00`, end: `${date}T08:30:00+02:00` },
          { start: `${date}T09:00:00+02:00`, end: `${date}T09:30:00+02:00` },
        ],
      }),
    });
  };
  try {
    await page.goto("http://127.0.0.1:" + address.port);
    const time = page.getByRole("combobox", {
      name: "Appointment time",
      exact: true,
    });
    await expect(time).toBeDisabled();
    await page
      .getByRole("combobox", { name: "Service", exact: true })
      .selectOption("service");
    await page
      .getByLabel("Appointment date", { exact: true })
      .fill("2026-10-14");
    await expect(page.getByRole("status")).toContainText(
      "Checking available times",
    );
    await expect(time).toBeDisabled();
    await answer();
    await expect(time).toBeEnabled();
    await expect(time).toHaveValue("");
    expect(
      await time.evaluate(
        (element: HTMLSelectElement) => element.validity.valueMissing,
      ),
    ).toBe(true);
    await time.selectOption({ index: 2 });
    await expect(time).toHaveValue("2026-10-14T09:00:00+02:00");
    await page
      .getByRole("button", { name: "Refresh available times", exact: true })
      .click();
    await expect(time).toBeDisabled();
    await answer();
    await expect(time).toBeEnabled();
    await expect(time).toHaveValue("");
    await time.selectOption({ index: 1 });
    await page
      .getByLabel("Appointment date", { exact: true })
      .fill("2026-10-15");
    await answer();
    await expect(time).toBeEnabled();
    await expect(time).toHaveValue("");
    console.log(
      "Booking requires an explicit available time after loading, refresh and date changes.",
    );
  } finally {
    await page.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}
