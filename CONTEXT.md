# PJRoutes — CONTEXT.md

## What This Is
Empty-leg private jet marketplace. Operators submit flights → admin approves → passengers book. No membership, no brokers.

**Current priority:** Get to first live booking.

**Status:** Live at `https://pjroutes.com` — Stripe account under review (2-3 days)

---

## Stack
- **Framework:** Next.js 14 App Router (TypeScript, Tailwind)
- **Database/Auth:** Supabase — project `rjqwjfzvhkdkdjldlnqs`
- **Payments:** Stripe (ACH bank transfer only)
- **Email:** Resend — `support@pjroutes.com`
- **Hosting:** Vercel — connected to `github.com/jaylenmareko/pjroutes-`

---

## Credentials & Logins

### Site
- **URL:** https://pjroutes.com
- **Admin panel:** https://pjroutes.com/admin
- **Admin password:** `***REMOVED***`

### GitHub
- **Username:** jaylenmareko
- **Repo:** https://github.com/jaylenmareko/pjroutes-

### Vercel
- **Dashboard:** https://vercel.com/jaylenmareko/pjroutes-
- **Login:** GitHub (jaylenmareko)

### Supabase
- **Dashboard:** https://supabase.com/dashboard/project/rjqwjfzvhkdkdjldlnqs
- **Project URL:** `https://rjqwjfzvhkdkdjldlnqs.supabase.co`
- **Anon key:** `***REMOVED***`
- **Service role key:** `***REMOVED***`

### Stripe
- **Dashboard (active — Jaylen Davis):** https://dashboard.stripe.com/acct_1TQYWuFAhGnz11V8/dashboard
- **Dashboard (old — PJ Routes, violation flagged):** https://dashboard.stripe.com/acct_1TWM1EJVkNqyNYUy/dashboard
- **Dashboard (sandbox):** https://dashboard.stripe.com/acct_1TWM1qJXkXHZkpBt/test/dashboard
- **Live publishable key:** `pk_live_51TQYWuFAhGnz11V8hc1NhFtwUxfO4fRhB1cen0v5So1agiOjhrzvaol9HtA2eBa08ouSbSwjN6rJJb7oYx3W1Szg0035TBaB4N`
- **Live secret key:** `STRIPE_SECRET_KEY_REMOVED`
- **Status:** Active, no violations — "Jaylen Davis" personal account, framed as travel marketplace

### Resend
- **Dashboard:** https://resend.com
- **API key:** `***REMOVED***`
- **From address:** `support@pjroutes.com`

### Operator / Passenger test accounts
- **Operator email:** jaylen3282004@gmail.com
- **Passenger email:** j7beatss@gmail.com

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

**Done (confirmed working):**
- ✅ Domain live at `pjroutes.com`
- ✅ Resend domain verified — emails from `support@pjroutes.com`
- ✅ OTP auth (8-digit codes, no magic links)
- ✅ Navbar: auth state, logout, My Bookings, My Listings
- ✅ My Bookings page (RLS fixed, fetches via service role)
- ✅ My Listings page (operator view, shows passenger info on booked flights)
- ✅ Booking flow end-to-end (card + ACH PaymentElement)
- ✅ Flight disappears from listing after booking
- ✅ Demo flights removed
- ✅ Stripe receipt URL embedded in passenger confirmation email
- ✅ FBO address: operator form field + passenger confirmation email
- ✅ Broker language removed across all pages
- ✅ PJR favicon

**Remaining — in order:**
1. ~~Operator form datetime bug~~ — fixed (ISO conversion on submit)
2. Swap Stripe live keys in Vercel env vars — keys are ready, Jaylen needs to paste into Vercel dashboard manually (browser auth issue)
3. Enable Stripe "Send payment instruction emails" — Stripe → Settings → Customer emails → toggle on
4. Delete test data — dummy bookings + test flights before real operator listings go live
5. Operator outreach — 402 contacts in `outreach/tier1-operators-enriched.csv`

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
