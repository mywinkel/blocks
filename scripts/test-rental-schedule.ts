import { mkdir } from "node:fs/promises";
import { expect, type Browser } from "@playwright/test";
import type { CustomerAccount } from "../packages/sdk/src/wire-types";
import { artifactPath } from "./artifacts";

/** Use the distributed account served by the history harness, with an independent
 * customer response and a browser timezone that crosses the SAST date boundary. */
export async function verifyRentalSchedule(browser: Browser, origin: string) {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      timezoneId: "America/Los_Angeles",
    });
    const errors: string[] = [];
    const writes: string[] = [];
    const account: CustomerAccount = {
      customer: {
        id: "rental-customer",
        name: "Synthetic hirer",
        email: "hirer@example.test",
      },
      revision: 1,
      memberships: [],
      nextMembershipCursor: null,
      nextHistoryCursor: null,
      history: [
        {
          id: "rental-pressure-washer",
          name: "Pressure washer weekend hire",
          type: "rentals",
          status: "reserved",
          version: 1,
          amountMinor: 100000,
          createdAt: "2027-01-01T08:00:00Z",
          start: "2027-01-10T23:30:00Z",
          end: "2027-01-12T12:00:00+02:00",
          payment: "deposit_paid",
          hasReceipt: true,
          booking: {
            cancel: true,
            reschedule: false,
            noticeHours: 24,
            serviceId: "",
            resourceId: "pressure-washer",
            calendarStatus: "",
            calendarError: "",
            refundStatus: "",
          },
        },
      ],
    };
    const record = account.history[0]!;
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => {
      if (request.method() !== "GET") writes.push(request.url());
    });
    await page.route("**/storefront/customer/account?*", (route) =>
      route.fulfill({ json: account }),
    );
    try {
      await page.goto(origin);
      const rental = page.locator("li").filter({ hasText: record.name });
      await expect(rental).toBeVisible();
      const output = artifactPath("verification", "customer-history");
      await mkdir(output, { recursive: true });
      await page.screenshot({
        path: `${output}/rental-schedule-${width}.png`,
        fullPage: true,
      });
      const times = rental.locator("time");
      await expect(times).toHaveCount(2);
      await expect(rental.locator("dt")).toHaveText([
        "Scheduled collection",
        "Scheduled return",
      ]);
      await expect(times.nth(0)).toHaveAttribute("datetime", record.start);
      await expect(times.nth(0)).toHaveText(/11 Jan 2027.*01:30/);
      await expect(times.nth(1)).toHaveAttribute("datetime", record.end);
      await expect(times.nth(1)).toHaveText(/12 Jan 2027.*12:00/);
      await expect(rental).toContainText("South African Standard Time (SAST)");
      await expect(
        rental.getByRole("button", { name: "Download calendar file" }),
      ).toHaveCount(0);
      const receipt = rental.getByRole("link", {
        name: "View request and payment",
      });
      await expect(receipt).toHaveAttribute(
        "href",
        "/request?id=rental-pressure-washer",
      );
      await rental
        .getByRole("button", { name: "Cancel booking", exact: true })
        .focus();
      await page.keyboard.press("Enter");
      const reason = rental.getByRole("textbox", {
        name: "Reason",
        exact: true,
      });
      await reason.fill("Keep my rental cancellation draft");
      const query = page.getByRole("searchbox", {
        name: "Search loaded history",
      });
      await query.fill("unmatched");
      await expect(rental).not.toBeVisible();
      await query.fill("pressure washer");
      await expect(reason).toHaveValue("Keep my rental cancellation draft");
      const refresh = page.getByRole("button", {
        name: "Refresh account",
        exact: true,
      });
      record.end = "2027-01-13T10:00:00Z";
      await refresh.focus();
      await page.keyboard.press("Enter");
      await expect(times.nth(1)).toHaveText(/13 Jan 2027.*12:00/);
      await expect(reason).toHaveValue("Keep my rental cancellation draft");
      // Malformed, missing, impossible, backwards and timezone-less values must
      // not acquire the browser's local timezone or imply an agreed return.
      for (const end of [
        "",
        "invalid",
        "2027-02-30T12:00:00Z",
        record.start,
        "2027-01-01T12:00:00Z",
        "2027-01-13T12:00:00",
      ]) {
        record.end = end;
        await refresh.click();
        await expect(times).toHaveCount(0);
        await expect(rental).toContainText(
          "Contact the business for collection and return times.",
        );
        await expect(rental).not.toContainText("Invalid Date");
      }
      record.end = "2027-01-13T10:00:00Z";
      record.start = "";
      await refresh.click();
      await expect(times).toHaveCount(0);
      record.start = "2027-01-10T23:30:00Z";
      record.status = "cancelled";
      await refresh.click();
      await expect(times).toHaveCount(2);
      await expect(rental).toContainText("cancelled");
      await expect(
        rental.getByRole("button", { name: "Confirm cancellation" }),
      ).toHaveCount(1);
      // No command is submitted: reading/refreshing the schedule keeps the draft.
      await expect(reason).toHaveValue("Keep my rental cancellation draft");
      expect(writes).toEqual([]);
      expect(errors).toEqual([]);
      expect(
        await page.evaluate(() => [localStorage.length, sessionStorage.length]),
      ).toEqual([0, 0]);
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth,
        ),
      ).toBe(true);
      console.log(
        `${width}px: paired rental schedule, explicit SAST/date boundary, refreshed return, invalid/older-host recovery, retained keyboard cancellation draft and receipt link; no writes or overflow.`,
      );
    } finally {
      await page.close();
    }
  }
}
