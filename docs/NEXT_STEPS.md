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
- Treat live appointment data as temporary while the app remains file-backed on Vercel/serverless.
- Re-run public navigation, booking, mock checkout, confirmation, owner login, and owner dashboard checks after the staging owner variables are set.

## Polish Follow-Ups

- Continue checking mobile layouts at 320, 375, 390, 414, and 430px before each public demo.
- Replace the generated brand placeholder files with final production logo/icon exports when they are approved.
- Decide whether archived source exports in `public/brand/source/` should remain in the repo after production brand review.
- Add service-worker/offline PWA behavior only after booking freshness requirements are decided.
- Keep booking copy explicit that the current deposit step is demo/mock-only until Square live checkout is implemented.
- Keep form validation aligned with the current US-only phone requirement unless the business expands beyond that assumption.

## Deferred Production Work

- Move appointment persistence from the file-backed repository to Supabase only after repository adapters and transactional booking flows are ready.
- Add owner-managed blocked times/days before using the booking backend for real customer scheduling.
- Add Square hosted checkout and webhook reconciliation before collecting real deposits.
- Add owner notifications only after provider responses and notification logs are wired.
- Harden owner/admin auth separately from this polish sprint.
