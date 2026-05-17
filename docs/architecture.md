# Aliz Studio Revamp Architecture

## Product Scope

The website needs to become a full appointment system, not just a landing page. The customer journey is:

1. Review services and pricing.
2. Select a service.
3. Pick an available appointment date and time.
4. Pay a deposit through Square.
5. Receive confirmation.
6. Notify the owner by email/SMS.
7. Reconcile final booking status from Square webhooks.

## Current Foundation

- `app/page.tsx`: public homepage and service overview.
- `app/about/page.tsx`: brand/story page.
- `app/book/page.tsx`: booking configurator page.
- `app/api/booking/quote/route.ts`: validates service/date and returns pricing/deposit quote.
- `app/api/booking/create/route.ts`: creates a pending booking and returns a Square checkout URL stub.
- `app/api/square/webhook/route.ts`: Square webhook placeholder.
- `lib/services.ts`: structured service menu copied from the current site surface.
- `lib/booking.ts`: quote and booking request validation.
- `lib/square.ts`: Square checkout integration boundary.
- `lib/notifications.ts`: email/SMS notification boundary.

## Square Strategy

Keep the UI consistent with the site until the last possible moment. The likely paths are:

- Square Checkout API: lower maintenance, hosted payment page, simplest compliance story.
- Square Web Payments SDK: tighter visual integration, more frontend/backend work.

Either way, the booking should stay `pending_deposit` until the Square webhook confirms payment.

## Data Model To Add

- `Service`: name, duration, price, deposit, availability settings.
- `Customer`: name, email, phone.
- `Appointment`: service, customer, start/end time, status, notes.
- `Payment`: provider, deposit amount, checkout id, payment id, status.
- `NotificationLog`: email/SMS delivery attempts.
- `BlackoutDate`: unavailable dates or owner blocks.

## Verification

Playwright will verify desktop and mobile:

- Landing page renders correctly.
- Services are visible and bookable.
- Booking page accepts service/date/time.
- Continue button only unlocks once required selections are made.
- Future: Square sandbox handoff and webhook confirmation.
