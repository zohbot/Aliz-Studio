# Repository Layer

Task 7 added a narrow repository boundary around appointment persistence. The owner service/menu management sprint extends that boundary to services while preserving the current file-backed runtime behavior today.

## Files

- `lib/repositories/types.ts`: shared repository interfaces and backend names.
- `lib/repositories/factory.ts`: server-side repository factory.
- `lib/repositories/file-appointment-repository.ts`: current file-backed behavior moved behind the interface.
- `lib/repositories/demo-appointment-repository.ts`: deterministic in-memory demo adapter using `lib/demo` seed data.
- `lib/repositories/supabase-appointment-repository.ts`: Supabase-ready skeleton that fails closed if selected.
- `lib/repositories/file-service-repository.ts`: demo-safe editable service/menu store seeded from the core service catalog.
- `lib/repositories/demo-service-repository.ts`: deterministic in-memory service adapter using `lib/demo` seed data.
- `lib/repositories/supabase-service-repository.ts`: Supabase-ready service skeleton that fails closed if selected directly.
- `lib/repositories/file-availability-repository.ts`: demo-safe weekly-hours, blocked-date, and booking-rule store.
- `lib/repositories/demo-availability-repository.ts`: deterministic in-memory availability adapter.
- `lib/repositories/supabase-availability-repository.ts`: Supabase-ready availability skeleton that fails closed if selected directly.
- `lib/repositories/index.ts`: repository barrel exports.
- `lib/appointments.ts`: compatibility facade preserving existing public exports.
- `lib/services.ts`: compatibility facade plus async service repository helpers for public and owner views.
- `lib/availability.ts`: compatibility facade plus public availability calculation helpers.
- `lib/service-catalog.ts`: build-safe core service catalog with stable IDs/routes.

## Current Default Backend

The default backend is `file`.

If `ALIZ_DATA_BACKEND` is unset, the app behaves like it did before this task. The current booking flow, mock checkout flow, owner dashboard, appointment APIs, and owner service management use file-backed stores.

## Backend Names

Allowed `ALIZ_DATA_BACKEND` values:

- `file`: default runtime backend. Uses `data/appointments.json` and `data/services.json` locally, with `/tmp` equivalents on Vercel.
- Availability settings use `data/availability-settings.json` locally and `/tmp/aliz-studio-availability/settings.json` on Vercel.
- `demo`: optional in-memory adapter backed by deterministic seed data.
- `supabase`: future backend. Currently a skeleton and intentionally falls back to `file`.

Do not expose `ALIZ_DATA_BACKEND`, `ALIZ_ENABLE_SUPABASE_REPOSITORY`, Supabase service role keys, or repository configuration to browser code.

If `ALIZ_DATA_BACKEND=supabase` or an unsupported backend value is set before the adapter is implemented, the factory falls back to `file`. This protects staging/demo deployments from accidentally selecting the not-yet-implemented Supabase skeleton. `ALIZ_ENABLE_SUPABASE_REPOSITORY` is reserved for the future implementation and should remain `false` for current staging.

## AppointmentRepository Methods

The interface currently covers appointment operations already used by the app:

- `listAppointments()`
- `getAppointmentById(appointmentId)`
- `createAppointment(input)`
- `getReservedTimesForDate(appointmentDate)`
- `isAppointmentSlotAvailable(appointmentDate, appointmentTime)`
- `updateAppointment(appointmentId, patch)`
- `updateAppointmentStatus(appointmentId, status)`
- `updateAppointmentPaymentStatus(appointmentId, paymentStatus)`
- `setAppointmentCheckoutUrl(appointmentId, squareCheckoutUrl)`
- `completeAppointmentDeposit(input)`
- `getAppointmentStats()`

## ServiceRepository Methods

The service interface covers owner service/menu operations now used by the app:

- `listServices()`
- `getServiceById(serviceId)`
- `updateService(serviceId, patch)`

The update path preserves stable service IDs, public route slugs, images, detail copy, and inclusions. Editable fields are limited to display name, short name, short description, price, deposit, duration, active/bookable state, featured state, public visibility, and sort order.

## AvailabilityRepository Methods

The availability interface covers owner-managed booking rules now used by `/owner/availability` and `/api/booking/availability`:

- `getAvailabilitySettings()`
- `updateAvailabilitySettings(input)`

The current settings shape includes:

- `timezone`
- weekly hours with open/closed day toggles
- daily start/end time
- optional break start/end time
- blocked dates with optional owner reason
- booking lead time minutes
- max appointments per slot
- max appointments per day
- cancellation cutoff hours for display/future workflow use

## File Backend

The file adapter preserves the existing behavior from `lib/appointments.ts`:

- Reads and writes `data/appointments.json` during local development.
- Uses writable temp storage at runtime on Vercel so authenticated owner/dashboard and booking demo flows do not crash against the read-only deployment filesystem.
- Creates the same local seed appointments if the file is missing or invalid.
- Keeps the current in-process mutation queue.
- Uses the same appointment IDs, timestamps, slot checks, deposit completion behavior, stats calculation, and update behavior as before.

Vercel temp storage is intentionally ephemeral. It keeps the staging/demo app usable, but appointment data can reset across deployments, cold starts, or serverless instance changes. Supabase is still required before relying on appointment data as production data.

`lib/appointments.ts` remains the public appointment compatibility layer so existing imports do not need broad rewrites.

The service file adapter:

- Reads and writes `data/services.json` during local development.
- Uses writable temp storage at `/tmp/aliz-studio-services/services.json` on Vercel.
- Seeds from the stable catalog in `lib/service-catalog.ts`.
- Merges stored service records against the core catalog so deleted/missing demo services are restored safely.
- Validates money/duration basics and prevents deposits from exceeding price.

Vercel temp storage is intentionally ephemeral. It keeps `/owner/services`, `/book`, `/packages`, and service detail demos usable, but service edits can reset across deployments, cold starts, or serverless instance changes.

The availability file adapter:

- Reads and writes `data/availability-settings.json` during local development.
- Uses writable temp storage at `/tmp/aliz-studio-availability/settings.json` on Vercel.
- Seeds from demo-safe defaults where all weekdays are open across the existing fixed slot list.
- Validates weekly hours, blocked dates, lead time, and slot/day limits through the canonical Zod schemas.

The public booking availability API now filters fixed slots through these settings. This supports closed days, open-hour windows, optional breaks, blocked dates, lead time, and simple slot/day capacity checks while preserving the current customer-facing slot response shape.

## Demo Backend

The demo adapters read deterministic seed appointments and services from `lib/demo`, and the availability demo adapter uses deterministic in-memory defaults.

It returns cloned, API-compatible appointment objects so callers cannot mutate module-level seed constants or leak future-only seed fields into current API responses. Write operations are in-memory only and reset per server process. Runtime-created demo appointment IDs are deterministic process-local IDs such as `apt_demo_runtime_009`.

Demo writes are in-memory only and reset per server process. The demo adapter is not the default backend.

## Supabase Backend

The Supabase adapter is a skeleton in this task. It does not import `@supabase/supabase-js`, does not read credentials, and does not connect to a live project.

The Supabase skeleton can still be instantiated directly by code, but the runtime factory does not select it yet. A future task should implement it against the schema in `supabase/migrations/0001_create_aliz_studio_core_schema.sql` before enabling it in deployed environments.

Expected future mapping:

- `appointments`: appointment time/status/note records.
- `customers`: customer contact records created or found during booking.
- `payments`: Square deposit payment records and provider references.
- `booking_holds`: pending deposit holds and expiration state.
- `availability_blocks`: owner-managed blocked times and days used by availability checks.
- `availability_rules`: owner-managed weekly hours and booking windows.
- `services`: service/package records, active/public visibility, pricing, deposits, duration, and sort order.

The migration already includes a GiST exclusion constraint to prevent overlapping active appointments. Production creation should still use a transaction or RPC for customer, appointment, hold, and payment setup.

## Future Preparation

This boundary prepares for:

- blocked times/days by moving availability checks toward repository-backed weekly settings and block reads
- transaction-safe booking by isolating create/check/update operations behind one interface
- Square reconciliation by giving payments a future repository path without changing current checkout behavior
- Vercel/Supabase deployment by keeping database access in server-side routes and adapters

## Not Implemented Yet

- No Supabase client code.
- No live Supabase connection.
- No production credentials.
- No default backend switch.
- No durable Supabase availability adapter.
- No payment repository.
- No notification repository.
- No owner settings repository.
- No Square live checkout.
- No real notifications.
- No owner auth replacement.
- No route URL or API response shape changes.

## Validation

After repository changes, run:

```bash
npm run lint
npm run build
npm run test:e2e
```

The e2e suite should pass with the default `file` backend.
