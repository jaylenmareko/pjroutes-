'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/clients/supabase-browser'
import Link from 'next/link'

interface Booking {
  passenger_name: string
  passenger_email: string
  passenger_phone: string
  passengers: number
  created_at: string
}

interface Listing {
  id: string
  from_city: string
  from_airport: string
  to_city: string
  to_airport: string
  aircraft_type: string
  depart_start: string
  price: number
  status: 'pending' | 'published' | 'rejected' | 'booked'
  bookings: Booking[]
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Under review', color: 'bg-yellow-100 text-yellow-700' },
  published: { label: 'Live',         color: 'bg-green-100 text-green-700' },
  rejected:  { label: 'Rejected',     color: 'bg-red-100 text-red-700' },
  booked:    { label: 'Booked',       color: 'bg-blue-100 text-blue-700' },
}

export default function MyListingsPage() {
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/'); return }
      setEmail(data.user.email ?? '')
      const res = await fetch('/api/my-listings')
      const rows = await res.json()
      setListings(Array.isArray(rows) ? rows : [])
      setLoading(false)
    })
  }, [router])

  if (loading) {
    return (
      <div className="pt-14 min-h-screen flex items-center justify-center">
        <p className="text-muted text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-ink mb-1">My Listings</h1>
            <p className="text-muted text-sm">{email}</p>
          </div>
          <Link href="/operator" className="btn-primary py-2 px-4 text-sm">
            + New listing
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-border rounded-2xl">
            <p className="text-muted text-sm mb-6">No listings yet.</p>
            <Link href="/operator" className="btn-primary">List an Empty Leg</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map(l => {
              const status = STATUS_LABEL[l.status] ?? { label: l.status, color: 'bg-surface text-muted' }
              const depart = l.depart_start
                ? new Date(l.depart_start).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                  })
                : '—'
              const price = `$${(l.price / 100).toLocaleString()}`
              const booking = l.bookings?.[0]

              return (
                <div key={l.id} className="border border-border rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-ink text-lg">
                        {l.from_city} ({l.from_airport}) → {l.to_city} ({l.to_airport})
                      </p>
                      <p className="text-muted text-sm">{l.aircraft_type} · {depart} · {price}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  {l.status === 'booked' && booking && (
                    <div className="mt-3 border-t border-border pt-3">
                      <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Passenger</p>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                        <span className="text-ink font-medium">{booking.passenger_name}</span>
                        <a href={`mailto:${booking.passenger_email}`} className="text-primary hover:underline">{booking.passenger_email}</a>
                        <a href={`tel:${booking.passenger_phone}`} className="text-primary hover:underline">{booking.passenger_phone}</a>
                        <span className="text-muted">{booking.passengers} passenger{booking.passengers > 1 ? 's' : ''}</span>
                      </div>
                      <p className="text-xs text-muted mt-2">Booked {new Date(booking.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — contact them with FBO address and departure window.</p>
                    </div>
                  )}

                  {l.status === 'rejected' && (
                    <p className="text-xs text-red-500 mt-2">This listing was not approved. <Link href="/operator" className="underline">Submit a new one.</Link></p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
