# Progress Log

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
