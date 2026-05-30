# Route And API Inventory

This document captures the current Aliz Studio routes before production scheduling work begins. The app currently uses static service data, a local file-backed appointment store, mock checkout behavior, custom owner auth, and placeholder notification/payment integrations.

## Public Pages

### `/`

- Purpose: Public homepage with brand hero, service overview, and booking entry points.
- Current data source: Static service data from `lib/services.ts` through `components/service-grid.tsx`.
- Auth requirement: None.
- Readiness: Demo-ready, not production-complete.
- Known limitations: Content and service catalog are static; no production CMS/database source.
- Future production direction: Keep the public experience, but source active services/pricing from Supabase or a typed service repository with deterministic seed data for local/demo use.

### `/about`

- Purpose: Studio/about page for brand context.
- Current data source: Static page content.
- Auth requirement: None.
- Readiness: Demo-ready.
- Known limitations: Static marketing content only.
- Future production direction: Keep static unless the owner needs editable content later.

### `/book`

- Purpose: Customer booking UI for selecting service, date, time, and customer details.
- Current data source: Static services from `lib/services.ts`; availability from `/api/booking/availability`.
- Auth requirement: None.
- Readiness: Demo-ready, not production-ready.
- Known limitations: Fixed slots, no real business hours, no owner-managed blocked times/days, no hold expiration, and no timezone model.
- Future production direction: Use a booking repository backed by Supabase availability rules, availability blocks, existing appointments, service durations, buffers, and hold expiration.

### `/checkout`

- Purpose: Mock Square-style deposit checkout for a created appointment.
- Current data source: Appointment lookup from `lib/appointments.ts` using `data/appointments.json`.
- Auth requirement: None.
- Readiness: Local mock/demo only.
- Known limitations: Does not create real Square checkout sessions, does not charge a card, and relies on local appointment files.
- Future production direction: Replace with `POST /api/checkout/create` and Square hosted Checkout or Web Payments SDK flow. Keep mock mode for local/demo.

### `/book/confirmation`

- Purpose: Customer confirmation/hold page after mock checkout or appointment creation.
- Current data source: Query params plus appointment lookup from `lib/appointments.ts`.
- Auth requirement: None.
- Readiness: Demo-ready.
- Known limitations: Confirmation can be driven by query params and local mock payment state.
- Future production direction: Show trusted appointment/payment state from Supabase after verified Square webhook reconciliation.

### `/services/[serviceId]`

- Purpose: Service/package detail page with service summary and booking CTA.
- Current data source: Static services from `lib/services.ts`.
- Auth requirement: None.
- Readiness: Demo-ready.
- Known limitations: Static service catalog and generated static params.
- Future production direction: Source active services from Supabase or a service repository while preserving deterministic seed data for local/demo.

## Owner Pages

### `/owner/login`

- Purpose: Owner login form.
- Current data source: Owner credentials from environment variables through `lib/admin-auth.ts`.
- Auth requirement: Redirects authenticated users to `/owner/dashboard`; unauthenticated users can view login.
- Readiness: Works for current single-owner demo.
- Known limitations: Custom credential auth is simple and single-owner oriented; demo credentials can be shown only in local demo mode.
- Future production direction: Consider Supabase Auth for managed auth, multi-admin support, password reset, and stronger operational controls.

### `/owner/dashboard`

- Purpose: Protected owner dashboard with appointment stats and appointment management.
- Current data source: `lib/appointments.ts` reading/writing `data/appointments.json`.
- Auth requirement: Requires valid owner session cookie.
- Readiness: Demo-ready, not production-ready.
- Known limitations: No blocked time/day controls, no durable database, no audit events, no real payment reconciliation, and no real notifications.
- Future production direction: Back dashboard with Supabase repositories for appointments, payments, availability blocks, settings, notification logs, and audit events.

## Booking APIs

### `GET /api/booking/availability`

- Purpose: Returns slots for a requested date and marks reserved times.
- Current data source: Fixed slot list from `lib/availability.ts`; reserved times from `lib/appointments.ts`.
- Auth requirement: None.
- Readiness: Demo-ready, not production-ready.
- Known limitations: Only exact time strings are reserved; service duration, buffers, blocked times/days, business hours, timezone, and hold expiration are not modeled.
- Future production direction: Query Supabase through an availability service that calculates valid slots from rules, blocks, service duration, buffers, existing appointments, and active holds.

### `POST /api/booking/quote`

- Purpose: Validates service/date and returns price, deposit, duration, and amount due later.
- Current data source: Static services from `lib/services.ts`.
- Auth requirement: None.
- Readiness: Demo-ready.
- Known limitations: Service/pricing data is static and not owner-editable.
- Future production direction: Source quote data from active Supabase services and enforce server-side pricing at appointment creation.

### `POST /api/booking/create`

- Purpose: Validates customer booking details, rate limits requests, creates a pending appointment, creates a mock Square checkout URL, and returns notification stub data.
- Current data source: `lib/appointments.ts`, `lib/square.ts`, `lib/notifications.ts`, `lib/rate-limit.ts`.
- Auth requirement: None.
- Readiness: Demo-ready, not production-ready.
- Known limitations: File-backed writes are not durable on Vercel; in-memory mutation queue is not safe across serverless instances; Square and notifications are stubs; pending holds do not expire.
- Future production direction: Use Supabase transaction/RPC for appointment holds, create a real Square checkout session, store payment records, and queue real owner notifications.

## Checkout And Payment APIs

### `POST /api/checkout/complete`

- Purpose: Completes the local mock checkout and marks appointment deposit paid.
- Current data source: `lib/appointments.ts` local file-backed appointment store.
- Auth requirement: None.
- Readiness: Local mock/demo only.
- Known limitations: No real payment provider, no Square payment ID, no webhook verification, and no idempotent payment reconciliation.
- Future production direction: Keep only for local mock mode or test helpers. Production should confirm appointments from verified Square webhook events.

### `POST /api/square/webhook`

- Purpose: Receives Square webhook events and verifies signatures when configured.
- Current data source: Request body and `SQUARE_WEBHOOK_SIGNATURE_KEY`.
- Auth requirement: No user auth; relies on Square signature verification when enabled.
- Readiness: Signature verification scaffold exists, but payment reconciliation is not implemented.
- Known limitations: Does not map Square events to payments/appointments, does not update appointment status, and does not implement idempotency/event dedupe.
- Future production direction: Verify signatures, store webhook event IDs, process idempotently, update payment and appointment records, and send notification events.

## Owner APIs

### `GET /api/owner/session`

- Purpose: Returns current owner session status.
- Current data source: Signed owner session cookie via `lib/admin-auth.ts`.
- Auth requirement: Requires valid owner session; returns 401 otherwise.
- Readiness: Demo-ready for current custom auth.
- Known limitations: No role/permission model beyond single owner role.
- Future production direction: Integrate with Supabase Auth or a stronger owner/admin session model if multi-admin support is needed.

### `POST /api/owner/auth/login`

- Purpose: Validates owner credentials, rate limits login attempts, and sets signed owner session cookie.
- Current data source: Environment variables via `lib/admin-auth.ts`; in-memory rate limiter.
- Auth requirement: Public login endpoint with same-origin checks.
- Readiness: Works for current single-owner demo.
- Known limitations: In-memory rate limiting resets across serverless instances; no password reset, MFA, or account lifecycle.
- Future production direction: Prefer Supabase Auth for production owner accounts, or harden custom auth with durable rate limits and audit logs.

### `POST /api/owner/auth/logout`

- Purpose: Clears owner session cookie.
- Current data source: Signed owner session cookie settings from `lib/admin-auth.ts`.
- Auth requirement: Same-origin protected; does not require a valid session to clear cookie.
- Readiness: Demo-ready.
- Known limitations: No server-side session revocation because sessions are stateless cookies.
- Future production direction: Use managed auth session revocation if Supabase Auth is adopted.

### `GET /api/owner/appointments`

- Purpose: Returns owner appointment list.
- Current data source: `lib/appointments.ts` local file-backed appointment store.
- Auth requirement: Requires valid owner session.
- Readiness: Demo-ready, not production-ready.
- Known limitations: Reads local JSON file; no pagination, date filtering, search query, audit data, or database persistence.
- Future production direction: Query Supabase appointments with filters, pagination, customer/payment joins, and role-based auth.

### `PATCH /api/owner/appointments/[appointmentId]`

- Purpose: Updates appointment status, payment status, and owner notes.
- Current data source: `lib/appointments.ts` local file-backed appointment store.
- Auth requirement: Requires valid owner session and same-origin request.
- Readiness: Demo-ready, not production-ready.
- Known limitations: No audit events, no validation of status transition rules, no refund workflow, no notification side effects, and no durable persistence.
- Future production direction: Enforce status transitions server-side, update Supabase records transactionally, create audit events, and trigger notifications when needed.

## Missing Production Routes Likely Needed

### `GET /api/services`

- Purpose: Return active bookable services.
- Future data source: Supabase `services` table or typed service repository.
- Auth requirement: None for active public services.

### `POST /api/checkout/create`

- Purpose: Create a real Square checkout session for an appointment deposit.
- Future data source: Supabase `appointments` and `payments`; Square Checkout API.
- Auth requirement: Public but validated and rate-limited.

### `POST /api/owner/availability-blocks`

- Purpose: Let owner block a time range or full day.
- Future data source: Supabase `availability_blocks`.
- Auth requirement: Owner/admin only with same-origin/CSRF-aware protections.

### `DELETE /api/owner/availability-blocks/[id]`

- Purpose: Let owner remove a blocked time/day.
- Future data source: Supabase `availability_blocks`.
- Auth requirement: Owner/admin only with same-origin/CSRF-aware protections.

### `GET /api/owner/settings`

- Purpose: Return owner-managed settings such as timezone, business hours, buffers, notification preferences, and deposit rules.
- Future data source: Supabase `settings` or structured settings tables.
- Auth requirement: Owner/admin only.

### `PATCH /api/owner/settings`

- Purpose: Update owner-managed scheduling/payment/notification settings.
- Future data source: Supabase `settings` or structured settings tables.
- Auth requirement: Owner/admin only with same-origin/CSRF-aware protections and audit events.
