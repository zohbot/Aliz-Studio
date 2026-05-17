import { expect, test } from "@playwright/test";

test.describe("Aliz Studio booking foundation", () => {
  test("home page exposes service menu and booking entry point", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /appointment-only grooming/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /book an appointment/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Basic Cut" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Deluxe Cut" })).toBeVisible();
  });

  test("package card opens a richer selected-package page", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "View package" }).first().click();

    await expect(page.getByRole("heading", { name: "Basic Cut" })).toBeVisible();
    await expect(page.getByText("Selected package")).toBeVisible();
    await expect(page.getByRole("link", { name: /Pick date and time/i })).toBeVisible();
  });

  test("customer can select a service, date, and slot before Square handoff", async ({ page }) => {
    await page.goto("/book?service=deluxe-cut");

    await expect(page.getByRole("heading", { name: "Deluxe Cut" })).toBeVisible();
    await page.getByRole("button", { name: "2:00 PM" }).click();

    const continueButton = page.getByRole("button", { name: /continue to deposit/i });
    await expect(continueButton).toBeEnabled();
    await expect(page.getByText("Square checkout-ready deposit handoff")).toBeVisible();
  });
});
