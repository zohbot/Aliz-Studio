import { expect, test } from "@playwright/test";
import { rm } from "fs/promises";
import path from "path";

test.describe("Aliz Studio booking foundation", () => {
  test.beforeAll(async () => {
    await rm(path.join(process.cwd(), "data", "appointments.json"), { force: true });
  });

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
    await page.getByLabel("Full name").fill("Jordan Price");
    await page.getByLabel("Email").fill("jordan@example.com");
    await page.getByLabel("Phone").fill("(555) 014-0199");
    await page.getByLabel("Notes").fill("Low fade with a natural finish.");

    const continueButton = page.getByRole("button", { name: /continue to deposit/i });
    await expect(continueButton).toBeEnabled();
    await expect(page.getByText("Square checkout-ready deposit handoff")).toBeVisible();
    await continueButton.click();

    await expect(page).toHaveURL(/\/book\/confirmation/);
    await expect(page.getByRole("heading", { name: /your spot is ready/i })).toBeVisible();
  });

  test("owner can sign in and manage appointment status", async ({ page }) => {
    await page.goto("/owner/dashboard");
    await expect(page).toHaveURL(/\/owner\/login/);

    await page.getByLabel("Email").fill("owner@alizstudio.test");
    await page.getByLabel("Password").fill("aliz-demo-2026");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/owner\/dashboard/);
    await expect(page.getByRole("heading", { name: /manage bookings/i })).toBeVisible();
    await expect(page.getByText("Marcus Reed")).toBeVisible();

    const firstCard = page.locator(".appointment-card").first();
    await firstCard.getByLabel("Appointment status").selectOption("completed");
    await firstCard.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("Appointment saved.")).toBeVisible();
  });
});
