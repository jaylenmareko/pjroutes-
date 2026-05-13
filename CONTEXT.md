# PJRoutes — CONTEXT.md

## What This Is
Empty-leg private jet marketplace. Operators submit flights → admin approves → passengers book. No membership, no brokers.

**Current priority:** Get to first live booking.

**Status:** Deployed and live at `https://pjroutes.vercel.app`

---

## Stack
- **Framework:** Next.js 14 App Router (TypeScript, Tailwind)
- **Database/Auth:** Supabase — project `rjqwjfzvhkdkdjldlnqs`
- **Payments:** Stripe (card + ACH bank transfer)
- **Email:** Resend — `support@pjroutes.com` (pending domain verification)
- **Hosting:** Vercel — connected to `github.com/jaylenmareko/pjroutes-`

## Key Credentials (in `.env.local` — never commit)
- Supabase URL: `https://rjqwjfzvhkdkdjldlnqs.supabase.co`
- Admin email: `j7beatss@gmail.com`
- Stripe: test keys active (swap to live keys before launch)

---

## File Map
```
app/
  page.tsx              — landing page (hero, search, featured flights, route alert signup)
  layout.tsx            — root layout with Navbar + Footer
  flights/
    page.tsx            — search results with jet size + price filters
    [id]/page.tsx       — flight detail + booking CTA
  book/[id]/page.tsx    — booking form (Stripe card + ACH)
  book/success/page.tsx — booking confirmation
  bookings/page.tsx     — user booking history
  operator/page.tsx     — operator flight submission form (hidden URL)
  admin/page.tsx        — admin approval queue
  auth/page.tsx         — standalone auth page
  api/
    create-payment-intent/ — Stripe PaymentIntent creation
    confirm-booking/       — booking record + emails via Resend
    operator-submit/       — flight submission + admin notification
    admin/approve/         — approve/reject + route alert emails
    alerts/                — route alert signup
    flight/[id]/           — public flight fetch
components/
  Navbar.tsx            — fixed nav, auth-gated links
  Footer.tsx
  FlightCard.tsx        — flight listing card
  SearchBar.tsx         — from/to/date/passengers form
  AlertSignupForm.tsx   — route alert email signup
  AuthModal.tsx         — OTP auth modal (email → 6-digit code)
  BookNowButton.tsx
  PhotoGallery.tsx
lib/
  supabase.ts           — server-side Supabase client
  supabase-browser.ts   — client-side Supabase client
  supabase-server.ts    — SSR Supabase client
  stripe.ts             — Stripe client
  resend.ts             — lazy-initialized Resend client
  types.ts              — Flight, Booking, RouteAlert types
  airports.ts           — airport lookup data
docs/
  supabase-schema.sql   — DB schema (already run)
  plans/                — implementation plans
```

---

## Database (Supabase)
Tables: `flights`, `bookings`, `route_alerts` — schema already applied.

Auth: Email OTP (6-digit codes). "Confirm email" is OFF. No magic links.

---

## Flow
1. Operator submits at `/operator` → status `pending`
2. Admin approves at `/admin` → status `published` → route alert emails fire
3. Passenger searches, finds flight, books at `/book/[id]`
4. Stripe payment → `confirm-booking` API → status `booked` → emails to passenger + operator

---

## What Moves the Needle
1. Domain live (`pjroutes.com`) → Resend domain verified → real emails working
2. Stripe live keys swapped in
3. First operator submits a real flight
4. First booking

---

## Claude Instructions — DO, Don't Instruct

**When working on this project, Claude must execute tasks directly rather than giving step-by-step instructions for Jaylen to follow.**

Specifically:
- **Vercel changes** (env vars, domains, redeploys): use Playwright to do it in the browser
- **Supabase changes** (schema, auth settings, RLS policies): use Playwright to run SQL or toggle settings
- **Resend setup** (domain verification, DNS): use Playwright to navigate Resend dashboard and complete the steps
- **GitHub** (push, branch, PR): use git commands directly
- **Domain registrar DNS records**: use Playwright to add DNS records in the browser

**Only ask Jaylen to act when:**
- A purchase is required (buying a domain, upgrading a plan)
- A physical device or login credential is needed that Claude cannot access
- An irreversible destructive action needs explicit confirmation

Everything else: just do it.
