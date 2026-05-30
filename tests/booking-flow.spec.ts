import { expect, test } from "@playwright/test";
import { readdir, readFile, rm } from "fs/promises";
import path from "path";
import { resolveFileAppointmentStoragePaths } from "../lib/repositories/file-appointment-repository";

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

test.describe("Aliz Studio booking foundation", () => {
  test.beforeAll(async () => {
    await rm(path.join(process.cwd(), "data", "appointments.json"), { force: true });
  });

  test("file appointment storage uses writable temp storage on Vercel", () => {
    expect(resolveFileAppointmentStoragePaths({}).dataDirectory).toBe(path.join(process.cwd(), "data"));

    const vercelPaths = resolveFileAppointmentStoragePaths({ VERCEL: "1" });

    expect(vercelPaths.dataDirectory).toBe("/tmp/aliz-studio-appointments");
    expect(vercelPaths.appointmentsFile).toBe("/tmp/aliz-studio-appointments/appointments.json");
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
    await expect(page.getByText("Marcus Reed")).toBeVisible();

    const ownerSeedCard = page.locator(".appointment-card").filter({ hasText: "Marcus Reed" }).first();
    await ownerSeedCard.getByLabel("Appointment status").selectOption("completed");
    await expect(ownerSeedCard.locator(".status-badge")).toHaveText("Completed");
    await ownerSeedCard.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("Appointment saved.")).toBeVisible();
  });

  test("owner login rejects invalid credentials with a friendly error", async ({ page }) => {
    await page.goto("/owner/login");

    await page.getByLabel("Email").fill("not-owner@example.com");
    await page.getByLabel("Password", { exact: true }).fill("wrong-password");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/owner\/login/);
    await expect(page.getByText("Invalid owner login. Check the owner email and password.")).toBeVisible();
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
    await expect(page.getByRole("link", { name: "Book Online" }).first()).toHaveAttribute("href", "/book");
    await expect(page.getByRole("link", { name: "Reserve" })).toHaveAttribute("href", "/book");
    await expect(page.getByRole("link", { name: "Owner" })).toHaveAttribute("href", "/owner/login");
    await expect(page.getByRole("link", { name: "Inquiries" })).toHaveAttribute(
      "href",
      "https://worldsoftwares.com"
    );

    await page.goto("/about");
    await expect(page.getByRole("heading", { name: /modern barbering/i })).toBeVisible();

    await page.goto("/book");
    await expect(page.getByText("Select one package to update the summary")).toBeVisible();

    await page.goto("/owner/login");
    await expect(page.getByRole("heading", { name: /appointment command center/i })).toBeVisible();
  });

  test("mobile public routes do not create horizontal overflow", async ({ page }) => {
    const widths = [320, 375, 390, 414, 430];
    const routes = ["/", "/about", "/book", "/services/basic-cut", "/owner/login"];

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
