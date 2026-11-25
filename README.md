# PJRoutes

PJRoutes is an empty-leg private jet marketplace. Operators list empty-leg flights, and passengers book those seats directly instead of chartering a whole plane.

## What is in this repo

- `app/` is the web app: flight search and listings, flight detail and booking pages, passenger bookings, operator pages, and the admin area.
- `app/api/` holds the API routes: flights, booking and payment flow, operator onboarding and payouts, contact and alerts, and admin actions.
- `components/` holds the shared UI: flight cards, search, booking and listing forms, and the site layout.
- `lib/` holds the supporting code: airport and demo flight data, shared types, and the payment, email, and database clients.
- `docs/` holds the product plan and the database schema.
- `outreach/` holds the operator outreach scripts, data enrichment scripts, and the email template used to contact operators.
- `public/` holds static files served by the site.

## Running it

Install dependencies, then run the dev script in `package.json` and open the local address it prints.
