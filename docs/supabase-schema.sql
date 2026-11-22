-- Run this in Supabase SQL Editor
-- Safe to re-run: uses IF NOT EXISTS and DROP POLICY IF EXISTS

create table if not exists flights (
  id uuid primary key default gen_random_uuid(),
  from_city text not null,
  from_airport text not null,
  from_state text not null,
  to_city text not null,
  to_airport text not null,
  to_state text not null,
  depart_start timestamptz not null,
  depart_end timestamptz not null,
  price integer not null,
  seats integer not null,
  aircraft_type text not null,
  aircraft_tail text not null,
  jet_size text not null check (jet_size in ('light','midsize','super_midsize','heavy')),
  has_wifi boolean default false,
  pets_allowed boolean default false,
  standup_cabin boolean default false,
  photos text[] default '{}',
  operator_name text not null,
  operator_email text not null,
  operator_phone text not null,
  status text default 'pending' check (status in ('pending','published','booked','rejected')),
  created_at timestamptz default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  flight_id uuid references flights(id),
  passenger_name text not null,
  passenger_email text not null,
  passenger_phone text not null,
  passengers integer not null default 1,
  payment_intent_id text,
  payment_method text check (payment_method in ('card','ach')),
  amount integer not null,
  status text default 'pending' check (status in ('pending','confirmed','cancelled')),
  created_at timestamptz default now()
);

create table if not exists route_alerts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  from_city text not null,
  to_city text not null,
  created_at timestamptz default now()
);

-- RLS
alter table flights enable row level security;
alter table bookings enable row level security;
alter table route_alerts enable row level security;

-- Drop existing policies before recreating
drop policy if exists "Public can read published flights" on flights;
drop policy if exists "Service role can do anything" on flights;
drop policy if exists "Service role only" on bookings;
drop policy if exists "Service role only" on route_alerts;
drop policy if exists "Anyone can insert alert" on route_alerts;

-- Recreate policies
create policy "Public can read published flights" on flights for select using (status = 'published');
create policy "Service role full access" on flights using (auth.role() = 'service_role');
create policy "Service role bookings" on bookings using (auth.role() = 'service_role');
create policy "Service role alerts" on route_alerts using (auth.role() = 'service_role');
create policy "Anyone can insert alert" on route_alerts for insert with check (true);
