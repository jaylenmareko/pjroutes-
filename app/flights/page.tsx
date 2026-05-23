export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/clients/supabase'
import { Flight } from '@/lib/types'
import FlightCard from '@/components/flights/FlightCard'
import SearchBar from '@/components/flights/SearchBar'
import Link from 'next/link'
import { LayoutGrid, LayoutList } from 'lucide-react'

interface Props {
  searchParams: Promise<{
    from?: string
    to?: string
    date?: string
    passengers?: string
    size?: string
    sort?: string
    layout?: string
  }>
}

function cityOnly(val: string): string {
  return val.replace(/\s*\([A-Z]{2,4}\)\s*$/, '').trim()
}

function applySort(flights: Flight[], sort?: string): Flight[] {
  const copy = [...flights]
  switch (sort) {
    case 'price_asc':  return copy.sort((a, b) => a.price - b.price)
    case 'price_desc': return copy.sort((a, b) => b.price - a.price)
    case 'date_asc':   return copy.sort((a, b) => new Date(a.depart_start).getTime() - new Date(b.depart_start).getTime())
    case 'date_desc':  return copy.sort((a, b) => new Date(b.depart_start).getTime() - new Date(a.depart_start).getTime())
    default:           return copy.sort((a, b) => new Date(a.depart_start).getTime() - new Date(b.depart_start).getTime())
  }
}

async function searchFlights(params: Awaited<Props['searchParams']>): Promise<Flight[]> {
  try {
    const fromCity = params.from ? cityOnly(params.from) : undefined
    const toCity = params.to ? cityOnly(params.to) : undefined

    let query = supabase.from('flights').select('*').eq('status', 'published')
    if (fromCity) query = query.ilike('from_city', `%${fromCity}%`)
    if (toCity) query = query.ilike('to_city', `%${toCity}%`)
    if (params.size) query = query.eq('jet_size', params.size)
    if (params.date) {
      const start = new Date(params.date)
      const end = new Date(params.date)
      end.setDate(end.getDate() + 1)
      query = query.gte('depart_start', start.toISOString()).lte('depart_start', end.toISOString())
    }

    const { data } = await query
    return applySort(data ?? [], params.sort)
  } catch {
    return []
  }
}

export default async function FlightsPage({ searchParams }: Props) {
  const params = await searchParams
  const flights = await searchFlights(params)

  const fromLabel = params.from ? cityOnly(params.from) : ''
  const toLabel = params.to ? cityOnly(params.to) : ''
  const heading = fromLabel && toLabel
    ? `${fromLabel} → ${toLabel}`
    : fromLabel ? `From ${fromLabel}` : toLabel ? `To ${toLabel}` : 'All Flights'

  const isGrid = params.layout === 'grid'
  const activeSort = params.sort || 'recommended'

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    const merged = { ...params, ...overrides }
    Object.entries(merged).forEach(([k, v]) => { if (v) p.set(k, v) })
    return `/flights?${p.toString()}`
  }

  const SORTS = [
    { value: 'recommended', label: 'Recommended' },
    { value: 'date_asc',    label: 'Date: Soonest' },
    { value: 'date_desc',   label: 'Date: Latest' },
    { value: 'price_asc',   label: 'Price: Low → High' },
    { value: 'price_desc',  label: 'Price: High → Low' },
  ]

  const SIZES = [
    { value: '',             label: 'All sizes' },
    { value: 'light',        label: 'Light Jet' },
    { value: 'midsize',      label: 'Midsize' },
    { value: 'super_midsize',label: 'Super Midsize' },
    { value: 'heavy',        label: 'Heavy Jet' },
  ]

  return (
    <div className="pt-16 min-h-screen">
      {/* Search bar */}
      <div className="bg-ink py-5 px-4">
        <div className="max-w-7xl mx-auto">
          <SearchBar
            defaultFrom={params.from}
            defaultTo={params.to}
            defaultDate={params.date}
            defaultPassengers={params.passengers}
            dark
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header row */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-ink">{heading}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
              <span className="text-sm text-muted">{flights.length} flight{flights.length !== 1 ? 's' : ''} available</span>
            </div>
          </div>

          {/* Layout toggle */}
          <div className="flex items-center gap-1 border border-border rounded-lg p-0.5">
            <Link
              href={buildUrl({ layout: 'list' })}
              className={`p-1.5 rounded-md transition-colors ${!isGrid ? 'bg-primary text-white' : 'text-muted hover:text-ink'}`}
              title="List view"
            >
              <LayoutList size={16} />
            </Link>
            <Link
              href={buildUrl({ layout: 'grid' })}
              className={`p-1.5 rounded-md transition-colors ${isGrid ? 'bg-primary text-white' : 'text-muted hover:text-ink'}`}
              title="Grid view"
            >
              <LayoutGrid size={16} />
            </Link>
          </div>
        </div>

        {/* Sort + filter row */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {/* Sort */}
          <span className="text-xs text-muted font-medium mr-1">Sort:</span>
          {SORTS.map(s => (
            <Link
              key={s.value}
              href={buildUrl({ sort: s.value === 'recommended' ? undefined : s.value })}
              className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                activeSort === s.value
                  ? 'bg-primary text-white border-primary'
                  : 'border-border text-muted hover:border-primary hover:text-primary'
              }`}
            >
              {s.label}
            </Link>
          ))}

          {/* Divider */}
          <div className="w-px h-4 bg-border mx-1" />

          {/* Jet size */}
          {SIZES.map(s => (
            <Link
              key={s.value}
              href={buildUrl({ size: s.value || undefined })}
              className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                (params.size || '') === s.value
                  ? 'bg-primary text-white border-primary'
                  : 'border-border text-muted hover:border-primary hover:text-primary'
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>

        {/* Results */}
        {flights.length === 0 ? (
          <div className="py-24 text-center">
            <div className="text-6xl mb-4 opacity-20">✈</div>
            <h2 className="text-xl font-semibold text-ink mb-2">No flights found</h2>
            <p className="text-muted text-sm mb-8">Try adjusting your search — new empty legs are listed daily.</p>
            <Link href="/" className="btn-primary">Back to home</Link>
          </div>
        ) : isGrid ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {flights.map(f => <FlightCard key={f.id} flight={f} layout="grid" />)}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {flights.map(f => <FlightCard key={f.id} flight={f} layout="list" />)}
          </div>
        )}

        {/* Private Jet Request */}
        <div className="mt-16 mb-8 rounded-2xl border border-border bg-surface px-8 py-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-2">Don&apos;t See Your Route?</p>
          <h2 className="text-2xl font-bold text-ink mb-3">Private Jet Request</h2>
          <p className="text-muted max-w-md mx-auto mb-6">Tell us where you want to fly. Our concierge sources a vetted operator and confirms availability and pricing.</p>
          <Link href="/contact" className="btn-primary">Request a Flight</Link>
        </div>
      </div>
    </div>
  )
}
