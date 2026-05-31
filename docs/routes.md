# Route And API Inventory

This document captures the current Aliz Studio routes before production scheduling work begins. The app currently uses a demo-safe file-backed service repository, a local file-backed appointment store, mock checkout behavior, custom owner auth, and placeholder notification/payment integrations.

## Public Pages

### `/`

- Purpose: Public homepage with brand hero, service overview, and booking entry points.
- Current data source: Service repository helpers from `lib/services.ts` through `components/service-grid.tsx`.
- Auth requirement: None.
- Readiness: Demo-ready, not production-complete.
- Known limitations: Service edits are demo/file-backed and not durable production data.
- Future production direction: Keep the public experience, but source active services/pricing from Supabase or a typed service repository with deterministic seed data for local/demo use.

### `/about`

- Purpose: Studio/about page for brand context.
- Current data source: Static page content.
- Auth requirement: None.
- Readiness: Demo-ready.
- Known limitations: Static marketing content only.
- Future production direction: Keep static unless the owner needs editable content later.

### `/packages`

- Purpose: Public package comparison page with richer service descriptions, price, duration, deposit, best-for guidance, inclusions, and booking CTAs.
- Current data source: Service repository helpers from `lib/services.ts` for price/duration/deposit/images plus marketing copy from `lib/package-copy.ts`.
- Auth requirement: None.
- Readiness: Demo-ready.
- Known limitations: Package copy remains static; service edits are demo/file-backed and deep-linked booking selection uses current `/book?service=` behavior.
- Future production direction: Source active services and owner-editable package copy from Supabase or a service repository while preserving deterministic local/demo seed data.

### `/book`

- Purpose: Customer booking UI for selecting service, date, time, and customer details.
- Current data source: Active/bookable service repository data from `lib/services.ts`; availability from `/api/booking/availability`.
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
- Current data source: Public service repository data from `lib/services.ts`.
- Auth requirement: None.
- Readiness: Demo-ready.
- Known limitations: Service edits are demo/file-backed; stable generated params remain tied to the core demo service IDs.
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

### `/owner/services`

- Purpose: Protected owner service/menu management for demo-safe package edits.
- Current data source: Service repository helpers from `lib/services.ts` backed by local or Vercel temp JSON storage.
- Auth requirement: Requires valid owner session cookie.
- Readiness: Demo-ready, not production-durable.
- Known limitations: Edits are file-backed/ephemeral on Vercel, do not create audit events, and do not support deleting core demo services.
- Future production direction: Map to the Supabase `services` table through a production service repository with durable audit events and owner permissions.

### `/owner/availability`

- Purpose: Protected owner availability and booking-rule management for weekly hours, open/closed day toggles, optional breaks, blocked dates, lead time, per-slot/day limits, and timezone display.
- Current data source: Availability repository helpers from `lib/availability.ts` backed by ignored local JSON storage or Vercel temp storage.
- Auth requirement: Requires valid owner session cookie.
- Readiness: Demo-ready, not production-durable.
- Known limitations: Uses the current fixed slot list, file-backed settings are ephemeral on Vercel, max appointment settings are demo-safe guardrails, and no audit events are written yet.
- Future production direction: Map weekly rules and blocked dates to Supabase availability tables, enforce booking holds transactionally, and create audit events for owner changes.

### `/owner/customers`

- Purpose: Protected owner client book with customer records, booking history, customer search, summary metrics, and owner-only notes/preferences.
- Current data source: Customer records are derived from appointment data in `lib/customers.ts`; owner notes, tags, and preferences are stored through the customer profile repository.
- Auth requirement: Requires valid owner session cookie.
- Readiness: Demo-ready, not production-durable.
- Known limitations: Customer records are derived from booking contact fields, customer profile storage is local/ephemeral on Vercel, and there is no customer account system, export/delete workflow, or audit trail yet.
- Future production direction: Map to Supabase `customers` plus customer preference/profile tables, add RLS, audit events, data export/deletion policy, and durable search/filtering.

## Booking APIs

### `GET /api/booking/availability`

- Purpose: Returns slots for a requested date and marks reserved times.
- Current data source: Fixed slot list filtered by owner-managed availability settings from `lib/availability.ts`; active appointment counts from `lib/appointments.ts`.
- Auth requirement: None.
- Readiness: Demo-ready, not production-ready.
- Known limitations: Availability now respects weekly open hours, closed days, blocked dates, optional breaks, lead time, and simple per-slot/day limits, but still uses fixed time labels and does not model service-duration overlap, buffers, booking holds, or durable transactions.
- Future production direction: Query Supabase through an availability service that calculates valid slots from rules, blocks, service duration, buffers, existing appointments, and active holds.

### `POST /api/booking/quote`

- Purpose: Validates service/date and returns price, deposit, duration, and amount due later.
- Current data source: Active/bookable service repository data from `lib/services.ts`.
- Auth requirement: None.
- Readiness: Demo-ready.
- Known limitations: Service/pricing edits are demo-file-backed until Supabase is connected.
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

### `PATCH /api/owner/services/[serviceId]`

- Purpose: Updates demo-safe service/menu fields such as name, short description, price, deposit, duration, active/bookable status, featured state, public visibility, and sort order.
- Current data source: File-backed service repository seeded from the core service catalog.
- Auth requirement: Requires valid owner session and same-origin request.
- Readiness: Demo-ready, not production-durable.
- Known limitations: Stable IDs/slugs, images, inclusions, and core routes are intentionally preserved; edits are ephemeral on Vercel until Supabase is active.
- Future production direction: Update Supabase service records transactionally, add audit events, validate owner permissions, and revalidate public package/booking views.

### `GET /api/owner/availability`

- Purpose: Returns current owner availability settings for protected owner tooling.
- Current data source: Availability repository seeded from default demo-safe settings.
- Auth requirement: Requires valid owner session.
- Readiness: Demo-ready, not production-durable.
- Known limitations: File-backed settings are local/ephemeral, no audit trail exists, and the data shape is a Supabase-ready bridge rather than the final schema adapter.
- Future production direction: Read Supabase availability rules, availability blocks, booking rules, and owner settings with role-aware owner permissions.

### `PATCH /api/owner/availability`

- Purpose: Updates weekly hours, blocked dates, and booking-rule settings.
- Current data source: Availability repository writing ignored local JSON storage or Vercel temp storage.
- Auth requirement: Requires valid owner session and same-origin request.
- Readiness: Demo-ready, not production-durable.
- Known limitations: Updates do not write audit events, do not auto-cancel existing appointments, and do not touch Supabase yet.
- Future production direction: Transactionally update Supabase availability tables, validate conflicts with existing appointments, and create owner audit events.

### `GET /api/owner/customers`

- Purpose: Returns protected owner customer records derived from appointment history.
- Current data source: `lib/customers.ts` combining appointment repository records with customer profile repository data.
- Auth requirement: Requires valid owner session.
- Readiness: Demo-ready, not production-durable.
- Known limitations: No pagination, no durable customer table, and no public/customer self-service access.
- Future production direction: Query Supabase customer records with appointment/payment aggregates, RLS, pagination, and privacy controls.

### `PATCH /api/owner/customers/[customerId]`

- Purpose: Updates owner-only customer notes, sensitive owner note, preferred cut, preferred time window, and simple customer tags.
- Current data source: Customer profile repository writing ignored local JSON storage or Vercel temp storage.
- Auth requirement: Requires valid owner session and same-origin request.
- Readiness: Demo-ready, not production-durable.
- Known limitations: Notes/preferences are not audit logged, profile IDs are derived from appointment contact identity, and changes are ephemeral on Vercel until Supabase is active.
- Future production direction: Persist to Supabase customer/profile tables with audit events, role-aware permissions, and retention/export/deletion controls.

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
- Future data source: Supabase `availability_blocks`; current demo owner availability uses `PATCH /api/owner/availability` for blocked dates.
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
