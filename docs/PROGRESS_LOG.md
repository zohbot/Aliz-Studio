# Progress Log

## 2026-05-30 - Night Theme Sprint

Scope: visual/theming polish only. No real auth provider, database, payment, notification, DNS, Vercel setting, secret, or env value was changed.

Completed:

- Added a tokenized light/night theme system using `data-theme` and CSS variables.
- Kept the existing light theme as the default.
- Added a minimal header theme toggle that persists the selected theme locally as `aliz-theme`.
- Added an early layout script to apply the stored theme before the page finishes painting.
- Added black-and-gold night theme styling across header, hero, service cards, booking, checkout, owner login, owner dashboard, footer, and PWA install surfaces.
- Swapped transparent light logo assets into dark-theme header, footer, and owner login contexts.
- Added Playwright coverage for theme persistence, night-theme logo usage, mobile overflow, and owner login/dashboard usability in night mode.
- Moved Playwright appointment-store cleanup into a single global setup step to avoid cross-project file-backed data races during e2e runs.

Validation:

- `npm run lint` passed.
- `npm run build` passed.
- `npm test` was not run because `package.json` does not define a `test` script.
- `npm run test:e2e` passed with 56/56 Playwright tests.

Notes:

- The night theme is opt-in through the toggle; no backend, payment, or persistence behavior changed.

## 2026-05-30 - Owner Session UX And Storage Fallback Follow-Up

Scope: owner dashboard session clarity and demo storage reliability only. No real auth provider, database, payment, notification, DNS, Vercel setting, secret, or env value was changed.

Completed:

- Confirmed that an active owner session intentionally redirects `/owner/login` to `/owner/dashboard`; this is expected protected-route behavior, not a credential form bypass.
- Added a visible owner session panel and `Log out` action to the dashboard so testers can clearly end the current session before retesting credentials.
- Added logout feedback on `/owner/login` after the session is cleared.
- Hardened repository backend selection so an accidental `ALIZ_DATA_BACKEND=supabase` or unsupported backend value falls back to the file backend until the Supabase adapter is implemented.
- Documented the staging expectation that Supabase repository activation remains disabled until the adapter is implemented.
- Added Playwright coverage for active-session redirect behavior, logout, dashboard session controls on mobile, and Supabase backend fallback.

Validation:

- `npm run lint` passed.
- `npm run build` passed.
- `npm test` was not run because `package.json` does not define a `test` script.
- `npm run test:e2e` passed with 50/50 Playwright tests.

Notes:

- A read-only live availability check before this sprint returned storage-unavailable JSON, which points to a runtime repository/storage configuration problem rather than an owner credential mismatch.
- A post-deploy read-only availability check returned HTTP 200 with slot data after the repository fallback was tightened.
- Live dashboard safe-mode status still requires founder confirmation with private owner credentials, but the public availability API no longer reports storage unavailable.

## 2026-05-30 - Corrective Valid Login And Logo Sprint

Scope: owner valid-login success path, transparent app-used brand assets, owner login polish, and handoff packaging. No real auth provider, database, payment, notification, DNS, Vercel setting, secret, or env value was changed.

Completed:

- Investigated the valid-login path that runs after credentials are accepted: session token creation, cookie setting, redirect, protected dashboard render, and appointment repository access.
- Kept the previous Vercel temp-storage fallback and added explicit Node.js runtime declarations to owner/booking/checkout routes that depend on Node APIs or the file-backed appointment repository.
- Added dashboard-level error handling so appointment storage failures render a friendly owner safe-mode state instead of a generic server error screen.
- Added safe 503 responses for owner appointment APIs and booking availability when appointment storage is temporarily unavailable.
- Confirmed a production-build local login flow with test-only credentials reaches `/owner/dashboard`.
- Rebuilt the app-used wordmark and mark PNGs with real alpha transparency from the cleanest available archived source exports.
- Added a show/hide password toggle with accessible labels and preserved `autocomplete="current-password"`.
- Tightened the owner login card presentation and logo placement.
- Added Playwright coverage for valid owner login, invalid login, password visibility, desktop/mobile overflow, Vercel storage path resolution, and app-used PNG alpha channels.

Validation:

- `npm run lint` passed.
- `npm run build` passed.
- `npm test` was not run because `package.json` does not define a `test` script.
- `npm run test:e2e` passed with 42/42 Playwright tests.
- Production build smoke test with test-only owner credentials passed: login API returned 200 and `/owner/dashboard` returned 200 with dashboard content.

Notes:

- Vercel CLI/log access was not available locally, so raw Vercel runtime logs were not inspected.
- `cfc6d13` could not be directly confirmed from response headers; the pushed corrective commit supersedes that deployment.
- Live valid-login confirmation still requires private owner credentials after Vercel deploys the corrective commit.

## 2026-05-30 - Owner Login Debug Sprint

Scope: owner login reliability and documentation only. No real auth provider, database, payment, notification, DNS, Vercel setting, secret, or env value was changed.

Completed:

- Confirmed the owner login code reads the intended env names: `OWNER_EMAIL`, `OWNER_PASSWORD`, `OWNER_SESSION_SECRET`, `ALIZ_REQUIRE_PRODUCTION_SECRETS`, and `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS`.
- Confirmed login sets the same signed HttpOnly owner session cookie that protected owner routes read.
- Normalized configured owner email handling so accidental surrounding whitespace or wrapping quotes from Vercel env entry do not break email comparison.
- Updated the login API to trim email before email validation, so copy/pasted owner email input with surrounding spaces can still authenticate.
- Kept owner password exact-match and documented that accidental quotes or spaces in Vercel become part of the password.
- Added Playwright coverage for invalid owner login error copy and normalized email login through the owner auth API.
- Documented the Vercel env redeploy requirement after changing owner credentials.

Validation:

- `npm run lint` passed.
- `npm run build` passed.
- `npm test` was not run because `package.json` does not define a `test` script.
- `npm run test:e2e` passed with 36/36 Playwright tests.

Notes:

- Live valid-login confirmation still requires the private owner credentials and a deployment containing this fix.
- If live login still fails after deployment, verify `OWNER_PASSWORD` in Vercel is entered as raw text with no accidental quotes/spaces, then redeploy.

## 2026-05-30 - Valid Owner Login Success-Path Fix

Scope: authenticated owner dashboard success path only. No real auth provider, database, payment, notification, DNS, Vercel setting, secret, or env value was changed.

Completed:

- Investigated the path that only runs after valid credentials: session cookie creation, redirect, and owner dashboard render.
- Identified the likely production-only failure: the dashboard reads the file-backed appointment repository, which could try to seed/write `data/appointments.json` inside the deployed app directory.
- Updated the file-backed appointment repository so local development still uses `data/appointments.json`, while Vercel runtime uses writable ephemeral temp storage.
- Added Playwright coverage for Vercel storage path resolution.
- Documented that Vercel file-backed storage is usable only for temporary staging/demo validation and remains non-durable.

Validation:

- `npm run lint` passed.
- `npm run build` passed.
- `npm test` was not run because `package.json` does not define a `test` script.
- `npm run test:e2e` passed with 38/38 Playwright tests.

Notes:

- This keeps `ALIZ_DATA_BACKEND=file` as the default and does not activate Supabase.
- Valid live-login confirmation still requires private owner credentials after deployment.

## 2026-05-30 - Live Deployment QA And Polish

Scope: production-readiness polish only for the live staging app at `https://aliz.zohbot.net`. No real payments, customer database, real auth replacement, Supabase runtime integration, notification provider, Vercel setting, or DNS change was made.

Completed:

- Checked live public route status for `/`, `/about`, `/book`, and `/services/basic-cut`; all returned HTTP 200.
- Confirmed live `/owner/login` currently returns HTTP 500. This appears consistent with missing or invalid owner auth staging environment configuration, and no secrets were inspected or changed.
- Added basic Open Graph/Twitter metadata, canonical metadata, and icon metadata.
- Clarified booking and checkout copy so the deposit step reads as demo/mock behavior and does not imply a real card charge.
- Tightened booking phone validation to require exactly 10 digits after formatting is stripped.
- Added a phone helper note and mobile telephone input hint.
- Fixed selected service visual styling by matching the existing `aria-pressed` state.
- Added global focus-visible styling for keyboard users.
- Added required owner login inputs without changing auth behavior.
- Added Playwright coverage for public route navigation, mobile overflow at 320/375/390/414/430px, and clear phone validation messaging.
- Updated README with live QA documentation pointers.

Validation:

- `npm run lint` passed.
- `npm run build` passed.
- `npm test` was not run because `package.json` does not define a `test` script.
- `npm run test:e2e` passed locally after this polish pass.

Notes:

- The current file-backed appointment store remains the default backend.
- File-backed data is not durable on Vercel/serverless and should remain temporary staging/demo behavior.
- Supabase schema and adapter planning exist, but Supabase runtime integration is not active.
- Square checkout remains mock/demo-only.
- Notifications remain non-real stubs.

## 2026-05-30 - Brand And UI Integration Sprint

Scope: brand/design integration and demo-safe UI polish. No real payments, customer database, real auth replacement, Supabase runtime integration, notification provider, Vercel setting, DNS change, secret, or env value was changed.

Completed:

- Normalized the generated Aliz Studio signature logo, compact mark, PWA icon, and Apple touch icon assets into stable `public/brand` and `public/icons` filenames.
- Added `app/manifest.ts` and expanded Next.js metadata icon references using App Router conventions.
- Updated the header and footer to use the Aliz Studio signature/mark assets.
- Shifted the visual system toward a premium system-font, glass-surface, mobile-first direction.
- Refined booking form attributes and phone formatting so alphabetic characters are stripped before state persists.
- Replaced branded payment logos with neutral mock/demo payment presentation chips.
- Documented brand asset usage and replacement expectations in `docs/BRAND_ASSETS.md`.

Validation:

- `npm run lint` passed.
- `npm run build` passed.
- `npm test` was not run because `package.json` does not define a `test` script.
- `npm run test:e2e` passed with 24/24 Playwright tests.
- Read-only live status check: `/`, `/about`, `/book`, and `/services/basic-cut` returned HTTP 200; `/owner/login` still returned HTTP 500.

Notes:

- Live `/owner/login` was previously observed returning HTTP 500 until Vercel staging owner env vars are configured.
- Checkout/deposit UI remains mock/demo-only.

## 2026-05-30 - Asset Cleanup And PWA Install Sprint

Scope: safe asset cleanup and installability polish only. No real payments, customer persistence, Supabase runtime, owner auth behavior, Vercel setting, DNS change, secret, or env value was changed.

Completed:

- Moved original generated source PNG exports out of the `public/` root and into clean `public/brand/source/` filenames.
- Kept normalized app-facing logo and icon paths unchanged under `public/brand` and `public/icons`.
- Added a polished PWA install card on the homepage.
- Used `beforeinstallprompt` where available and manual Share then Add to Home Screen instructions for iOS-like browsers.
- Hid the install card when the app is already running in standalone display mode.
- Kept `app/manifest.ts` as the manifest source of truth and avoided adding a service worker or offline cache.
- Added Playwright coverage for install UI visibility, standalone hiding, iOS instructions, clean source filenames, manifest/icon paths, and no messy generated names in app code.

Validation:

- `npm run lint` passed.
- `npm run build` passed.
- `npm test` was not run because `package.json` does not define a `test` script.
- `npm run test:e2e` passed with 32/32 Playwright tests.
- Read-only live status check: `/`, `/about`, `/book`, and `/services/basic-cut` returned HTTP 200; `/owner/login` still returned HTTP 500.

Notes:

- Live `/owner/login` remains an owner env/config follow-up unless verified separately.
- Checkout/deposit behavior remains mock/demo-only.
