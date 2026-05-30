# Supabase Schema Plan

This document describes the Supabase-ready database foundation for the production Aliz Studio booking backend. It is a planning and migration task only: the app still uses static services, file-backed appointments, mock checkout, custom owner auth, and stub notifications.

## Files Added

- `supabase/migrations/0001_create_aliz_studio_core_schema.sql`
- `docs/supabase.md`

## Purpose

The schema prepares durable Postgres storage for services, customers, appointments, booking holds, Square deposit payments, webhook idempotency, business hours, blocked times/days, notification logs, owner/admin settings, and appointment audit events.

It maps to the canonical domain module in `lib/domain` and the deterministic demo seed collections in `lib/demo`, but it is not wired into runtime behavior yet.

## Tables

- `services`: durable service catalog. Uses text IDs so current slugs such as `basic-cut`, `plus-cut`, and `deluxe-cut` remain compatible with the public booking flow and demo seed data.
- `customers`: customer contact records for bookings. Customers do not need accounts for the MVP.
- `appointments`: scheduled appointment records with service/customer references, `starts_at`, `ends_at`, timezone, status, notes, cancellation fields, and price/deposit snapshots.
- `booking_holds`: future hold-expiration records tied to appointments while deposits are pending.
- `payments`: Square deposit payment records with provider references, checkout/payment IDs, idempotency key, raw provider payload, paid/refunded timestamps, and checkout mode.
- `square_webhook_events`: Square webhook idempotency and audit records.
- `availability_rules`: recurring business-hour rules by weekday and local time.
- `availability_blocks`: owner-managed all-day and time-range blocks.
- `notification_logs`: notification attempt records for email/SMS provider responses.
- `admin_users`: future owner/admin profile table for Supabase Auth integration.
- `app_settings`: JSON settings table for owner settings, booking settings, notification preferences, and feature flags.
- `appointment_events`: append-only appointment audit trail for owner actions, payment updates, cancellations, notes, and blocked-time activity.

## Domain Mapping

- `Service` maps to `services`, with current dollar fields converted to `price_cents` and `deposit_cents`.
- `Customer` and `CustomerContact` map to `customers`.
- `Appointment` maps to `appointments`; current date/time labels become `starts_at`, `ends_at`, and `timezone`.
- `BookingHold` maps to `booking_holds`.
- `DepositPayment`, `Payment`, and `PaymentProviderReference` map to `payments`.
- `BusinessHoursRule` / `AvailabilityRule` map to `availability_rules`.
- `AvailabilityBlock` maps to `availability_blocks`.
- `NotificationLog` maps to `notification_logs`.
- `OwnerSettings` and `BookingSettings` can be stored in `app_settings`.
- `AppointmentAuditEvent` / `AppointmentEvent` map to `appointment_events`.

## Preserved Values

Appointment statuses:

- `pending_deposit`
- `confirmed`
- `completed`
- `cancelled`
- `no_show`

Payment statuses:

- `pending`
- `paid`
- `refunded`

Payment provider:

- `square`

Checkout modes:

- `stub`
- `live`

Booking hold statuses:

- `active`
- `expired`
- `converted`
- `cancelled`

Availability block types:

- `full_day`
- `time_range`

Notification channels:

- `email`
- `sms`

Notification statuses:

- `queued`
- `sent`
- `failed`
- `skipped`

Admin roles:

- `owner`
- `manager`

Default scheduling timezone:

- `America/New_York`

## Constraints And Indexes

The migration includes check constraints for valid statuses, providers, checkout modes, admin roles, notification values, booking hold states, positive durations, non-negative money values, `deposit_cents <= price_cents`, and `ends_at > starts_at`.

For a single-chair MVP, `appointments_no_overlapping_active_times` prevents overlapping `pending_deposit` and `confirmed` appointments with a GiST exclusion constraint over `tstzrange(starts_at, ends_at, '[)')`.

Indexes cover appointment range queries, status filters, customer lookup, service lookup, payment provider references, payment idempotency keys, Square webhook event lookup, availability rule lookup, availability block range queries, notification log filters, and appointment event history.

## Updated Timestamps

The migration adds `public.set_updated_at()` and triggers on mutable tables:

- `admin_users`
- `services`
- `customers`
- `appointments`
- `booking_holds`
- `payments`
- `availability_rules`
- `availability_blocks`
- `notification_logs`
- `app_settings`

## RLS And Security Model

RLS is enabled on every application table. No `anon` or `authenticated` policies are created in this migration, so access is deny-by-default for browser/client Supabase access.

The expected production access pattern is:

- Public and owner UI call Next.js route handlers.
- Next.js server code validates input, rate limits, checks owner auth where required, and performs database work server-side.
- Server-only Supabase credentials stay on the server.

Do not expose `SUPABASE_SERVICE_ROLE_KEY` or any service-role credentials to client components, public env vars, or browser code.

Future owner/admin policies can be added when the app adopts Supabase Auth or a hardened owner session model. Until then, server routes should enforce auth and same-origin/CSRF-aware protections before mutating owner data.

## Environment Variables

`.env.example` now includes Supabase variable names:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL`
- `BOOKING_TIMEZONE`
- `DEPOSIT_HOLD_MINUTES`

Only `NEXT_PUBLIC_` values are safe to expose to the browser. The service role key and database URL are server-only.

## Local Migration Testing Later

This task does not initialize Supabase tooling or run a local database. Later, after Supabase local development is intentionally configured, validate the migration with a local-only workflow such as:

```bash
supabase db reset
```

Do not link this repo to a remote Supabase project or run migrations against production until repository adapters and deployment procedures are reviewed.

## Demo Seed Data

The deterministic seed data in `lib/demo` can become Supabase seed scripts later. The current seed services already preserve active public service IDs and provide cents-based fields that map cleanly to `services.price_cents` and `services.deposit_cents`.

When seed scripts are added, keep them deterministic, fake, and reviewable. Do not seed real customer data, credentials, provider secrets, or live Square identifiers.

## Repository Adapter Support

This schema is shaped for future repository interfaces with mock and Supabase adapters:

- service repository backed by `services`
- customer repository backed by `customers`
- appointment repository backed by `appointments`
- booking hold repository backed by `booking_holds`
- payment repository backed by `payments` and `square_webhook_events`
- availability repository backed by `availability_rules` and `availability_blocks`
- notification repository backed by `notification_logs`
- audit repository backed by `appointment_events`

## Blocked Times And Days

`availability_blocks` supports all-day closures and partial-day blocks. Availability calculation should combine these blocks with business-hour rules, service duration, buffers, existing active appointments, active holds, and timezone.

The migration does not auto-cancel appointments when a block is added. Future owner workflows should detect conflicts and guide the owner through cancellations or rescheduling.

## Square Deposit Reconciliation

`payments` stores Square checkout/payment references and idempotency keys. `square_webhook_events` stores Square event IDs before processing so webhook handling can be idempotent.

Production appointment confirmation should happen only after verified Square webhook reconciliation, except in local mock/demo mode.

## Notifications

`notification_logs` stores notification attempts and provider results. A `sent` status should only be written after the provider confirms success. Resend email is the expected first real provider; Twilio SMS is optional.

## Audit Events

`appointment_events` supports created, status changed, payment changed, cancelled, refunded, availability blocked, and owner note updated events. Future owner mutations should write audit events transactionally with the domain change they describe.

## Not Implemented In This Task

- No Supabase client code.
- No live Supabase connection.
- No production credentials.
- No repository adapter switch.
- No booking API changes.
- No checkout API changes.
- No owner API changes.
- No Square live checkout.
- No real notifications.
- No owner auth replacement.
- No runtime persistence change.

## Future Tasks

- Task 7: repository interface with mock and Supabase adapters.
- Task 8: availability and blocked times/days.
- Task 9: production booking creation and hold expiration.
- Task 10: Square deposit flow and webhook reconciliation.
- Task 11: owner notifications.
- Task 12: owner dashboard hardening.
