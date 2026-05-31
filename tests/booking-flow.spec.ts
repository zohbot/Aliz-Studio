import { expect, test } from "@playwright/test";
import { readdir, readFile } from "fs/promises";
import path from "path";
import { resolveFileAvailabilityStoragePaths } from "../lib/repositories/file-availability-repository";
import { resolveFileAppointmentStoragePaths } from "../lib/repositories/file-appointment-repository";
import { resolveFileCustomerProfileStoragePaths } from "../lib/repositories/file-customer-profile-repository";
import { resolveRepositoryBackend } from "../lib/repositories/factory";

async function listFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(root, entry.name);

      return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
    })
  );

  return files.flat();
}

async function pngHasAlphaChannel(filePath: string) {
  const buffer = await readFile(filePath);

  return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
    [4, 6].includes(buffer[25]);
}

function parseRgbColor(value: string) {
  const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);

  expect(match, `${value} should be an rgb/rgba color`).toBeTruthy();

  return {
    blue: Number(match?.[3] ?? 0),
    green: Number(match?.[2] ?? 0),
    red: Number(match?.[1] ?? 0)
  };
}

function expectReadableImageCardTextColor(value: string, label: string) {
  const color = parseRgbColor(value);

  expect(color.red, `${label} red channel should stay light enough`).toBeGreaterThanOrEqual(180);
  expect(color.green, `${label} green channel should stay light enough`).toBeGreaterThanOrEqual(145);
  expect(color.blue, `${label} blue channel should not be near black`).toBeGreaterThanOrEqual(95);
}

function expectNotBrowserBlue(value: string, label: string) {
  const color = parseRgbColor(value);
  const looksLikeDefaultBlue =
    color.blue >= 150 && color.blue > color.red + 60 && color.blue > color.green + 30;

  expect(looksLikeDefaultBlue, `${label} should not look like default browser blue`).toBeFalsy();
}

function dateOffsetId(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);

  return date.toISOString().slice(0, 10);
}

test.describe("Aliz Studio booking foundation", () => {
  test("file appointment storage uses writable temp storage on Vercel", () => {
    expect(resolveFileAppointmentStoragePaths({}).dataDirectory).toBe(path.join(process.cwd(), "data"));

    const vercelPaths = resolveFileAppointmentStoragePaths({ VERCEL: "1" });

    expect(vercelPaths.dataDirectory).toBe("/tmp/aliz-studio-appointments");
    expect(vercelPaths.appointmentsFile).toBe("/tmp/aliz-studio-appointments/appointments.json");

    expect(resolveFileAvailabilityStoragePaths({}).dataDirectory).toBe(path.join(process.cwd(), "data"));

    const vercelAvailabilityPaths = resolveFileAvailabilityStoragePaths({ VERCEL: "1" });

    expect(vercelAvailabilityPaths.dataDirectory).toBe("/tmp/aliz-studio-availability");
    expect(vercelAvailabilityPaths.availabilityFile).toBe("/tmp/aliz-studio-availability/settings.json");

    expect(resolveFileCustomerProfileStoragePaths({}).dataDirectory).toBe(path.join(process.cwd(), "data"));

    const vercelCustomerPaths = resolveFileCustomerProfileStoragePaths({ VERCEL: "1" });

    expect(vercelCustomerPaths.dataDirectory).toBe("/tmp/aliz-studio-customers");
    expect(vercelCustomerPaths.customerProfilesFile).toBe("/tmp/aliz-studio-customers/profiles.json");
  });

  test("inactive Supabase repository setting falls back to file backend", () => {
    expect(resolveRepositoryBackend("supabase", {})).toBe("file");
    expect(resolveRepositoryBackend("supabase", { ALIZ_ENABLE_SUPABASE_REPOSITORY: "true" })).toBe("file");
    expect(resolveRepositoryBackend("unexpected")).toBe("file");
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

    const continueButton = page.getByRole("button", { name: /continue to mock deposit/i });
    await expect(continueButton).toBeEnabled();
    await expect(page.getByText(/No real card will be charged/i)).toBeVisible();
    await expect(page.getByText("Credit or debit").first()).toBeVisible();
    await expect(page.getByText("Square-style demo").first()).toBeVisible();
    await continueButton.click();

    await expect(page).toHaveURL(/\/checkout/);
    await expect(page.getByRole("heading", { name: /reserve your appointment/i })).toBeVisible();
    await expect(page.getByText("Apple Pay style mock")).toBeVisible();
    await expect(page.getByText("Google Pay style mock")).toBeVisible();
    await page.getByLabel("Card number").fill("4242 4242 4242 4242");
    await page.getByLabel("Expiration").fill("12/30");
    await page.getByLabel("CVC").fill("123");
    await page.getByLabel("ZIP code").fill("07030");
    await page.getByRole("button", { name: /record mock \$15 deposit/i }).click();

    await expect(page).toHaveURL(/\/book\/confirmation/);
    await expect(page.getByRole("heading", { name: /your appointment is confirmed/i })).toBeVisible();
    await expect(page.getByText(/demo-only mock deposit has been recorded/i)).toBeVisible();
  });

  test("owner can sign in and manage appointment status", async ({ page }) => {
    const targetCustomer = "Darius Cole";

    await page.goto("/owner/dashboard");
    await expect(page).toHaveURL(/\/owner\/login/);

    await page.getByLabel("Email").fill(process.env.OWNER_EMAIL || "owner@alizstudio.test");
    await page.getByLabel("Password", { exact: true }).fill(
      process.env.OWNER_PASSWORD || "local-owner-password-for-tests"
    );
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/owner\/dashboard/);
    await expect(page.getByRole("heading", { name: /manage bookings/i })).toBeVisible();
    await expect(page.getByRole("region", { name: "Appointment statistics" })).toBeVisible();
    await expect(page.getByRole("complementary", { name: "Owner session" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
    await expect(page.getByText("Temporary demo storage is unavailable")).toHaveCount(0);
    await expect(page.getByText(targetCustomer)).toBeVisible();

    const ownerSeedCard = page.locator(".appointment-card").filter({ hasText: targetCustomer }).first();
    await ownerSeedCard.getByLabel("Appointment status").selectOption("completed");
    await expect(ownerSeedCard.getByLabel("Appointment status")).toHaveValue("completed");
    await ownerSeedCard.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("Appointment saved.")).toBeVisible();
    await expect(ownerSeedCard.locator(".status-badge")).toHaveText("Completed");
  });

  test("owner can open appointment detail and save status notes", async ({ page, request }) => {
    const isMobileProject = test.info().project.name.includes("mobile");
    const customerName = isMobileProject ? "Taylor Detail Mobile" : "Taylor Detail Desktop";
    const appointmentDate = dateOffsetId(isMobileProject ? 21 : 20);
    const appointmentTime = isMobileProject ? "10:00 AM" : "11:00 AM";
    const ownerNote = `Internal detail note ${test.info().project.name}`;

    const createResponse = await request.post("/api/booking/create", {
      data: {
        serviceId: "basic-cut",
        appointmentDate,
        appointmentTime,
        customerName,
        customerEmail: "taylor.detail@example.com",
        customerPhone: "(555) 014-0222",
        notes: "Prefers a quiet appointment and a clean neckline."
      }
    });

    expect(createResponse.status()).toBe(200);

    await page.goto("/owner/login");
    await page.getByLabel("Email").fill(process.env.OWNER_EMAIL || "owner@alizstudio.test");
    await page.getByLabel("Password", { exact: true }).fill(
      process.env.OWNER_PASSWORD || "local-owner-password-for-tests"
    );
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/owner\/dashboard/);

    await page.getByPlaceholder("Search client, service, or phone").fill(customerName);
    const appointmentCard = page.locator(".appointment-card").filter({ hasText: customerName }).first();

    await expect(appointmentCard).toBeVisible();
    await expect(appointmentCard.locator(".status-badge")).toHaveText("Pending deposit");
    await appointmentCard.getByRole("button", { name: "View details" }).scrollIntoViewIfNeeded();
    await appointmentCard.getByRole("button", { name: "View details" }).click();

    const detail = page.locator(".appointment-detail-drawer");

    await expect(detail).toBeVisible();
    await expect(detail.getByRole("heading", { name: customerName })).toBeVisible();
    await expect(detail.getByText("Basic Cut")).toBeVisible();
    await expect(detail.getByText("taylor.detail@example.com")).toBeVisible();
    await expect(detail.getByText("(555) 014-0222")).toBeVisible();
    await expect(detail.getByText(/Mock deposit pending/i)).toBeVisible();
    await expect(detail.getByText(/demo\/mock deposit record only/i)).toBeVisible();
    await expect(detail.getByText("Date and time")).toBeVisible();
    await expect(detail.locator(".appointment-detail-stat").filter({ hasText: "Mock deposit" })).toBeVisible();
    await expect(detail.getByText("Last updated")).toBeVisible();
    await expect(detail.getByText("Appointment ID")).toBeVisible();
    await expect(detail.locator(".appointment-detail-stat")).toHaveCount(3);
    await expect(detail.getByRole("button", { name: "Close", exact: true })).toBeVisible();
    await expect(detail.getByRole("button", { name: "Save detail changes" })).toBeVisible();

    await detail.getByLabel("Appointment status").selectOption("no_show");
    await detail.getByLabel("Owner notes").fill(ownerNote);
    await detail.getByRole("button", { name: "Save detail changes" }).click();

    await expect(page.getByText("Appointment saved.")).toBeVisible();
    await expect(detail.locator(".status-badge")).toHaveText("No show");

    await detail.getByRole("button", { name: "Close", exact: true }).click();
    await appointmentCard.getByRole("button", { name: "View details" }).click();
    await expect(page.locator(".appointment-detail-drawer").getByLabel("Owner notes")).toHaveValue(ownerNote);
  });

  test("owner can manage service menu details with validation", async ({ page }) => {
    const isMobileProject = test.info().project.name.includes("mobile");
    const targetServiceId = isMobileProject ? "eyebrows" : "shape-up";
    const targetServiceName = isMobileProject ? "Eyebrows" : "Shape Up";
    const updatedDescription = `Demo-safe owner service edit for ${test.info().project.name}.`;
    const restoredDescription = isMobileProject
      ? "Subtle eyebrow cleanup for a finished look."
      : "Fast edge cleanup for a sharper look between cuts.";
    const restoredPrice = isMobileProject ? "10" : "15";
    const restoredDeposit = "5";
    const restoredDuration = isMobileProject ? "15" : "20";
    const restoredSortOrder = isMobileProject ? "70" : "50";

    await page.goto("/owner/services");
    await expect(page).toHaveURL(/\/owner\/login/);

    await page.getByLabel("Email").fill(process.env.OWNER_EMAIL || "owner@alizstudio.test");
    await page.getByLabel("Password", { exact: true }).fill(
      process.env.OWNER_PASSWORD || "local-owner-password-for-tests"
    );
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/owner\/dashboard/);
    await page.goto("/owner/services");
    await expect(page.getByRole("heading", { name: /manage the public menu/i })).toBeVisible();
    await expect(page.locator(".owner-service-card")).toHaveCount(7);
    await expect(page.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/owner/dashboard");

    if (isMobileProject) {
      for (const width of [320, 375, 390, 414, 430]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto("/owner/services");

        const overflow = await page.evaluate(() => {
          const documentWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);

          return documentWidth - window.innerWidth;
        });

        expect(overflow, `owner services should not overflow at ${width}px`).toBeLessThanOrEqual(1);
      }
    }

    const serviceCard = page.locator(".owner-service-card").filter({ hasText: targetServiceName }).first();
    await expect(serviceCard).toBeVisible();
    await serviceCard.getByRole("button", { name: "Edit" }).click();

    const drawer = page.getByRole("dialog", { name: targetServiceName });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText(`Stable ID: ${targetServiceId}`)).toBeVisible();

    await drawer.getByLabel("Price").fill("10");
    await drawer.getByLabel("Deposit").fill("20");
    await drawer.getByRole("button", { name: "Save service" }).click();
    await expect(drawer.getByText("Deposit cannot exceed the service price.")).toBeVisible();

    await drawer.getByLabel("Price").fill(isMobileProject ? "12" : "18");
    await drawer.getByLabel("Deposit").fill(restoredDeposit);
    await drawer.getByLabel("Duration minutes").fill(isMobileProject ? "18" : "24");
    await drawer.getByLabel("Short description").fill(updatedDescription);
    await drawer.getByRole("button", { name: "Bookable Shown in booking" }).click();
    await drawer.getByRole("button", { name: "Save service" }).click();

    await expect(page.getByText(`${targetServiceName} saved.`)).toBeVisible();
    await page.goto("/book");
    await expect(page.getByRole("button", { name: new RegExp(targetServiceName) })).toHaveCount(0);

    await page.goto("/owner/services");
    await page.locator(".owner-service-card").filter({ hasText: targetServiceName }).first().getByRole("button", { name: "Edit" }).click();
    const restoreDrawer = page.getByRole("dialog", { name: targetServiceName });
    await restoreDrawer.getByLabel("Price").fill(restoredPrice);
    await restoreDrawer.getByLabel("Deposit").fill(restoredDeposit);
    await restoreDrawer.getByLabel("Duration minutes").fill(restoredDuration);
    await restoreDrawer.getByLabel("Short description").fill(restoredDescription);
    await restoreDrawer.getByLabel("Sort order").fill(restoredSortOrder);
    await restoreDrawer.getByRole("button", { name: "Bookable Hidden from booking" }).click();
    await restoreDrawer.getByRole("button", { name: "Save service" }).click();

    await expect(page.getByText(`${targetServiceName} saved.`)).toBeVisible();
    await page.goto("/book");
    await expect(page.getByRole("button", { name: new RegExp(targetServiceName) })).toBeVisible();
  });

  test("owner service update endpoint rejects unauthorized requests", async ({ request }) => {
    const response = await request.patch("/api/owner/services/basic-cut", {
      data: {
        price: 31
      }
    });

    expect(response.status()).toBe(401);
  });

  test("owner availability page is protected and responsive", async ({ page }) => {
    await page.goto("/owner/availability");
    await expect(page).toHaveURL(/\/owner\/login/);

    await page.getByLabel("Email").fill(process.env.OWNER_EMAIL || "owner@alizstudio.test");
    await page.getByLabel("Password", { exact: true }).fill(
      process.env.OWNER_PASSWORD || "local-owner-password-for-tests"
    );
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/owner\/dashboard/);
    await page.goto("/owner/availability");
    await expect(page.getByRole("heading", { name: /set booking hours/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Business hours" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Blocked dates", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Controls" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Services" })).toHaveAttribute("href", "/owner/services");

    if (test.info().project.name.includes("mobile")) {
      for (const width of [320, 375, 390, 414, 430]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto("/owner/availability");

        const overflow = await page.evaluate(() => {
          const documentWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);

          return documentWidth - window.innerWidth;
        });

        expect(overflow, `owner availability should not overflow at ${width}px`).toBeLessThanOrEqual(1);
      }
    }
  });

  test("owner can manage availability settings and booking respects blocked dates", async ({ page }) => {
    test.skip(
      test.info().project.name.includes("mobile"),
      "Shared file-backed availability mutation is covered in the desktop project."
    );

    const blockedDate = dateOffsetId(45);

    await page.goto("/owner/login");
    await page.getByLabel("Email").fill(process.env.OWNER_EMAIL || "owner@alizstudio.test");
    await page.getByLabel("Password", { exact: true }).fill(
      process.env.OWNER_PASSWORD || "local-owner-password-for-tests"
    );
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/owner\/dashboard/);
    await page.goto("/owner/availability");
    await expect(page.getByRole("heading", { name: "Business hours" })).toBeVisible();

    await page.locator('input[type="date"]').fill(blockedDate);
    await page.getByLabel("Reason").fill("Playwright blocked date");
    await page.getByRole("button", { name: "Add blocked date" }).click();
    await expect(page.getByText("Blocked date added. Save changes to apply it to booking.")).toBeVisible();
    await page.getByRole("button", { name: "Save availability" }).click();
    await expect(page.getByText("Availability rules saved.")).toBeVisible();

    const blockedAvailability = await page.request.get(`/api/booking/availability?date=${blockedDate}`);
    const blockedPayload = await blockedAvailability.json();

    expect(blockedAvailability.status()).toBe(200);
    expect(blockedPayload.slots.every((slot: { isReserved?: boolean }) => slot.isReserved)).toBeTruthy();

    await page.getByLabel(`Remove blocked date ${blockedDate}`).click();
    await page.getByRole("button", { name: "Save availability" }).click();
    await expect(page.getByText("Availability rules saved.")).toBeVisible();

    const restoredAvailability = await page.request.get(`/api/booking/availability?date=${blockedDate}`);
    const restoredPayload = await restoredAvailability.json();

    expect(restoredPayload.slots.some((slot: { isReserved?: boolean }) => !slot.isReserved)).toBeTruthy();

    await page.getByLabel("Monday start time").fill("17:00");
    await page.getByLabel("Monday end time").fill("10:00");
    await page.getByRole("button", { name: "Save availability" }).click();
    await expect(page.getByText("Monday end time must be after start time.")).toBeVisible();
  });

  test("owner availability endpoint requires auth and rejects invalid settings", async ({ request }) => {
    const unauthorized = await request.patch("/api/owner/availability", {
      data: {
        timezone: "America/New_York"
      }
    });

    expect(unauthorized.status()).toBe(401);

    const login = await request.post("/api/owner/auth/login", {
      headers: {
        "content-type": "application/json"
      },
      data: {
        email: process.env.OWNER_EMAIL || "owner@alizstudio.test",
        password: process.env.OWNER_PASSWORD || "local-owner-password-for-tests"
      }
    });

    expect(login.status()).toBe(200);

    const invalidSettings = await request.patch("/api/owner/availability", {
      data: {
        timezone: "America/New_York",
        weeklyHours: [],
        blockedDates: [],
        bookingRules: {
          leadTimeMinutes: -1,
          maxAppointmentsPerSlot: 0,
          maxAppointmentsPerDay: 0,
          cancellationCutoffHours: 24
        }
      }
    });
    const payload = await invalidSettings.json();

    expect(invalidSettings.status()).toBe(400);
    expect(payload.error).toBe("Invalid availability settings.");

    await request.post("/api/owner/auth/logout", {
      headers: {
        "content-type": "application/json"
      }
    });
  });

  test("owner customers page is protected and responsive", async ({ page }) => {
    await page.goto("/owner/customers");
    await expect(page).toHaveURL(/\/owner\/login/);

    await page.getByLabel("Email").fill(process.env.OWNER_EMAIL || "owner@alizstudio.test");
    await page.getByLabel("Password", { exact: true }).fill(
      process.env.OWNER_PASSWORD || "local-owner-password-for-tests"
    );
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/owner\/dashboard/);
    await page.goto("/owner/customers");
    await expect(page.getByRole("heading", { name: /review customers/i })).toBeVisible();
    await expect(page.getByRole("region", { name: "Owner customer records" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Services" })).toHaveAttribute("href", "/owner/services");
    await expect(page.getByRole("link", { name: "Availability" })).toHaveAttribute(
      "href",
      "/owner/availability"
    );
    await expect(page.getByText("Marcus Reed")).toBeVisible();

    if (test.info().project.name.includes("mobile")) {
      for (const width of [320, 375, 390, 414, 430]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto("/owner/customers");

        const overflow = await page.evaluate(() => {
          const documentWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);

          return documentWidth - window.innerWidth;
        });

        expect(overflow, `owner customers should not overflow at ${width}px`).toBeLessThanOrEqual(1);
      }
    }
  });

  test("owner can search customer records, view history, and save private notes", async ({ page }) => {
    test.skip(
      test.info().project.name.includes("mobile"),
      "Shared file-backed customer profile mutation is covered in the desktop project."
    );

    await page.goto("/owner/login");
    await page.getByLabel("Email").fill(process.env.OWNER_EMAIL || "owner@alizstudio.test");
    await page.getByLabel("Password", { exact: true }).fill(
      process.env.OWNER_PASSWORD || "local-owner-password-for-tests"
    );
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/owner\/dashboard/);
    await page.goto("/owner/customers");
    await expect(page.getByRole("heading", { name: /review customers/i })).toBeVisible();

    await page.getByPlaceholder("Search name, phone, or email").fill("0140131");
    const customerCard = page.locator(".customer-record-card").filter({ hasText: "Marcus Reed" }).first();

    await expect(customerCard).toBeVisible();
    await expect(customerCard.getByText("(555) 014-0131")).toBeVisible();
    await customerCard.getByRole("button", { name: "View history" }).click();

    const detail = page.getByRole("dialog", { name: "Marcus Reed" });

    await expect(detail).toBeVisible();
    await expect(detail.getByText("marcus@example.com")).toBeVisible();
    await expect(detail.getByLabel("Appointment history").getByText("Deluxe Cut")).toBeVisible();
    await expect(detail.getByText("Appointment timeline")).toBeVisible();

    await detail.getByRole("button", { name: "VIP" }).click();
    await detail.getByLabel("Preferred cut").fill("Low taper with beard balance");
    await detail.getByLabel("Preferred time window").fill("Late afternoon");
    await detail.getByLabel("Owner notes").fill("Prefers a quiet chair and a clean beard line.");
    await detail.getByLabel("Sensitive owner note").fill("Owner-only demo reminder.");
    await detail.getByRole("button", { name: "Save customer notes" }).click();

    await expect(page.getByText("Marcus Reed saved.")).toBeVisible();
    await detail.getByRole("button", { name: "Close", exact: true }).click();
    await customerCard.getByRole("button", { name: "View history" }).click();

    const reopenedDetail = page.getByRole("dialog", { name: "Marcus Reed" });

    await expect(reopenedDetail.getByLabel("Preferred cut")).toHaveValue("Low taper with beard balance");
    await expect(reopenedDetail.getByLabel("Owner notes")).toHaveValue(
      "Prefers a quiet chair and a clean beard line."
    );
    await expect(reopenedDetail.getByRole("button", { name: "VIP" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  test("owner customer profile endpoint requires auth and rejects invalid tags", async ({ request }) => {
    const unauthorized = await request.patch("/api/owner/customers/cus_missing", {
      data: {
        ownerNotes: "Not allowed."
      }
    });

    expect(unauthorized.status()).toBe(401);

    const login = await request.post("/api/owner/auth/login", {
      headers: {
        "content-type": "application/json"
      },
      data: {
        email: process.env.OWNER_EMAIL || "owner@alizstudio.test",
        password: process.env.OWNER_PASSWORD || "local-owner-password-for-tests"
      }
    });

    expect(login.status()).toBe(200);

    const invalidProfile = await request.patch("/api/owner/customers/cus_missing", {
      data: {
        tags: ["not_a_real_tag"]
      }
    });
    const payload = await invalidProfile.json();

    expect(invalidProfile.status()).toBe(400);
    expect(payload.error).toBe("Invalid customer profile update.");

    await request.post("/api/owner/auth/logout", {
      headers: {
        "content-type": "application/json"
      }
    });
  });

  test("owner appointment mutation requires auth and rejects invalid status", async ({ request }) => {
    const unauthorized = await request.patch("/api/owner/appointments/apt_seed_101", {
      data: {
        status: "confirmed"
      }
    });

    expect(unauthorized.status()).toBe(401);

    const login = await request.post("/api/owner/auth/login", {
      headers: {
        "content-type": "application/json"
      },
      data: {
        email: process.env.OWNER_EMAIL || "owner@alizstudio.test",
        password: process.env.OWNER_PASSWORD || "local-owner-password-for-tests"
      }
    });

    expect(login.status()).toBe(200);

    const invalidStatus = await request.patch("/api/owner/appointments/apt_seed_101", {
      data: {
        status: "archived"
      }
    });
    const payload = await invalidStatus.json();

    expect(invalidStatus.status()).toBe(400);
    expect(payload.error).toBe("Invalid appointment update.");

    await request.post("/api/owner/auth/logout", {
      headers: {
        "content-type": "application/json"
      }
    });
  });

  test("owner login rejects invalid credentials with a friendly error", async ({ page }) => {
    await page.goto("/owner/login");

    await page.getByLabel("Email").fill("not-owner@example.com");
    await page.getByLabel("Password", { exact: true }).fill("wrong-password");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/owner\/login/);
    await expect(page.getByText("Invalid owner login. Check the owner email and password.")).toBeVisible();
  });

  test("owner login shows credential fields when there is no active session", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/owner/login");

    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("owner can log out and dashboard requires login again", async ({ page }) => {
    await page.goto("/owner/login");

    await page.getByLabel("Email").fill(process.env.OWNER_EMAIL || "owner@alizstudio.test");
    await page.getByLabel("Password", { exact: true }).fill(
      process.env.OWNER_PASSWORD || "local-owner-password-for-tests"
    );
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/owner\/dashboard/);
    await page.goto("/owner/login");
    await expect(page).toHaveURL(/\/owner\/dashboard/);

    await page.getByRole("button", { name: "Log out" }).click();

    await expect(page).toHaveURL(/\/owner\/login/);
    await expect(page.getByText("You have been logged out. Sign in again to continue.")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();

    await page.goto("/owner/dashboard");

    await expect(page).toHaveURL(/\/owner\/login/);
  });

  test("owner login password visibility toggle is accessible", async ({ page }) => {
    await page.goto("/owner/login");

    const passwordInput = page.getByLabel("Password", { exact: true });
    const showPassword = page.getByRole("button", { name: "Show password" });

    await expect(passwordInput).toHaveAttribute("type", "password");
    await expect(passwordInput).toHaveAttribute("autocomplete", "current-password");

    await showPassword.click();

    await expect(passwordInput).toHaveAttribute("type", "text");
    await expect(page.getByRole("button", { name: "Hide password" })).toBeVisible();
  });

  test("owner login API accepts normalized email and exact password", async ({ request }) => {
    const email = (process.env.OWNER_EMAIL || "owner@alizstudio.test").trim().replace(/^['"]|['"]$/g, "");
    const password = process.env.OWNER_PASSWORD || "local-owner-password-for-tests";

    const response = await request.post("/api/owner/auth/login", {
      headers: {
        "content-type": "application/json"
      },
      data: {
        email: ` ${email.toUpperCase()} `,
        password
      }
    });

    expect(response.status()).toBe(200);

    await request.post("/api/owner/auth/logout", {
      headers: {
        "content-type": "application/json"
      }
    });
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

  test("brand assets, app icons, and manifest are wired", async ({ page, request }) => {
    await page.goto("/");

    await expect(page.getByRole("banner").getByRole("link", { name: "Aliz Studio home" })).toBeVisible();
    await expect(page.locator(".brand-mark img:visible").first()).toBeVisible();

    const manifestResponse = await request.get("/manifest.webmanifest");
    expect(manifestResponse.status()).toBe(200);

    const manifest = await manifestResponse.json();
    expect(manifest).toEqual(
      expect.objectContaining({
        name: "Aliz Studio",
        short_name: "Aliz",
        start_url: "/",
        display: "standalone",
        background_color: "#f7f3ec",
        theme_color: "#11100f"
      })
    );
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: "/icons/icon-192.png", sizes: "192x192" }),
        expect.objectContaining({ src: "/icons/icon-512.png", sizes: "512x512" })
      ])
    );

    for (const assetPath of [
      "/icon.svg",
      "/brand/aliz-studio-logo-dark.png",
      "/brand/aliz-studio-logo-light.png",
      "/brand/aliz-mark-dark.png",
      "/brand/aliz-mark-light.png",
      "/brand/aliz-studio-logo-dark.svg",
      "/brand/aliz-studio-logo-light.svg",
      "/brand/aliz-mark-dark.svg",
      "/brand/aliz-mark-light.svg",
      "/icons/icon-192.png",
      "/icons/icon-512.png",
      "/icons/apple-touch-icon.png"
    ]) {
      const response = await request.get(assetPath);

      expect(response.status(), `${assetPath} should be available`).toBe(200);
    }

    for (const assetPath of [
      "public/brand/aliz-studio-logo-dark.png",
      "public/brand/aliz-studio-logo-light.png",
      "public/brand/aliz-mark-dark.png",
      "public/brand/aliz-mark-light.png"
    ]) {
      await expect(pngHasAlphaChannel(path.join(process.cwd(), assetPath))).resolves.toBeTruthy();
    }
  });

  test("theme toggle switches to persisted night theme and uses light logo assets", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await page.getByRole("button", { name: "Switch to night theme" }).click();

    await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
    await expect(page.getByRole("button", { name: "Switch to light theme" })).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.localStorage.getItem("aliz-theme"))).toBe("night");

    const visibleLogoSrc = await page.locator(".brand-mark img:visible").first().getAttribute("src");
    const paperToken = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--paper").trim()
    );

    expect(visibleLogoSrc).toContain("light");
    expect(paperToken).toBe("#0b0b0b");

    await page.reload();

    await expect(page.locator("html")).toHaveAttribute("data-theme", "night");

    await page.goto("/book");

    await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
    await expect(page.getByText("Select one package to update the summary")).toBeVisible();
  });

  test("mobile header stays compact and uses the right logo for each theme", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/book");
    await page.evaluate(() => {
      window.localStorage.removeItem("aliz-theme");
    });
    await page.reload();

    const headerBox = await page.locator(".site-header").boundingBox();
    const toggleBox = await page.getByRole("button", { name: "Switch to night theme" }).boundingBox();
    const bookingShellBox = await page.locator(".booking-shell").boundingBox();
    const lightLogoSources = await page
      .locator(".brand-mark img:visible")
      .evaluateAll((images) => images.map((image) => image.getAttribute("src") || ""));

    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    expect(headerBox?.height, "mobile header should stay compact").toBeLessThanOrEqual(112);
    expect(toggleBox?.height, "mobile theme toggle should not dominate the header").toBeLessThanOrEqual(42);
    expect(toggleBox?.width, "mobile theme toggle should be icon-sized").toBeLessThanOrEqual(42);
    expect(bookingShellBox?.y, "booking form should start within the first mobile viewport").toBeLessThanOrEqual(
      620
    );
    expect(lightLogoSources).toHaveLength(1);
    expect(lightLogoSources[0]).toContain("aliz-mark-dark");

    await page.getByRole("button", { name: "Switch to night theme" }).click();

    const nightLogoSources = await page
      .locator(".brand-mark img:visible")
      .evaluateAll((images) => images.map((image) => image.getAttribute("src") || ""));

    await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
    await expect(page.getByRole("button", { name: "Switch to light theme" })).toBeVisible();
    expect(nightLogoSources).toHaveLength(1);
    expect(nightLogoSources[0]).toContain("aliz-mark-light");

    await page.reload();

    await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
    await expect(page.getByRole("button", { name: "Switch to light theme" })).toBeVisible();
  });

  test("footer and owner login logos expose only the theme-appropriate variant", async ({ page }) => {
    await page.goto("/owner/login");
    await page.evaluate(() => {
      window.localStorage.removeItem("aliz-theme");
    });
    await page.reload();

    const lightOwnerLogos = await page
      .locator(".owner-login-card__brand img:visible")
      .evaluateAll((images) => images.map((image) => image.getAttribute("src") || ""));

    expect(lightOwnerLogos).toHaveLength(1);
    expect(lightOwnerLogos[0]).toContain("aliz-studio-logo-dark");

    await page.goto("/");
    await page.locator(".site-footer").scrollIntoViewIfNeeded();

    const footer = page.locator(".site-footer");
    const lightFooterBackground = await footer.evaluate((element) => getComputedStyle(element).backgroundImage);
    const lightFooterRadius = await footer.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).borderTopLeftRadius)
    );
    const lightFooterLogos = await page
      .locator(".footer-brand img:visible")
      .evaluateAll((images) => images.map((image) => image.getAttribute("src") || ""));

    await expect(footer.getByRole("link", { name: "Packages" })).toHaveAttribute("href", "/packages");
    await expect(footer.getByRole("link", { name: "Book Online" })).toHaveAttribute("href", "/book");
    expect(lightFooterBackground, "footer should use a premium surface gradient").toContain("linear-gradient");
    expect(lightFooterRadius, "footer should read as a refined brand surface").toBeGreaterThanOrEqual(12);
    expect(lightFooterLogos).toHaveLength(1);
    expect(lightFooterLogos[0]).toContain("aliz-studio-logo-dark");

    await page.getByRole("button", { name: "Switch to night theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
    await page.locator(".site-footer").scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);

    const nightFooterLogos = await page
      .locator(".footer-brand img:visible")
      .evaluateAll((images) => images.map((image) => image.getAttribute("src") || ""));
    const nightFooterLinkColor = await footer
      .getByRole("link", { name: "Packages" })
      .evaluate((element) => getComputedStyle(element).color);

    expect(nightFooterLogos).toHaveLength(1);
    expect(nightFooterLogos[0]).toContain("aliz-studio-logo-light");
    expectReadableImageCardTextColor(nightFooterLinkColor, "night footer package link");

    await page.goto("/owner/login");

    const nightOwnerLogos = await page
      .locator(".owner-login-card__brand img:visible")
      .evaluateAll((images) => images.map((image) => image.getAttribute("src") || ""));

    expect(nightOwnerLogos).toHaveLength(1);
    expect(nightOwnerLogos[0]).toContain("aliz-studio-logo-light");
  });

  test("desktop owner detail drawer uses premium controls and smooth system typography", async ({ page }) => {
    await page.setViewportSize({ width: 1365, height: 900 });
    await page.goto("/owner/login");
    await page.getByLabel("Email").fill(process.env.OWNER_EMAIL || "owner@alizstudio.test");
    await page.getByLabel("Password", { exact: true }).fill(
      process.env.OWNER_PASSWORD || "local-owner-password-for-tests"
    );
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/owner\/dashboard/);

    const firstAppointmentCard = page.locator(".appointment-card").first();
    const detailButton = firstAppointmentCard.getByRole("button", { name: "View details" });

    await expect(firstAppointmentCard).toBeVisible();
    await detailButton.scrollIntoViewIfNeeded();
    await detailButton.click();

    const detail = page.getByRole("dialog");
    const statusSelect = detail.getByLabel("Appointment status");
    const paymentSelect = detail.getByLabel("Payment status");
    await expect(detail).toBeVisible();
    const drawerBox = await detail.boundingBox();
    const bodyFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    const fontSmoothing = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("-webkit-font-smoothing")
    );
    const drawerBackground = await detail.evaluate((element) => getComputedStyle(element).backgroundColor);
    const drawerShadow = await detail.evaluate((element) => getComputedStyle(element).boxShadow);
    const drawerRadius = await detail.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).borderTopLeftRadius)
    );
    const headingStyles = await detail.getByRole("heading").evaluate((element) => {
      const styles = getComputedStyle(element);

      return {
        color: styles.color,
        fontWeight: Number.parseFloat(styles.fontWeight),
        letterSpacing: styles.letterSpacing,
        lineHeight: Number.parseFloat(styles.lineHeight)
      };
    });
    const statLabelStyles = await detail.locator(".appointment-detail-stat p").first().evaluate((element) => {
      const styles = getComputedStyle(element);

      return {
        color: styles.color,
        fontWeight: Number.parseFloat(styles.fontWeight),
        letterSpacing: styles.letterSpacing
      };
    });
    const contactValueWeight = await detail
      .locator(".appointment-detail-list dd")
      .first()
      .evaluate((element) => Number.parseFloat(getComputedStyle(element).fontWeight));
    const selectBackgroundImage = await statusSelect.evaluate(
      (element) => getComputedStyle(element).backgroundImage
    );
    const selectHeight = await statusSelect.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).minHeight)
    );
    const selectAppearance = await statusSelect.evaluate((element) =>
      getComputedStyle(element).getPropertyValue("appearance") ||
      getComputedStyle(element).getPropertyValue("-webkit-appearance")
    );
    const overflow = await page.evaluate(() => {
      const documentWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);

      return documentWidth - window.innerWidth;
    });

    if (!drawerBox) {
      throw new Error("Appointment detail drawer should be measurable");
    }

    await expect(detail.getByRole("heading")).toBeVisible();
    await expect(detail.locator(".appointment-detail-stat")).toHaveCount(3);
    await expect(detail.getByText("Phone")).toBeVisible();
    await expect(detail.getByText("Customer notes")).toBeVisible();
    await expect(statusSelect).toBeVisible();
    await expect(paymentSelect).toBeVisible();
    await expect(detail.getByRole("button", { name: "Save detail changes" })).toBeVisible();
    expect(bodyFont).toContain("Segoe UI");
    expect(fontSmoothing).toBe("antialiased");
    expect(drawerBox.width, "desktop detail drawer should have a refined wide layout").toBeGreaterThan(760);
    expect(parseRgbColor(drawerBackground).red, "drawer should not be raw/default white").toBeLessThan(255);
    expect(drawerShadow, "drawer should have a premium shadow").not.toBe("none");
    expect(drawerRadius, "drawer should have a softer premium radius").toBeGreaterThanOrEqual(16);
    expect(parseRgbColor(headingStyles.color).red, "drawer heading should use softer near-black, not pure black").toBeGreaterThan(25);
    expect(headingStyles.fontWeight, "drawer heading should stay strong without extra-heavy weight").toBeLessThanOrEqual(730);
    expect(["normal", "0px"], "drawer heading should avoid crunchy negative tracking").toContain(
      headingStyles.letterSpacing
    );
    expect(headingStyles.lineHeight, "drawer heading should breathe more than a tight display block").toBeGreaterThan(48);
    expect(statLabelStyles.fontWeight, "drawer labels should use medium/semi-bold weight").toBeLessThanOrEqual(700);
    expect(["normal", "0px"], "drawer labels should avoid sharp wide tracking").toContain(
      statLabelStyles.letterSpacing
    );
    expect(parseRgbColor(statLabelStyles.color).red, "drawer label color should be softened rather than pure black").toBeGreaterThan(80);
    expect(contactValueWeight, "drawer contact values should avoid bold-heavy rendering").toBeLessThanOrEqual(650);
    expect(selectBackgroundImage, "detail select should use the custom chevron background").toContain("svg");
    expect(selectHeight, "detail select should have comfortable desktop height").toBeGreaterThanOrEqual(52);
    expect(selectAppearance, "detail select should not use the browser default appearance").toContain("none");
    expect(overflow, "desktop appointment detail should not overflow horizontally").toBeLessThanOrEqual(1);
  });

  test("night theme keeps service card titles, prices, and metadata readable over images", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("aliz-theme", "night");
    });
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/");

    const deluxeCard = page.locator(".service-card").filter({ hasText: "Deluxe Cut" }).first();
    const titleColor = await deluxeCard
      .getByRole("heading", { name: "Deluxe Cut" })
      .evaluate((element) => getComputedStyle(element).color);
    const priceColor = await deluxeCard
      .locator(".service-price")
      .evaluate((element) => getComputedStyle(element).color);
    const durationColor = await deluxeCard
      .locator(".service-duration")
      .evaluate((element) => getComputedStyle(element).color);
    const ctaColor = await deluxeCard
      .getByRole("link", { name: "View package" })
      .evaluate((element) => getComputedStyle(element).color);
    const overlayToken = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--image-card-overlay").trim()
    );

    expectReadableImageCardTextColor(titleColor, "Deluxe Cut title");
    expectReadableImageCardTextColor(priceColor, "Deluxe Cut price");
    expectReadableImageCardTextColor(durationColor, "Deluxe Cut duration");
    expect(parseRgbColor(ctaColor).red, "Night card CTA should use dark text on gold").toBeLessThanOrEqual(
      20
    );
    expect(overlayToken).toMatch(/rgba\(0, 0, 0|#000000/);
  });

  test("night theme booking selections use gold styling without default blue states", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("aliz-theme", "night");
    });
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/book?service=basic-cut");

    const plusCut = page.getByRole("button", { name: /Plus Cut/ });
    await plusCut.click();
    const selectedDate = page.locator(".calendar-day[aria-pressed='true']").first();
    const openSlot = page.locator(".slot-button:not(:disabled)").first();
    await openSlot.click();

    const selectedServiceBorder = await plusCut.evaluate((element) => getComputedStyle(element).borderTopColor);
    const selectedDateBorder = await selectedDate.evaluate((element) => getComputedStyle(element).borderTopColor);
    const selectedSlotBorder = await openSlot.evaluate((element) => getComputedStyle(element).borderTopColor);
    const selectedSlotTextColor = await openSlot.evaluate((element) => getComputedStyle(element).color);
    const tapHighlight = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("-webkit-tap-highlight-color")
    );

    await page.getByLabel("Full name").focus();
    const focusedInputBorder = await page
      .getByLabel("Full name")
      .evaluate((element) => getComputedStyle(element).borderTopColor);

    for (const [label, color] of [
      ["selected service border", selectedServiceBorder],
      ["selected date border", selectedDateBorder],
      ["selected slot border", selectedSlotBorder],
      ["focused input border", focusedInputBorder],
      ["tap highlight", tapHighlight]
    ] as const) {
      expectNotBrowserBlue(color, label);
      expect(parseRgbColor(color).red, `${label} should carry warm gold/neutral styling`).toBeGreaterThanOrEqual(
        180
      );
    }

    expectReadableImageCardTextColor(selectedSlotTextColor, "selected slot text");
  });

  test("desktop booking layout gives time slots generous room", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("aliz-theme", "night");
    });
    await page.setViewportSize({ width: 1365, height: 920 });
    await page.goto("/book?service=deluxe-cut");

    const shellBox = await page.locator(".booking-shell").boundingBox();
    const timePanelBox = await page.locator(".booking-panel--times").boundingBox();
    const summaryBox = await page.locator(".booking-summary").boundingBox();
    const renderedSlotColumns = await page
      .locator(".slot-list")
      .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").filter(Boolean).length);
    const slotMetrics = await page.locator(".slot-button:not(:disabled)").evaluateAll((buttons) =>
      buttons.map((button) => {
        const rect = button.getBoundingClientRect();
        const styles = getComputedStyle(button);

        return {
          borderColor: styles.borderTopColor,
          height: rect.height,
          width: rect.width
        };
      })
    );
    const overflow = await page.evaluate(() => {
      const documentWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);

      return documentWidth - window.innerWidth;
    });

    if (!shellBox || !timePanelBox || !summaryBox) {
      throw new Error("Booking layout regions should be visible on desktop");
    }

    expect(shellBox.width, "desktop booking shell should use the available viewport").toBeGreaterThanOrEqual(
      1260
    );
    expect(timePanelBox.width, "time selection panel should no longer be a narrow side column").toBeGreaterThanOrEqual(
      520
    );
    expect(summaryBox.x, "summary should remain the right-hand rail on desktop").toBeGreaterThan(timePanelBox.x);
    expect(renderedSlotColumns, "desktop time slots should render in a roomy two-column grid").toBeGreaterThanOrEqual(
      2
    );
    expect(slotMetrics.length).toBeGreaterThan(0);
    expect(
      Math.min(...slotMetrics.map((metric) => metric.width)),
      "each desktop time slot should remain readable"
    ).toBeGreaterThanOrEqual(240);
    expect(
      Math.min(...slotMetrics.map((metric) => metric.height)),
      "time slots should keep comfortable tap/click height"
    ).toBeGreaterThanOrEqual(68);
    expect(overflow, "desktop booking layout should not overflow horizontally").toBeLessThanOrEqual(1);

    const openSlot = page.locator(".slot-button:not(:disabled)").first();
    await openSlot.click();
    const selectedSlotBorder = await openSlot.evaluate((element) => getComputedStyle(element).borderTopColor);

    expectNotBrowserBlue(selectedSlotBorder, "desktop selected slot border");
    expect(
      parseRgbColor(selectedSlotBorder).red,
      "desktop selected slot should keep the warm gold selection treatment"
    ).toBeGreaterThanOrEqual(180);
  });

  test("night theme keeps mock payment cards and booking helper text readable", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("aliz-theme", "night");
    });
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/book?service=deluxe-cut");

    const expectedPaymentLabels = [
      "Credit or debit",
      "Mobile wallet mock",
      "Google Pay style mock",
      "Apple Pay style mock",
      "Square-style demo",
      "Manual deposit placeholder"
    ];
    const creditCardLogo = page.locator(".payment-logo").filter({ hasText: "Credit or debit" }).first();
    const paymentTextColor = await creditCardLogo.evaluate((element) => getComputedStyle(element).color);
    const paymentBackground = await creditCardLogo.evaluate(
      (element) => getComputedStyle(element).backgroundColor
    );
    const paymentBackgroundImage = await creditCardLogo.evaluate(
      (element) => getComputedStyle(element).backgroundImage
    );
    const paymentBorder = await creditCardLogo.evaluate((element) => getComputedStyle(element).borderTopColor);
    const paymentIconColor = await creditCardLogo
      .locator(".payment-logo__icon")
      .evaluate((element) => getComputedStyle(element).color);
    const phoneHelpColor = await page
      .locator("#booking-phone-help")
      .evaluate((element) => getComputedStyle(element).color);
    const notesPlaceholderColor = await page
      .getByLabel("Notes")
      .evaluate((element) => getComputedStyle(element, "::placeholder").color);
    const disabledContinueButton = page.getByRole("button", { name: /continue to mock deposit/i });
    const disabledButtonColor = await disabledContinueButton.evaluate(
      (element) => getComputedStyle(element).color
    );
    const disabledButtonBackground = await disabledContinueButton.evaluate(
      (element) => getComputedStyle(element).backgroundColor
    );

    for (const label of expectedPaymentLabels) {
      const tile = page.locator(".payment-logo").filter({ hasText: label }).first();

      await expect(tile).toBeVisible();
      await expect(tile.locator(".payment-logo__text")).toBeVisible();
    }

    expectReadableImageCardTextColor(paymentTextColor, "payment card text");
    expectReadableImageCardTextColor(paymentIconColor, "payment card icon");
    expectReadableImageCardTextColor(phoneHelpColor, "phone helper text");
    expectReadableImageCardTextColor(notesPlaceholderColor, "notes placeholder text");
    expect(parseRgbColor(paymentBackground).red, "payment card background should stay dark").toBeLessThanOrEqual(
      35
    );
    expect(paymentBackgroundImage, "payment card should have the dark/gold tile gradient").toContain(
      "linear-gradient"
    );
    expectNotBrowserBlue(paymentBorder, "payment card border");
    expectReadableImageCardTextColor(disabledButtonColor, "disabled continue button text");
    expect(
      parseRgbColor(disabledButtonBackground).red,
      "disabled continue button background should stay dark in night theme"
    ).toBeLessThanOrEqual(35);
  });

  test("night theme keeps key mobile routes free of horizontal overflow", async ({ page }) => {
    const widths = [320, 375, 390, 414, 430];
    const routes = ["/", "/book", "/owner/login"];

    await page.addInitScript(() => {
      window.localStorage.setItem("aliz-theme", "night");
    });

    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });

      for (const route of routes) {
        await page.goto(route);

        const overflow = await page.evaluate(() => {
          const documentWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);

          return documentWidth - window.innerWidth;
        });

        await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
        await expect(page.getByRole("banner").getByRole("link", { name: "Aliz Studio home" })).toBeVisible();
        expect(overflow, `${route} at ${width}px in night theme should not overflow`).toBeLessThanOrEqual(
          1
        );
      }
    }
  });

  test("owner login and dashboard remain usable in night theme", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("aliz-theme", "night");
    });

    await page.goto("/owner/login");

    await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
    await page.getByLabel("Email").fill(process.env.OWNER_EMAIL || "owner@alizstudio.test");
    await page.getByLabel("Password", { exact: true }).fill(
      process.env.OWNER_PASSWORD || "local-owner-password-for-tests"
    );
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/owner\/dashboard/);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
    await expect(page.getByRole("heading", { name: /manage bookings/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
  });

  test("owner appointment detail remains readable in night theme on mobile", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("aliz-theme", "night");
    });
    await page.setViewportSize({ width: 390, height: 900 });

    await page.goto("/owner/login");
    await page.getByLabel("Email").fill(process.env.OWNER_EMAIL || "owner@alizstudio.test");
    await page.getByLabel("Password", { exact: true }).fill(
      process.env.OWNER_PASSWORD || "local-owner-password-for-tests"
    );
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/owner\/dashboard/);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "night");

    const firstAppointmentCard = page.locator(".appointment-card").filter({ hasText: "Marcus Reed" }).first();
    const detailButton = firstAppointmentCard.getByRole("button", { name: "View details" });

    await expect(firstAppointmentCard).toBeVisible();
    await detailButton.scrollIntoViewIfNeeded();
    await expect(detailButton).toBeVisible();
    await detailButton.click({ force: true });

    const detail = page.getByRole("dialog");
    const detailStatusBadge = detail.locator(".status-badge").first();

    await expect(detail).toBeVisible();
    await expect(detailStatusBadge).toBeVisible();
    await expect(detail.locator(".appointment-detail-stat")).toHaveCount(3);

    const badgeColor = await detail
      .locator(".status-badge")
      .first()
      .evaluate((element) => getComputedStyle(element).color);
    const drawerBackground = await detail.evaluate((element) => getComputedStyle(element).backgroundColor);
    const statBackground = await detail
      .locator(".appointment-detail-stat")
      .first()
      .evaluate((element) => getComputedStyle(element).backgroundColor);
    const contactCardBackground = await detail
      .locator(".appointment-detail-list div")
      .first()
      .evaluate((element) => getComputedStyle(element).backgroundColor);
    const noteCardBorder = await detail
      .locator(".appointment-detail-note-grid article")
      .first()
      .evaluate((element) => getComputedStyle(element).borderTopColor);
    const overflow = await page.evaluate(() => {
      const documentWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);

      return documentWidth - window.innerWidth;
    });

    await expect(detail.getByText(/demo\/mock deposit record only/i)).toBeVisible();
    expectReadableImageCardTextColor(badgeColor, "night appointment detail status badge");
    expect(parseRgbColor(drawerBackground).red, "night detail drawer should stay dark").toBeLessThanOrEqual(
      35
    );
    expect(parseRgbColor(statBackground).red, "night detail stat card should stay dark").toBeLessThanOrEqual(
      35
    );
    expect(
      parseRgbColor(contactCardBackground).red,
      "night detail contact card should stay dark"
    ).toBeLessThanOrEqual(35);
    expectNotBrowserBlue(noteCardBorder, "night detail note card border");
    expect(overflow, "night appointment detail should not overflow horizontally").toBeLessThanOrEqual(1);
  });

  test("generated source asset names are archived and not referenced by app code", async ({ page }) => {
    const publicRootNames = await readdir(path.join(process.cwd(), "public"));
    const sourceNames = await readdir(path.join(process.cwd(), "public", "brand", "source"));
    const codeFiles = (
      await Promise.all(
        ["app", "components", "lib"].map((folder) => listFiles(path.join(process.cwd(), folder)))
      )
    ).flat();

    expect(publicRootNames.filter((name) => name.startsWith("ChatGPT Image"))).toEqual([]);
    expect(sourceNames).toEqual(
      expect.arrayContaining(["aliz-studio-source-01.png", "aliz-mark-source-01.png"])
    );

    for (const sourceName of sourceNames) {
      expect(sourceName).toMatch(/^aliz-(studio|mark)-source-\d{2}\.png$/);
    }

    for (const filePath of codeFiles) {
      const content = await readFile(filePath, "utf8");

      expect(content, `${filePath} should not reference messy generated source names`).not.toContain(
        "ChatGPT Image"
      );
    }

    await page.goto("/");
    await expect(page.getByText(/ChatGPT Image/i)).toHaveCount(0);
  });

  test("install app card is visible in normal browser mode", async ({ page }) => {
    await page.goto("/");

    const installCard = page.getByRole("region", { name: "Install Aliz Studio app" });

    await expect(installCard).toBeVisible();
    await expect(installCard.getByRole("heading", { name: /keep aliz studio one tap away/i })).toBeVisible();
    await expect(installCard.getByText(/No real payments or notifications are enabled/i)).toBeVisible();
  });

  test("install app card is hidden in standalone display mode", async ({ page }) => {
    await page.addInitScript(() => {
      window.matchMedia = ((query: string) => ({
        matches: query === "(display-mode: standalone)",
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false
      })) as typeof window.matchMedia;
      Object.defineProperty(navigator, "standalone", {
        configurable: true,
        value: true
      });
    });

    await page.goto("/");

    await expect(page.getByRole("region", { name: "Install Aliz Studio app" })).toHaveCount(0);
  });

  test("install app card shows iOS manual add-to-home-screen instructions", async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: "http://127.0.0.1:3000",
      hasTouch: true,
      isMobile: true,
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      viewport: { width: 390, height: 844 }
    });
    const page = await context.newPage();

    await page.goto("/");

    const installCard = page.getByRole("region", { name: "Install Aliz Studio app" });

    await expect(installCard).toBeVisible();
    await expect(installCard.getByText(/Tap the browser Share button/i)).toBeVisible();
    await expect(installCard.getByText(/Choose Add to Home Screen/i)).toBeVisible();

    await context.close();
  });

  test("public routes and footer inquiry links are reachable", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: "Home", exact: true })).toHaveAttribute("href", "/");
    await expect(page.getByRole("link", { name: "About" }).first()).toHaveAttribute("href", "/about");
    await expect(page.getByRole("link", { name: "Packages" }).first()).toHaveAttribute("href", "/packages");
    await expect(page.getByRole("link", { name: "Book Online" }).first()).toHaveAttribute("href", "/book");
    await expect(page.getByRole("link", { name: "Reserve" })).toHaveAttribute("href", "/book");
    await expect(page.getByRole("link", { name: "Owner" })).toHaveAttribute("href", "/owner/login");
    await expect(page.getByRole("link", { name: "Inquiries" })).toHaveAttribute(
      "href",
      "https://worldsoftwares.com"
    );

    await page.goto("/about");
    await expect(page.getByRole("heading", { name: /modern barbering/i })).toBeVisible();

    await page.goto("/packages");
    await expect(page.getByRole("heading", { name: /choose the cut that fits the moment/i })).toBeVisible();

    await page.goto("/book");
    await expect(page.getByText("Select one package to update the summary")).toBeVisible();

    await page.goto("/owner/login");
    await expect(page.getByRole("heading", { name: /appointment command center/i })).toBeVisible();
  });

  test("about page cards and booking CTA stay balanced across themes", async ({ page }) => {
    await page.setViewportSize({ width: 1365, height: 900 });
    await page.goto("/about");

    const appointmentCard = page.locator(".story-grid article").filter({ hasText: "Appointment First" });
    const appointmentHeading = page.getByRole("heading", { name: "Appointment First" });
    const cta = page.locator(".cta-band__action");
    const headingBox = await appointmentHeading.boundingBox();
    const cardBox = await appointmentCard.boundingBox();
    const ctaBox = await cta.boundingBox();
    const headingFontSize = await appointmentHeading.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize)
    );

    if (!headingBox || !cardBox || !ctaBox) {
      throw new Error("About card and CTA should be measurable");
    }

    await expect(appointmentHeading).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/book");
    expect(headingBox.width, "Appointment First heading should stay inside its card").toBeLessThanOrEqual(
      cardBox.width - 24
    );
    expect(headingFontSize, "story card headings should not inherit oversized page h2 styling").toBeLessThanOrEqual(
      38
    );
    expect(ctaBox.width, "Book Online CTA should read as a premium pill, not a tiny circle").toBeGreaterThan(
      ctaBox.height * 2.4
    );

    await page.evaluate(() => {
      window.localStorage.setItem("aliz-theme", "night");
      document.documentElement.dataset.theme = "night";
      document.documentElement.style.colorScheme = "dark";
    });
    const nightCtaBackground = await cta.evaluate((element) => getComputedStyle(element).backgroundImage);

    expect(nightCtaBackground).toContain("linear-gradient");

    await page.setViewportSize({ width: 390, height: 900 });
    await page.reload();

    const mobileOverflow = await page.evaluate(() => {
      const documentWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);

      return documentWidth - window.innerWidth;
    });
    const mobileCtaBox = await cta.boundingBox();

    if (!mobileCtaBox) {
      throw new Error("Mobile CTA should be measurable");
    }

    await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
    await expect(appointmentHeading).toBeVisible();
    await expect(cta).toBeVisible();
    expect(mobileOverflow, "about page CTA/cards should not overflow on mobile").toBeLessThanOrEqual(1);
    expect(mobileCtaBox.width, "mobile CTA should keep a comfortable full-width touch target").toBeGreaterThan(
      300
    );

    await cta.click();
    await expect(page).toHaveURL(/\/book/);
  });

  test("packages page compares every package and routes into booking", async ({ page }) => {
    const expectedPackages = [
      "Basic Cut",
      "Plus Cut",
      "Deluxe Cut",
      "Kids Cut",
      "Shape Up",
      "Beard Trim",
      "Eyebrows"
    ];

    await page.goto("/");
    await page.getByRole("banner").getByRole("link", { name: "Packages" }).click();
    await expect(page).toHaveURL(/\/packages/);
    await expect(page.getByRole("heading", { name: /choose the cut that fits the moment/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /book a package/i })).toHaveAttribute("href", "/book");
    await expect(page.getByRole("link", { name: /compare packages/i })).toHaveAttribute(
      "href",
      "#compare-packages"
    );
    await expect(page.getByText(/mock deposit language until production payments are connected/i)).toBeVisible();

    const packageCards = page.locator(".package-card");
    await expect(packageCards).toHaveCount(7);

    for (const packageName of expectedPackages) {
      const card = packageCards.filter({ hasText: packageName }).first();

      await expect(card).toBeVisible();
      await expect(card.getByRole("heading", { name: packageName })).toBeVisible();
      await expect(card.getByText("Price")).toBeVisible();
      await expect(card.getByText("Duration")).toBeVisible();
      await expect(card.getByText("Deposit")).toBeVisible();
      await expect(card.getByText("Best for")).toBeVisible();
      await expect(card.getByText("Includes")).toBeVisible();
      await expect(card.getByRole("link", { name: /^Book / })).toHaveAttribute("href", /\/book\?service=/);
      await expect(card.getByRole("link", { name: "View details" })).toHaveAttribute("href", /\/services\//);
    }

    const deluxeCard = packageCards.filter({ hasText: "Deluxe Cut" }).first();
    await expect(deluxeCard.locator(".package-card__badge")).toHaveText("Signature");

    await page.addInitScript(() => {
      window.localStorage.setItem("aliz-theme", "night");
    });
    await page.reload();

    await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
    const cardBackground = await deluxeCard.evaluate((element) => getComputedStyle(element).backgroundColor);
    const cardBorder = await deluxeCard.evaluate((element) => getComputedStyle(element).borderTopColor);

    expect(parseRgbColor(cardBackground).red, "night package cards should stay dark").toBeLessThanOrEqual(35);
    expectNotBrowserBlue(cardBorder, "night package card border");

    await deluxeCard.getByRole("link", { name: "Book Deluxe" }).click();
    await expect(page).toHaveURL(/\/book\?service=deluxe-cut/);
    await expect(page.getByRole("heading", { name: "Deluxe Cut" })).toBeVisible();
  });

  test("mobile public routes do not create horizontal overflow", async ({ page }) => {
    const widths = [320, 375, 390, 414, 430];
    const routes = ["/", "/about", "/packages", "/book", "/services/basic-cut", "/owner/login"];

    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });

      for (const route of routes) {
        await page.goto(route);

        const overflow = await page.evaluate(() => {
          const documentWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);

          return documentWidth - window.innerWidth;
        });

        expect(overflow, `${route} at ${width}px should not overflow horizontally`).toBeLessThanOrEqual(1);
      }
    }
  });

  test("owner login desktop layout does not create horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/owner/login");

    const overflow = await page.evaluate(() => {
      const documentWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);

      return documentWidth - window.innerWidth;
    });

    await expect(page.getByRole("heading", { name: /appointment command center/i })).toBeVisible();
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("owner dashboard logout is visible across mobile widths", async ({ page }) => {
    const widths = [320, 375, 390, 414, 430];

    await page.goto("/owner/login");
    await page.getByLabel("Email").fill(process.env.OWNER_EMAIL || "owner@alizstudio.test");
    await page.getByLabel("Password", { exact: true }).fill(
      process.env.OWNER_PASSWORD || "local-owner-password-for-tests"
    );
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/owner\/dashboard/);

    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/owner/dashboard");

      const overflow = await page.evaluate(() => {
        const documentWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);

        return documentWidth - window.innerWidth;
      });

      await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
      expect(overflow, `owner dashboard at ${width}px should not overflow horizontally`).toBeLessThanOrEqual(
        1
      );
    }
  });

  test("booking validation rejects non-US phone lengths clearly", async ({ page }) => {
    await page.goto("/book?service=basic-cut");

    await page.getByRole("button", { name: "12:30 PM" }).click();
    await page.getByLabel("Full name").fill("Jordan Price");
    await page.getByLabel("Email").fill("jordan@example.com");
    await page.getByLabel("Phone").fill("555123");
    await page.getByRole("button", { name: /continue to mock deposit/i }).click();

    await expect(page.getByText("Enter a 10-digit US phone number.")).toBeVisible();
    await expect(page).toHaveURL(/\/book/);
  });

  test("booking form fields expose mobile-friendly attributes and strip phone letters", async ({ page }) => {
    await page.goto("/book?service=basic-cut");

    const nameInput = page.getByLabel("Full name");
    await expect(nameInput).toHaveAttribute("autocomplete", "name");
    await expect(nameInput).toHaveAttribute("autocapitalize", "words");
    await expect(nameInput).toHaveAttribute("autocorrect", "on");

    const emailInput = page.getByLabel("Email");
    await expect(emailInput).toHaveAttribute("type", "email");
    await expect(emailInput).toHaveAttribute("autocomplete", "email");

    const phoneInput = page.getByLabel("Phone");
    await expect(phoneInput).toHaveAttribute("type", "tel");
    await expect(phoneInput).toHaveAttribute("inputmode", "tel");
    await expect(phoneInput).toHaveAttribute("autocomplete", "tel");

    await phoneInput.fill("abc555xyz0140199");

    await expect(phoneInput).toHaveValue("(555) 014-0199");
    await expect(page.getByText("No real card will be charged.")).toBeVisible();
  });
});
