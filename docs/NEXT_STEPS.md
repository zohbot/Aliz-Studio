# Next Steps

## Staging Readiness

- Verify the live Vercel staging owner environment so `https://aliz.zohbot.net/owner/login` accepts the intended owner credentials:
  - `OWNER_EMAIL`
  - `OWNER_PASSWORD`
  - `OWNER_SESSION_SECRET`
  - `ALIZ_REQUIRE_PRODUCTION_SECRETS=true`
  - `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=false`
- Enter owner env values as raw text in Vercel, without wrapping quotes. `OWNER_PASSWORD` remains exact-match, so accidental spaces or quotes will become part of the password.
- Redeploy after changing Vercel env vars; existing deployments do not automatically pick up new values.
- Keep `ALIZ_DATA_BACKEND=file` until the Supabase adapter is intentionally enabled in a later task.
- Keep `ALIZ_ENABLE_SUPABASE_REPOSITORY=false` until the Supabase appointment repository is implemented. The current factory falls back to `file` if `ALIZ_DATA_BACKEND=supabase` is entered early.
- Treat live appointment, service, and availability settings data as temporary while the app remains file-backed on Vercel/serverless; the file backend uses ephemeral temp storage in that environment.
- If `/owner/login` redirects straight to `/owner/dashboard`, that means a valid owner session is still active. Use the visible dashboard `Log out` action before testing the credential form again.
- Re-run public navigation, booking, mock checkout, confirmation, owner login, and owner dashboard checks after the staging owner variables are set.

## Polish Follow-Ups

- Founder-review the new `/owner/services` flow on desktop and mobile, especially the service edit drawer and active/public visibility language.
- Founder-review the new `/owner/availability` flow on desktop and mobile, especially weekly hours, blocked dates, lead time, and fixed-slot demo language.
- Continue checking mobile layouts at 320, 375, 390, 414, and 430px before each public demo.
- Replace the generated brand placeholder files with final production logo/icon exports when they are approved.
- Decide whether archived source exports in `public/brand/source/` should remain in the repo after production brand review.
- Re-check both light and night themes when making future UI changes; light remains the default and the night toggle persists locally as `aliz-theme`.
- Keep image-backed service/menu card text tied to the dedicated image-card tokens so night-mode titles, prices, durations, and CTAs remain readable over photography.
- Keep booking selections, tap highlights, form focus states, and mock payment cards tied to the theme interaction/payment tokens so browser-default blue and washed-out night surfaces do not return.
- Keep mock payment tiles on explicit dark/gold night overrides so they do not regress into bright white blocks inside the booking summary.
- Keep the mobile header compact on booking pages; verify only one theme-appropriate logo variant is visible after any header or logo changes.
- Keep the desktop booking shell roomy enough for a wide center date/time area; available time slots should not return to a cramped narrow column.
- Keep About-page story cards on their dedicated smaller heading scale so "Appointment First" does not inherit oversized page-heading typography again.
- Keep owner appointment detail drawer stat/contact/note panels on the refined card treatment when adding future admin fields.
- Keep owner appointment detail typography on the softened near-black tokens and medium/semi-bold weights; avoid returning drawer labels or values to pure black or 850/900-heavy weights.
- Keep `/packages` as the public package comparison destination; if services become owner-editable, move the richer package copy behind the future service repository instead of duplicating prices or durations.
- Extend owner service management later for image selection, long-form detail copy, inclusions, and audit-event history; the current sprint intentionally limits edits to safe menu fields.
- Keep the owner appointment detail drawer and footer aligned with the refined premium surface system when adding future admin fields or footer links.
- Add service-worker/offline PWA behavior only after booking freshness requirements are decided.
- Keep booking copy explicit that the current deposit step is demo/mock-only until Square live checkout is implemented.
- Keep form validation aligned with the current US-only phone requirement unless the business expands beyond that assumption.

## Deferred Production Work

- Continue the next admin implementation sprint from `docs/ADMIN_ROADMAP.md`: owner settings, customer summaries, notification/audit previews, or availability conflict-preview polish in demo-safe mode.
- Move appointment persistence from the file-backed repository to Supabase only after repository adapters and transactional booking flows are ready.
- Implement and test the Supabase repository before allowing the runtime factory to select it.
- Add durable Supabase owner-managed blocked times/days and transaction-safe booking holds before using the booking backend for real customer scheduling.
- Add Square hosted checkout and webhook reconciliation before collecting real deposits.
- Add owner notifications only after provider responses and notification logs are wired.
- Harden owner/admin auth separately from this polish sprint.
