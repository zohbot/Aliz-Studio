# Aliz Studio Website Revamp

Full-site rebuild for Aliz Studio, a by-appointment barbershop. The foundation is built around a polished public site, a guided booking flow, Square deposit collection, and owner notifications.

For website/template inquiries, booking-flow builds, or customer customization, visit [SYHTEK](https://syhtek.com).

## Buyer / Customer Notes

This project demonstrates a full-service local business website with premium visual direction, service packaging, a guided booking flow, and Square-ready deposit architecture. It is suitable as a template foundation for barbershops, salons, appointment-only studios, and local service providers.

Website design direction, booking UX, frontend implementation, backend integration planning, and presentation by [SYHTEK](https://syhtek.com).

## Stack

- Next.js App Router with TypeScript
- Tailwind-style global CSS tokens without adding a UI kit
- Square-ready backend routes for deposits and payment webhooks
- Protected owner dashboard with signed HttpOnly session cookies
- File-backed local appointment store for development and demos
- Playwright for desktop/mobile booking-flow checks

## Tech Behind The Website

- Next.js App Router
- React 19
- TypeScript
- Custom global CSS design tokens
- Square SDK integration path
- Zod validation
- Playwright end-to-end checks
- Responsive appointment-booking UI
- Environment-based payment configuration
- Owner appointment management APIs

## Owner Dashboard

Use the dummy login to test the protected backend locally:

- URL: `/owner/login`
- Email: `owner@alizstudio.test`
- Password: `aliz-demo-2026`

Appointments are seeded into `data/appointments.json` on first dashboard/API access. The repository is intentionally isolated in `lib/appointments.ts` so it can be replaced with Postgres, Supabase, Prisma, or another production database without changing the dashboard workflow.

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
npm run test:e2e
```

The first Playwright spec checks the landing page, service cards, and the booking configurator path.
