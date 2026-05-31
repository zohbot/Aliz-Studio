# Deployment

This document captures the staging deployment plan for Aliz Studio on Vercel with Cloudflare DNS. It is documentation and readiness guidance only; do not deploy from Codex unless the environment is already authenticated with Vercel and the owner explicitly asks for deployment.

## Deployment Target

- Vercel hosts the Next.js app.
- Supabase will host database/auth/storage later.
- Square will handle deposit payments later.
- Resend and optionally Twilio will handle owner notifications later.

## Staging Domain

Staging hostname:

```text
aliz.zohbot.net
```

## Cloudflare DNS Plan

After adding `aliz.zohbot.net` to the Vercel project, Vercel will show the exact DNS target to configure.

Create this Cloudflare record:

- Type: `CNAME`
- Name: `aliz`
- Target: copy the exact CNAME target from Vercel Project Settings > Domains
- Proxy status: DNS only / gray cloud

Do not hard-code the target here because Vercel can provide a project-specific value. Vercel should manage SSL for the custom domain.

Do not use the Cloudflare orange-cloud proxy for this staging hostname unless that is intentionally tested later.

## Vercel Project Setup

1. Import the GitHub repository into Vercel.
2. Use framework preset `Next.js`.
3. Install command: `npm install`, unless Vercel auto-detects an equivalent.
4. Build command: `npm run build`.
5. Output directory: use the Vercel/Next.js default.
6. Node version: use the project/Vercel default unless `package.json` requires otherwise.
7. Add `aliz.zohbot.net` in Project Settings > Domains.
8. If using a staging branch, assign `aliz.zohbot.net` to that Git branch or a custom staging environment if the Vercel plan supports it.

## Required Staging Environment Variables

Set these in Vercel for the staging environment. Use real staging values in Vercel only; do not commit them.

```text
OWNER_EMAIL
OWNER_PASSWORD
OWNER_SESSION_SECRET
ALIZ_REQUIRE_PRODUCTION_SECRETS=true
NEXT_PUBLIC_SITE_URL=https://aliz.zohbot.net
ALIZ_DATA_BACKEND=file
ALIZ_ENABLE_SUPABASE_REPOSITORY=false
BOOKING_TIMEZONE=America/New_York
DEPOSIT_HOLD_MINUTES=15
```

Owner credential notes:

- Enter Vercel values as raw text, without surrounding quotes.
- `OWNER_EMAIL` is normalized by trimming surrounding whitespace, removing accidental wrapping quotes, and comparing case-insensitively.
- `OWNER_PASSWORD` is intentionally exact-match. Do not add surrounding quotes or spaces unless they are part of the intended password.
- Vercel environment variable changes require a new deployment before the live app can read them.
- Keep `ALIZ_ENABLE_SUPABASE_REPOSITORY=false` until the Supabase adapter is implemented and tested. If `ALIZ_DATA_BACKEND=supabase` is entered early, the app currently falls back to `file`.

## Optional Future Environment Variables

These are not active for the current staging backend, but will be needed by later Supabase, Square, and notification tasks. Add values only when those integrations are implemented and reviewed.

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_DB_URL
SQUARE_ENVIRONMENT
SQUARE_ACCESS_TOKEN
SQUARE_LOCATION_ID
NEXT_PUBLIC_SQUARE_APPLICATION_ID
NEXT_PUBLIC_SQUARE_LOCATION_ID
SQUARE_WEBHOOK_SIGNATURE_KEY
OWNER_NOTIFICATION_EMAIL
RESEND_API_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_FROM_NUMBER
OWNER_SMS_NUMBER
```

Only `NEXT_PUBLIC_` values are safe to expose to browser code. Keep Supabase service role keys, database URLs, Square access tokens, notification provider secrets, owner credentials, and session secrets server-only.

## Current Staging Limitations

- File-backed appointment, service, and availability settings storage uses ephemeral writable temp storage on Vercel/serverless and is only acceptable for temporary staging/demo validation.
- Supabase schema exists, but the Supabase runtime adapter is not active yet.
- Square live payments are not active yet.
- Notifications are not real yet.
- Owner auth must use real staging credentials, not local demo credentials.
- Do not rely on staging appointment data as permanent data until Supabase is active.

## Deployment Validation Checklist

Run local validation before deploying:

```bash
npm run lint
npm run build
npm run test:e2e
```

After deployment, verify:

- Vercel build succeeds.
- `aliz.zohbot.net` resolves after DNS propagation.
- HTTPS certificate is active.
- Public navigation works.
- Booking flow works.
- Mock checkout works.
- Confirmation page works.
- Owner login works with staging credentials.
- Owner dashboard loads.
- Owner appointment update works.
- No secrets appear in logs.
- Cloudflare record remains DNS only / gray cloud.

## DNS Verification Commands

These are examples for local/manual verification. They do not need to pass inside Codex.

```bash
dig CNAME aliz.zohbot.net
dig aliz.zohbot.net
```

## Rollback Plan

- Remove or disable the Vercel custom domain if needed.
- Revert the Cloudflare CNAME record.
- Use the Vercel-generated deployment URL for testing.
- Keep Supabase and Square disabled until their implementation tasks are complete.
