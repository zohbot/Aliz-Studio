# Repository Layer

Task 7 adds a narrow repository boundary around appointment persistence. The goal is to prepare the app for mock and Supabase-backed data access later while preserving the current file-backed runtime behavior today.

## Files

- `lib/repositories/types.ts`: shared repository interfaces and backend names.
- `lib/repositories/factory.ts`: server-side repository factory.
- `lib/repositories/file-appointment-repository.ts`: current file-backed behavior moved behind the interface.
- `lib/repositories/demo-appointment-repository.ts`: deterministic in-memory demo adapter using `lib/demo` seed data.
- `lib/repositories/supabase-appointment-repository.ts`: Supabase-ready skeleton that fails closed if selected.
- `lib/repositories/index.ts`: repository barrel exports.
- `lib/appointments.ts`: compatibility facade preserving existing public exports.

## Current Default Backend

The default backend is `file`.

If `ALIZ_DATA_BACKEND` is unset, the app behaves like it did before this task. The current booking flow, mock checkout flow, owner dashboard, and appointment APIs still use the file-backed appointment store.

## Backend Names

Allowed `ALIZ_DATA_BACKEND` values:

- `file`: default runtime backend. Uses `data/appointments.json` through the proven file-backed implementation.
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

This intentionally stays appointment-focused. Future repositories can be added for services, availability, payments, notifications, settings, and audit events when those tasks need them.

## File Backend

The file adapter preserves the existing behavior from `lib/appointments.ts`:

- Reads and writes `data/appointments.json` during local development.
- Uses writable temp storage at runtime on Vercel so authenticated owner/dashboard and booking demo flows do not crash against the read-only deployment filesystem.
- Creates the same local seed appointments if the file is missing or invalid.
- Keeps the current in-process mutation queue.
- Uses the same appointment IDs, timestamps, slot checks, deposit completion behavior, stats calculation, and update behavior as before.

Vercel temp storage is intentionally ephemeral. It keeps the staging/demo app usable, but appointment data can reset across deployments, cold starts, or serverless instance changes. Supabase is still required before relying on appointment data as production data.

`lib/appointments.ts` remains the public compatibility layer so existing imports do not need broad rewrites.

## Demo Backend

The demo adapter reads deterministic seed appointments from `lib/demo`.

It returns cloned, API-compatible appointment objects so callers cannot mutate module-level seed constants or leak future-only seed fields into current API responses. Write operations are in-memory only and reset per server process. Runtime-created demo appointment IDs are deterministic process-local IDs such as `apt_demo_runtime_009`.

The demo adapter is not the default backend.

## Supabase Backend

The Supabase adapter is a skeleton in this task. It does not import `@supabase/supabase-js`, does not read credentials, and does not connect to a live project.

The Supabase skeleton can still be instantiated directly by code, but the runtime factory does not select it yet. A future task should implement it against the schema in `supabase/migrations/0001_create_aliz_studio_core_schema.sql` before enabling it in deployed environments.

Expected future mapping:

- `appointments`: appointment time/status/note records.
- `customers`: customer contact records created or found during booking.
- `payments`: Square deposit payment records and provider references.
- `booking_holds`: pending deposit holds and expiration state.
- `availability_blocks`: owner-managed blocked times and days used by availability checks.

The migration already includes a GiST exclusion constraint to prevent overlapping active appointments. Production creation should still use a transaction or RPC for customer, appointment, hold, and payment setup.

## Future Preparation

This boundary prepares for:

- blocked times/days by moving availability checks toward repository-backed appointment and block reads
- transaction-safe booking by isolating create/check/update operations behind one interface
- Square reconciliation by giving payments a future repository path without changing current checkout behavior
- Vercel/Supabase deployment by keeping database access in server-side routes and adapters

## Not Implemented Yet

- No Supabase client code.
- No live Supabase connection.
- No production credentials.
- No default backend switch.
- No service repository.
- No availability block repository.
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
