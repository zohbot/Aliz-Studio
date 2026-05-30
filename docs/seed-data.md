# Seed Data

This document describes the deterministic demo seed data added for local development, future mock repositories, and future Supabase seed scripts.

## Files

- `lib/demo/seed-data.ts`: canonical demo seed collections and lightweight invariant checks.
- `lib/demo/index.ts`: barrel export for demo seed helpers.

## Purpose

The seed layer provides stable, generated dummy data without changing current app behavior. It gives future backend work a typed set of records for services, customers, appointments, payment states, availability blocks, notification logs, settings, booking holds, and appointment audit events.

Current runtime persistence is unchanged. The booking flow and owner dashboard still use the existing static services and file-backed appointments.

## Determinism Rules

Seed data must be stable across machines and test runs.

- Use fixed IDs, fixed strings, fixed dates, and fixed times.
- Do not use `Math.random()`.
- Do not use `Date.now()`.
- Do not use faker packages or live APIs.
- Do not depend on environment variables.
- Keep dummy records hand-authored and reviewable.

## No Real PII

All seed contacts are fake. Emails use `example.com`, phone numbers use 555-style placeholders, customer names are fictional, and payment references use obvious demo identifiers such as `demo_square_checkout_001`.

Do not add real customer details, live provider IDs, tokens, webhook signatures, or credentials to seed data.

## Collections Included

- `demoServices`: mirrors the current public service IDs and adds future-ready cents fields, categories, active flags, and sort order.
- `demoCustomers`: fake customer records with stable contact details and timestamps.
- `demoAppointments`: current appointment compatibility fields plus customer references, `startsAt`, `endsAt`, and timezone.
- `demoBookingHolds`: future-ready hold examples for active, converted, and expired holds.
- `demoPayments`: deposit payment records linked to appointments, covering pending, paid, and refunded states.
- `demoAvailabilityRules`: business-hour rules for local/demo scheduling logic later.
- `demoAvailabilityBlocks`: all-day closure, partial-day block, lunch/personal block, and future vacation block examples.
- `demoNotificationLogs`: mock notification attempt records for email and SMS states.
- `demoBookingSettings` and `demoOwnerSettings`: timezone, deposit hold, booking window, buffer, and owner notification placeholders.
- `demoAppointmentEvents`: audit examples for created, deposit paid, status changed, cancelled, owner note updated, and blocked time created events.

## Exports

The seed module exports:

- `DEMO_SEED_VERSION`
- `DEMO_TIMEZONE`
- `DEMO_ANCHOR_DATE`
- each seed collection
- `validateDemoSeedData()`
- `getDemoSeedData()`
- `getDemoSeedSummary()`

`getDemoSeedSummary()` returns counts only, which is useful for docs, development diagnostics, or future lightweight tests.

## Behavior-Preserving Status

This task does not wire seed data into production or demo runtime behavior. Existing services in `lib/services.ts`, file-backed appointments in `lib/appointments.ts`, mock checkout, owner login, and owner dashboard behavior remain the active implementation.

The seed services intentionally preserve current service IDs and slugs so a later mock repository can adopt them without breaking booking navigation.

## Future Supabase Support

The seed layer is shaped around the canonical domain types in `lib/domain`. Future Supabase work can map these records into seed scripts for services, customers, appointments, payments, availability blocks, notification logs, settings, booking holds, and appointment audit events.

When Supabase is introduced, use database constraints, transactions, or RPC for double-booking prevention. Keep service-role keys server-only and out of seed files committed to the repo.

## Future Mock Repository Support

The seed collections can back mock repository adapters before production adapters exist. Mock repositories should import from `lib/demo`, copy data before mutation, and keep deterministic defaults intact.

## Not Implemented Yet

This seed task does not:

- Connect Supabase.
- Add Supabase migrations or database queries.
- Replace file-backed appointment storage.
- Enable real Square checkout or payment reconciliation.
- Send real notifications.
- Add owner-managed availability block routes.
- Change current API response shapes or route URLs.
