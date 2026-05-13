# PJRoutes Marketplace Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a private jet empty-leg marketplace targeting Texas/World Cup 2026 routes, modeled on SkyAccess.com's aesthetic with Marquett's improvements baked in.

**Architecture:** Next.js 14 App Router with Supabase (DB + storage), Stripe (CC + ACH bank transfer), and Resend (email). Operators submit flights via form, admin approves before publish. Buyers search, save route alerts, and book with payment. Post-booking Resend sequences handle retention SkyAccess fails at.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase, Stripe, Resend

**Name placeholder:** `PJRoutes` — swap via find-replace when final name chosen.

---

## What We're REMOVING vs SkyAccess
- "Tonight's Board" section — gimmick, skip
- "For Operators" in main nav — hidden URL `/operator` only
- Complex 15-filter bar — simplified to jet size + price range + 3 amenity toggles
- Membership tiers — no freemium, pure transactional

## What We're ADDING vs SkyAccess
- Email follow-up after booking 1 → suggest similar routes
- Email follow-up after booking 2 → offer "preferred flyer" status
- Verified badge on listings (admin approved = verified)
- ACH bank transfer at checkout (saves ~$140 in fees on a $5K booking)
- Required fields on operator form (no stale/missing data)

---

## Database Schema (Supabase)

```sql
-- flights
create table flights (
  id uuid primary key default gen_random_uuid(),
  from_city text not null,
  from_airport text not null,         -- e.g. "DAL"
  from_state text not null,
  to_city text not null,
  to_airport text not null,
  to_state text not null,
  depart_start timestamptz not null,  -- departure window open
  depart_end timestamptz not null,    -- departure window close
  price integer not null,             -- in cents
  seats integer not null,
  aircraft_type text not null,        -- e.g. "Citation CJ3"
  aircraft_tail text not null,        -- e.g. "N760JP"
  jet_size text not null check (jet_size in ('light','midsize','super_midsize','heavy')),
  has_wifi boolean default false,
  pets_allowed boolean default false,
  standup_cabin boolean default false,
  photos text[] default '{}',         -- Supabase storage URLs
  operator_name text not null,
  operator_email text not null,
  operator_phone text not null,
  status text default 'pending' check (status in ('pending','published','booked')),
  created_at timestamptz default now()
);

-- bookings
create table bookings (
  id uuid primary key default gen_random_uuid(),
  flight_id uuid references flights(id),
  passenger_name text not null,
  passenger_email text not null,
  passenger_phone text not null,
  passengers integer not null default 1,
  payment_intent_id text,             -- Stripe
  payment_method text check (payment_method in ('card','ach')),
  amount integer not null,            -- cents
  status text default 'pending' check (status in ('pending','confirmed','cancelled')),
  created_at timestamptz default now()
);

-- route_alerts (email when matching flight listed)
create table route_alerts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  from_city text not null,
  to_city text not null,
  created_at timestamptz default now()
);
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `projects/business/PJRoutes/` (entire Next.js app)

**Step 1: Scaffold Next.js app**

```bash
cd "C:\Users\Jaylen.Davis\OneDrive - Southwestern College\Desktop\DoWhatever\projects\business"
npx create-next-app@latest PJRoutes --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
cd PJRoutes
```

**Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr stripe @stripe/stripe-js resend lucide-react
```

**Step 3: Create `.env.local`**

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
RESEND_API_KEY=re_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_PASSWORD=changeme123
```

**Step 4: Create lib files**

`lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

`lib/stripe.ts`:
```typescript
import Stripe from 'stripe'
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
})
```

`lib/resend.ts`:
```typescript
import { Resend } from 'resend'
export const resend = new Resend(process.env.RESEND_API_KEY)
```

`lib/types.ts`:
```typescript
export type JetSize = 'light' | 'midsize' | 'super_midsize' | 'heavy'
export type FlightStatus = 'pending' | 'published' | 'booked'
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled'
export type PaymentMethod = 'card' | 'ach'

export interface Flight {
  id: string
  from_city: string
  from_airport: string
  from_state: string
  to_city: string
  to_airport: string
  to_state: string
  depart_start: string
  depart_end: string
  price: number          // cents
  seats: number
  aircraft_type: string
  aircraft_tail: string
  jet_size: JetSize
  has_wifi: boolean
  pets_allowed: boolean
  standup_cabin: boolean
  photos: string[]
  operator_name: string
  operator_email: string
  operator_phone: string
  status: FlightStatus
  created_at: string
}

export interface Booking {
  id: string
  flight_id: string
  passenger_name: string
  passenger_email: string
  passenger_phone: string
  passengers: number
  payment_intent_id: string
  payment_method: PaymentMethod
  amount: number
  status: BookingStatus
  created_at: string
}
```

**Step 5: Update `tailwind.config.ts` with brand colors**

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          amber: '#F59E0B',      // CTA buttons (matches SkyAccess orange)
          navy: '#0F172A',       // dark text
          sky: '#0EA5E9',        // accent blue
          muted: '#64748B',      // secondary text
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
export default config
```

**Step 6: Update `app/globals.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body { @apply bg-white text-slate-900 antialiased; }
}
```

**Step 7: Run dev server to confirm scaffold works**

```bash
npm run dev
```
Expected: Next.js app running at localhost:3000.

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold PJRoutes Next.js app with Supabase, Stripe, Resend"
```

---

## Task 2: Shared Components

**Files:**
- Create: `components/Navbar.tsx`
- Create: `components/SearchBar.tsx`
- Create: `components/FlightCard.tsx`
- Create: `components/Footer.tsx`

**`components/Navbar.tsx`:**
```tsx
import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-sm border-b border-slate-100 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-brand-navy tracking-tight">
            PJRoutes
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/flights" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              Browse Flights
            </Link>
            <Link href="/book" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              How It Works
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
```

**`components/SearchBar.tsx`:**
```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

export default function SearchBar({ className = '' }: { className?: string }) {
  const router = useRouter()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [date, setDate] = useState('')
  const [passengers, setPassengers] = useState('1')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams({ from, to, date, passengers })
    router.push(`/flights?${params}`)
  }

  return (
    <form onSubmit={handleSearch} className={`bg-white rounded-2xl shadow-xl p-2 flex flex-col sm:flex-row gap-2 ${className}`}>
      <input
        className="flex-1 px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-amber/50 placeholder:text-slate-400"
        placeholder="From — city or airport"
        value={from}
        onChange={e => setFrom(e.target.value)}
        required
      />
      <input
        className="flex-1 px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-amber/50 placeholder:text-slate-400"
        placeholder="To — city or airport"
        value={to}
        onChange={e => setTo(e.target.value)}
        required
      />
      <input
        type="date"
        className="px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-amber/50 text-slate-600"
        value={date}
        onChange={e => setDate(e.target.value)}
      />
      <select
        className="px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-amber/50 text-slate-600"
        value={passengers}
        onChange={e => setPassengers(e.target.value)}
      >
        {[1,2,3,4,5,6,7,8].map(n => (
          <option key={n} value={n}>{n} passenger{n > 1 ? 's' : ''}</option>
        ))}
      </select>
      <button
        type="submit"
        className="px-6 py-3 bg-brand-amber text-white font-semibold rounded-xl hover:bg-amber-500 transition-colors flex items-center gap-2 whitespace-nowrap"
      >
        <Search size={16} />
        Search
      </button>
    </form>
  )
}
```

**`components/FlightCard.tsx`:**
```tsx
import Link from 'next/link'
import { Wifi, PawPrint, ArrowRight } from 'lucide-react'
import { Flight } from '@/lib/types'

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

const JET_SIZE_LABEL: Record<string, string> = {
  light: 'Light Jet',
  midsize: 'Midsize',
  super_midsize: 'Super Midsize',
  heavy: 'Heavy Jet',
}

export default function FlightCard({ flight }: { flight: Flight }) {
  return (
    <Link href={`/flights/${flight.id}`} className="block group">
      <div className="bg-white rounded-2xl border border-slate-100 hover:border-brand-amber/30 hover:shadow-lg transition-all duration-200 overflow-hidden flex">
        {/* Photo */}
        <div className="w-44 h-36 flex-shrink-0 bg-slate-100 overflow-hidden">
          {flight.photos[0] ? (
            <img src={flight.photos[0]} alt={flight.aircraft_type} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">No photo</div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 px-5 py-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">AVAILABLE NOW</span>
              <span className="text-xs text-slate-400">{JET_SIZE_LABEL[flight.jet_size]}</span>
            </div>
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              {flight.from_city}
              <ArrowRight size={16} className="text-slate-400" />
              {flight.to_city}
            </div>
            <div className="text-sm text-slate-500 mt-0.5">
              {flight.aircraft_type} · Up to {flight.seats} passengers
            </div>
            <div className="text-sm text-slate-500">
              {formatDate(flight.depart_start)}
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-2">
              {flight.has_wifi && <Wifi size={14} className="text-slate-400" />}
              {flight.pets_allowed && <PawPrint size={14} className="text-slate-400" />}
            </div>
            <div className="text-xl font-bold text-slate-900">{formatPrice(flight.price)}</div>
          </div>
        </div>
      </div>
    </Link>
  )
}
```

**`components/Footer.tsx`:**
```tsx
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-slate-100 mt-24 py-12 px-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-lg font-bold text-slate-900">PJRoutes</span>
        <p className="text-sm text-slate-400">Empty legs on Part 135 aircraft. No membership, no brokers.</p>
        <div className="flex gap-6 text-sm text-slate-500">
          <Link href="/operator" className="hover:text-slate-900">List a Flight</Link>
          <Link href="/flights" className="hover:text-slate-900">Browse</Link>
        </div>
      </div>
    </footer>
  )
}
```

**Step: Commit**
```bash
git add -A
git commit -m "feat: add shared Navbar, SearchBar, FlightCard, Footer components"
```

---

## Task 3: Landing Page

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`

**`app/layout.tsx`:**
```tsx
import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'PJRoutes — Empty Leg Flights. No Membership, No Brokers.',
  description: 'Book discounted empty-leg private jet flights. Up to 75% off market rate.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  )
}
```

**`app/page.tsx`:**
```tsx
import Link from 'next/link'
import SearchBar from '@/components/SearchBar'
import FlightCard from '@/components/FlightCard'
import { supabase } from '@/lib/supabase'
import { Flight } from '@/lib/types'

const POPULAR_ROUTES = [
  { from: 'Dallas', to: 'Houston' },
  { from: 'Houston', to: 'Miami' },
  { from: 'Dallas', to: 'Las Vegas' },
  { from: 'Austin', to: 'Dallas' },
  { from: 'Houston', to: 'New York' },
  { from: 'Dallas', to: 'Austin' },
]

async function getFeaturedFlights(): Promise<Flight[]> {
  const { data } = await supabase
    .from('flights')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(4)
  return data || []
}

export default async function HomePage() {
  const featured = await getFeaturedFlights()

  return (
    <main>
      {/* Hero */}
      <section className="relative min-h-[600px] flex items-center pt-16">
        {/* Background image — swap with real jet photo */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="absolute inset-0 bg-[url('/hero-jet.jpg')] bg-cover bg-center opacity-30" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-2xl mb-10">
            <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight mb-4">
              Where to?
            </h1>
            <p className="text-xl text-slate-300">
              Empty legs on Part 135 aircraft. No membership, no brokers.
            </p>
          </div>

          <SearchBar className="max-w-4xl" />

          {/* Popular routes */}
          <div className="mt-6 flex flex-wrap gap-2">
            {POPULAR_ROUTES.map(r => (
              <Link
                key={`${r.from}-${r.to}`}
                href={`/flights?from=${r.from}&to=${r.to}`}
                className="px-3 py-1.5 bg-white/10 text-white text-sm rounded-full hover:bg-white/20 transition-colors backdrop-blur-sm"
              >
                {r.from} → {r.to}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[
            { stat: 'Up to 75%', label: 'off market rate' },
            { stat: 'Part 135', label: 'certified operators only' },
            { stat: '$0', label: 'membership or broker fees' },
          ].map(item => (
            <div key={item.stat}>
              <div className="text-4xl font-bold text-brand-navy mb-2">{item.stat}</div>
              <div className="text-slate-500">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured flights */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Available Now</h2>
            <Link href="/flights" className="text-sm text-brand-amber font-medium hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {featured.map(f => <FlightCard key={f.id} flight={f} />)}
          </div>
        </section>
      )}

      {/* Route alert CTA */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Get notified when your route lists</h2>
          <p className="text-slate-500 mb-6">We'll email you the moment a matching empty leg is available.</p>
          <AlertSignupForm />
        </div>
      </section>
    </main>
  )
}

// Inline client component for alert signup
import AlertSignupForm from '@/components/AlertSignupForm'
```

**`components/AlertSignupForm.tsx`:**
```tsx
'use client'
import { useState } from 'react'

export default function AlertSignupForm() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, email }),
    })
    setDone(true)
  }

  if (done) return <p className="text-emerald-600 font-medium">Done — we'll email you when a match lists.</p>

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
      <input className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-amber/50" placeholder="From city" value={from} onChange={e => setFrom(e.target.value)} required />
      <input className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-amber/50" placeholder="To city" value={to} onChange={e => setTo(e.target.value)} required />
      <input type="email" className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-amber/50" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
      <button type="submit" className="px-5 py-2.5 bg-brand-amber text-white text-sm font-semibold rounded-xl hover:bg-amber-500 transition-colors whitespace-nowrap">Alert me</button>
    </form>
  )
}
```

**Step: Commit**
```bash
git add -A
git commit -m "feat: landing page with hero search, featured flights, route alert signup"
```

---

## Task 4: Flights Search Results Page

**Files:**
- Create: `app/flights/page.tsx`

```tsx
import { supabase } from '@/lib/supabase'
import { Flight } from '@/lib/types'
import FlightCard from '@/components/FlightCard'
import SearchBar from '@/components/SearchBar'

interface Props {
  searchParams: { from?: string; to?: string; date?: string; passengers?: string; size?: string; max_price?: string }
}

async function searchFlights(params: Props['searchParams']): Promise<Flight[]> {
  let query = supabase.from('flights').select('*').eq('status', 'published')

  if (params.from) query = query.ilike('from_city', `%${params.from}%`)
  if (params.to) query = query.ilike('to_city', `%${params.to}%`)
  if (params.size) query = query.eq('jet_size', params.size)
  if (params.max_price) query = query.lte('price', parseInt(params.max_price) * 100)
  if (params.date) {
    const start = new Date(params.date)
    const end = new Date(params.date)
    end.setDate(end.getDate() + 1)
    query = query.gte('depart_start', start.toISOString()).lte('depart_start', end.toISOString())
  }

  const { data } = await query.order('price', { ascending: true })
  return data || []
}

export default async function FlightsPage({ searchParams }: Props) {
  const flights = await searchFlights(searchParams)
  const heading = searchParams.from && searchParams.to
    ? `${searchParams.from} → ${searchParams.to}`
    : 'All Available Flights'

  return (
    <main className="pt-20 min-h-screen">
      {/* Search bar */}
      <div className="bg-slate-900 py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <SearchBar />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header + filter row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{heading}</h1>
            <p className="text-slate-500 text-sm">{flights.length} flight{flights.length !== 1 ? 's' : ''} available</p>
          </div>

          {/* Simplified filters */}
          <form className="flex flex-wrap gap-2">
            <select name="size" defaultValue={searchParams.size || ''} className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-amber/50">
              <option value="">All sizes</option>
              <option value="light">Light Jet</option>
              <option value="midsize">Midsize</option>
              <option value="super_midsize">Super Midsize</option>
              <option value="heavy">Heavy Jet</option>
            </select>
            <select name="max_price" defaultValue={searchParams.max_price || ''} className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-amber/50">
              <option value="">Any price</option>
              <option value="5000">Under $5,000</option>
              <option value="10000">Under $10,000</option>
              <option value="20000">Under $20,000</option>
            </select>
            <button type="submit" className="px-4 py-2 bg-brand-amber text-white text-sm font-semibold rounded-lg hover:bg-amber-500 transition-colors">Apply</button>
          </form>
        </div>

        {/* Results */}
        {flights.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 text-lg mb-4">No flights found for that route.</p>
            <p className="text-slate-400 text-sm">Set a route alert below and we'll notify you when one lists.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {flights.map(f => <FlightCard key={f.id} flight={f} />)}
          </div>
        )}
      </div>
    </main>
  )
}
```

**Step: Commit**
```bash
git add -A
git commit -m "feat: flights search results page with route filter and jet size/price filter"
```

---

## Task 5: Flight Detail Page

**Files:**
- Create: `app/flights/[id]/page.tsx`

```tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Flight } from '@/lib/types'
import { Wifi, PawPrint, ArrowUpRight, Shield, ArrowRight } from 'lucide-react'

async function getFlight(id: string): Promise<Flight | null> {
  const { data } = await supabase.from('flights').select('*').eq('id', id).eq('status', 'published').single()
  return data
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100)
}

function formatWindow(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const dateStr = s.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const startTime = s.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const endTime = e.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${dateStr}, ${startTime} – ${endTime}`
}

const JET_SIZE_LABEL: Record<string, string> = {
  light: 'Light Jet', midsize: 'Midsize', super_midsize: 'Super Midsize', heavy: 'Heavy Jet',
}

export default async function FlightDetailPage({ params }: { params: { id: string } }) {
  const flight = await getFlight(params.id)
  if (!flight) notFound()

  return (
    <main className="pt-20 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Back */}
        <Link href="/flights" className="text-sm text-slate-500 hover:text-slate-900 mb-6 inline-block">← Back to flights</Link>

        {/* Photo grid */}
        {flight.photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-8 rounded-2xl overflow-hidden h-72">
            {flight.photos.slice(0, 3).map((url, i) => (
              <img key={i} src={url} alt="" className={`w-full h-full object-cover ${i === 0 ? 'col-span-2 sm:col-span-1' : ''}`} />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left — details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Route */}
            <div>
              <div className="flex items-center gap-3 text-3xl font-bold text-slate-900 mb-1">
                {flight.from_city}
                <ArrowRight className="text-slate-400" />
                {flight.to_city}
              </div>
              <p className="text-slate-500">{flight.from_airport} → {flight.to_airport}</p>
            </div>

            {/* Verified badge */}
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg w-fit">
              <Shield size={14} />
              Verified operator · Part 135 certified
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Aircraft', value: flight.aircraft_type },
                { label: 'Tail number', value: flight.aircraft_tail },
                { label: 'Jet size', value: JET_SIZE_LABEL[flight.jet_size] },
                { label: 'Max passengers', value: `${flight.seats} passengers` },
                { label: 'Departure window', value: formatWindow(flight.depart_start, flight.depart_end) },
              ].map(item => (
                <div key={item.label}>
                  <div className="text-slate-400 mb-0.5">{item.label}</div>
                  <div className="font-medium text-slate-900">{item.value}</div>
                </div>
              ))}
            </div>

            {/* Amenities */}
            <div className="flex gap-4">
              {flight.has_wifi && (
                <div className="flex items-center gap-1.5 text-sm text-slate-600"><Wifi size={14} />Wi-Fi</div>
              )}
              {flight.pets_allowed && (
                <div className="flex items-center gap-1.5 text-sm text-slate-600"><PawPrint size={14} />Pets welcome</div>
              )}
              {flight.standup_cabin && (
                <div className="flex items-center gap-1.5 text-sm text-slate-600"><ArrowUpRight size={14} />Stand-up cabin</div>
              )}
            </div>
          </div>

          {/* Right — booking card */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm sticky top-24">
              <div className="text-3xl font-bold text-slate-900 mb-1">{formatPrice(flight.price)}</div>
              <p className="text-sm text-slate-500 mb-4">Entire aircraft · up to {flight.seats} passengers</p>

              <div className="text-xs text-slate-400 mb-4 space-y-1">
                <div className="flex justify-between"><span>Flight price</span><span>{formatPrice(flight.price)}</span></div>
                <div className="flex justify-between"><span>Platform fee</span><span>$0</span></div>
                <div className="flex justify-between font-semibold text-slate-700 pt-1 border-t border-slate-100"><span>Total</span><span>{formatPrice(flight.price)}</span></div>
              </div>

              <Link
                href={`/book/${flight.id}`}
                className="block w-full text-center px-6 py-3 bg-brand-amber text-white font-semibold rounded-xl hover:bg-amber-500 transition-colors"
              >
                Book This Flight
              </Link>
              <p className="text-xs text-center text-slate-400 mt-3">Pay by card or bank transfer</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
```

**Step: Commit**
```bash
git add -A
git commit -m "feat: flight detail page with photos, specs, verified badge, booking CTA"
```

---

## Task 6: Booking Page (Stripe CC + ACH)

**Files:**
- Create: `app/book/[id]/page.tsx`
- Create: `app/api/create-payment-intent/route.ts`
- Create: `app/api/confirm-booking/route.ts`

**`app/api/create-payment-intent/route.ts`:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { flightId, paymentMethod } = await req.json()

  const { data: flight } = await supabase.from('flights').select('*').eq('id', flightId).single()
  if (!flight) return NextResponse.json({ error: 'Flight not found' }, { status: 404 })

  const paymentMethodTypes = paymentMethod === 'ach' ? ['us_bank_account'] : ['card']

  const intent = await stripe.paymentIntents.create({
    amount: flight.price,
    currency: 'usd',
    payment_method_types: paymentMethodTypes,
    metadata: { flightId },
  })

  return NextResponse.json({ clientSecret: intent.client_secret })
}
```

**`app/api/confirm-booking/route.ts`:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { resend } from '@/lib/resend'

export async function POST(req: NextRequest) {
  const { flightId, paymentIntentId, paymentMethod, passenger } = await req.json()

  // Create booking record
  const { data: booking } = await supabaseAdmin.from('bookings').insert({
    flight_id: flightId,
    passenger_name: passenger.name,
    passenger_email: passenger.email,
    passenger_phone: passenger.phone,
    passengers: passenger.count,
    payment_intent_id: paymentIntentId,
    payment_method: paymentMethod,
    status: 'confirmed',
  }).select().single()

  // Get flight details for emails
  const { data: flight } = await supabaseAdmin.from('flights').select('*').eq('id', flightId).single()

  // Mark flight as booked
  await supabaseAdmin.from('flights').update({ status: 'booked' }).eq('id', flightId)

  // Send confirmation to passenger
  await resend.emails.send({
    from: 'bookings@PJRoutes.com',
    to: passenger.email,
    subject: `Booking confirmed — ${flight.from_city} → ${flight.to_city}`,
    html: `
      <h2>Your flight is confirmed.</h2>
      <p><strong>Route:</strong> ${flight.from_city} → ${flight.to_city}</p>
      <p><strong>Aircraft:</strong> ${flight.aircraft_type} (${flight.aircraft_tail})</p>
      <p><strong>Operator will contact you within 2 hours.</strong></p>
      <p>Questions? Reply to this email.</p>
    `,
  })

  // Send to operator
  await resend.emails.send({
    from: 'ops@PJRoutes.com',
    to: flight.operator_email,
    subject: `New booking — ${flight.from_city} → ${flight.to_city}`,
    html: `
      <h2>You have a new booking.</h2>
      <p><strong>Passenger:</strong> ${passenger.name}</p>
      <p><strong>Email:</strong> ${passenger.email}</p>
      <p><strong>Phone:</strong> ${passenger.phone}</p>
      <p><strong>Passengers:</strong> ${passenger.count}</p>
      <p>Contact the passenger within 2 hours to confirm details.</p>
    `,
  })

  // Follow-up email — fires 24hrs after booking (use Resend scheduled send)
  await resend.emails.send({
    from: 'hello@PJRoutes.com',
    to: passenger.email,
    subject: 'Other routes you might like',
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    html: `
      <p>Hope your flight was smooth.</p>
      <p>We have more empty legs available on your routes. <a href="${process.env.NEXT_PUBLIC_APP_URL}/flights">Browse available flights →</a></p>
    `,
  })

  return NextResponse.json({ bookingId: booking.id })
}
```

**`app/book/[id]/page.tsx`:**
```tsx
'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function BookingForm({ flightId, price }: { flightId: string; price: number }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'ach'>('card')
  const [clientSecret, setClientSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [passenger, setPassenger] = useState({ name: '', email: '', phone: '', count: 1 })

  useEffect(() => {
    fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flightId, paymentMethod }),
    }).then(r => r.json()).then(d => setClientSecret(d.clientSecret))
  }, [flightId, paymentMethod])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements || !clientSecret) return
    setLoading(true)

    const card = elements.getElement(CardElement)
    const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: card! }
    })

    if (error) { alert(error.message); setLoading(false); return }

    await fetch('/api/confirm-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        flightId,
        paymentIntentId: paymentIntent?.id,
        paymentMethod,
        passenger,
      }),
    })

    router.push('/book/success')
  }

  const fee = paymentMethod === 'ach' ? 500 : Math.round(price * 0.029 + 30)
  const formatPrice = (c: number) => `$${(c / 100).toLocaleString()}`

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold text-slate-900">Complete your booking</h1>

      {/* Passenger info */}
      <div className="space-y-3">
        <h2 className="font-semibold text-slate-700">Passenger details</h2>
        <input className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber/50" placeholder="Full name" required value={passenger.name} onChange={e => setPassenger(p => ({ ...p, name: e.target.value }))} />
        <input type="email" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber/50" placeholder="Email" required value={passenger.email} onChange={e => setPassenger(p => ({ ...p, email: e.target.value }))} />
        <input className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber/50" placeholder="Phone" required value={passenger.phone} onChange={e => setPassenger(p => ({ ...p, phone: e.target.value }))} />
        <select className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber/50" value={passenger.count} onChange={e => setPassenger(p => ({ ...p, count: parseInt(e.target.value) }))}>
          {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} passenger{n > 1 ? 's' : ''}</option>)}
        </select>
      </div>

      {/* Payment method toggle */}
      <div className="space-y-3">
        <h2 className="font-semibold text-slate-700">Payment method</h2>
        <div className="grid grid-cols-2 gap-2">
          {(['card', 'ach'] as const).map(m => (
            <button key={m} type="button" onClick={() => setPaymentMethod(m)}
              className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${paymentMethod === m ? 'border-brand-amber bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
              {m === 'card' ? '💳 Credit card' : '🏦 Bank transfer (ACH)'}
              {m === 'ach' && <span className="block text-xs text-emerald-600">Save ~{formatPrice(Math.round(price * 0.029) - 500)} in fees</span>}
            </button>
          ))}
        </div>

        {paymentMethod === 'card' && (
          <div className="p-4 border border-slate-200 rounded-xl">
            <CardElement options={{ style: { base: { fontSize: '14px', color: '#0F172A' } } }} />
          </div>
        )}
        {paymentMethod === 'ach' && (
          <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded-xl">You'll enter your routing and account number on the next screen.</p>
        )}
      </div>

      {/* Price summary */}
      <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-1">
        <div className="flex justify-between text-slate-600"><span>Flight</span><span>{formatPrice(price)}</span></div>
        <div className="flex justify-between text-slate-600"><span>Processing fee</span><span>{formatPrice(fee)}</span></div>
        <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200"><span>Total</span><span>{formatPrice(price + fee)}</span></div>
      </div>

      <button type="submit" disabled={loading || !stripe}
        className="w-full py-3 bg-brand-amber text-white font-semibold rounded-xl hover:bg-amber-500 transition-colors disabled:opacity-50">
        {loading ? 'Processing...' : `Pay ${formatPrice(price + fee)}`}
      </button>
    </form>
  )
}

export default function BookPage() {
  const { id } = useParams()
  // In full implementation, fetch flight price here
  return (
    <main className="pt-16 min-h-screen">
      <Elements stripe={stripePromise}>
        <BookingForm flightId={id as string} price={500000} />
      </Elements>
    </main>
  )
}
```

**Step: Commit**
```bash
git add -A
git commit -m "feat: booking page with Stripe card + ACH, confirm API, post-booking emails"
```

---

## Task 7: Operator Submission Form

**Files:**
- Create: `app/operator/page.tsx`
- Create: `app/api/operator-submit/route.ts`

**`app/api/operator-submit/route.ts`:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { resend } from '@/lib/resend'

export async function POST(req: NextRequest) {
  const body = await req.json()

  const { data, error } = await supabaseAdmin.from('flights').insert({
    ...body,
    status: 'pending',       // must be admin-approved before publish
    price: body.price * 100, // convert dollars to cents
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Notify admin
  await resend.emails.send({
    from: 'ops@PJRoutes.com',
    to: 'your@email.com',  // replace with your email
    subject: `New operator submission — ${body.from_city} → ${body.to_city}`,
    html: `
      <p><strong>Operator:</strong> ${body.operator_name}</p>
      <p><strong>Route:</strong> ${body.from_city} → ${body.to_city}</p>
      <p><strong>Aircraft:</strong> ${body.aircraft_type} (${body.aircraft_tail})</p>
      <p><strong>Price:</strong> $${body.price}</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin">Review in admin →</a></p>
    `,
  })

  return NextResponse.json({ id: data.id })
}
```

**`app/operator/page.tsx`:**
```tsx
'use client'
import { useState } from 'react'

export default function OperatorPage() {
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    from_city: '', from_airport: '', from_state: '',
    to_city: '', to_airport: '', to_state: '',
    depart_start: '', depart_end: '',
    price: '', seats: '',
    aircraft_type: '', aircraft_tail: '',
    jet_size: 'light',
    has_wifi: false, pets_allowed: false, standup_cabin: false,
    operator_name: '', operator_email: '', operator_phone: '',
  })

  function set(k: string, v: string | boolean) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/operator-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSubmitted(true)
  }

  if (submitted) return (
    <main className="pt-20 min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Submission received.</h1>
        <p className="text-slate-500">We review all listings within 24 hours. We'll contact you if we need anything.</p>
      </div>
    </main>
  )

  const inputClass = "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber/50"
  const labelClass = "block text-sm font-medium text-slate-700 mb-1"

  return (
    <main className="pt-20 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">List an Empty Leg</h1>
        <p className="text-slate-500 text-sm mb-8">All fields required. Listings are reviewed within 24 hours before going live.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Route */}
          <div>
            <h2 className="font-semibold text-slate-700 mb-3">Route</h2>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={labelClass}>From city</label><input className={inputClass} required value={form.from_city} onChange={e => set('from_city', e.target.value)} /></div>
              <div><label className={labelClass}>Airport code</label><input className={inputClass} placeholder="e.g. DAL" required value={form.from_airport} onChange={e => set('from_airport', e.target.value)} /></div>
              <div><label className={labelClass}>State</label><input className={inputClass} placeholder="TX" required value={form.from_state} onChange={e => set('from_state', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div><label className={labelClass}>To city</label><input className={inputClass} required value={form.to_city} onChange={e => set('to_city', e.target.value)} /></div>
              <div><label className={labelClass}>Airport code</label><input className={inputClass} placeholder="e.g. IAH" required value={form.to_airport} onChange={e => set('to_airport', e.target.value)} /></div>
              <div><label className={labelClass}>State</label><input className={inputClass} placeholder="TX" required value={form.to_state} onChange={e => set('to_state', e.target.value)} /></div>
            </div>
          </div>

          {/* Timing */}
          <div>
            <h2 className="font-semibold text-slate-700 mb-3">Departure window</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClass}>Earliest departure</label><input type="datetime-local" className={inputClass} required value={form.depart_start} onChange={e => set('depart_start', e.target.value)} /></div>
              <div><label className={labelClass}>Latest departure</label><input type="datetime-local" className={inputClass} required value={form.depart_end} onChange={e => set('depart_end', e.target.value)} /></div>
            </div>
          </div>

          {/* Aircraft */}
          <div>
            <h2 className="font-semibold text-slate-700 mb-3">Aircraft</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClass}>Aircraft type</label><input className={inputClass} placeholder="e.g. Citation CJ3" required value={form.aircraft_type} onChange={e => set('aircraft_type', e.target.value)} /></div>
              <div><label className={labelClass}>Tail number</label><input className={inputClass} placeholder="e.g. N760JP" required value={form.aircraft_tail} onChange={e => set('aircraft_tail', e.target.value)} /></div>
              <div>
                <label className={labelClass}>Jet size</label>
                <select className={inputClass} value={form.jet_size} onChange={e => set('jet_size', e.target.value)}>
                  <option value="light">Light Jet</option>
                  <option value="midsize">Midsize</option>
                  <option value="super_midsize">Super Midsize</option>
                  <option value="heavy">Heavy Jet</option>
                </select>
              </div>
              <div><label className={labelClass}>Max passengers</label><input type="number" min="1" max="19" className={inputClass} required value={form.seats} onChange={e => set('seats', e.target.value)} /></div>
            </div>
            <div className="flex gap-4 mt-3">
              {[['has_wifi','Wi-Fi'],['pets_allowed','Pets welcome'],['standup_cabin','Stand-up cabin']].map(([k, label]) => (
                <label key={k} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={!!form[k as keyof typeof form]} onChange={e => set(k, e.target.checked)} className="rounded" />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h2 className="font-semibold text-slate-700 mb-3">Pricing</h2>
            <div><label className={labelClass}>Price (USD)</label><input type="number" min="500" className={inputClass} placeholder="e.g. 4500" required value={form.price} onChange={e => set('price', e.target.value)} /></div>
          </div>

          {/* Operator */}
          <div>
            <h2 className="font-semibold text-slate-700 mb-3">Your info</h2>
            <div className="space-y-3">
              <div><label className={labelClass}>Company name</label><input className={inputClass} required value={form.operator_name} onChange={e => set('operator_name', e.target.value)} /></div>
              <div><label className={labelClass}>Email</label><input type="email" className={inputClass} required value={form.operator_email} onChange={e => set('operator_email', e.target.value)} /></div>
              <div><label className={labelClass}>Phone</label><input className={inputClass} required value={form.operator_phone} onChange={e => set('operator_phone', e.target.value)} /></div>
            </div>
          </div>

          <button type="submit" className="w-full py-3 bg-brand-amber text-white font-semibold rounded-xl hover:bg-amber-500 transition-colors">
            Submit listing for review
          </button>
        </form>
      </div>
    </main>
  )
}
```

**Step: Commit**
```bash
git add -A
git commit -m "feat: operator submission form with admin notification"
```

---

## Task 8: Admin Approval Page

**Files:**
- Create: `app/admin/page.tsx`
- Create: `app/api/admin/approve/route.ts`

**`app/api/admin/approve/route.ts`:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { resend } from '@/lib/resend'

export async function POST(req: NextRequest) {
  const { id, action } = await req.json() // action: 'approve' | 'reject'

  const status = action === 'approve' ? 'published' : 'rejected'
  const { data: flight } = await supabaseAdmin.from('flights').update({ status }).eq('id', id).select().single()

  if (action === 'approve') {
    // Notify any route alert subscribers
    const { data: alerts } = await supabaseAdmin
      .from('route_alerts')
      .select('*')
      .ilike('from_city', `%${flight.from_city}%`)
      .ilike('to_city', `%${flight.to_city}%`)

    for (const alert of alerts || []) {
      await resend.emails.send({
        from: 'alerts@PJRoutes.com',
        to: alert.email,
        subject: `New flight: ${flight.from_city} → ${flight.to_city} for $${flight.price / 100}`,
        html: `
          <p>A new empty leg matching your saved route just listed.</p>
          <p><strong>${flight.from_city} → ${flight.to_city}</strong></p>
          <p><strong>Price: $${(flight.price / 100).toLocaleString()}</strong></p>
          <p><strong>Aircraft:</strong> ${flight.aircraft_type}</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/flights/${flight.id}">View & Book →</a>
        `,
      })
    }
  }

  return NextResponse.json({ ok: true })
}
```

**`app/admin/page.tsx`:**
```tsx
import { supabaseAdmin } from '@/lib/supabase'
import AdminActions from './AdminActions'

async function getPendingFlights() {
  const { data } = await supabaseAdmin.from('flights').select('*').eq('status', 'pending').order('created_at', { ascending: false })
  return data || []
}

export default async function AdminPage() {
  // Basic password gate — use middleware for prod
  const pending = await getPendingFlights()

  return (
    <main className="pt-20 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-6">Admin — Pending Listings ({pending.length})</h1>
        <div className="space-y-4">
          {pending.map(f => (
            <div key={f.id} className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-lg">{f.from_city} → {f.to_city}</div>
                  <div className="text-sm text-slate-500">{f.aircraft_type} · {f.aircraft_tail} · {f.seats} seats</div>
                  <div className="text-sm text-slate-500">{f.operator_name} · {f.operator_email} · {f.operator_phone}</div>
                  <div className="text-lg font-bold mt-1">${(f.price / 100).toLocaleString()}</div>
                </div>
                <AdminActions flightId={f.id} />
              </div>
            </div>
          ))}
          {pending.length === 0 && <p className="text-slate-400">No pending listings.</p>}
        </div>
      </div>
    </main>
  )
}
```

**`app/admin/AdminActions.tsx`** (client component):
```tsx
'use client'
import { useRouter } from 'next/navigation'

export default function AdminActions({ flightId }: { flightId: string }) {
  const router = useRouter()

  async function act(action: 'approve' | 'reject') {
    await fetch('/api/admin/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: flightId, action }),
    })
    router.refresh()
  }

  return (
    <div className="flex gap-2">
      <button onClick={() => act('approve')} className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600">Approve</button>
      <button onClick={() => act('reject')} className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600">Reject</button>
    </div>
  )
}
```

**Step: Commit**
```bash
git add -A
git commit -m "feat: admin approval page, route alert trigger on approval"
```

---

## Task 9: Route Alerts API

**Files:**
- Create: `app/api/alerts/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { email, from, to } = await req.json()

  await supabaseAdmin.from('route_alerts').insert({
    email,
    from_city: from,
    to_city: to,
  })

  return NextResponse.json({ ok: true })
}
```

**Step: Commit**
```bash
git add -A
git commit -m "feat: route alerts API endpoint"
```

---

## Task 10: Deploy to Vercel

**Step 1: Push to GitHub**
```bash
git remote add origin https://github.com/jaylenmareko/PJRoutes.git
git push -u origin main
```

**Step 2: Connect to Vercel**
- Go to vercel.com → Import Git Repository → select PJRoutes
- Add all `.env.local` variables in Vercel environment settings
- Deploy

**Step 3: Add Supabase schema**
- Go to Supabase dashboard → SQL Editor → paste the schema from Task 1
- Run it

**Step 4: Test full flow**
1. Operator submits a flight at `/operator`
2. Admin approves at `/admin`
3. Flight appears on landing page and `/flights`
4. User books at `/book/[id]`
5. Confirmation emails land (check Resend logs)

---

## Swap Placeholder Name

When name is decided, run find-replace across entire project:
```bash
# Replace "PJRoutes" with "YourName" and "PJRoutes" with "yourname"
```
One command, done.
