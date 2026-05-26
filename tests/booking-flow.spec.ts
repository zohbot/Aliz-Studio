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

  test("security headers and booking API validation are in place", async ({ request }) => {
    const ownerLogin = await request.get("/owner/login");

    expect(ownerLogin.headers()["x-frame-options"]).toBe("DENY");
    expect(ownerLogin.headers()["x-content-type-options"]).toBe("nosniff");
    expect(ownerLogin.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(ownerLogin.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");

    const invalidBooking = await request.post("/api/booking/create", {
      data: {
        serviceId: "deluxe-cut",
        appointmentDate: "2000-01-01",
        appointmentTime: "9:00 PM",
        customerName: "Jordan Price",
        customerEmail: "jordan@example.com",
        customerPhone: "(555) 014-0199"
      }
    });

    expect(invalidBooking.status()).toBe(400);

    const nonJsonBooking = await request.post("/api/booking/quote", {
      headers: {
        "content-type": "text/plain"
      },
      data: JSON.stringify({
        serviceId: "deluxe-cut",
        appointmentDate: "2030-01-01"
      })
    });

    expect(nonJsonBooking.status()).toBe(415);
  });

  test("package card opens a richer selected-package page", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "View package" }).first().click();

    await expect(page.getByRole("heading", { name: "Basic Cut" })).toBeVisible();
    await expect(page.getByText("Selected package")).toBeVisible();
    await expect(page.getByRole("link", { name: /Pick date and time/i })).toBeVisible();
  });

  test("customer can select a service, date, slot, and complete mock checkout", async ({ page }) => {
    const slotLabel = test.info().project.name.includes("mobile") ? "3:30 PM" : "2:00 PM";

    await page.goto("/book?service=deluxe-cut");

    await expect(page.getByRole("heading", { name: "Deluxe Cut" })).toBeVisible();
    await page.getByRole("button", { name: slotLabel }).click();
    await page.getByLabel("Full name").fill("Jordan Price");
    await page.getByLabel("Email").fill("jordan@example.com");
    await page.getByLabel("Phone").fill("(555) 014-0199");
    await page.getByLabel("Notes").fill("Low fade with a natural finish.");

    const continueButton = page.getByRole("button", { name: /continue to deposit/i });
    await expect(continueButton).toBeEnabled();
    await expect(page.getByText("Mock Square checkout for deposit testing")).toBeVisible();
    await expect(page.getByText("Visa").first()).toBeVisible();
    await expect(page.getByText("Square Pay").first()).toBeVisible();
    await continueButton.click();

    await expect(page).toHaveURL(/\/checkout/);
    await expect(page.getByRole("heading", { name: /reserve your appointment/i })).toBeVisible();
    await expect(page.getByText("Cash App")).toBeVisible();
    await expect(page.getByText("American Express")).toBeVisible();
    await page.getByLabel("Card number").fill("4242 4242 4242 4242");
    await page.getByLabel("Expiration").fill("12/30");
    await page.getByLabel("CVC").fill("123");
    await page.getByLabel("ZIP code").fill("07030");
    await page.getByRole("button", { name: /pay \$15 deposit/i }).click();

    await expect(page).toHaveURL(/\/book\/confirmation/);
    await expect(page.getByRole("heading", { name: /your appointment is confirmed/i })).toBeVisible();
    await expect(page.getByText(/mock deposit has been recorded/i)).toBeVisible();
  });

  test("owner can sign in and manage appointment status", async ({ page }) => {
    await page.goto("/owner/dashboard");
    await expect(page).toHaveURL(/\/owner\/login/);

    await page.getByLabel("Email").fill(process.env.OWNER_EMAIL || "owner@alizstudio.test");
    await page.getByLabel("Password").fill(process.env.OWNER_PASSWORD || "local-owner-password-for-tests");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/owner\/dashboard/);
    await expect(page.getByRole("heading", { name: /manage bookings/i })).toBeVisible();
    await expect(page.getByText("Marcus Reed")).toBeVisible();

    const firstCard = page.locator(".appointment-card").first();
    await firstCard.getByLabel("Appointment status").selectOption("completed");
    await firstCard.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("Appointment saved.")).toBeVisible();
  });

  test("owner session cookie is issued with strict attributes", async ({ request }) => {
    const email = process.env.OWNER_EMAIL || "owner@alizstudio.test";
    const password = process.env.OWNER_PASSWORD || "local-owner-password-for-tests";

    const response = await request.post("/api/owner/auth/login", {
      headers: {
        "content-type": "application/json"
      },
      data: {
        email,
        password
      }
    });

    const setCookieHeader = response
      .headersArray()
      .find((header) => header.name.toLowerCase() === "set-cookie")?.value;
    const normalizedSetCookieHeader = setCookieHeader?.toLowerCase() ?? "";

    expect(response.status()).toBe(200);
    expect(setCookieHeader).toBeTruthy();
    expect(normalizedSetCookieHeader).toContain("aliz_owner_session=");
    expect(normalizedSetCookieHeader).toContain("httponly");
    expect(normalizedSetCookieHeader).toContain("path=/");
    expect(normalizedSetCookieHeader).toContain("samesite=strict");

    await request.post("/api/owner/auth/logout", {
      headers: {
        "content-type": "application/json"
      }
    });
  });

  test("square webhook behavior is safe in current environment", async ({ request }) => {
    const webhookResponse = await request.post("/api/square/webhook", {
      headers: {
        "content-type": "application/json"
      },
      data: JSON.stringify({
        type: "payment.updated",
        data: { id: "evt_123" }
      })
    });
    const webhookPayload = await webhookResponse.json();
    const shouldVerify = process.env.NODE_ENV === "production" || process.env.SQUARE_WEBHOOK_VERIFY === "true";

    if (shouldVerify) {
      expect(webhookResponse.status()).toBe(401);
      expect(webhookPayload.error).toBe("Missing Square webhook signature header.");
    } else {
      expect(webhookResponse.status()).toBe(200);
      expect(webhookPayload).toEqual(
        expect.objectContaining({
          received: true,
          verified: false,
          action: "square_webhook_stub"
        })
      );
    }
  });
});
