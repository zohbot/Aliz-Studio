# Progress Log

## 2026-05-30 - Demo-Safe Owner Customer Records

Scope: owner-only customer records and client history, derived from existing appointment data with demo-safe owner profile notes/preferences. No Supabase connection, real payment capture, notifications, auth-provider changes, DNS, Vercel setting, secret, env value, or public booking behavior changes were made.

Completed:

- Added `/owner/customers` as a protected owner client-book route.
- Added customer records derived from appointment contact/history data, including search, contact info, appointment totals, upcoming/completed counts, last/next appointment dates, latest status, most-booked service, and projected historical value.
- Added a customer detail drawer with booking timeline, contact context, owner-only notes, sensitive owner note, preferred cut, preferred time window, and simple owner tags.
- Added `GET /api/owner/customers` and `PATCH /api/owner/customers/[customerId]` with owner-session auth, same-origin protection for mutation, server-side validation, safe errors, and path revalidation.
- Added a customer profile repository interface with file, demo, and Supabase-ready skeleton adapters.
- Added dashboard navigation to Customers alongside Services and Availability.
- Added Playwright coverage for protected customer access, customer search/detail/history, note/tag persistence, invalid customer mutation rejection, mobile overflow, and local/Vercel customer profile storage paths.

Validation:

- `npm run lint` passed.
- `npm run build` passed.
- `npm test` was not run because `package.json` does not define a `test` script.
- `npm run test:e2e -- --reporter=line` passed with 94/96 Playwright tests and 2 intentional mobile-project skips for shared file-backed mutation paths.

Notes:

- Customer records remain derived from appointments, not a durable customer account system.
- Owner profile notes/preferences persist to `data/customer-profiles.json` locally and `/tmp/aliz-studio-customers/profiles.json` on Vercel. This remains demo-safe and ephemeral, not production durable.
- Supabase is still required before real customer records are trusted for production retention, privacy, search, export/delete, or audit workflows.

## 2026-05-30 - Demo-Safe Owner Availability Management

Scope: owner-only availability and booking-rule management, file/demo availability repository support, public availability filtering, tests, and docs. No Supabase connection, real payment capture, notifications, auth-provider changes, DNS, Vercel setting, secret, env value, or route slug changes were made.

Completed:

- Added `/owner/availability` as a protected owner availability management route.
- Added an owner availability manager with weekly open/closed toggles, daily start/end times, optional break times, blocked-date add/remove controls, lead time, max appointments per slot/day, cancellation cutoff, and timezone settings.
- Added `GET` and `PATCH /api/owner/availability` with owner-session auth, same-origin protection, server-side validation, safe errors, and path revalidation.
- Added an availability repository interface with file, demo, and Supabase-ready skeleton adapters.
- Updated public booking availability to respect configured weekly hours, closed days, blocked dates, optional breaks, lead time, and simple slot/day capacity checks while preserving the current slot response shape.
- Added dashboard navigation to Availability alongside Services.
- Added Playwright coverage for protected availability access, blocked-date behavior in public availability, invalid settings, unauthorized mutation rejection, mobile overflow, and Vercel/local availability storage paths.

Validation:

- `npm run lint` passed.
- `npm run build` passed.
- `npm test` was not run because `package.json` does not define a `test` script.
- `npm run test:e2e -- --reporter=line` passed with 89/90 Playwright tests and 1 intentional mobile-project skip for the shared file-backed availability mutation path.

Notes:

- Availability edits persist to `data/availability-settings.json` locally and `/tmp/aliz-studio-availability/settings.json` on Vercel. This remains demo-safe and ephemeral, not production durable.
- Current booking availability still uses the existing fixed slot labels; Supabase is still required for transaction-safe holds, service-duration overlap checks, durable blocked-time ranges, and audit events.

## 2026-05-30 - Demo-Safe Owner Service/Menu Management

Scope: owner-only service/menu management, file/demo service repository support, public service reads, tests, and docs. No Supabase connection, real payment capture, notifications, auth-provider changes, DNS, Vercel setting, secret, env value, or route slug changes were made.

Completed:

- Added `/owner/services` as a protected owner service/menu management route.
- Added an owner service manager with premium cards, edit drawer, validation, active/bookable toggles, public visibility, featured/signature state, sort order, price, deposit, duration, name, and short-description edits.
- Added `PATCH /api/owner/services/[serviceId]` with owner-session auth, same-origin protection, server-side validation, safe errors, and path revalidation.
- Added a service repository interface with file, demo, and Supabase-ready skeleton adapters while preserving stable service IDs and public routes.
- Updated public home, packages, service detail, booking, quote, booking create, and confirmation paths to read repository-backed service data where server-side/runtime-safe.
- Added Playwright coverage for owner service editing, validation, unauthorized service mutation rejection, active/bookable behavior, and deterministic service test reset.

Validation:

- `npm run lint` passed.
- `npm run build` passed.
- `npm test` was not run because `package.json` does not define a `test` script.
- `npm run test:e2e -- --reporter=line` passed with 84/84 Playwright tests.

Notes:

- Service edits persist to `data/services.json` locally and `/tmp/aliz-studio-services/services.json` on Vercel. This remains demo-safe and ephemeral, not production durable.
- Core demo services cannot be deleted in this sprint; missing service records are restored from the stable catalog.

## 2026-05-30 - Desktop Typography Smoothness Polish

Scope: focused desktop typography refinement for the owner appointment detail drawer and related theme tokens. No auth, database, payment behavior, notification, DNS, Vercel setting, secret, env value, route, or persistence behavior was changed.

Completed:

- Preserved the existing pure system font stack and antialiased rendering setup.
- Added drawer-specific light/night typography tokens so the owner detail surface uses softer near-black text instead of harsh dark text in light mode.
- Reduced heavy 850/900-style drawer weights on headings, price metadata, labels, contact values, note labels, and detail form controls to medium/semi-bold values.
- Improved drawer line-height and neutralized sharp label tracking while keeping headings strong and readable.
- Added Playwright computed-style coverage to guard against pure-black, extra-heavy, or overly tracked drawer typography returning.

Validation:

- `npm run lint` passed.
- `npm run build` passed.
- `npm test` was not run because `package.json` does not define a `test` script.
- `npm run test:e2e -- --reporter=line` passed with 80/80 Playwright tests.

Notes:

- This sprint intentionally did not add external fonts, font files, text shadows, blur tricks, or global opacity changes.

## 2026-05-30 - Desktop Detail Drawer And Footer Premium UI Polish

Scope: desktop owner appointment detail drawer, footer, and system typography polish only. No auth, database, payment behavior, notification, DNS, Vercel setting, secret, env value, route, or persistence behavior was changed.

Completed:

- Refined the global system font stack with Apple/SF, Segoe UI, Roboto, Helvetica Neue, Arial fallbacks and enabled antialiased font smoothing for a softer desktop feel.
- Reworked the owner appointment detail drawer into a wider premium desktop surface with blur/dim backdrop, softer warm light-theme gradients, stronger night-theme treatment, rounded metric/contact/note cards, polished close control, and refined action spacing.
- Added custom theme-aware detail select styling with a chevron, consistent height, focus ring, and smoother control surfaces.
- Upgraded the footer into a branded card-like system section with logo, hierarchy, refined navigation pills, subtle gold line, and light/night theme treatments.
- Added Playwright coverage for premium drawer styling, custom select appearance, font smoothing, footer Packages link visibility, footer surface styling, and night footer readability.

Validation:

- `npm run lint` passed.
- `npm run build` passed.
- `npm test` was not run because `package.json` does not define a `test` script.
- `npm run test:e2e -- --reporter=line` passed with 80/80 Playwright tests.

Notes:

- Owner appointment behavior remains unchanged from the current demo-safe dashboard; this sprint only changes presentation and control styling.

## 2026-05-30 - Public Packages Page And Navigation

Scope: public package-marketing and navigation polish only. No auth, database, payment behavior, notification, DNS, Vercel setting, secret, env value, owner workflow, or persistence behavior was changed.

Completed:

- Added a dedicated `/packages` public route with a hero, signature Deluxe Cut feature, full package comparison cards, booking confidence section, and direct booking CTAs.
- Added Packages to the header navigation and footer links, and pointed service-detail "View all packages" actions to `/packages`.
- Kept `lib/services.ts` as the source of truth for package IDs, prices, durations, deposits, and images; added `lib/package-copy.ts` for richer static customer-facing copy.
- Styled the packages page for both the light theme and premium black-and-gold night theme with responsive card layouts and no route behavior changes.
- Added Playwright coverage for package navigation, all seven package cards, booking CTA routing, night-theme package-card styling, and mobile overflow.

Validation:

- `npm run lint` passed.
- `npm run build` passed.
- `npm test` was not run because `package.json` does not define a `test` script.
- `npm run test:e2e -- --reporter=line` passed with 78/78 Playwright tests.

Notes:

- Package booking links use the existing `/book?service=` preselection behavior. No service editing, real payments, Supabase, or production persistence was added.
- While validating, an existing owner-dashboard edge case surfaced where an immediate Save after changing appointment status could submit the stale pre-change appointment object. The owner board now keeps a tiny client-side draft ref so Save uses the latest selected status/payment/note values.

## 2026-05-30 - Public CTA And Appointment Detail Drawer Premium Polish

Scope: targeted public About-page cards/CTA and owner appointment detail drawer polish only. No auth, database, payment behavior, notification, DNS, Vercel setting, secret, env value, booking flow, owner mutation behavior, or persistence behavior was changed.

Completed:

- Reduced public story-card heading scale so "Studio Feel", "Appointment First", and "Local Trust" stay balanced instead of inheriting oversized page-heading typography.
- Reworked the About-page CTA into a framed premium section with a readable pill-style "Book Online" action and arrow icon.
- Polished the owner appointment detail drawer with a larger premium surface, refined header panel, price/duration cluster, stat cards, contact cards, note cards, themed control panel, and stronger footer actions.
- Kept all appointment detail status/payment/owner-note mutation behavior unchanged.
- Added Playwright coverage for public card/CTA sizing and navigation, richer drawer content, drawer stat-card rendering, and night-mode drawer card surfaces.

Validation:

- `npm run lint` passed.
- `npm run build` passed.
- `npm test` was not run because `package.json` does not define a `test` script.
- `npm run test:e2e -- --reporter=line` passed with 76/76 Playwright tests.

Notes:

- No new logo/icon assets were provided in this sprint, so existing transparent normalized brand assets remain unchanged.

## 2026-05-30 - Premium Booking Layout Visual Refinement

Scope: targeted `/book` layout and visual polish only. No auth, database, payment behavior, notification, DNS, Vercel setting, secret, env value, owner dashboard flow, or persistence behavior was changed.

Completed:

- Reworked the desktop booking shell into a more spacious three-zone composition: services on the left, date and time stacked in a larger center area, and the summary/customer form on the right.
- Expanded the booking shell width on desktop so the page uses available viewport space instead of squeezing the time panel into a narrow side column.
- Made available time slots a roomy two-column grid on tablet/desktop with larger touch/click targets and more comfortable text spacing.
- Kept mobile booking content single-column and preserved the existing no-horizontal-overflow behavior at small widths.
- Added a subtle shared booking-shell backdrop so the booking panels read as one connected premium workspace without changing the booking flow.
- Added Playwright coverage for the 1365px desktop booking layout, slot width/height readability, night-theme selection styling, and horizontal overflow.

Validation:

- `npm run lint` passed.
- `npm run build` passed.
- `npm test` was not run because `package.json` does not define a `test` script.
- `npm run test:e2e` passed with 74/74 Playwright tests.

Notes:

- Booking behavior, mock deposit copy, current API shapes, and theme persistence remain unchanged.

## 2026-05-30 - Admin Appointment Detail And Status Workflow

Scope: demo-safe owner appointment management only. No Supabase runtime, real payment capture, real notifications, multi-user auth, DNS, Vercel setting, secret, env value, or durable production persistence was changed.

Completed:

- Added a responsive owner appointment detail drawer from the dashboard.
- Detail view now shows customer name, phone, email, service, price, duration, appointment date/time, current appointment status, mock deposit/payment status, customer notes, owner notes, and created/updated timestamps when available.
- Added owner-only detail controls for appointment status, mock payment status, and internal owner notes.
- Kept updates behind the existing protected owner appointment PATCH route and existing appointment repository abstraction.
- Added dashboard revalidation after owner appointment mutations so server-rendered metrics can refresh after saves.
- Added an empty-state card for filtered appointment views.
- Tightened owner notes validation by trimming and keeping the existing 800-character limit.
- Added Playwright coverage for appointment detail open/save/reopen behavior, unauthorized mutation rejection, invalid status rejection, night-theme detail readability, and mobile detail overflow.

Validation:

- `npm run lint` passed.
- `npm run build` passed.
- `npm test` was not run because `package.json` does not define a `test` script.
- First `npm run test:e2e` run exposed brittle new detail-test selectors; after tightening the selectors, `npm run test:e2e` passed with 72/72 Playwright tests.

Notes:

- Status values remain the existing domain values: `pending_deposit`, `confirmed`, `completed`, `cancelled`, and `no_show`.
- Payment copy remains explicitly mock/demo-only.
- Supabase is still required before appointment records are production-durable.

## 2026-05-30 - Admin Production Readiness Roadmap

Scope: planning and documentation only. No auth, database, payment, notification, DNS, Vercel setting, secret, env value, or runtime behavior was changed.

Completed:

- Audited the current app routes, owner routes, booking APIs, repository layer, domain model, seed data, Supabase plan, docs, environment placeholders, and tests.
- Added `docs/ADMIN_ROADMAP.md` with the current production-readiness assessment, complete admin feature set, proposed data/repository interfaces, and PR-sized implementation roadmap.
- Identified what is demo-ready today, what is production-ready today, what remains mock/demo-only, what must be connected before real customers use it, what can be built without credentials, and what should wait for owner approval.
- Recommended the next implementation sprint: demo-safe owner appointment detail/status workflow using the existing appointment repository abstraction.
- Added README and next-step pointers to the roadmap.

Validation:

- `npm run lint` passed.
- `npm run build` passed.
- `npm test` was not run because `package.json` does not define a `test` script.
- First `npm run test:e2e` run had one transient mobile mock-checkout navigation timeout with 65/66 passing; immediate rerun passed with 66/66 Playwright tests.

Notes:

- The roadmap keeps the app demo-safe and defers Supabase runtime, Square live checkout, real notifications, durable customer records, and auth-provider replacement until explicitly approved.

## 2026-05-30 - Mobile Header Compactness And Logo Variant Fix

Scope: targeted mobile header, logo variant, and theme-toggle polish. No auth, database, payment, notification, DNS, Vercel setting, secret, or env value was changed.

Completed:

- Fixed the mobile header logo cascade so the light/white mark is hidden on light surfaces and only the dark mark is visible in light mode.
- Kept the night theme using the light/white mark on dark surfaces.
- Reworked the mobile header into a compact two-row app-header layout.
- Reduced mobile logo mark, title, theme toggle, Reserve CTA, nav spacing, and header padding.
- Made the mobile theme toggle icon-sized while keeping its accessible label and persistence behavior.
- Added Playwright coverage for compact mobile header height, booking content position, theme-specific header logo variants, theme toggle persistence, footer logo variants, and owner-login logo variants.

Validation:

- `npm run lint` passed.
- `npm run build` passed.
- `npm test` was not run because `package.json` does not define a `test` script.
- `npm run test:e2e` passed with 66/66 Playwright tests.

Notes:

- Desktop header behavior and theme persistence remain intact.

## 2026-05-30 - Night Theme Mock Payment Tile Contrast Fix

Scope: targeted night-theme polish for mock payment method tiles and nearby disabled continue-button state. No auth, database, payment, notification, DNS, Vercel setting, secret, or env value was changed.

Completed:

- Added a stronger dark payment-card surface token and explicit night-mode payment tile override.
- Kept payment method labels readable with warm off-white text and gold icons/borders.
- Added subtle rounded hover/pressed treatment to payment method tiles without making them look like real payment buttons.
- Reviewed and polished the disabled `Continue to mock deposit` button state in night mode so it reads as intentionally unavailable.
- Strengthened Playwright coverage so all mock payment tile labels are visible and the tile background, gradient, icon, border, helper text, placeholder, and disabled CTA styles are checked.

Validation:

- `npm run lint` passed.
- `npm run build` passed.
- `npm test` was not run because `package.json` does not define a `test` script.
- `npm run test:e2e` passed with 62/62 Playwright tests.

Notes:

- Mock payment behavior remains demo-only and unchanged.

## 2026-05-30 - Night Theme Booking Interaction Polish

Scope: targeted night-theme polish for booking controls, form focus states, and mock payment option cards. No auth, database, payment, notification, DNS, Vercel setting, secret, or env value was changed.

Completed:

- Added theme tokens for tap highlights, selected-state surfaces, selected-state borders, input focus styling, placeholders, and mock payment cards.
- Replaced default-looking blue mobile tap/focus/selection behavior with warm gold and charcoal night-theme treatment.
- Updated selected service, calendar day, and time-slot controls to share theme-aware selected-state styling.
- Fixed night-mode mock payment option cards so their labels and icons are readable on dark premium card surfaces.
- Improved night-mode textarea placeholder and booking helper text readability.
- Added Playwright coverage for night booking selection colors, tap highlight styling, payment card readability, and helper/placeholder contrast.

Validation:

- `npm run lint` passed.
- `npm run build` passed.
- `npm test` was not run because `package.json` does not define a `test` script.
- `npm run test:e2e` passed with 62/62 Playwright tests.

Notes:

- Mock deposit behavior remains demo-only and unchanged.

## 2026-05-30 - Night Theme Service Card Contrast Fix

Scope: targeted night-theme readability polish for image-backed service/menu cards. No auth, database, payment, notification, DNS, Vercel setting, secret, or env value was changed.

Completed:

- Added dedicated image-card design tokens for title, body, muted metadata, price, divider, and overlay treatment.
- Strengthened the night-mode image scrim behind service-card text while keeping the photography visible.
- Updated service-card titles, prices, durations, and related mini-package cards so they no longer inherit dark surface text in night mode.
- Made the night-mode service-card CTA a gold-forward button with dark text for stronger contrast.
- Added Playwright coverage for night-mode service-card title, price, duration, CTA, and overlay token readability.

Validation:

- `npm run lint` passed.
- `npm run build` passed.
- `npm test` was not run because `package.json` does not define a `test` script.
- `npm run test:e2e` passed with 58/58 Playwright tests.

Notes:

- Light theme remains the default and was not redesigned.

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
