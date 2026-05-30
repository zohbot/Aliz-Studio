# Domain Model

This document describes the shared domain types introduced in `lib/domain/`. The refactor is behavior-preserving: current route URLs, API response shapes, mock checkout behavior, owner auth, and file-backed appointment storage remain unchanged.

## Canonical Module

- `lib/domain/constants.ts`: shared string-value constants for statuses, providers, notification channels, block types, admin roles, booking hold states, and current demo time slots.
- `lib/domain/types.ts`: canonical TypeScript types for services, customers, appointments, booking, payments, availability, notifications, and owner/admin settings.
- `lib/domain/schemas.ts`: current Zod schemas that preserve existing validation behavior for booking dates, booking requests, appointment status updates, and file-backed appointments.
- `lib/domain/index.ts`: barrel export for domain constants, schemas, and types.

Existing modules such as `lib/services.ts`, `lib/appointments.ts`, `lib/booking.ts`, `lib/availability.ts`, `lib/square.ts`, and `lib/notifications.ts` continue to re-export compatibility types so older imports still work.

## Active Today

These domain entities are used by the current working demo:

- `Service`: static service/package data in `lib/services.ts`.
- `AvailabilitySlot`: fixed daily slot labels returned by `lib/availability.ts` and `/api/booking/availability`.
- `BookingQuote`: quote shape returned by `/api/booking/quote` and `/api/booking/create`.
- `BookingQuoteInput` and `BookingRequest`: validated customer booking inputs.
- `Appointment`: file-backed appointment shape stored in `data/appointments.json`.
- `AppointmentStatus`: current appointment statuses.
- `PaymentStatus`: current payment status values for appointments and mock deposits.
- `CreateAppointmentInput`: current input shape used by `lib/appointments.ts`.
- `AppointmentUpdateInput`: current owner dashboard patch shape.
- `SquareCheckoutReference`: current mock Square checkout response shape.
- `BookingNotification`: current owner notification stub input.

## Future-Ready Placeholders

These types prepare the repo for production scheduling work but are not wired to real persistence yet:

- `Customer`, `CustomerId`, `CustomerContact`, and `BookingCustomerInput`
- `Payment`, `PaymentId`, `DepositPayment`, and `PaymentProviderReference`
- `BookingHold` and `BookingHoldStatus`
- `AvailabilityRule`, `BusinessHoursRule`, `AvailabilityBlock`, `AvailabilityBlockInput`, and `BlockedTimeRange`
- `NotificationLog`, `NotificationStatus`, and `OwnerNotificationPayload`
- `OwnerSettings`, `BookingSettings`, and `AdminRole`
- `AppointmentAuditEvent` / `AppointmentEvent`

These are type-layer preparation only. They do not add Supabase, Square production payments, real notification providers, or new owner dashboard behavior.

## Current Mock And File-Backed State

Appointments are still stored by `lib/appointments.ts` in `data/appointments.json`. The store is suitable for local demo/testing only and is intentionally not expanded for production in this task.

Current services remain static in `lib/services.ts`. Current checkout remains a mock flow through `/checkout` and `/api/checkout/complete`. Current notifications remain a stub in `lib/notifications.ts`.

## Preserved Status And Provider Values

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

Payment providers:

- `square`

Square checkout modes:

- `stub`
- `live`

Notification channels:

- `email`
- `sms`

Availability block types:

- `full_day`
- `time_range`

Booking hold statuses:

- `active`
- `expired`
- `converted`
- `cancelled`

Admin roles:

- `owner`
- `manager`

Current demo time slots:

- `10:00 AM`
- `11:00 AM`
- `12:30 PM`
- `2:00 PM`
- `3:30 PM`
- `5:00 PM`

## Future Supabase Direction

Future repository work should map these canonical types to Supabase tables for services, customers, appointments, payments, availability blocks, notification logs, settings, and audit events.

When Supabase is introduced:

- Keep server-only service role keys out of client code.
- Use database constraints, transactions, or RPC to prevent double-booking.
- Calculate availability from service duration, buffers, existing appointments, blocked times/days, hold expiration, and timezone.
- Confirm appointments from verified Square payment/webhook state, except in local mock/demo mode.
- Record notification attempts and appointment audit events as durable records.

## API Compatibility Notes

The current API response shapes are intentionally preserved:

- `/api/booking/quote` still returns `{ quote }`.
- `/api/booking/create` still returns `{ status, appointment, quote, checkout, notification }`.
- `/api/booking/availability` still returns `{ date, slots }`.
- `/api/checkout/complete` still returns `{ status, appointment, receipt }`.
- Owner appointment endpoints still return the same appointment shape.

Do not rename current statuses or fields casually. If a cleaner production name is needed later, add an explicit compatibility alias or migration path.
