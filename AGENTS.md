# AGENTS.md

## Project Summary

Aliz Studio is a barbershop booking PWA/full-stack app. Customers browse services, book appointments, and pay a deposit. The owner manages appointments, blocked times/days, cancellations, payment state, and notifications.

## Current Stack

- Next.js App Router
- React
- TypeScript
- npm
- Custom CSS in `app/globals.css`
- Playwright end-to-end tests
- Zod validation
- Square package present for future payment integration
- Current custom owner auth with signed HttpOnly cookies

## Core Commands

Run these after meaningful changes:

```bash
npm run lint
npm run build
npm run test:e2e
```

## Safety Rules

- Do not commit secrets.
- Do not print secret values.
- Do not commit `.env.local`.
- Do not expose Supabase service role keys to the client.
- Do not remove existing working booking/demo flows unless replacing them with tested equivalents.
- Do not make large unrelated rewrites.
- Keep changes PR-sized.
- Keep generated dummy data deterministic.

## Environment Rules

- `.env.example` may contain variable names only.
- `.env.local` is ignored and must not be committed.
- Server-only secrets must stay server-only.
- Public env vars must use `NEXT_PUBLIC_` only when safe for the browser.

## Development Workflow

- Audit the relevant code before modifying it.
- Explain touched files in final responses.
- Prefer type-safe shared domain models over duplicated ad hoc shapes.
- Run validation commands after changes.
- Include testing notes in the final response.
- Keep the public demo flow working.

## Booking And Scheduling Rules

Scheduling is the riskiest domain in this app.

- Avoid direct file-store expansion for production.
- Move toward repository interfaces with mock and Supabase adapters.
- Availability must account for service duration, buffers, existing appointments, blocked times/days, hold expiration, and timezone.
- Prevent double-booking with database constraints, transactions, or RPC when Supabase is introduced.

## Owner And Admin Rules

- Owner routes must stay protected.
- Mutating owner actions require auth and same-origin/CSRF-aware protections.
- Status changes, cancellations, payment adjustments, and blocked time changes should eventually create audit events.

## Payment Rules

- Square deposit flow should be abstracted behind server-side helpers.
- Webhook handling must verify signatures when configured.
- Webhooks must be idempotent.
- Appointment confirmation should happen only after verified payment, except in local mock/demo mode.

## Notification Rules

- Do not pretend notifications are sent unless provider response confirms success.
- Store notification attempts once notification logging exists.
- Resend email should be the first real provider; Twilio SMS is optional.

## PWA Rules

- Add PWA basics incrementally.
- Do not add an aggressive service worker that breaks fresh booking/availability data.

## Documentation Expectations

Update docs when routes, env vars, database schema, deployment, or architecture changes.
