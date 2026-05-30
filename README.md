# Aliz Studio Website Revamp

Full-site rebuild for Aliz Studio, a by-appointment barbershop. The foundation is built around a polished public site, a guided booking flow, mock Square-style deposit checkout, owner notifications, and a protected owner dashboard.

For website/template inquiries, booking-flow builds, or customer customization, visit [World Softwares](https://worldsoftwares.com).

## Buyer / Customer Notes

This project demonstrates a full-service local business website with premium visual direction, service packaging, a guided booking flow, mock checkout, and Square-ready deposit architecture. It is suitable as a template foundation for barbershops, salons, appointment-only studios, and local service providers.

Website design direction, booking UX, frontend implementation, backend integration planning, and presentation by [SYHTEK](https://worldsoftwares.com).

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

Configure owner credentials in `.env.local` before testing the protected backend:

- URL: `/owner/login`
- `OWNER_EMAIL`
- `OWNER_PASSWORD`
- `OWNER_SESSION_SECRET`

Owner email is compared case-insensitively and tolerates accidental surrounding whitespace or wrapping quotes. Owner password is intentionally exact-match; enter it without surrounding quotes or spaces unless those characters are part of the intended password.

When an owner session is already active, `/owner/login` redirects to `/owner/dashboard` by design. Use the dashboard `Log out` action to clear the session and return to the credential form.

For a local-only demo, set `ALIZ_ALLOW_LOCAL_DEMO_AUTH=true` and choose your own local password and session secret. Do not commit real credentials.

Appointments are seeded into `data/appointments.json` on first local dashboard/API access. On Vercel, the file-backed repository uses ephemeral temp storage so the demo can run on a read-only deployment filesystem. This is not durable storage; keep `ALIZ_DATA_BACKEND=file` and `ALIZ_ENABLE_SUPABASE_REPOSITORY=false` until the Supabase adapter is implemented and intentionally enabled.

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

For LAN testing (phone / other devices on the same network):

```bash
npm run dev:lan
```

Tailscale access is now supported directly on the same host because Next.js now whitelists discovered local interface IPs automatically in dev mode.
Use the current Tailscale IP from your desktop (example format: `100.x.x.x`) and open:

```bash
http://100.x.x.x:3000
```

If you still get a connection error:

1. Close any old Next.js instance and restart `npm run dev:lan`.
2. Confirm port `3000` is listening with `netstat -ano | Select-String \":3000\"`.
3. Confirm the URL uses the Tailscale IP, not a stale DNS alias.

For strict local loopback testing only:

```bash
npm run dev:local
```

## Deployment

Staging deployment notes for Vercel and the `aliz.zohbot.net` Cloudflare DNS setup live in [docs/deployment.md](docs/deployment.md).

## Brand Assets

Logo, mark, app icon, and manifest asset usage is documented in [docs/BRAND_ASSETS.md](docs/BRAND_ASSETS.md). The current assets are normalized copies of the generated Aliz Studio exports and can be replaced in place with production exports using the same filenames.

## Theme System

Aliz Studio supports the original polished light theme and an optional black-and-gold night theme. The compact header theme toggle persists the visitor choice in `localStorage` under `aliz-theme`, and `app/layout.tsx` applies the stored value early to reduce theme flash. Light remains the default when no preference is stored. Image-backed service cards, booking selections, form focus states, and mock payment cards use dedicated tokens so the night theme stays readable without default blue browser styling.

## PWA Install

Aliz Studio includes a lightweight install card backed by `app/manifest.ts`. Chrome, Edge, and Android browsers can use the native install prompt when available; iOS Safari receives manual Share then Add to Home Screen instructions. No push notifications, service worker cache, or offline booking behavior is enabled yet.

## Live QA

Live QA notes, completed polish items, and current production-readiness limits are tracked in [docs/PROGRESS_LOG.md](docs/PROGRESS_LOG.md). Follow-up work is tracked in [docs/NEXT_STEPS.md](docs/NEXT_STEPS.md).

## Admin Roadmap

The production-readiness admin feature plan is documented in [docs/ADMIN_ROADMAP.md](docs/ADMIN_ROADMAP.md). It breaks the remaining owner/admin work into small, demo-safe implementation sprints before production Supabase, Square, notification, and auth-provider hookups.

## Verification

```bash
npm run lint
npm run build
npm run test:e2e
```

The Playwright suite covers the landing page, service package routing, security headers, booking validation, mock checkout completion, and owner dashboard status management across desktop and mobile viewports.
