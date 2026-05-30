# Admin Production Readiness Roadmap

This roadmap captures the current owner/admin production-readiness status and a PR-sized implementation plan for taking Aliz Studio from a polished demo to a production-ready booking app.

It is a planning document only. It does not activate Supabase, real payments, real notifications, durable customer storage, or a new auth provider.

## Current Architecture Snapshot

- Public routes: `/`, `/about`, `/book`, `/checkout`, `/book/confirmation`, and `/services/[serviceId]`.
- Owner routes: `/owner/login` and `/owner/dashboard`.
- Booking APIs: `/api/booking/availability`, `/api/booking/quote`, and `/api/booking/create`.
- Checkout/payment APIs: `/api/checkout/complete` and `/api/square/webhook`.
- Owner APIs: `/api/owner/session`, `/api/owner/auth/login`, `/api/owner/auth/logout`, `/api/owner/appointments`, and `/api/owner/appointments/[appointmentId]`.
- Data boundary: `lib/repositories` defines an appointment repository interface with `file`, `demo`, and future `supabase` backends.
- Current runtime backend: `file`, with local JSON storage and Vercel temp storage for demo-safe serverless use.
- Domain layer: `lib/domain` owns canonical shared types, constants, and Zod schemas.
- Demo data: `lib/demo` owns deterministic seed collections for future mock repositories and Supabase seeding.
- Supabase planning: `supabase/migrations/0001_create_aliz_studio_core_schema.sql` and `docs/supabase.md` define the database foundation, but runtime integration is not active.
- Services: current public services are static in `lib/services.ts`.
- Payments: Square package and webhook scaffold exist, but checkout remains mock/demo-only.
- Notifications: current notification behavior is a stub and does not send real email or SMS.
- Owner auth: custom single-owner signed HttpOnly cookie auth through environment variables.
- Tests: Playwright covers public flow, booking, mock checkout, owner auth/dashboard basics, theme, PWA, responsive, and visual regression-sensitive states.

## Production-Readiness Assessment

### Demo-Ready Today

- Premium public website in light and night themes.
- Theme toggle with local persistence.
- Service browsing and service detail routes.
- Guided booking flow with service, date, time, customer details, and mock deposit handoff.
- Mock Square-style checkout and confirmation path.
- Owner login/logout with signed HttpOnly cookie sessions.
- Protected owner dashboard with appointment stats, search/filter, status edits, payment-status edits, and owner notes.
- PWA manifest and install CTA.
- Deterministic demo seed data and a future-ready domain model.
- Supabase schema plan and repository boundary.

### Production-Ready Today

- Public UI polish and responsive presentation are close to production quality.
- Basic input validation, security headers, same-origin protections, and owner session cookie handling are in place.
- Route and API inventory is documented.
- Database, repository, seed-data, and deployment directions are documented.

### Mock Or Demo-Only Today

- Appointment persistence is file-backed and ephemeral on Vercel.
- Availability uses fixed slots and existing appointment time checks only.
- Services are static and not owner-editable.
- Checkout is mock-only and does not charge cards.
- Square webhook handling does not reconcile payments.
- Notifications are not actually sent.
- Rate limiting is in-memory and not durable across serverless instances.
- Owner auth is custom and single-owner oriented.
- Customer records are appointment fields, not durable customer profiles.
- Audit events, settings, availability blocks, and notification logs are not active runtime features yet.

### Must Be Connected Before Real Customers Use It

- Durable Supabase Postgres persistence for appointments, customers, payments, holds, availability, settings, notification logs, and audit events.
- Transaction-safe booking creation that prevents double-booking.
- Owner-managed availability rules and blocked times/days.
- Real Square hosted checkout or Web Payments flow for deposits.
- Verified, idempotent Square webhook reconciliation.
- Real owner notification provider, likely Resend first and optional Twilio later.
- Production-safe rate limiting and audit logging for sensitive owner and booking actions.
- Production credentials and deployment configuration reviewed by the owner.

### Can Be Built Now Without Production Credentials

- Owner appointment detail route or drawer.
- Richer owner appointment filters and date-range controls.
- Service management UI backed by demo/file repository adapters.
- Availability settings UI backed by deterministic demo data.
- Owner settings UI with local/demo adapter.
- Customer list derived from appointment data.
- Dashboard metrics from existing appointment/demo repositories.
- Audit-log UI backed by deterministic demo events.
- Repository interfaces for services, availability, settings, customers, payments, notifications, and audit events.

### Should Wait For Owner Approval

- Enabling Supabase as the runtime backend.
- Migrating real customer or appointment data into Supabase.
- Enabling Square live or sandbox payment capture beyond mock mode.
- Sending real emails or SMS.
- Replacing owner auth with Supabase Auth or another provider.
- Any DNS, Vercel project, credential, or production environment changes.

## Complete Admin Feature Set

### Appointment Management

Target owner capabilities:

- View all appointments with date, time, customer, service, status, payment status, and notes.
- Search by customer name, phone, email, service, or appointment ID.
- Filter by status, payment status, service, and date range.
- Open an appointment detail view or drawer.
- Move appointments through the status workflow:
  - `pending_deposit`
  - `confirmed`
  - `completed`
  - `cancelled`
  - `no_show`
- Edit owner notes.
- View customer notes.
- Reschedule appointment date/time after conflict checks.
- Cancel appointment with reason.
- Record no-show.
- Display deposit/payment state and receipt/provider references when available.
- Export appointment lists as CSV later if useful.

Near-term data needs:

- Extend `AppointmentRepository` with detail-friendly reads and filters before adding pagination.
- Add `AppointmentAuditRepository` or appointment event write methods when mutating status, notes, cancellation, reschedule, payment state, or blocked time side effects.

### Service/Menu Management

Target owner capabilities:

- View service catalog.
- Edit name, short name, price, deposit, duration, description, detail copy, inclusions, and style note.
- Enable or disable services.
- Mark featured/signature services.
- Control sort order.
- Map a service to an approved image asset.
- Validate price/deposit/duration before saving.

Near-term data needs:

- Add `ServiceRepository` with file/demo adapter first.
- Keep current static `lib/services.ts` exports compatible until the repository is ready.
- Supabase table `services` already supports this direction.

### Availability And Settings

Target owner capabilities:

- Manage weekly business hours.
- Add all-day closures.
- Add partial-day blocked time.
- Add recurring or one-off lunch/break blocks.
- Configure slot interval, buffer minutes, booking window days, deposit hold minutes, lead time, cancellation cutoff, and timezone.
- See conflicts if a new block overlaps existing appointments.

Near-term data needs:

- Add `AvailabilityRepository` and `SettingsRepository`.
- Availability calculation must account for service duration, buffers, business rules, availability blocks, existing appointments, active holds, hold expiration, and timezone.
- Supabase should enforce active appointment overlap prevention through the existing exclusion constraint and transaction/RPC flow.

### Deposit And Payment Settings

Target owner capabilities:

- Display current mode: demo/mock or production.
- Configure deposit amount or percentage by service later.
- Toggle deposit requirement by service when production policy is approved.
- Show provider readiness state without exposing secrets.
- View payment records tied to appointments.
- Handle refund/manual adjustment records later with audit events.

Near-term data needs:

- Add `PaymentRepository` and settings models for deposit rules.
- Keep `/checkout` and `/api/checkout/complete` mock-only until Square integration is explicitly approved.
- Production confirmation should happen only after verified Square webhook reconciliation.

### Customer And Client Records

Target owner capabilities:

- View a customer list derived from bookings.
- See contact info, appointment count, last visit, upcoming appointment, booking history, and owner notes.
- Search customer name, phone, and email.
- Avoid unnecessary sensitive fields.
- Include privacy notes and deletion/export plan later.

Near-term data needs:

- Add `CustomerRepository`.
- Do not store more PII than needed.
- Start with records created from bookings; no customer account system is needed for MVP.

### Notifications Readiness

Target owner capabilities:

- Configure owner notification email.
- See notification attempt status per appointment.
- Later enable customer confirmation/cancellation/reschedule messages.
- Retry failed notifications when provider logs exist.

Near-term data needs:

- Add provider-agnostic `NotificationRepository`.
- Add durable `notification_logs`.
- Do not mark a notification as `sent` until the provider confirms success.
- Resend email should be first; Twilio SMS is optional.

### Dashboard Metrics

Target owner capabilities:

- Upcoming appointments.
- Pending deposits.
- Projected revenue.
- Deposits collected.
- Completed appointments.
- Cancellations and no-shows.
- Date-range filter.
- Simple trend cards only when data is durable enough.

Near-term data needs:

- Keep metrics derived from appointment/payment repositories.
- Avoid analytics complexity until production data exists.

### Admin Settings

Target owner capabilities:

- Shop name, tagline, contact email/phone, address/location if approved.
- Public booking copy and demo/production mode labels.
- Booking timezone, hold minutes, booking window, lead time, cancellation cutoff.
- PWA/install copy if owner wants it editable.
- Optional default theme preference later.

Near-term data needs:

- Add `SettingsRepository` with structured typed settings.
- Store settings in Supabase `app_settings` or typed tables later.

### Security And Audit

Target owner capabilities and operational needs:

- Clear owner auth status and logout controls.
- Safe invalid-session handling.
- Same-origin/CSRF-aware protections for mutations.
- Durable rate limiting before real public booking writes.
- Audit events for appointment changes, payment changes, cancellations, note edits, availability blocks, settings changes, and notification retries.
- Sanitized diagnostics only; never log or display secret values.

Near-term data needs:

- Add `AuditRepository`.
- Add event writes alongside owner mutations.
- Decide whether custom auth remains acceptable or Supabase Auth replaces it after owner approval.

## Proposed Data Models And Repository Interfaces

The existing domain model already includes the main shapes. Future repositories should preserve current API compatibility while moving storage behind typed adapters.

### Appointment Repository

Already exists. Extend carefully with:

- `listAppointments(filters)`
- `getAppointmentDetail(id)`
- `rescheduleAppointment(id, input)`
- `cancelAppointment(id, input)`
- `appendOwnerNote(id, note)` or typed note update
- `listAppointmentEvents(id)`

### Service Repository

Suggested methods:

- `listServices(filters)`
- `getServiceById(serviceId)`
- `createService(input)` if owner-created services are approved
- `updateService(serviceId, patch)`
- `setServiceActive(serviceId, active)`
- `reorderServices(input)`

### Availability Repository

Suggested methods:

- `listBusinessHours()`
- `updateBusinessHours(input)`
- `listAvailabilityBlocks(filters)`
- `createAvailabilityBlock(input)`
- `deleteAvailabilityBlock(blockId)`
- `getBookableSlots(input)`
- `validateSlot(input)`

### Customer Repository

Suggested methods:

- `listCustomers(filters)`
- `getCustomerById(customerId)`
- `findOrCreateCustomer(contact)`
- `updateCustomerNotes(customerId, notes)`
- `listCustomerAppointments(customerId)`

### Settings Repository

Suggested methods:

- `getOwnerSettings()`
- `updateOwnerSettings(patch)`
- `getBookingSettings()`
- `updateBookingSettings(patch)`
- `getPaymentSettings()`
- `updatePaymentSettings(patch)`

### Payment Repository

Suggested methods:

- `createDepositPayment(input)`
- `getPaymentByAppointmentId(appointmentId)`
- `markPaymentPending(input)`
- `markPaymentPaid(input)`
- `markPaymentRefunded(input)`
- `recordProviderReference(input)`
- `recordWebhookEvent(input)`
- `hasProcessedWebhookEvent(providerEventId)`

### Notification Repository

Suggested methods:

- `createNotificationAttempt(input)`
- `markNotificationSent(input)`
- `markNotificationFailed(input)`
- `listAppointmentNotifications(appointmentId)`

### Audit Repository

Suggested methods:

- `recordAppointmentEvent(input)`
- `recordSettingsEvent(input)`
- `listAppointmentEvents(appointmentId)`
- `listRecentAdminEvents(filters)`

## PR-Sized Implementation Roadmap

### Sprint 1: Admin Appointment Detail And Status Workflow

Status: implemented on 2026-05-30 in demo-safe file-backed mode.

Objective: Make appointment management feel complete without changing persistence.

Scope:

- Add appointment detail route or drawer from the owner dashboard.
- Show complete appointment, customer, service, payment, and notes context.
- Keep current status/payment update behavior.
- Add cancellation/no-show/completed workflow affordances with current status values.
- Add friendly empty/error states.

Out of scope:

- Supabase, real payments, real notifications, rescheduling, and audit persistence.

Acceptance criteria:

- Owner can open appointment detail from dashboard.
- Owner can update status, payment status, and notes from detail view.
- Existing dashboard list still works.
- Current API response shapes remain compatible.

Tests:

- Owner login reaches dashboard.
- Appointment detail opens or route renders.
- Status update persists through existing owner API.
- Invalid/unauthenticated access is handled.

Docs:

- Update `docs/ADMIN_ROADMAP.md`, `docs/NEXT_STEPS.md`, and `docs/PROGRESS_LOG.md`.

Risks:

- Avoid duplicating update logic between list cards and detail view.
- Avoid adding real customer detail storage beyond current appointment fields.

### Sprint 2: Service Management UI With Demo Repository

Objective: Let the owner manage service definitions in a demo-safe admin surface.

Scope:

- Add `ServiceRepository` interface with static/demo adapter.
- Add owner service list and edit form.
- Preserve public static-service behavior until the repository is explicitly wired.
- Validate price, deposit, duration, active flag, featured flag, and sort order.

Out of scope:

- Supabase service writes and image upload management.

Acceptance criteria:

- Owner can view and edit demo service data.
- Public booking flow does not change unless explicitly wired.
- Light/night themes stay polished.

Tests:

- Owner services page renders.
- Validation catches invalid price/duration/deposit.
- Public service IDs remain unchanged.

Docs:

- Update service-management section and repository docs.

Risks:

- Accidental drift between static services and demo services.

### Sprint 3: Availability Settings UI With Demo Repository

Objective: Give the owner a safe preview of hours and blocked-time management.

Scope:

- Add availability settings page.
- Display weekly hours.
- Add all-day and time-range block forms backed by demo/in-memory data.
- Document that it is not production scheduling yet.

Out of scope:

- Real availability calculation changes and automatic appointment conflict resolution.

Acceptance criteria:

- Owner can see weekly schedule and demo blocks.
- Owner can add/remove demo blocks in-memory.
- Booking API remains unchanged unless separately approved.

Tests:

- Availability settings page renders.
- Block forms validate start/end and all-day fields.
- Existing booking flow still passes.

Docs:

- Update routes and production readiness notes if new owner routes are added.

Risks:

- Users may assume blocks affect public booking. Copy must clearly mark demo status until wired.

### Sprint 4: Settings And Data Model Hardening

Objective: Add typed admin settings and prepare repository interfaces for production.

Scope:

- Add `SettingsRepository`, settings schemas, and demo adapter.
- Define owner settings, booking settings, payment settings, notification settings, and public copy settings.
- Add owner settings UI.

Out of scope:

- Secret management UI and production provider configuration.

Acceptance criteria:

- Settings are typed, validated, and demo-safe.
- No secrets are displayed or saved.

Tests:

- Settings page renders.
- Validation catches invalid timezone/hold/window values.
- No secret placeholders are exposed.

Docs:

- Update `.env.example` only for variable names if needed.
- Update docs for settings scope.

Risks:

- Avoid placing provider secrets in editable client-visible settings.

### Sprint 5: Supabase Repository Implementation Behind Feature Flag

Objective: Implement Supabase adapters without making them default.

Scope:

- Add server-only Supabase client helper.
- Implement appointment/customer/payment/service/availability/settings repository adapters as needed.
- Keep `ALIZ_ENABLE_SUPABASE_REPOSITORY=false` by default.
- Add local/static validation instructions.

Out of scope:

- Live production migration and real customer data migration.

Acceptance criteria:

- App builds without Supabase env values unless Supabase backend is selected.
- Supabase backend fails closed when required env is missing.
- File backend remains default.

Tests:

- Repository factory selection tests through Playwright or lightweight route checks.
- Supabase-disabled build passes.

Docs:

- Update `docs/supabase.md`, `docs/repositories.md`, and deployment docs.

Risks:

- Accidentally exposing service role keys or selecting Supabase too early.

### Sprint 6: Production Booking Persistence Dry Run

Objective: Exercise production-shaped booking creation with Supabase in a controlled mode.

Scope:

- Add transaction/RPC path for customer, appointment, hold, and pending payment records.
- Enforce overlap prevention.
- Keep Square mocked unless payment sprint is active.
- Add hold expiration strategy.

Out of scope:

- Live payment capture.

Acceptance criteria:

- Booking creation uses durable records in Supabase-enabled test/staging mode.
- Double-booking is prevented.
- File/demo modes still work.

Tests:

- Slot conflict tests.
- Hold-expiration behavior tests.
- Existing public flow tests.

Docs:

- Update route/API and production readiness docs.

Risks:

- Race conditions around slot reservation and hold expiration.

### Sprint 7: Square Deposit Planning And Integration

Objective: Replace mock deposit with verified Square flow when owner approves.

Scope:

- Add `POST /api/checkout/create`.
- Create Square checkout sessions server-side.
- Store payment records and provider references.
- Verify Square webhooks and reconcile idempotently.
- Keep mock mode for local/demo.

Out of scope:

- Non-Square payment providers.

Acceptance criteria:

- Production mode confirms appointments only after verified Square payment.
- Webhooks are signature-verified and idempotent.
- No card data is stored by the app.

Tests:

- Mock webhook verification paths.
- Idempotency tests.
- Local mock checkout remains available.

Docs:

- Update deployment, Square, route, and owner docs.

Risks:

- Payment/webhook edge cases and refund policy decisions.

### Sprint 8: Notification Provider Planning And Integration

Objective: Add real owner/customer notifications after provider choice.

Scope:

- Add provider-agnostic notification service.
- Start with Resend email.
- Add Twilio SMS only if approved.
- Log notification attempts and provider outcomes.

Out of scope:

- Marketing campaigns or customer accounts.

Acceptance criteria:

- Notifications are recorded and only marked sent after provider success.
- Failed attempts are visible to owner/admin later.

Tests:

- Provider mock tests.
- Failure/retry visibility.

Docs:

- Update notification docs and environment variable guidance.

Risks:

- Sending to real recipients during testing; keep explicit staging safeguards.

### Sprint 9: Final Production Readiness Checklist

Objective: Confirm the app is ready for real customer booking after owner approval.

Scope:

- Review env vars and Vercel config.
- Confirm database migrations and RLS posture.
- Confirm Square webhook endpoint and signatures.
- Confirm notification provider.
- Confirm owner flows, public flows, accessibility, SEO, PWA, and mobile layouts.
- Confirm backup/rollback expectations.

Out of scope:

- New feature expansion.

Acceptance criteria:

- Production readiness checklist is complete.
- Owner signs off on policies and credentials.
- Live smoke test passes with staging or production credentials.

Tests:

- Full e2e suite.
- Manual live smoke test.
- Provider webhook test.

Docs:

- Update `docs/deployment.md`, `docs/NEXT_STEPS.md`, and `docs/PROGRESS_LOG.md`.

Risks:

- Real customer data and payment flows require cautious rollout and monitoring.

## Recommended Next Implementation Sprint

The next single Codex task should be:

**Service management UI with a demo repository, still demo-safe.**

Why this is the right next step:

- Appointment detail/status management is now in place.
- Services remain static and are the next owner/admin surface that can be safely built without production credentials.
- A service repository boundary will prepare the public menu and booking quote flow for future Supabase-backed services.
- It creates the owner-editable foundation for names, descriptions, prices, deposits, durations, active flags, and sort order while preserving the current public booking demo.

Suggested next prompt:

```text
Build Sprint 2 from docs/ADMIN_ROADMAP.md: add a demo-safe owner service management UI and service repository interface/adapters. Preserve current public service IDs, booking behavior, mock payments, owner auth, file-backed appointment behavior, and light/night themes. Add tests and docs.
```
