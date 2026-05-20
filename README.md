# Aliz Studio Website Revamp

Full-site rebuild for Aliz Studio, a by-appointment barbershop. The foundation is built around a polished public site, a guided booking flow, mock Square-style deposit checkout, owner notifications, and a protected owner dashboard.

For website/template inquiries, booking-flow builds, or customer customization, visit [SYHTEK](https://syhtek.com).

## Buyer / Customer Notes

This project demonstrates a full-service local business website with premium visual direction, service packaging, a guided booking flow, mock checkout, and Square-ready deposit architecture. It is suitable as a template foundation for barbershops, salons, appointment-only studios, and local service providers.

Website design direction, booking UX, frontend implementation, backend integration planning, and presentation by [SYHTEK](https://syhtek.com).

## Stack

- Next.js App Router with TypeScript
- Tailwind-style global CSS tokens without adding a UI kit
- Mock checkout flow with Square-ready backend routes for deposits and payment webhooks
- Protected owner dashboard with signed HttpOnly session cookies
- Security headers, same-origin route checks, and local/demo rate limiting
- File-backed local appointment store for development and demos
- Playwright for desktop/mobile booking-flow checks

## Tech Behind The Website

- Next.js App Router
- React 19
- TypeScript
- Custom global CSS design tokens
- Square SDK integration path
- Mock card deposit flow that records paid appointment status without storing card numbers
- Zod validation
- Playwright desktop/mobile end-to-end checks
- Responsive appointment-booking UI
- Environment-based payment configuration
- Owner appointment management APIs

## Owner Dashboard

Use the dummy login to test the protected backend locally:

- URL: `/owner/login`
- Email: `owner@alizstudio.test`
- Password: `aliz-demo-2026`

Appointments are seeded into `data/appointments.json` on first dashboard/API access. The repository is intentionally isolated in `lib/appointments.ts` so it can be replaced with Postgres, Supabase, Prisma, or another production database without changing the dashboard workflow.

## Security / Operations Notes

- Global security headers are configured in `next.config.ts`, including CSP, frame blocking, content sniffing protection, referrer policy, permissions policy, and no-store headers for owner/checkout surfaces.
- Owner auth uses signed HttpOnly cookies, same-origin checks on mutating owner routes, in-memory login rate limiting for local/demo deployments, and production guardrails for replacing demo credentials and session secrets.
- Booking APIs validate service IDs, bookable dates, supported time slots, JSON body size, and JSON parsing failures before mutating the appointment store.
- The mock checkout intentionally sends only cardholder name and card last four to the backend. It does not store card numbers.
- The Square webhook route is a non-mutating stub until real signature verification is implemented.

## Local Setup

1. Install dependencies.
2. Copy `.env.example` to `.env.local`.
3. Add Square sandbox credentials when backend payment integration begins.
4. Run the app.

```bash
npm install
npm run dev
```

## Verification

```bash
npm run build
npm run test:e2e
```

The Playwright suite covers the landing page, service package routing, security headers, booking validation, mock checkout completion, and owner dashboard status management across desktop and mobile viewports.
